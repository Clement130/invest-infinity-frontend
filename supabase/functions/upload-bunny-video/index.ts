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
const bunnyLibraryId = Deno.env.get('BUNNY_STREAM_LIBRARY_ID') || '';
const bunnyApiKey = Deno.env.get('BUNNY_STREAM_API_KEY') || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface UploadRequest {
  title: string;
  videoFile?: string; // Base64 encoded file (pour les petits fichiers)
  videoUrl?: string; // URL d'une vidéo à télécharger
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

  // Vérifier que l'utilisateur est admin
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

  if (req.method === 'POST') {
    try {
      const formData = await req.formData();
      const title = formData.get('title') as string;
      const videoFile = formData.get('file') as File | null;

      if (!title) {
        return new Response(
          JSON.stringify({ error: 'Title is required' }),
          { status: 400, headers: corsHeaders },
        );
      }

      if (!videoFile) {
        return new Response(
          JSON.stringify({ error: 'Video file is required' }),
          { status: 400, headers: corsHeaders },
        );
      }

      // Étape 1: Créer la vidéo dans Bunny Stream
      const createUrl = `https://video.bunnycdn.com/library/${bunnyLibraryId}/videos`;
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'AccessKey': bunnyApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('[upload-bunny-video] Create error:', errorText);
        return new Response(
          JSON.stringify({
            error: 'Failed to create video in Bunny Stream',
            details: errorText,
          }),
          { status: 500, headers: corsHeaders },
        );
      }

      const videoData = await createResponse.json();
      const videoId = videoData.videoId || videoData.guid;

      if (!videoId) {
        return new Response(
          JSON.stringify({ error: 'Failed to get video ID from Bunny Stream' }),
          { status: 500, headers: corsHeaders },
        );
      }

      // Étape 2: Uploader le fichier vidéo
      const uploadUrl = `https://video.bunnycdn.com/library/${bunnyLibraryId}/videos/${videoId}`;
      
      // Convertir le File en ArrayBuffer
      const fileBuffer = await videoFile.arrayBuffer();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': bunnyApiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: fileBuffer,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[upload-bunny-video] Upload error:', errorText);
        
        // Nettoyer: supprimer la vidéo créée si l'upload échoue
        await fetch(`https://video.bunnycdn.com/library/${bunnyLibraryId}/videos/${videoId}`, {
          method: 'DELETE',
          headers: {
            'AccessKey': bunnyApiKey,
          },
        });

        return new Response(
          JSON.stringify({
            error: 'Failed to upload video to Bunny Stream',
            details: errorText,
          }),
          { status: 500, headers: corsHeaders },
        );
      }

      // Retourner les informations de la vidéo
      return new Response(
        JSON.stringify({
          success: true,
          videoId,
          guid: videoData.guid,
          title: videoData.title,
          message: 'Video uploaded successfully',
        }),
        { status: 200, headers: corsHeaders },
      );
    } catch (err) {
      console.error('[upload-bunny-video] Unexpected error:', err);
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

