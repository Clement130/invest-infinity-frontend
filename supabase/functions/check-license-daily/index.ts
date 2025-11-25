import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helper CORS sécurisé
function getCorsHeaders(origin: string | null): Record<string, string> {
  const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    // Ajoutez vos domaines de production ici
  ];
  
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

const DEVELOPER_EMAIL = 'butcher13550@gmail.com';
const CLIENT_EMAIL = 'investinfinityfr@gmail.com';
const SECRET_KEY = Deno.env.get('LICENSE_CHECK_SECRET_KEY') || '';

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

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

    // Si auto_renewal_enabled = true, le paiement a été validé une fois
    // On ne fait plus rien - la protection est désactivée définitivement
    if (license.auto_renewal_enabled) {
      console.log('Paiement validé une fois - Protection désactivée définitivement');
      return new Response(
        JSON.stringify({
          message: 'Payment validated once - Protection permanently disabled',
          action: 'none',
          is_active: license.is_active,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier si on est après le 26 décembre 2025 (seulement si auto_renewal_enabled = false)
    const now = new Date();
    const deadline = new Date('2025-12-26T00:00:00'); // 26 décembre 2025 à 00h00 - DATE FIXE

    // Si on est après le 26 décembre 2025 ET que le paiement n'a pas été validé
    if (now >= deadline) {
      console.log('Date limite dépassée (26 décembre 2025) - Paiement non validé, désactivation...');

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

    // Aucune action nécessaire (on est avant le 26 décembre 2025)
    const daysUntilDeadline = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    return new Response(
      JSON.stringify({
        message: 'License check completed',
        action: 'none',
        is_active: license.is_active,
        days_remaining: daysUntilDeadline,
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

