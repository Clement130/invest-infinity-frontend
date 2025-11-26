import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { priceId, userId, userEmail, successUrl, cancelUrl } = await req.json();
    // Validation - userId peut être optionnel pour les nouveaux inscrits
    if (!priceId || !userEmail) {
      throw new Error('Missing required fields: priceId, userEmail');
    }
    // Utiliser les URLs envoyées depuis le frontend, ou fallback sur SITE_URL
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.investinfinity.fr';
    const finalSuccessUrl = successUrl || `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${siteUrl}/pricing`;
    console.log('[checkout-public] Creating session for:', userEmail, 'userId:', userId);
    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        'card'
      ],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      client_reference_id: userId || userEmail,
      customer_email: userEmail,
      metadata: {
        userId: userId || 'pending',
        priceId: priceId,
        userEmail: userEmail
      }
    });
    console.log('[checkout-public] Session created:', session.id);
    return new Response(JSON.stringify({
      sessionId: session.id,
      url: session.url
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('[checkout-public] Error:', error.message);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
