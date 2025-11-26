import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

// Supabase Admin client (avec service_role pour créer des utilisateurs)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Mapping priceId → licence
const PRICE_TO_LICENSE: Record<string, string> = {
  'price_1SXfwzKaUb6KDbNF81uubunw': 'starter',
  'price_1SXfxaKaUb6KDbNFRgl7y7I5': 'pro',
  'price_1SXfyUKaUb6KDbNFYjpa57JP': 'elite'
};

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    
    // Vérifier la signature Stripe
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    
    console.log('[stripe-webhook] Event received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const customerEmail = session.customer_email || session.customer_details?.email;
      const priceId = session.metadata?.priceId;
      
      if (!customerEmail) {
        console.error('[stripe-webhook] No customer email found');
        return new Response('No customer email', { status: 400 });
      }

      console.log('[stripe-webhook] Processing payment for:', customerEmail);

      // Vérifier si l'utilisateur existe déjà
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === customerEmail);

      let userId: string;
      let passwordToken: string | null = null;

      if (existingUser) {
        // Utilisateur existe déjà
        userId = existingUser.id;
        console.log('[stripe-webhook] Existing user found:', userId);
      } else {
        // Créer un nouveau compte avec mot de passe temporaire
        const tempPassword = crypto.randomUUID();
        
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: customerEmail,
          password: tempPassword,
          email_confirm: true, // Confirmer l'email automatiquement
        });

        if (createError || !newUser.user) {
          console.error('[stripe-webhook] Error creating user:', createError);
          return new Response('Error creating user', { status: 500 });
        }

        userId = newUser.user.id;
        console.log('[stripe-webhook] New user created:', userId);

        // Générer un lien de reset password (sans envoyer d'email)
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: customerEmail,
        });

        if (linkError) {
          console.error('[stripe-webhook] Error generating link:', linkError);
        } else if (linkData?.properties?.hashed_token) {
          passwordToken = linkData.properties.hashed_token;
          console.log('[stripe-webhook] Password token generated');
        }
      }

      // Attribuer la licence
      const license = PRICE_TO_LICENSE[priceId || ''] || 'starter';
      
      // Mettre à jour le profil
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: customerEmail,
          role: 'client',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('[stripe-webhook] Error updating profile:', profileError);
      }

      // Donner accès à tous les modules de formation
      const { data: modules } = await supabaseAdmin
        .from('training_modules')
        .select('id');
      
      if (modules && modules.length > 0) {
        const accessRecords = modules.map(m => ({
          user_id: userId,
          module_id: m.id,
          access_type: 'full',
          granted_at: new Date().toISOString()
        }));

        const { error: accessError } = await supabaseAdmin
          .from('training_access')
          .upsert(accessRecords, {
            onConflict: 'user_id,module_id'
          });

        if (accessError) {
          console.error('[stripe-webhook] Error granting access:', accessError);
        }
      }

      // Enregistrer l'achat avec le token
      const { error: purchaseError } = await supabaseAdmin
        .from('purchases')
        .insert({
          user_id: userId,
          stripe_session_id: session.id,
          status: 'completed'
        });

      if (purchaseError) {
        console.error('[stripe-webhook] Error recording purchase:', purchaseError);
      }

      // Stocker le token temporairement pour la redirection
      // On utilise la table purchases pour stocker le token
      if (passwordToken) {
        await supabaseAdmin
          .from('purchases')
          .update({ 
            status: 'pending_password',
          })
          .eq('stripe_session_id', session.id);
      }

      console.log('[stripe-webhook] Successfully processed payment for:', customerEmail, 'License:', license, 'Token:', passwordToken ? 'generated' : 'none');

      // Retourner le token dans les metadata pour que le frontend puisse le récupérer
      return new Response(JSON.stringify({ 
        received: true,
        userId,
        email: customerEmail,
        token: passwordToken,
        isNewUser: !existingUser
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (err) {
    console.error('[stripe-webhook] Error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
