/**
 * Utilitaires pour l'API Bunny Stream
 * ⚠️ SÉCURITÉ: Toutes les opérations doivent passer par les Edge Functions
 * Les clés API ne sont jamais exposées côté client
 */

// ⚠️ Ces constantes ne sont plus utilisées - les clés API sont côté serveur uniquement
// Toutes les opérations doivent passer par les Edge Functions Supabase

export interface BunnyVideoMetadata {
  guid: string;
  title: string;
  dateUploaded: string;
  views: number;
  length: number; // en secondes
  status: number;
  thumbnailFileName?: string;
  thumbnailCount: number;
  framerate: number;
  width: number;
  height: number;
  storageSize: number;
  transcodingStatus: number;
  encodeProgress: number;
}

export interface CreateVideoResponse {
  guid: string;
  videoLibraryId: string;
  title: string;
  dateUploaded: string;
}

/**
 * Crée une vidéo dans Bunny Stream (prépare l'upload)
 * ⚠️ SÉCURITÉ: Cette fonction est gérée par l'Edge Function upload-bunny-video
 */
export const createBunnyVideo = async (title: string): Promise<CreateVideoResponse> => {
  throw new Error(
    'Cette fonction est gérée par l\'Edge Function upload-bunny-video. ' +
    'Les clés API ne doivent pas être exposées côté client.'
  );
};

/**
 * Upload une vidéo vers Bunny Stream avec suivi de progression
 * ⚠️ SÉCURITÉ: Cette fonction est gérée par l'Edge Function upload-bunny-video
 */
export const uploadToBunny = async (
  videoId: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<void> => {
  throw new Error(
    'Cette fonction est gérée par l\'Edge Function upload-bunny-video. ' +
    'Les clés API ne doivent pas être exposées côté client.'
  );
};

/**
 * Récupère les métadonnées d'une vidéo
 * ⚠️ SÉCURITÉ: Cette fonction doit être implémentée via une Edge Function
 */
export const getBunnyVideo = async (videoId: string): Promise<BunnyVideoMetadata> => {
  throw new Error(
    'Cette fonction doit être implémentée via une Edge Function. ' +
    'Les clés API ne doivent pas être exposées côté client.'
  );
};

/**
 * Liste toutes les vidéos de la bibliothèque
 * ⚠️ SÉCURITÉ: Utilise l'Edge Function list-bunny-videos
 */
export const listBunnyVideos = async (
  page: number = 1,
  itemsPerPage: number = 100
): Promise<{ items: BunnyVideoMetadata[]; totalItems: number }> => {
  // Utiliser le service bunnyStreamService qui passe par l'Edge Function
  const { listBunnyVideos: listVideos } = await import('../../services/bunnyStreamService');
  return await listVideos(page, itemsPerPage);
};

/**
 * Génère l'URL de la miniature
 * ⚠️ Note: Cette fonction nécessite VITE_BUNNY_STREAM_LIBRARY_ID pour l'URL CDN
 * Mais cette variable peut rester publique car elle ne contient pas de clé secrète
 */
export const getBunnyThumbnail = (videoId: string): string => {
  const bunnyLibraryId = import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID;
  if (!bunnyLibraryId) return '';
  return `https://vz-${bunnyLibraryId}.b-cdn.net/${videoId}/thumbnail.jpg`;
};

/**
 * Formate la durée en secondes en format MM:SS ou HH:MM:SS
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

