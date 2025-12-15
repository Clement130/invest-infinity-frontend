/**
 * ============================================================================
 * STRIPE WEBHOOK - MODE TEST (Développement)
 * ============================================================================
 * 
 * URL de l'endpoint TEST :
 * https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook-test
 * 
 * VARIABLES D'ENVIRONNEMENT REQUISES :
 * ------------------------------------
 * - STRIPE_SECRET_KEY_TEST    : sk_test_xxxxxxxxxxxxxxxx
 * - STRIPE_WEBHOOK_SECRET_TEST: whsec_xxxxxxxxxxxxxxxx (du webhook TEST)
 * - SUPABASE_URL              : (auto-injecté par Supabase)
 * - SUPABASE_SERVICE_ROLE_KEY : (auto-injecté par Supabase)
 * 
 * ÉVÉNEMENTS STRIPE À CONFIGURER :
 * --------------------------------
 * - checkout.session.completed
 * - invoice.paid
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * 
 * COMMENT TESTER AVEC STRIPE CLI :
 * --------------------------------
 * 1. stripe login
 * 2. stripe listen --forward-to https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook-test
 * 3. Dans un autre terminal : stripe trigger checkout.session.completed
 * 
 * ============================================================================
 */

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ============================================================================
// CONFIGURATION - MODE TEST
// ============================================================================

const MODE = 'TEST';
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY_TEST');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Log de démarrage
console.log(`[stripe-webhook-${MODE}] Function initialized`);
console.log(`[stripe-webhook-${MODE}] Environment check:`, {
  mode: MODE,
  hasStripeKey: !!STRIPE_SECRET_KEY,
  hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET,
  hasSupabaseUrl: !!SUPABASE_URL,
  hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY,
});

// Initialisation Stripe
let stripe: Stripe | null = null;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient()
  });
}

// Initialisation Supabase
let supabaseAdmin: ReturnType<typeof createClient> | null = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// ============================================================================
// TYPES ET CONSTANTES
// ============================================================================

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
const LICENSE_CACHE_TTL = 5 * 60 * 1000;

// Hiérarchie des licences PROFILE (utilisées dans profiles.license)
const PROFILE_LICENSE_HIERARCHY: Record<string, number> = {
  'entree': 1,
  'transformation': 2,
  'immersion': 3
};

// Hiérarchie des licences SYSTÈME (utilisées dans modules.required_license)
const SYSTEM_LICENSE_HIERARCHY: Record<string, number> = {
  'starter': 1,
  'pro': 2,
  'elite': 3
};

// Mapping licence profile → licence système
const PROFILE_TO_SYSTEM_LICENSE: Record<string, string> = {
  'entree': 'starter',
  'transformation': 'pro',
  'immersion': 'elite',
};

// Fallback TEST prices (à adapter avec vos price IDs de test)
const FALLBACK_PRICE_TO_LICENSE: Record<string, string> = {
  // Prix de TEST Stripe - à remplacer par vos vrais IDs de test
  'price_test_entree': 'entree',
  'price_test_transformation': 'transformation',
  'price_test_immersion': 'immersion',
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function secureLog(message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const prefix = `[stripe-webhook-${MODE}]`;
  if (data) {
    const sanitized = { ...data };
    if (sanitized.email && typeof sanitized.email === 'string') {
      const [local, domain] = sanitized.email.split('@');
      sanitized.email = local && domain ? `${local.substring(0, 2)}***@${domain}` : '[REDACTED]';
    }
    console.log(`${prefix} [${timestamp}] ${message}`, JSON.stringify(sanitized));
  } else {
    console.log(`${prefix} [${timestamp}] ${message}`);
  }
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function getPriceToLicenseMapping(): Promise<Record<string, string>> {
  if (!supabaseAdmin) {
    secureLog('Supabase not initialized, using fallback mapping');
    return FALLBACK_PRICE_TO_LICENSE;
  }

  const now = Date.now();
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

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: customerEmail,
    });

    if (linkError) {
      secureLog('Error generating recovery link', { error: linkError.message });
    } else if (linkData?.properties?.hashed_token) {
      passwordToken = linkData.properties.hashed_token;
      secureLog('Password token generated');
      
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

  const priceToLicense = await getPriceToLicenseMapping();
  const license = priceToLicense[priceId || ''] || 'entree';
  
  secureLog('Assigning license', { license, priceId });

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

  // Convertir la licence profile en licence système pour la comparaison
  const userSystemLicense = PROFILE_TO_SYSTEM_LICENSE[license] || 'starter';
  const userLicenseLevel = SYSTEM_LICENSE_HIERARCHY[userSystemLicense] || 1;

  const { data: modules } = await supabaseAdmin
    .from('training_modules')
    .select('id, required_license');
  
  if (modules && modules.length > 0) {
    const accessibleModules = modules.filter(m => {
      // required_license est déjà en format système (starter, pro, elite)
      const requiredLicense = m.required_license;
      if (!requiredLicense || !['starter', 'pro', 'elite'].includes(requiredLicense)) {
        // Module sans licence requise définie = refuser l'accès par sécurité
        return false;
      }
      const requiredLevel = SYSTEM_LICENSE_HIERARCHY[requiredLicense] || 1;
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

  secureLog('Invoice paid processed', { email: customerEmail });
}

async function handleSubscriptionEvent(
  subscription: Stripe.Subscription, 
  eventType: string
): Promise<void> {
  if (!supabaseAdmin || !stripe) {
    throw new Error('Stripe or Supabase not initialized');
  }

  const customerId = subscription.customer as string;
  
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

  if (eventType === 'customer.subscription.deleted' && customerEmail) {
    secureLog('Subscription deleted', { email: customerEmail });
  }
}

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

  // OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  // Uniquement POST
  if (req.method !== 'POST') {
    secureLog(`Method not allowed [${requestId}]`, { method: req.method });
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Vérification des dépendances
  if (!stripe) {
    secureLog(`STRIPE_SECRET_KEY_TEST not configured [${requestId}]`);
    return jsonResponse({ error: 'Server configuration error: missing Stripe key' }, 500);
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    secureLog(`STRIPE_WEBHOOK_SECRET_TEST not configured [${requestId}]`);
    return jsonResponse({ error: 'Server configuration error: missing webhook secret' }, 500);
  }

  if (!supabaseAdmin) {
    secureLog(`Supabase not configured [${requestId}]`);
    return jsonResponse({ error: 'Server configuration error: missing Supabase' }, 500);
  }

  // Récupération signature et raw body
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

  // Vérification de la signature Stripe
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
    eventId: event.id,
    mode: MODE
  });

  // Événement non géré → 200 quand même
  if (!HANDLED_EVENT_TYPES.includes(event.type)) {
    secureLog(`Unhandled event type [${requestId}]`, { type: event.type });
    return jsonResponse({ received: true, handled: false, mode: MODE }, 200);
  }

  // Traitement de l'événement
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
      eventId: event.id,
      mode: MODE
    });

    return jsonResponse({ received: true, handled: true, mode: MODE }, 200);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    secureLog(`Error processing event [${requestId}]`, { 
      type: event.type,
      eventId: event.id,
      error: errorMessage 
    });
    
    // Retourne 200 pour éviter les retries infinis de Stripe
    return jsonResponse({ 
      received: true, 
      handled: false, 
      error: 'Processing error',
      mode: MODE
    }, 200);
  }
});

