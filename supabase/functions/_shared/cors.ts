/**
 * Helper pour gérer CORS de manière sécurisée
 * Ne permet que les origines autorisées
 */

// Liste des origines autorisées
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  // Domaines de production
  'https://www.investinfinity.fr',
  'https://investinfinity.fr',
  'https://invest-infinity-frontend.vercel.app',
];

/**
 * Génère les headers CORS en fonction de l'origine de la requête
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  let allowedOrigin = ALLOWED_ORIGINS[0]; // Fallback sur localhost en développement
  
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowedOrigin = origin;
    }
    // Accepter les sous-domaines Vercel pour les previews
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
