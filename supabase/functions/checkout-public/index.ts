import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});

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
  
  // Vérifier si l'origine est autorisée
  let allowedOrigin = ALLOWED_ORIGINS[0];
  
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowedOrigin = origin;
    } 
    // Accepter les sous-domaines Vercel pour les previews
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

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { priceId, successUrl, cancelUrl } = await req.json();
    
    // Validation - seul priceId est requis, Stripe collecte l'email
    if (!priceId) {
      throw new Error('Missing required field: priceId');
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.investinfinity.fr';
    const finalSuccessUrl = successUrl || `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${siteUrl}/pricing`;

    console.log('[checkout-public] Creating session for priceId:', priceId);

    // Créer la session Stripe Checkout - Stripe collecte l'email du client
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      // Stripe demande l'email au client sur la page de paiement
      metadata: {
        priceId: priceId
      }
    });

    console.log('[checkout-public] Session created:', session.id);

    return new Response(JSON.stringify({
      sessionId: session.id,
      url: session.url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('[checkout-public] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
