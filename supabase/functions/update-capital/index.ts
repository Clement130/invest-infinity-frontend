import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
import {
  checkRateLimit,
  getClientIP,
  rateLimitResponse,
  isValidEmail,
  isValidCapital,
  secureLog,
  addSecurityHeaders,
} from '../_shared/security.ts';

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

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

type UpdatePayload = {
  email: string;
  capital: number | string;
};

// Fonction helper pour vérifier si un utilisateur est admin
async function isAdmin(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  return profile?.role === 'admin' || profile?.role === 'developer';
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit({
    identifier: `update-capital:${clientIP}`,
    maxRequests: 20,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    secureLog('update-capital', 'Rate limit exceeded', { ip: clientIP });
    return rateLimitResponse(rateLimit.resetIn, corsHeaders);
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: addSecurityHeaders(corsHeaders) },
    );
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: addSecurityHeaders(corsHeaders) },
    );
  }

  // Vérifier l'authentification
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: addSecurityHeaders(corsHeaders) },
    );
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired session' }),
      { status: 401, headers: addSecurityHeaders(corsHeaders) },
    );
  }

  try {
    const payload = (await req.json()) as UpdatePayload;

    // Validation renforcée
    if (!isValidEmail(payload.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    const capitalValidation = isValidCapital(payload.capital);
    if (!capitalValidation.valid) {
      return new Response(
        JSON.stringify({ error: capitalValidation.error }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    const targetEmail = payload.email.toLowerCase().trim();
    const capitalValue = capitalValidation.value;

    // Vérifier les permissions
    const userEmail = user.email?.toLowerCase();
    const userIsAdmin = await isAdmin(user.id);

    if (!userIsAdmin && userEmail !== targetEmail) {
      secureLog('update-capital', 'Unauthorized access attempt', { 
        userId: user.id, 
        targetEmail 
      });
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    const { error, data } = await supabase
      .from('leads')
      .update({ capital: capitalValue })
      .eq('email', targetEmail)
      .select('id')
      .single();

    if (error) {
      secureLog('update-capital', 'Database error', { error: error.message });
      return new Response(
        JSON.stringify({ error: 'Unable to update capital' }),
        { status: 500, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Record not found' }),
        { status: 404, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    secureLog('update-capital', 'Capital updated', { email: targetEmail });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: addSecurityHeaders(corsHeaders) },
    );

  } catch (err) {
    secureLog('update-capital', 'Unexpected error', { 
      error: err instanceof Error ? err.message : 'Unknown' 
    });
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: addSecurityHeaders(corsHeaders) },
    );
  }
});

