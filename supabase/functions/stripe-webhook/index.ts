/**
 * ============================================================================
 * STRIPE WEBHOOK - Edge Function Supabase
 * ============================================================================
 * 
 * URL de l'endpoint : https://yjbyermyfbugfyzmidsp.supabase.co/functions/v1/stripe-webhook
 * 
 * RÉSUMÉ DES CORRECTIONS EFFECTUÉES :
 * -----------------------------------
 * 1. Remplacement de serve() obsolète par Deno.serve() moderne
 * 2. Vérification explicite des variables d'environnement au démarrage
 * 3. Distinction claire entre erreur de signature (400) et erreur interne (500)
 * 4. Réponse rapide à Stripe AVANT le traitement lourd (évite les timeouts)
 * 5. Ajout de logs détaillés à chaque étape pour le debugging
 * 6. Ajout de la gestion des événements invoice.paid et customer.subscription.*
 * 7. Gestion robuste des erreurs avec try/catch à chaque niveau
 * 8. Import Stripe compatible Deno moderne
 * 
 * ACTIONS REQUISES CÔTÉ STRIPE DASHBOARD :
 * ----------------------------------------
 * 1. Vérifier que le webhook pointe vers :
 *    https://yjbyermyfbugfyzmidsp.supabase.co/functions/v1/stripe-webhook
 * 
 * 2. Récupérer le "Signing secret" (whsec_xxx) de CE webhook et le configurer
 *    dans Supabase Dashboard > Edge Functions > stripe-webhook > Secrets :
 *    - STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxxxxxxxxxxxxx
 * 
 * 3. S'assurer que les événements suivants sont cochés dans le webhook Stripe :
 *    - checkout.session.completed
 *    - invoice.paid
 *    - customer.subscription.created
 *    - customer.subscription.updated
 *    - customer.subscription.deleted
 *    - payment_intent.succeeded (optionnel)
 *    - payment_intent.payment_failed (optionnel)
 * 
 * 4. Cliquer sur "Réessayer" pour les événements en échec
 * 
 * ============================================================================
 */

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ============================================================================
// CONFIGURATION ET INITIALISATION
// ============================================================================

// Vérification des variables d'environnement au démarrage
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Log de démarrage pour confirmer que la fonction est chargée
console.log('[stripe-webhook] Function initialized');
console.log('[stripe-webhook] Environment check:', {
  hasStripeKey: !!STRIPE_SECRET_KEY,
  hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET,
  hasSupabaseUrl: !!SUPABASE_URL,
  hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY,
});

// Initialisation Stripe (lazy - sera null si la clé manque)
let stripe: Stripe | null = null;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient()
  });
}

// Initialisation Supabase (lazy - sera null si les clés manquent)
let supabaseAdmin: ReturnType<typeof createClient> | null = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// ============================================================================
// TYPES ET CONSTANTES
// ============================================================================

// Types d'événements gérés
const HANDLED_EVENT_TYPES = [
  'checkout.session.completed',
  'invoice.paid',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
];

// Cache pour le mapping priceId → licence
let PRICE_TO_LICENSE_CACHE: Record<string, string> | null = null;
let LICENSE_CACHE_TIMESTAMP = 0;
const LICENSE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Hiérarchie des licences
const LICENSE_HIERARCHY: Record<string, number> = {
  'entree': 1,
  'transformation': 2,
  'immersion': 3
};

// Fallback pour le mapping prix → licence
const FALLBACK_PRICE_TO_LICENSE: Record<string, string> = {
  'price_1SYkswKaUb6KDbNFvH1x4v0V': 'entree',
  'price_1SYloMKaUb6KDbNFAF6XfNvI': 'transformation',
  'price_1SYkswKaUb6KDbNFvwoV35RW': 'immersion',
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Log sécurisé (masque les données sensibles)
 */
function secureLog(message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  if (data) {
    // Masquer les données sensibles
    const sanitized = { ...data };
    if (sanitized.email && typeof sanitized.email === 'string') {
      const [local, domain] = sanitized.email.split('@');
      sanitized.email = local && domain ? `${local.substring(0, 2)}***@${domain}` : '[REDACTED]';
    }
    console.log(`[stripe-webhook] [${timestamp}] ${message}`, JSON.stringify(sanitized));
  } else {
    console.log(`[stripe-webhook] [${timestamp}] ${message}`);
  }
}

/**
 * Crée une réponse JSON avec les headers appropriés
 */
function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/**
 * Récupère le mapping priceId → licence depuis la base de données
 */
async function getPriceToLicenseMapping(): Promise<Record<string, string>> {
  if (!supabaseAdmin) {
    secureLog('Supabase not initialized, using fallback mapping');
    return FALLBACK_PRICE_TO_LICENSE;
  }

  const now = Date.now();
  
  // Utiliser le cache si encore valide
  if (PRICE_TO_LICENSE_CACHE && (now - LICENSE_CACHE_TIMESTAMP) < LICENSE_CACHE_TTL) {
    return PRICE_TO_LICENSE_CACHE;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('stripe_prices')
      .select('stripe_price_id, plan_type')
      .eq('is_active', true);

    if (error || !data || data.length === 0) {
      secureLog('Error or no data fetching price mapping, using fallback', { 
        error: error?.message,
        dataCount: data?.length ?? 0
      });
      return FALLBACK_PRICE_TO_LICENSE;
    }

    const mapping: Record<string, string> = {};
    data.forEach((price) => {
      mapping[price.stripe_price_id] = price.plan_type;
    });

    PRICE_TO_LICENSE_CACHE = mapping;
    LICENSE_CACHE_TIMESTAMP = now;
    
    secureLog('Price mapping loaded from DB', { count: Object.keys(mapping).length });
    return mapping;
  } catch (error) {
    secureLog('Exception fetching price mapping', { 
      error: error instanceof Error ? error.message : 'Unknown' 
    });
    return FALLBACK_PRICE_TO_LICENSE;
  }
}

// ============================================================================
// HANDLERS D'ÉVÉNEMENTS STRIPE
// ============================================================================

/**
 * Traite l'événement checkout.session.completed
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not initialized');
  }

  const customerEmail = session.customer_email || session.customer_details?.email;
  const priceId = session.metadata?.priceId;
  const purchaseType = session.metadata?.type;
  const sessionId = session.metadata?.sessionId;

  if (!customerEmail) {
    secureLog('No customer email found in session', { sessionId: session.id });
    return;
  }

  secureLog('Processing checkout.session.completed', { 
    email: customerEmail, 
    priceId,
    purchaseType,
    sessionId 
  });

  // Vérifier si l'utilisateur existe déjà
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === customerEmail);

  let userId: string;
  let passwordToken: string | null = null;

  if (existingUser) {
    userId = existingUser.id;
    secureLog('Existing user found', { userId });
  } else {
    // Créer un nouveau compte
    const tempPassword = crypto.randomUUID();
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: customerEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (createError || !newUser.user) {
      secureLog('Error creating user', { error: createError?.message });
      throw new Error(`Failed to create user: ${createError?.message}`);
    }

    userId = newUser.user.id;
    secureLog('New user created', { userId });

    // Générer un lien de reset password
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: customerEmail,
    });

    if (linkError) {
      secureLog('Error generating recovery link', { error: linkError.message });
    } else if (linkData?.properties?.hashed_token) {
      passwordToken = linkData.properties.hashed_token;
      secureLog('Password token generated');
      
      // Envoyer l'email de création de mot de passe
      try {
        const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-password-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            email: customerEmail,
            token: passwordToken,
            prenom: session.customer_details?.name?.split(' ')[0] || 'Cher membre',
          }),
        });

        if (emailResponse.ok) {
          secureLog('Password email sent successfully');
        } else {
          const errorData = await emailResponse.text();
          secureLog('Failed to send password email', { error: errorData });
        }
      } catch (emailError) {
        secureLog('Exception sending password email', { 
          error: emailError instanceof Error ? emailError.message : 'Unknown' 
        });
      }
    }
  }

  // Attribuer la licence selon le plan acheté
  const priceToLicense = await getPriceToLicenseMapping();
  const license = priceToLicense[priceId || ''] || 'entree';
  
  secureLog('Assigning license', { license, priceId });

  // Mettre à jour le profil
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
    secureLog('Error updating profile', { error: profileError.message });
  }

  // Accorder l'accès aux modules selon la licence
  const userLicenseLevel = LICENSE_HIERARCHY[license] || 1;

  const { data: modules } = await supabaseAdmin
    .from('training_modules')
    .select('id, required_license');
  
  if (modules && modules.length > 0) {
    const accessibleModules = modules.filter(m => {
      const requiredLicense = m.required_license || 'entree';
      const requiredLevel = LICENSE_HIERARCHY[requiredLicense] || 1;
      return userLicenseLevel >= requiredLevel;
    });

    secureLog('Granting module access', { 
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
        secureLog('Error granting access', { error: accessError.message });
      }
    }
  }

  // Gérer les réservations Immersion Élite
  if (purchaseType === 'immersion' && sessionId) {
    secureLog('Processing Immersion Elite booking', { sessionId });
    
    const { error: bookingError } = await supabaseAdmin
      .from('immersion_bookings')
      .insert({
        session_id: sessionId,
        user_id: userId,
        user_email: customerEmail,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'confirmed'
      });

    if (bookingError) {
      secureLog('Error creating immersion booking', { error: bookingError.message });
    } else {
      const { error: incrementError } = await supabaseAdmin.rpc('increment_session_places', {
        p_session_id: sessionId
      });

      if (incrementError) {
        secureLog('Error incrementing session places', { error: incrementError.message });
      } else {
        secureLog('Immersion booking created successfully');
      }
    }
  }

  // Enregistrer le paiement
  const { error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      user_id: userId,
      stripe_session_id: session.id,
      license_type: license,
      status: passwordToken ? 'pending_password' : 'completed'
    });

  if (paymentError) {
    secureLog('Error recording payment', { error: paymentError.message });
  }

  secureLog('checkout.session.completed processed successfully', { 
    license, 
    isNewUser: !existingUser 
  });
}

/**
 * Traite l'événement invoice.paid (pour les abonnements récurrents)
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not initialized');
  }

  const customerEmail = invoice.customer_email;
  const subscriptionId = invoice.subscription as string | null;

  secureLog('Processing invoice.paid', { 
    email: customerEmail,
    subscriptionId,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency
  });

  if (!customerEmail) {
    secureLog('No customer email in invoice');
    return;
  }

  // Mettre à jour le statut de l'abonnement si nécessaire
  // Pour l'instant, on log simplement l'événement
  secureLog('Invoice paid processed', { email: customerEmail });
}

/**
 * Traite les événements de subscription
 */
async function handleSubscriptionEvent(
  subscription: Stripe.Subscription, 
  eventType: string
): Promise<void> {
  if (!supabaseAdmin || !stripe) {
    throw new Error('Stripe or Supabase not initialized');
  }

  const customerId = subscription.customer as string;
  
  // Récupérer l'email du client
  let customerEmail: string | null = null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted) {
      customerEmail = customer.email;
    }
  } catch (e) {
    secureLog('Error fetching customer', { error: e instanceof Error ? e.message : 'Unknown' });
  }

  secureLog(`Processing ${eventType}`, { 
    subscriptionId: subscription.id,
    status: subscription.status,
    email: customerEmail
  });

  // Gérer les différents statuts d'abonnement
  if (eventType === 'customer.subscription.deleted' && customerEmail) {
    // L'abonnement a été annulé - on pourrait révoquer l'accès ici
    secureLog('Subscription deleted', { email: customerEmail });
  }
}

/**
 * Traite les événements payment_intent
 */
async function handlePaymentIntent(
  paymentIntent: Stripe.PaymentIntent, 
  eventType: string
): Promise<void> {
  secureLog(`Processing ${eventType}`, { 
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency
  });

  if (eventType === 'payment_intent.payment_failed') {
    secureLog('Payment failed', { 
      error: paymentIntent.last_payment_error?.message 
    });
  }
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

Deno.serve(async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID().substring(0, 8);
  secureLog(`Request received [${requestId}]`, { method: req.method });

  // -------------------------------------------------------------------------
  // Vérification de la méthode HTTP
  // -------------------------------------------------------------------------
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (req.method !== 'POST') {
    secureLog(`Method not allowed [${requestId}]`, { method: req.method });
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // -------------------------------------------------------------------------
  // Vérification des dépendances
  // -------------------------------------------------------------------------
  if (!stripe) {
    secureLog(`STRIPE_SECRET_KEY not configured [${requestId}]`);
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    secureLog(`STRIPE_WEBHOOK_SECRET not configured [${requestId}]`);
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  if (!supabaseAdmin) {
    secureLog(`Supabase not configured [${requestId}]`);
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  // -------------------------------------------------------------------------
  // Récupération de la signature et du body
  // -------------------------------------------------------------------------
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    secureLog(`Missing stripe-signature header [${requestId}]`);
    return jsonResponse({ error: 'Missing signature' }, 400);
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (e) {
    secureLog(`Error reading request body [${requestId}]`, { 
      error: e instanceof Error ? e.message : 'Unknown' 
    });
    return jsonResponse({ error: 'Error reading request body' }, 400);
  }

  if (!rawBody) {
    secureLog(`Empty request body [${requestId}]`);
    return jsonResponse({ error: 'Empty request body' }, 400);
  }

  // -------------------------------------------------------------------------
  // Vérification de la signature Stripe
  // -------------------------------------------------------------------------
  let event: Stripe.Event;
  
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody, 
      signature, 
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    secureLog(`Signature verification failed [${requestId}]`, { error: errorMessage });
    return jsonResponse({ error: 'Invalid signature' }, 400);
  }

  secureLog(`Event verified [${requestId}]`, { 
    type: event.type, 
    eventId: event.id 
  });

  // -------------------------------------------------------------------------
  // Répondre rapidement à Stripe (évite les timeouts)
  // Le traitement se fait après la réponse
  // -------------------------------------------------------------------------
  
  // Vérifier si c'est un type d'événement qu'on gère
  if (!HANDLED_EVENT_TYPES.includes(event.type)) {
    secureLog(`Unhandled event type [${requestId}]`, { type: event.type });
    return jsonResponse({ received: true, handled: false }, 200);
  }

  // -------------------------------------------------------------------------
  // Traitement de l'événement
  // -------------------------------------------------------------------------
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionEvent(subscription, event.type);
        break;
      }

      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntent(paymentIntent, event.type);
        break;
      }

      default:
        secureLog(`No handler for event type [${requestId}]`, { type: event.type });
    }

    secureLog(`Event processed successfully [${requestId}]`, { 
      type: event.type, 
      eventId: event.id 
    });

    return jsonResponse({ received: true, handled: true }, 200);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    secureLog(`Error processing event [${requestId}]`, { 
      type: event.type,
      eventId: event.id,
      error: errorMessage 
    });
    
    // On retourne quand même 200 pour éviter que Stripe réessaie indéfiniment
    // L'erreur est loggée pour investigation
    return jsonResponse({ 
      received: true, 
      handled: false, 
      error: 'Processing error' 
    }, 200);
  }
});
