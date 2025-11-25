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

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const bunnyLibraryId = Deno.env.get('BUNNY_STREAM_LIBRARY_ID') || '';
const bunnyApiKey = Deno.env.get('BUNNY_STREAM_API_KEY') || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

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

  // Vérifier que l'utilisateur est admin ou developer
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: corsHeaders },
    );
  }

  // Vérifier le rôle admin ou developer
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'developer')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Admin or Developer access required' }),
      { status: 403, headers: corsHeaders },
    );
  }

  // Vérifier les secrets Bunny Stream
  if (!bunnyLibraryId || !bunnyApiKey) {
    return new Response(
      JSON.stringify({
        error: 'Bunny Stream configuration missing. Please configure BUNNY_STREAM_LIBRARY_ID and BUNNY_STREAM_API_KEY in Supabase secrets.',
      }),
      { status: 500, headers: corsHeaders },
    );
  }

  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const itemsPerPage = parseInt(url.searchParams.get('itemsPerPage') || '100', 10);

      const bunnyUrl = `https://video.bunnycdn.com/library/${bunnyLibraryId}/videos?page=${page}&itemsPerPage=${itemsPerPage}&orderBy=date`;

      const response = await fetch(bunnyUrl, {
        method: 'GET',
        headers: {
          AccessKey: bunnyApiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[list-bunny-videos] Error:', errorText);
        return new Response(
          JSON.stringify({
            error: 'Failed to fetch videos from Bunny Stream',
            details: errorText,
          }),
          { status: 500, headers: corsHeaders },
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({
          items: data.items || [],
          totalItems: data.totalItems || 0,
        }),
        { status: 200, headers: corsHeaders },
      );
    } catch (err) {
      console.error('[list-bunny-videos] Unexpected error:', err);
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

