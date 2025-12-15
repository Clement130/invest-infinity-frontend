import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';

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
  let allowedOrigin = ALLOWED_ORIGINS[0]; // Par défaut, localhost

  if (origin) {
    // Vérifier les correspondances exactes
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowedOrigin = origin;
    }
    // Vérifier les patterns Vercel (wildcard pour previews)
    else if (origin.match(/^https:\/\/invest-infinity-frontend.*\.vercel\.app$/)) {
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
const bunnyLibraryId = Deno.env.get('BUNNY_STREAM_LIBRARY_ID') || '';
// URL de base pour les embeds Bunny Stream
const BUNNY_EMBED_BASE_URL = 'https://iframe.mediadelivery.net/embed';

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

  if (!bunnyLibraryId) {
    return new Response(
      JSON.stringify({
        error: 'Bunny Stream library ID not configured. Please configure BUNNY_STREAM_LIBRARY_ID in Supabase secrets.',
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

      // ============================================================================
      // SÉCURITÉ : VÉRIFICATION DES DROITS D'ACCÈS
      // ============================================================================
      // On ne génère un token que si l'utilisateur a le droit de voir cette vidéo.
      // 1. La vidéo est une "preview" (gratuit)
      // 2. L'utilisateur a une licence >= licence requise du module (required_license)
      // 3. L'utilisateur est admin/developer

      // Récupérer les leçons associées à cette vidéo (peut y en avoir plusieurs)
      const { data: lessons, error: lessonError } = await supabase
        .from('training_lessons')
        .select('id, is_preview, module_id')
        .eq('bunny_video_id', videoId);

      if (lessonError || !lessons || lessons.length === 0) {
        // Si on ne trouve pas la leçon dans notre BDD, c'est que la vidéo n'est pas censée être là
        // ou que l'ID est invalide.
        console.warn(`Video ID ${videoId} not linked to any lesson.`);
        return new Response(
          JSON.stringify({ error: 'Video not found or access denied' }),
          { status: 404, headers: corsHeaders },
        );
      }

      // Récupérer le profil utilisateur avec sa licence
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, license')
        .eq('id', user.id)
        .single();

      const isAdminOrDev = profile?.role === 'admin' || profile?.role === 'developer';

      // Fonction helper pour vérifier l'accès selon la licence
      const hasLicenseAccess = (userLicense: string | null | undefined, requiredLicense: string | null | undefined): boolean => {
        if (!requiredLicense || !userLicense || userLicense === 'none') return false;
        if (isAdminOrDev) return true; // Admins ont accès à tout
        
        // Normaliser les anciennes valeurs
        let normalizedUserLicense = userLicense;
        if (userLicense === 'entree') normalizedUserLicense = 'starter';
        else if (userLicense === 'transformation') normalizedUserLicense = 'pro';
        else if (userLicense === 'immersion') normalizedUserLicense = 'elite';
        
        // Hiérarchie : starter < pro < elite
        const licenseHierarchy = ['starter', 'pro', 'elite'];
        const userLevel = licenseHierarchy.indexOf(normalizedUserLicense);
        const requiredLevel = licenseHierarchy.indexOf(requiredLicense);
        
        return userLevel >= requiredLevel && userLevel >= 0 && requiredLevel >= 0;
      };

      // Vérifier l'accès : l'utilisateur doit avoir accès à AU MOINS UNE des leçons
      let hasAccess = false;

      for (const lesson of lessons) {
        // Cas 1 : Preview publique
        if (lesson.is_preview) {
          hasAccess = true;
          break;
        }

        // Cas 2 : Admin / Developer ont accès à tout
        if (isAdminOrDev) {
          hasAccess = true;
          break;
        }

        // Cas 3 : Vérifier la licence de l'utilisateur vs required_license du module
        const { data: module } = await supabase
          .from('training_modules')
          .select('required_license, is_active')
          .eq('id', lesson.module_id)
          .single();

        if (module && module.is_active && hasLicenseAccess(profile?.license, module.required_license)) {
          hasAccess = true;
          break;
        }
      }

      if (!hasAccess) {
        return new Response(
            JSON.stringify({ error: 'Vous n’avez pas accès à ce contenu.' }),
            { status: 403, headers: corsHeaders },
        );
      }
      
      // ============================================================================
      // FIN SÉCURITÉ
      // ============================================================================

      // Calculer l'expiration (timestamp UNIX)
      const expires = Math.floor(Date.now() / 1000) + (expiryHours * 3600);

      // Générer le token selon la formule Bunny Stream Embed Token Authentication :
      // SHA256_HEX(token_security_key + videoId + expiration)
      // Note: Pour l'embed token, on utilise directement videoId, pas le path complet
      const tokenString = bunnyEmbedTokenKey + videoId + expires;
      const token = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tokenString));
      const tokenHex = Array.from(new Uint8Array(token))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Construire l'URL sécurisée avec library ID
      // Format: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}?token={token}&expires={expires}
      const path = `/${bunnyLibraryId}/${videoId}`;
      const secureEmbedUrl = `${BUNNY_EMBED_BASE_URL}${path}?token=${tokenHex}&expires=${expires}`;

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
