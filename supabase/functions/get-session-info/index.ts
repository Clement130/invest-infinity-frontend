import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

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

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Missing sessionId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Validation du format de sessionId (doit commencer par cs_)
    if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
      return new Response(JSON.stringify({ error: 'Invalid sessionId format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log('[get-session-info] Fetching session:', sessionId);

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

    const customerEmail = session.customer_email || session.customer_details?.email;
    
    if (!customerEmail) {
      return new Response(JSON.stringify({ error: 'No email in session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Vérifier si l'utilisateur existe et a besoin de définir un mot de passe
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === customerEmail);

    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'User not found',
        email: customerEmail,
        needsAccount: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Vérifier si c'est un nouvel utilisateur (créé récemment et jamais connecté)
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const isNewUser = (now.getTime() - createdAt.getTime()) < 5 * 60 * 1000; // Créé il y a moins de 5 min
    const hasNeverLoggedIn = !user.last_sign_in_at;

    let token = null;
    
    if (isNewUser && hasNeverLoggedIn) {
      // Générer un nouveau token de reset
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: customerEmail,
      });

      if (!linkError && linkData?.properties?.hashed_token) {
        token = linkData.properties.hashed_token;
      }
    }

    console.log('[get-session-info] User found:', user.id, 'isNewUser:', isNewUser, 'hasToken:', !!token);

    return new Response(JSON.stringify({
      success: true,
      email: customerEmail,
      userId: user.id,
      isNewUser: isNewUser && hasNeverLoggedIn,
      token: token,
      paymentStatus: session.payment_status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (err) {
    console.error('[get-session-info] Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

