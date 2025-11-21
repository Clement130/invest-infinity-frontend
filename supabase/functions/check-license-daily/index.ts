import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEVELOPER_EMAIL = 'butcher13550@gmail.com';
const CLIENT_EMAIL = 'investinfinityfr@gmail.com';
const SECRET_KEY = Deno.env.get('LICENSE_CHECK_SECRET_KEY') || '';

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier la clé secrète (pour la sécurité du cron job)
    const authHeader = req.headers.get('Authorization');
    const providedSecret = authHeader?.replace('Bearer ', '') || req.headers.get('x-secret-key') || '';

    if (SECRET_KEY && providedSecret !== SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid secret key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Récupérer la licence
    const { data: license, error: licenseError } = await supabase
      .from('developer_license')
      .select('*')
      .maybeSingle();

    if (licenseError) {
      console.error('Erreur lors de la récupération de la licence:', licenseError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch license', details: licenseError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!license) {
      console.log('Aucune licence trouvée, création d\'une licence par défaut...');
      // Créer une licence par défaut
      const { error: createError } = await supabase
        .from('developer_license')
        .insert({
          is_active: true,
          last_payment_date: new Date().toISOString(),
          admin_revocation_days: 30,
        });

      if (createError) {
        console.error('Erreur lors de la création de la licence:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create license', details: createError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'License created', action: 'none' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier si la licence est expirée
    const lastPaymentDate = new Date(license.last_payment_date);
    const expirationDate = new Date(lastPaymentDate);
    expirationDate.setDate(expirationDate.getDate() + license.admin_revocation_days);
    const now = new Date();

    // Si la licence est active mais expirée, la désactiver
    if (license.is_active && now > expirationDate) {
      console.log('Licence expirée, désactivation...');

      // Désactiver la licence
      const { error: updateError } = await supabase
        .from('developer_license')
        .update({
          is_active: false,
          deactivated_at: now.toISOString(),
        })
        .eq('id', license.id);

      if (updateError) {
        console.error('Erreur lors de la désactivation de la licence:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to deactivate license', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Révoquer le rôle admin du client
      const { error: revokeError } = await supabase
        .from('profiles')
        .update({ role: 'client' })
        .eq('email', CLIENT_EMAIL)
        .eq('role', 'admin');

      if (revokeError) {
        console.error('Erreur lors de la révocation du rôle admin:', revokeError);
        // Ne pas faire échouer la requête si la révocation échoue
      } else {
        console.log(`Rôle admin révoqué pour ${CLIENT_EMAIL}`);
      }

      return new Response(
        JSON.stringify({
          message: 'License deactivated and admin role revoked',
          action: 'deactivated',
          deactivated_at: now.toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si la licence est déjà désactivée et que 30 jours se sont écoulés depuis la désactivation
    if (!license.is_active && license.deactivated_at) {
      const deactivatedDate = new Date(license.deactivated_at);
      const revocationDate = new Date(deactivatedDate);
      revocationDate.setDate(revocationDate.getDate() + license.admin_revocation_days);

      if (now >= revocationDate) {
        // Vérifier si le rôle admin n'a pas déjà été révoqué
        const { data: clientProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('email', CLIENT_EMAIL)
          .maybeSingle();

        if (clientProfile && clientProfile.role === 'admin') {
          console.log('Révocation du rôle admin après période de grâce...');

          const { error: revokeError } = await supabase
            .from('profiles')
            .update({ role: 'client' })
            .eq('email', CLIENT_EMAIL)
            .eq('role', 'admin');

          if (revokeError) {
            console.error('Erreur lors de la révocation du rôle admin:', revokeError);
            return new Response(
              JSON.stringify({ error: 'Failed to revoke admin role', details: revokeError.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({
              message: 'Admin role revoked after grace period',
              action: 'revoked',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Aucune action nécessaire
    return new Response(
      JSON.stringify({
        message: 'License check completed',
        action: 'none',
        is_active: license.is_active,
        days_remaining: license.is_active
          ? Math.max(0, Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

