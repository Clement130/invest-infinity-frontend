import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { secureLog, addSecurityHeaders } from '../_shared/security.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

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

// Types d'événements autorisés
const ALLOWED_EVENT_TYPES = [
  'checkout.session.completed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
];

// Cache pour la protection contre les replays (événements déjà traités)
const processedEvents = new Map<string, number>();
const EVENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: addSecurityHeaders({}) }
    );
  }

  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    secureLog('stripe-webhook', 'Missing signature');
    return new Response(
      JSON.stringify({ error: 'Missing signature' }), 
      { status: 400, headers: addSecurityHeaders({}) }
    );
  }

  try {
    const body = await req.text();
    
    // Vérifier la signature Stripe (protection contre la falsification)
    const event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
    
    // Protection contre les replays
    const now = Date.now();
    if (processedEvents.has(event.id)) {
      secureLog('stripe-webhook', 'Duplicate event ignored', { eventId: event.id });
      return new Response(
        JSON.stringify({ received: true, duplicate: true }), 
        { status: 200, headers: addSecurityHeaders({}) }
      );
    }
    
    // Nettoyer les anciens événements du cache
    for (const [id, timestamp] of processedEvents.entries()) {
      if (now - timestamp > EVENT_CACHE_TTL) {
        processedEvents.delete(id);
      }
    }
    
    // Marquer l'événement comme traité
    processedEvents.set(event.id, now);
    
    // Vérifier le type d'événement
    if (!ALLOWED_EVENT_TYPES.includes(event.type)) {
      secureLog('stripe-webhook', 'Unhandled event type', { type: event.type });
      return new Response(
        JSON.stringify({ received: true, handled: false }), 
        { status: 200, headers: addSecurityHeaders({}) }
      );
    }
    
    secureLog('stripe-webhook', 'Event received', { type: event.type, eventId: event.id });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const customerEmail = session.customer_email || session.customer_details?.email;
      const priceId = session.metadata?.priceId;
      
      if (!customerEmail) {
        console.error('[stripe-webhook] No customer email found');
        return new Response('No customer email', { status: 400 });
      }

      secureLog('stripe-webhook', 'Processing payment', { email: customerEmail });

      // Vérifier si l'utilisateur existe déjà
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === customerEmail);

      let userId: string;
      let passwordToken: string | null = null;

      if (existingUser) {
        userId = existingUser.id;
        secureLog('stripe-webhook', 'Existing user found', { userId });
      } else {
        // Créer un nouveau compte avec mot de passe temporaire
        const tempPassword = crypto.randomUUID();
        
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: customerEmail,
          password: tempPassword,
          email_confirm: true, // Confirmer l'email automatiquement
        });

        if (createError || !newUser.user) {
          secureLog('stripe-webhook', 'Error creating user', { error: createError?.message });
          return new Response(
            JSON.stringify({ error: 'Error creating user' }), 
            { status: 500, headers: addSecurityHeaders({}) }
          );
        }

        userId = newUser.user.id;
        secureLog('stripe-webhook', 'New user created', { userId });

        // Générer un lien de reset password (sans envoyer d'email)
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: customerEmail,
        });

        if (linkError) {
          secureLog('stripe-webhook', 'Error generating link', { error: linkError.message });
        } else if (linkData?.properties?.hashed_token) {
          passwordToken = linkData.properties.hashed_token;
          secureLog('stripe-webhook', 'Password token generated');
          
          // Envoyer l'email de création de mot de passe
          try {
            const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-password-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                email: customerEmail,
                token: passwordToken,
                prenom: session.customer_details?.name?.split(' ')[0] || 'Cher membre',
              }),
            });

            if (emailResponse.ok) {
              secureLog('stripe-webhook', 'Password email sent successfully');
            } else {
              const errorData = await emailResponse.json();
              secureLog('stripe-webhook', 'Failed to send password email', { error: errorData });
            }
          } catch (emailError: unknown) {
            const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
            secureLog('stripe-webhook', 'Error sending password email', { error: errorMessage });
          }
        }
      }

      // Attribuer la licence selon le plan acheté
      const license = PRICE_TO_LICENSE[priceId || ''] || 'starter';
      
      // Mettre à jour le profil AVEC la licence
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: customerEmail,
          role: 'client',
          license: license,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        secureLog('stripe-webhook', 'Error updating profile', { error: profileError.message });
      }

      // Hiérarchie des licences : starter < pro < elite
      const LICENSE_HIERARCHY: Record<string, number> = {
        'starter': 1,
        'pro': 2,
        'elite': 3
      };
      
      const userLicenseLevel = LICENSE_HIERARCHY[license] || 1;

      // Récupérer les modules accessibles selon la licence
      // Si pas de required_license défini, on considère que c'est 'starter' (accessible à tous)
      const { data: modules } = await supabaseAdmin
        .from('training_modules')
        .select('id, required_license');
      
      if (modules && modules.length > 0) {
        // Filtrer les modules selon la licence de l'utilisateur
        const accessibleModules = modules.filter(m => {
          const requiredLicense = m.required_license || 'starter';
          const requiredLevel = LICENSE_HIERARCHY[requiredLicense] || 1;
          return userLicenseLevel >= requiredLevel;
        });

        secureLog('stripe-webhook', 'Modules accessibles', { 
          license, 
          totalModules: modules.length,
          accessibleModules: accessibleModules.length 
        });

        const accessRecords = accessibleModules.map(m => ({
          user_id: userId,
          module_id: m.id,
          access_type: 'full',
          granted_at: new Date().toISOString()
        }));

        if (accessRecords.length > 0) {
          const { error: accessError } = await supabaseAdmin
            .from('training_access')
            .upsert(accessRecords, {
              onConflict: 'user_id,module_id'
            });

          if (accessError) {
            secureLog('stripe-webhook', 'Error granting access', { error: accessError.message });
          }
        }
      }

      // Enregistrer le paiement dans la table payments
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id: userId,
          stripe_session_id: session.id,
          license_type: license,
          status: 'completed'
        });

      if (paymentError) {
        secureLog('stripe-webhook', 'Error recording payment', { error: paymentError.message });
      }

      // Stocker le token temporairement pour la redirection
      // On utilise la table payments pour stocker le token
      if (passwordToken) {
        await supabaseAdmin
          .from('payments')
          .update({ 
            status: 'pending_password',
          })
          .eq('stripe_session_id', session.id);
      }

      secureLog('stripe-webhook', 'Payment processed successfully', { 
        license, 
        isNewUser: !existingUser 
      });

      // Note: Ne pas exposer de données sensibles dans la réponse
      // Le frontend récupère les infos via get-session-info
      return new Response(
        JSON.stringify({ received: true }), 
        { status: 200, headers: addSecurityHeaders({}) }
      );
    }

    return new Response(
      JSON.stringify({ received: true }), 
      { status: 200, headers: addSecurityHeaders({}) }
    );

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    // Ne pas exposer les détails de l'erreur (sécurité)
    secureLog('stripe-webhook', 'Webhook error', { error: errorMessage });
    
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }), 
      { status: 400, headers: addSecurityHeaders({}) }
    );
  }
});
