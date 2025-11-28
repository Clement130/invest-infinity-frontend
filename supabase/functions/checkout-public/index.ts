import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import {
  checkRateLimit,
  getClientIP,
  rateLimitResponse,
  secureLog,
  addSecurityHeaders,
} from '../_shared/security.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});

// Liste des priceId autorisés (protection contre manipulation)
const ALLOWED_PRICE_IDS = [
  'price_1SXfwzKaUb6KDbNF81uubunw', // starter
  'price_1SXfxaKaUb6KDbNFRgl7y7I5', // pro
  'price_1SXfyUKaUb6KDbNFYjpa57JP', // elite
];

// Helper CORS sécurisé
function getCorsHeaders(origin: string | null): Record<string, string> {
  const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'https://www.investinfinity.fr',
    'https://investinfinity.fr',
    'https://invest-infinity-frontend.vercel.app',
  ];
  
  let allowedOrigin = ALLOWED_ORIGINS[0];
  
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowedOrigin = origin;
    } 
    else if (origin.match(/^https:\/\/invest-infinity-frontend.*\.vercel\.app$/)) {
      allowedOrigin = origin;
    }
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
};
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ==================== RATE LIMITING ====================
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit({
    identifier: `checkout:${clientIP}`,
    maxRequests: 5,        // 5 tentatives max
    windowMs: 60 * 1000,   // par minute
  });

  if (!rateLimit.allowed) {
    secureLog('checkout-public', 'Rate limit exceeded', { ip: clientIP });
    return rateLimitResponse(rateLimit.resetIn, corsHeaders);
  }

  try {
    const body = await req.json();
    const { priceId, successUrl, cancelUrl, userEmail } = body;
    
    // ==================== VALIDATION RENFORCÉE ====================
    
    // Valider le priceId
    if (!priceId || typeof priceId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid priceId' }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) }
      );
    }

    // Valider l'email si fourni
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validatedEmail = userEmail && typeof userEmail === 'string' && emailRegex.test(userEmail) 
      ? userEmail.toLowerCase().trim() 
      : null;

    // Vérifier que le priceId est dans la liste autorisée
    if (!ALLOWED_PRICE_IDS.includes(priceId)) {
      secureLog('checkout-public', 'Invalid priceId attempted', { priceId, ip: clientIP });
      return new Response(
        JSON.stringify({ error: 'Invalid price selection' }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) }
      );
    }

    // Valider les URLs (protection contre open redirect)
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.investinfinity.fr';
    const allowedUrlPrefixes = [
      siteUrl,
      'https://www.investinfinity.fr',
      'https://investinfinity.fr',
      'http://localhost:5173',
    ];

    const isValidUrl = (url: string | undefined): boolean => {
      if (!url) return true; // URL par défaut sera utilisée
      return allowedUrlPrefixes.some(prefix => url.startsWith(prefix));
    };

    if (!isValidUrl(successUrl) || !isValidUrl(cancelUrl)) {
      secureLog('checkout-public', 'Invalid redirect URL attempted', { 
        successUrl, 
        cancelUrl, 
        ip: clientIP 
      });
      return new Response(
        JSON.stringify({ error: 'Invalid redirect URL' }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) }
      );
    }

    const finalSuccessUrl = successUrl || `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${siteUrl}/pricing`;

    secureLog('checkout-public', 'Creating checkout session', { priceId, hasEmail: !!validatedEmail });

    // Créer la session Stripe Checkout
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card', 'klarna'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        priceId: priceId,
        createdAt: new Date().toISOString(),
      },
      // Options de sécurité Stripe
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // Expire dans 30 min
    };

    // Pré-remplir l'email si disponible (empêche l'utilisateur de saisir un autre email)
    if (validatedEmail) {
      sessionParams.customer_email = validatedEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    secureLog('checkout-public', 'Session created', { sessionId: session.id });

    return new Response(JSON.stringify({
      sessionId: session.id,
      url: session.url
    }), {
      headers: addSecurityHeaders(corsHeaders),
      status: 200
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    secureLog('checkout-public', 'Error creating session', { error: errorMessage });
    
    return new Response(
      JSON.stringify({ error: 'Unable to create payment session' }),
      { status: 500, headers: addSecurityHeaders(corsHeaders) }
    );
  }
});
