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

        // Envoyer un email de reset password pour que l'utilisateur définisse son mot de passe
        const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: customerEmail,
          options: {
            redirectTo: `${Deno.env.get('SITE_URL') || 'https://www.investinfinity.fr'}/reset-password`
          }
        });

        if (resetError) {
          console.error('[stripe-webhook] Error sending reset email:', resetError);
        }
      }

      // Attribuer la licence
      const license = PRICE_TO_LICENSE[priceId || ''] || 'starter';
      
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: customerEmail,
          license: license,
          license_valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 an
          stripe_customer_id: session.customer as string || null,
          stripe_session_id: session.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('[stripe-webhook] Error updating profile:', profileError);
      }

      // Enregistrer le paiement
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id: userId,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent as string,
          amount: session.amount_total,
          currency: session.currency,
          status: 'completed',
          license_type: license,
          created_at: new Date().toISOString()
        });

      if (paymentError) {
        console.error('[stripe-webhook] Error recording payment:', paymentError);
      }

      console.log('[stripe-webhook] Successfully processed payment for:', customerEmail, 'License:', license);
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

