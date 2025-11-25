/**
 * Helper pour gérer CORS de manière sécurisée
 * Ne permet que les origines autorisées
 */

// Liste des origines autorisées
// ⚠️ IMPORTANT: Mettez à jour cette liste avec vos domaines de production
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  // Ajoutez vos domaines de production ici
  // 'https://votre-domaine.com',
  // 'https://www.votre-domaine.com',
];

/**
 * Génère les headers CORS en fonction de l'origine de la requête
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0]; // Fallback sur localhost en développement

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}
