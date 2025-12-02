/**
 * ============================================================================
 * STRIPE WEBHOOK - MODE LIVE (Production)
 * ============================================================================
 * 
 * URL de l'endpoint LIVE :
 * https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook
 * 
 * VARIABLES D'ENVIRONNEMENT REQUISES :
 * ------------------------------------
 * - STRIPE_SECRET_KEY_LIVE    : sk_live_xxxxxxxxxxxxxxxx
 * - STRIPE_WEBHOOK_SECRET_LIVE: whsec_xxxxxxxxxxxxxxxx (du webhook LIVE)
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
 * ============================================================================
 */

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ============================================================================
// CONFIGURATION - MODE LIVE
// ============================================================================

const MODE = 'LIVE';
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY_LIVE');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET_LIVE');
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
  'charge.refunded',
];

// Cache pour le mapping priceId → licence
let PRICE_TO_LICENSE_CACHE: Record<string, string> | null = null;
let LICENSE_CACHE_TIMESTAMP = 0;
const LICENSE_CACHE_TTL = 5 * 60 * 1000;

const LICENSE_HIERARCHY: Record<string, number> = {
  'entree': 1,
  'transformation': 2,
  'immersion': 3
};

// Fallback LIVE prices
const FALLBACK_PRICE_TO_LICENSE: Record<string, string> = {
  'price_1SYkswKaUb6KDbNFvH1x4v0V': 'entree',
  'price_1SYloMKaUb6KDbNFAF6XfNvI': 'transformation',
  'price_1SYkswKaUb6KDbNFvwoV35RW': 'immersion',
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

  // Vérifier si l'utilisateur existe déjà via la table profiles (plus rapide)
  let userId: string | null = null;
  let passwordToken: string | null = null;
  let isNewUser = false;

  try {
    // Vérifier d'abord dans la table profiles (beaucoup plus rapide que listUsers())
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs si aucun résultat

    if (profile && !profileError && profile.id) {
      userId = profile.id;
      secureLog('Existing user found via profile', { userId });
    }
  } catch (checkError) {
    secureLog('Error checking existing user in profiles, will create new user', { 
      error: checkError instanceof Error ? checkError.message : 'Unknown' 
    });
  }

  if (!userId) {
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
    isNewUser = true;
    secureLog('New user created', { userId });

    // Générer le lien de récupération de mot de passe de manière asynchrone (non bloquant)
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: customerEmail,
        options: {
          redirectTo: 'https://www.investinfinity.fr/create-password',
        },
      });

      if (linkError) {
        secureLog('Error generating recovery link', { error: linkError.message });
      } else if (linkData?.properties?.hashed_token) {
        passwordToken = linkData.properties.hashed_token;
        secureLog('Password token generated');
        
        // Construire l'URL de vérification Supabase (le bon format !)
        // Supabase vérifie le token et redirige vers /create-password avec une session établie
        const verificationUrl = `${SUPABASE_URL}/auth/v1/verify?token=${linkData.properties.hashed_token}&type=recovery&redirect_to=${encodeURIComponent('https://www.investinfinity.fr/create-password')}`;
        
        // Envoyer l'email de manière non bloquante (ne pas attendre la réponse)
        fetch(`${SUPABASE_URL}/functions/v1/send-password-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            email: customerEmail,
            verificationUrl: verificationUrl,
            prenom: session.customer_details?.name?.split(' ')[0] || 'Cher membre',
          }),
        }).then((emailResponse) => {
          if (emailResponse.ok) {
            secureLog('Password email sent successfully');
          } else {
            emailResponse.text().then((errorData) => {
              secureLog('Failed to send password email', { error: errorData });
            });
          }
        }).catch((emailError) => {
          secureLog('Exception sending password email', { 
            error: emailError instanceof Error ? emailError.message : 'Unknown' 
          });
        });
      }
    } catch (linkGenError) {
      secureLog('Exception generating recovery link', { 
        error: linkGenError instanceof Error ? linkGenError.message : 'Unknown' 
      });
    }
  }

  // Vérification de sécurité : userId doit être défini à ce stade
  if (!userId) {
    throw new Error('User ID is not defined after user creation/retrieval');
  }

  const priceToLicense = await getPriceToLicenseMapping();
  const license = priceToLicense[priceId || ''] || 'entree';
  
  secureLog('Assigning license', { license, priceId });

  // IMPORTANT: Utiliser upsert avec onConflict sur 'id' pour créer ou mettre à jour le profil
  const { data: upsertData, error: profileError } = await supabaseAdmin
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
    })
    .select('id, license');

  if (profileError) {
    secureLog('Error upserting profile', { error: profileError.message, code: profileError.code });
    
    // Tentative de fallback: UPDATE direct si l'upsert échoue
    secureLog('Attempting direct UPDATE as fallback');
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        license: license,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateError) {
      secureLog('Fallback UPDATE also failed', { error: updateError.message });
    } else {
      secureLog('Fallback UPDATE succeeded');
    }
  } else {
    secureLog('Profile upsert succeeded', { 
      profileId: upsertData?.[0]?.id,
      assignedLicense: upsertData?.[0]?.license 
    });
  }

  // VERIFICATION: S'assurer que la licence a bien été assignée
  const { data: verifyProfile, error: verifyError } = await supabaseAdmin
    .from('profiles')
    .select('id, license')
    .eq('id', userId)
    .single();

  if (verifyError) {
    secureLog('Error verifying profile after upsert', { error: verifyError.message });
  } else if (verifyProfile?.license !== license) {
    secureLog('WARNING: License mismatch detected!', { 
      expected: license, 
      actual: verifyProfile?.license 
    });
    
    // Forcer la mise à jour si la licence ne correspond pas
    const { error: forceUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ license: license })
      .eq('id', userId);
    
    if (forceUpdateError) {
      secureLog('Force update failed', { error: forceUpdateError.message });
    } else {
      secureLog('Force update succeeded - license corrected to', { license });
    }
  } else {
    secureLog('License verification passed', { license: verifyProfile?.license });
  }

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
    isNewUser 
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

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  if (!supabaseAdmin || !stripe) {
    throw new Error('Stripe or Supabase not initialized');
  }

  const customerEmail = charge.billing_details?.email || charge.receipt_email;
  const refundedAmount = charge.amount_refunded;
  const totalAmount = charge.amount;
  const isFullRefund = refundedAmount >= totalAmount;

  secureLog('Processing charge.refunded', { 
    chargeId: charge.id,
    email: customerEmail,
    refundedAmount,
    totalAmount,
    isFullRefund,
    currency: charge.currency
  });

  if (!customerEmail) {
    // Essayer de récupérer l'email via le customer ID
    if (charge.customer) {
      try {
        const customer = await stripe.customers.retrieve(charge.customer as string);
        if (customer && !customer.deleted && customer.email) {
          await revokeUserAccess(customer.email, isFullRefund);
          return;
        }
      } catch (e) {
        secureLog('Error fetching customer for refund', { error: e instanceof Error ? e.message : 'Unknown' });
      }
    }
    secureLog('No customer email found for refund');
    return;
  }

  await revokeUserAccess(customerEmail, isFullRefund);
}

async function revokeUserAccess(email: string, isFullRefund: boolean): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not initialized');
  }

  secureLog('Revoking user access due to refund', { email, isFullRefund });

  // Trouver l'utilisateur par email
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, license')
    .eq('email', email)
    .maybeSingle();

  if (profileError || !profile) {
    secureLog('User not found for refund revocation', { email, error: profileError?.message });
    return;
  }

  const previousLicense = profile.license;

  // Révoquer la licence (remettre à 'none')
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ 
      license: 'none',
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id);

  if (updateError) {
    secureLog('Error revoking license', { error: updateError.message });
    return;
  }

  secureLog('License revoked successfully', { 
    userId: profile.id, 
    previousLicense,
    newLicense: 'none'
  });

  // Supprimer les accès aux modules
  const { error: accessError } = await supabaseAdmin
    .from('training_access')
    .delete()
    .eq('user_id', profile.id);

  if (accessError) {
    secureLog('Error removing training access', { error: accessError.message });
  } else {
    secureLog('Training access removed');
  }

  // Mettre à jour le statut du paiement
  const { error: paymentError } = await supabaseAdmin
    .from('payments')
    .update({ status: 'refunded' })
    .eq('user_id', profile.id)
    .eq('status', 'completed');

  if (paymentError) {
    secureLog('Error updating payment status', { error: paymentError.message });
  } else {
    secureLog('Payment status updated to refunded');
  }
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

Deno.serve(async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID().substring(0, 8);
  
  // Wrapper global pour garantir qu'une réponse est toujours renvoyée
  try {
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
      secureLog(`STRIPE_SECRET_KEY_LIVE not configured [${requestId}]`);
      return jsonResponse({ error: 'Server configuration error: missing Stripe key' }, 500);
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      secureLog(`STRIPE_WEBHOOK_SECRET_LIVE not configured [${requestId}]`);
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

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          await handleChargeRefunded(charge);
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
      const errorStack = err instanceof Error ? err.stack : undefined;
      secureLog(`Error processing event [${requestId}]`, { 
        type: event.type,
        eventId: event.id,
        error: errorMessage,
        stack: errorStack
      });
      
      // Retourne 200 pour éviter les retries infinis de Stripe
      return jsonResponse({ 
        received: true, 
        handled: false, 
        error: 'Processing error',
        mode: MODE
      }, 200);
    }
  } catch (globalErr) {
    // Catch-all pour toute erreur non capturée
    const errorMessage = globalErr instanceof Error ? globalErr.message : 'Unknown error';
    const errorStack = globalErr instanceof Error ? globalErr.stack : undefined;
    secureLog(`Unhandled global error [${requestId}]`, { 
      error: errorMessage,
      stack: errorStack
    });
    
    // Toujours retourner 200 pour éviter les retries infinis de Stripe
    return jsonResponse({ 
      received: true, 
      handled: false, 
      error: 'Internal server error',
      mode: MODE
    }, 200);
  }
});
