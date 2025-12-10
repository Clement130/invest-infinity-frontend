/**
 * Service unifié pour la gestion des vidéos
 * 
 * Ce service centralise toutes les opérations liées aux vidéos :
 * - Upload vers Bunny Stream
 * - Liste et recherche de vidéos
 * - Génération d'URLs de lecture sécurisées
 * - Gestion des métadonnées
 * - Utilitaires (formatage, validation, etc.)
 * 
 * SÉCURITÉ : Toutes les opérations passent par les Edge Functions Supabase
 * Les clés API ne sont jamais exposées côté client
 */

import { supabase } from '../lib/supabaseClient';
import type {
  BunnyVideo,
  VideoUploadResponse,
  SecurePlaybackUrlResponse,
  ListVideosOptions,
  PlaybackUrlOptions,
  VideoListResponse,
  VideoMetadata,
  UploadOptions,
  BunnyVideoStatus,
} from '../types/video';

// ============================================================================
// CONFIGURATION
// ============================================================================

const FUNCTIONS_BASE_URL =
  import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ??
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// ============================================================================
// HELPERS INTERNES
// ============================================================================

/**
 * Récupère le token d'authentification de la session courante
 * @throws Error si l'utilisateur n'est pas connecté
 */
async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Vous devez être connecté pour accéder aux vidéos');
  }
  return session.access_token;
}

/**
 * Effectue une requête authentifiée vers une Edge Function
 */
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const response = await fetch(`${FUNCTIONS_BASE_URL}/${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Erreur API Bunny (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignorer les erreurs de parsing
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// ============================================================================
// API PUBLIQUE - UPLOAD
// ============================================================================

/**
 * Upload une vidéo vers Bunny Stream
 * 
 * @param options - Options d'upload (title, file, onProgress)
 * @returns Informations de la vidéo uploadée
 * 
 * @example
 * ```typescript
 * const result = await VideoService.upload({
 *   title: 'Ma vidéo',
 *   file: fileInput.files[0],
 *   onProgress: (progress) => console.log(`Upload: ${progress}%`)
 * });
 * ```
 */
export async function uploadVideo(
  options: UploadOptions
): Promise<VideoUploadResponse> {
  const { title, file, onProgress } = options;
  const token = await getAuthToken();

  const formData = new FormData();
  formData.append('title', title);
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const functionUrl = `${FUNCTIONS_BASE_URL}/upload-bunny-video`;

    // Suivi de la progression
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            resolve({
              videoId: response.videoId,
              guid: response.guid || response.videoId,
              title: response.title || title,
              success: true,
            });
          } else {
            reject(new Error(response.error || 'Échec de l\'upload'));
          }
        } catch {
          reject(new Error('Erreur lors du parsing de la réponse'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || `Upload échoué: ${xhr.statusText}`));
        } catch {
          reject(new Error(`Upload échoué: ${xhr.statusText}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Erreur réseau lors de l\'upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload annulé'));
    });

    xhr.open('POST', functionUrl);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

// ============================================================================
// API PUBLIQUE - LISTE ET RECHERCHE
// ============================================================================

/**
 * Liste toutes les vidéos de la bibliothèque Bunny Stream
 * 
 * @param options - Options de pagination
 * @returns Liste des vidéos et nombre total
 * 
 * @example
 * ```typescript
 * const { items, totalItems } = await VideoService.listVideos({
 *   page: 1,
 *   itemsPerPage: 50
 * });
 * ```
 */
export async function listVideos(
  options: ListVideosOptions = {}
): Promise<VideoListResponse> {
  const { page = 1, itemsPerPage = 100 } = options;
  
  return fetchWithAuth<VideoListResponse>(
    `list-bunny-videos?page=${page}&itemsPerPage=${itemsPerPage}`,
    { method: 'GET' }
  );
}

// ============================================================================
// API PUBLIQUE - LECTURE
// ============================================================================

/**
 * Génère une URL de lecture sécurisée (signée) pour une vidéo
 * 
 * L'URL générée expire après la durée spécifiée (défaut: 24h).
 * Cette fonction vérifie que l'utilisateur est authentifié et a les droits d'accès.
 * 
 * @param videoId - ID de la vidéo (GUID Bunny Stream)
 * @param options - Options de lecture (expiryHours)
 * @returns URL sécurisée avec token et expiration
 * 
 * @example
 * ```typescript
 * const { embedUrl } = await VideoService.getPlaybackUrl('video-id-123', {
 *   expiryHours: 2
 * });
 * ```
 */
export async function getPlaybackUrl(
  videoId: string,
  options: PlaybackUrlOptions = {}
): Promise<SecurePlaybackUrlResponse> {
  const { expiryHours = 24 } = options;

  if (!videoId) {
    throw new Error('L\'ID de la vidéo est requis');
  }

  return fetchWithAuth<SecurePlaybackUrlResponse>(
    'generate-bunny-token',
    {
      method: 'POST',
      body: JSON.stringify({ videoId, expiryHours }),
    }
  );
}

// ============================================================================
// API PUBLIQUE - UTILITAIRES
// ============================================================================

/**
 * Génère l'URL de la miniature d'une vidéo
 * 
 * Note: Cette URL est publique (non signée) car les miniatures
 * ne nécessitent pas de protection.
 * 
 * @param videoId - ID de la vidéo (GUID Bunny Stream)
 * @returns URL de la miniature ou chaîne vide si non configuré
 */
export function getThumbnailUrl(videoId: string): string {
  const bunnyLibraryId = import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID;
  if (!bunnyLibraryId || !videoId) {
    return '';
  }
  return `https://vz-${bunnyLibraryId}.b-cdn.net/${videoId}/thumbnail.jpg`;
}

/**
 * Vérifie si une vidéo est prête à être lue
 * 
 * @param status - Statut de la vidéo
 * @returns true si la vidéo est prête (statut = 3)
 */
export function isVideoReady(status: BunnyVideoStatus): boolean {
  return status === 3; // Statut "Terminé"
}

/**
 * Retourne un libellé lisible pour le statut d'une vidéo
 * 
 * @param status - Statut de la vidéo
 * @returns Libellé en français
 */
export function getVideoStatusLabel(status: BunnyVideoStatus): string {
  const labels: Record<BunnyVideoStatus, string> = {
    0: 'En attente',
    1: 'En cours de traitement',
    2: 'Transcodage',
    3: 'Prêt',
    4: 'Erreur',
    5: 'Upload en cours',
    6: 'Téléchargement',
  };
  return labels[status] || 'Inconnu';
}

/**
 * Formate la durée d'une vidéo en format lisible (mm:ss ou hh:mm:ss)
 * 
 * @param seconds - Durée en secondes
 * @returns Durée formatée (ex: "5:23" ou "1:23:45")
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formate la taille d'un fichier en format lisible
 * 
 * @param bytes - Taille en octets
 * @returns Taille formatée (ex: "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Valide le format d'un ID vidéo (UUID)
 * 
 * @param id - ID à valider
 * @returns true si l'ID est un UUID valide ou vide
 */
export function validateVideoId(id: string): boolean {
  if (!id.trim()) return true; // Vide est valide (pas de vidéo)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id.trim());
}

// ============================================================================
// EXPORT PAR DÉFAUT (Service unifié)
// ============================================================================

/**
 * Service unifié pour la gestion des vidéos
 * 
 * Toutes les opérations passent par les Edge Functions Supabase pour la sécurité.
 */
export const VideoService = {
  // Upload
  upload: uploadVideo,
  
  // Liste
  listVideos,
  
  // Lecture
  getPlaybackUrl,
  
  // Utilitaires
  getThumbnailUrl,
  isVideoReady,
  getVideoStatusLabel,
  formatDuration,
  formatFileSize,
  validateVideoId,
} as const;

export default VideoService;

