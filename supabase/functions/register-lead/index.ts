import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Supabase fournit automatiquement SUPABASE_URL
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please configure secrets via Supabase Dashboard > Settings > Edge Functions > Secrets');
}

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

  try {
    const payload = (await req.json()) as LeadPayload;
    const { prenom, email, telephone, capital } = payload;

    if (!prenom || !email || !telephone || capital === undefined || capital === null) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
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

    // Déterminer le segment basé sur le capital
    const segment = capitalValue < 500 ? 'low' : capitalValue < 2000 ? 'medium' : 'high';
    
    const { error } = await supabase.from('leads').upsert(
      {
        prenom,
        email: email.toLowerCase(),
        telephone,
        capital: capitalValue,
        statut: payload.statut ?? 'Lead',
        board_id: payload.boardId ?? null,
        newsletter: Boolean(payload.newsLetter),
        metadata: {
          ...payload.metadata,
          segment,
          registered_at: new Date().toISOString(),
        },
      },
      {
        onConflict: 'email',
      },
    );

    if (error) {
      console.error('[register-lead] upsert error', error);
      return new Response(
        JSON.stringify({
          error: 'Unable to register lead',
          details: error.message,
        }),
        { status: 500, headers: corsHeaders },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        segment,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (err) {
    console.error('[register-lead] unexpected error', err);
    return new Response(
      JSON.stringify({
        error: 'Unexpected error',
        details: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});

