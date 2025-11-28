import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';

// Helper CORS sécurisé
function getCorsHeaders(origin: string | null): Record<string, string> {
  const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'https://invest-infinity-frontend.vercel.app',
    'https://invest-infinity-frontend-*.vercel.app',
  ];

  // Vérifier si l'origine est autorisée
  let allowedOrigin = ALLOWED_ORIGINS[0]; // Par défaut, localhost

  if (origin) {
    // Vérifier les correspondances exactes
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowedOrigin = origin;
    }
    // Vérifier les patterns Vercel (wildcard)
    else if (origin.includes('vercel.app') && ALLOWED_ORIGINS.some(pattern => pattern.includes('vercel.app'))) {
      allowedOrigin = origin;
    }
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

// Récupérer les secrets depuis Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const bunnyEmbedTokenKey = Deno.env.get('BUNNY_EMBED_TOKEN_KEY') || '';
const bunnyEmbedBaseUrl = Deno.env.get('VITE_BUNNY_EMBED_BASE_URL') || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface TokenRequest {
  videoId: string;
  expiryHours?: number; // Durée de validité en heures (défaut: 24h)
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Vérifier l'authentification
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: corsHeaders },
    );
  }

  // Vérifier que l'utilisateur est connecté
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: corsHeaders },
    );
  }

  // Vérifier les secrets Bunny Stream
  if (!bunnyEmbedTokenKey) {
    return new Response(
      JSON.stringify({
        error: 'Bunny Stream embed token key not configured. Please configure BUNNY_EMBED_TOKEN_KEY in Supabase secrets.',
      }),
      { status: 500, headers: corsHeaders },
    );
  }

  if (req.method === 'POST') {
    try {
      const { videoId, expiryHours = 24 }: TokenRequest = await req.json();

      if (!videoId) {
        return new Response(
          JSON.stringify({ error: 'Video ID is required' }),
          { status: 400, headers: corsHeaders },
        );
      }

      // Calculer l'expiration (timestamp UNIX)
      const expires = Math.floor(Date.now() / 1000) + (expiryHours * 3600);

      // Générer le token selon la formule Bunny Stream :
      // SHA256_HEX(token_security_key + video_id + expiration)
      const tokenString = bunnyEmbedTokenKey + videoId + expires;
      const token = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tokenString));
      const tokenHex = Array.from(new Uint8Array(token))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Construire l'URL sécurisée
      const secureEmbedUrl = `${bunnyEmbedBaseUrl}/${videoId}?token=${tokenHex}&expires=${expires}`;

      return new Response(
        JSON.stringify({
          success: true,
          embedUrl: secureEmbedUrl,
          token: tokenHex,
          expires: expires,
          videoId: videoId,
        }),
        { status: 200, headers: corsHeaders },
      );

    } catch (err) {
      console.error('[generate-bunny-token] Unexpected error:', err);
      return new Response(
        JSON.stringify({
          error: 'Unexpected error',
          details: err instanceof Error ? err.message : 'Unknown error',
        }),
        { status: 500, headers: corsHeaders },
      );
    }
  }

  return new Response('Method not allowed', {
    status: 405,
    headers: corsHeaders,
  });
});
