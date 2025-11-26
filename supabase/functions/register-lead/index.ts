import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
import {
  checkRateLimit,
  getClientIP,
  rateLimitResponse,
  sanitizeString,
  isValidEmail,
  isValidPhone,
  isValidCapital,
  isValidName,
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

type LeadPayload = {
  prenom: string;
  email: string;
  telephone: string;
  capital: number | string;
  statut?: string;
  boardId?: number;
  newsLetter?: boolean;
  metadata?: Record<string, unknown>;
};

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ==================== RATE LIMITING ====================
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit({
    identifier: `register-lead:${clientIP}`,
    maxRequests: 10,      // 10 inscriptions max
    windowMs: 60 * 1000,  // par minute
  });

  if (!rateLimit.allowed) {
    secureLog('register-lead', 'Rate limit exceeded', { ip: clientIP });
    return rateLimitResponse(rateLimit.resetIn, corsHeaders);
  }

  // Vérifier la configuration
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

  try {
    const payload = (await req.json()) as LeadPayload;

    // ==================== VALIDATION RENFORCÉE ====================
    
    // Valider et sanitizer le prénom
    const prenom = sanitizeString(payload.prenom, 100);
    if (!isValidName(prenom)) {
      return new Response(
        JSON.stringify({ error: 'Invalid first name format' }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    // Valider l'email
    const email = payload.email?.toLowerCase().trim();
    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    // Rate limit additionnel par email (anti-spam)
    const emailRateLimit = checkRateLimit({
      identifier: `register-lead:email:${email}`,
      maxRequests: 3,       // 3 tentatives max
      windowMs: 60 * 1000,  // par minute
    });

    if (!emailRateLimit.allowed) {
      secureLog('register-lead', 'Email rate limit exceeded', { email });
      return rateLimitResponse(emailRateLimit.resetIn, corsHeaders);
    }

    // Valider le téléphone
    if (!isValidPhone(payload.telephone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone format. Use international format (+33...)' }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) },
      );
    }
    const telephone = payload.telephone.replace(/[\s\-().]/g, '');

    // Valider le capital
    const capitalValidation = isValidCapital(payload.capital);
    if (!capitalValidation.valid) {
      return new Response(
        JSON.stringify({ error: capitalValidation.error }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) },
      );
    }
    const capitalValue = capitalValidation.value;

    // ==================== INSERTION SÉCURISÉE ====================
    const segment = capitalValue < 500 ? 'low' : capitalValue < 2000 ? 'medium' : 'high';
    
    const { error } = await supabase.from('leads').upsert(
      {
        prenom,
        email,
        telephone,
        capital: capitalValue,
        statut: sanitizeString(payload.statut || 'Lead', 50),
        board_id: typeof payload.boardId === 'number' ? payload.boardId : null,
        newsletter: Boolean(payload.newsLetter),
        metadata: {
          segment,
          registered_at: new Date().toISOString(),
          ip_hash: await hashIP(clientIP), // Hash de l'IP pour audit sans stocker l'IP
        },
      },
      { onConflict: 'email' },
    );

    if (error) {
      secureLog('register-lead', 'Database error', { error: error.message });
      return new Response(
        JSON.stringify({ error: 'Unable to register. Please try again.' }),
        { status: 500, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    secureLog('register-lead', 'Lead registered successfully', { email, segment });

    return new Response(
      JSON.stringify({ success: true, segment }),
      { status: 200, headers: addSecurityHeaders(corsHeaders) },
    );

  } catch (err) {
    secureLog('register-lead', 'Unexpected error', { 
      error: err instanceof Error ? err.message : 'Unknown' 
    });
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: addSecurityHeaders(corsHeaders) },
    );
  }
});

// Hash l'IP pour l'audit sans stocker l'IP en clair
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + Deno.env.get('SUPABASE_URL')); // Salt avec URL
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}


