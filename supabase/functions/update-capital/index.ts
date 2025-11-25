import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';

// Helper CORS sécurisé
function getCorsHeaders(origin: string | null): Record<string, string> {
  const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    // Ajoutez vos domaines de production ici
  ];
  
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

// Supabase fournit automatiquement SUPABASE_URL
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please configure secrets via Supabase Dashboard > Settings > Edge Functions > Secrets');
}

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

  // Vérifier que les secrets sont configurés
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({
        error: 'Server configuration error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Please configure secrets via Supabase Dashboard.',
      }),
      { status: 500, headers: corsHeaders },
    );
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Vérifier l'authentification
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: corsHeaders },
    );
  }

  // Vérifier que l'utilisateur est authentifié
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: corsHeaders },
    );
  }

  try {
    const payload = (await req.json()) as UpdatePayload;
    const { email, capital } = payload;

    if (!email || capital === undefined || capital === null) {
      return new Response(
        JSON.stringify({
          error: 'Missing email or capital',
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const capitalValue = Number(capital);
    if (Number.isNaN(capitalValue)) {
      return new Response(
        JSON.stringify({
          error: 'Capital must be a number',
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Validation: l'utilisateur ne peut modifier que son propre email, sauf s'il est admin
    const userEmail = user.email?.toLowerCase();
    const targetEmail = email.toLowerCase();
    const userIsAdmin = await isAdmin(user.id);

    if (!userIsAdmin && userEmail !== targetEmail) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden: You can only update your own capital',
        }),
        { status: 403, headers: corsHeaders },
      );
    }

    const { error, data } = await supabase
      .from('leads')
      .update({ capital: capitalValue })
      .eq('email', targetEmail)
      .select('id')
      .single();

    if (error) {
      console.error('[update-capital] update error', error);
      return new Response(
        JSON.stringify({
          error: 'Unable to update capital',
          details: error.message,
        }),
        { status: 500, headers: corsHeaders },
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          error: 'Lead not found',
        }),
        { status: 404, headers: corsHeaders },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (err) {
    console.error('[update-capital] unexpected error', err);
    return new Response(
      JSON.stringify({
        error: 'Unexpected error',
        details: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});

