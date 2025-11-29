/**
 * lib/bunny.ts – Module d'intégration Bunny Stream
 * 
 * Ce module centralise toutes les interactions avec Bunny Stream.
 * 
 * SÉCURITÉ :
 * - Toutes les opérations passent par les Edge Functions Supabase
 * - Les clés API ne sont JAMAIS exposées côté client
 * - Les URLs de lecture sont signées avec expiration courte
 * 
 * Edge Functions utilisées :
 * - list-bunny-videos : Liste les vidéos de la bibliothèque
 * - generate-bunny-token : Génère une URL signée pour le playback
 * - upload-bunny-video : Upload une nouvelle vidéo
 */

import { supabase } from './supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

/** Statut de traitement d'une vidéo Bunny */
export type BunnyVideoStatus = 
  | 0  // En attente
  | 1  // En cours de traitement
  | 2  // Transcodage en cours
  | 3  // Terminé
  | 4  // Erreur
  | 5  // Upload en cours
  | 6  // Téléchargement en cours;

/** Représentation d'une vidéo Bunny Stream */
export interface BunnyVideo {
  videoId: string;
  guid: string;
  title: string;
  dateUploaded: string;
  views: number;
  isPublic: boolean;
  /** Durée en secondes */
  length: number;
  status: BunnyVideoStatus;
  thumbnailFileName: string;
  thumbnailCount: number;
  framerate: number;
  rotation: number;
  width: number;
  height: number;
  availableResolutions: string;
  categoryId: string;
  chapters: unknown[];
  moments: unknown[];
  metaTags: unknown[];
  transcodingStatus: number;
  storageSize: number;
  thumbnailUrl?: string;
}

/** Réponse de l'upload d'une vidéo */
export interface BunnyUploadResponse {
  videoId: string;
  guid: string;
  title: string;
  success: boolean;
}

/** Réponse de la génération d'URL signée */
export interface BunnySecureUrlResponse {
  embedUrl: string;
  token: string;
  expires: number;
  videoId: string;
}

/** Options pour la liste des vidéos */
export interface ListVideosOptions {
  page?: number;
  itemsPerPage?: number;
}

/** Options pour l'URL signée */
export interface SecureUrlOptions {
  /** Durée de validité en heures (défaut: 24) */
  expiryHours?: number;
}

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
// API PUBLIQUE
// ============================================================================

/**
 * Liste toutes les vidéos de la bibliothèque Bunny Stream
 * 
 * @example
 * const { items, totalItems } = await listVideos({ page: 1, itemsPerPage: 50 });
 */
export async function listVideos(
  options: ListVideosOptions = {}
): Promise<{ items: BunnyVideo[]; totalItems: number }> {
  const { page = 1, itemsPerPage = 100 } = options;
  
  return fetchWithAuth<{ items: BunnyVideo[]; totalItems: number }>(
    `list-bunny-videos?page=${page}&itemsPerPage=${itemsPerPage}`,
    { method: 'GET' }
  );
}

/**
 * Génère une URL de lecture sécurisée (signée) pour une vidéo
 * 
 * L'URL générée expire après la durée spécifiée (défaut: 24h).
 * Cette fonction vérifie que l'utilisateur est authentifié.
 * 
 * @example
 * const { embedUrl } = await generateSecurePlaybackUrl('video-id-123', { expiryHours: 2 });
 */
export async function generateSecurePlaybackUrl(
  videoId: string,
  options: SecureUrlOptions = {}
): Promise<BunnySecureUrlResponse> {
  const { expiryHours = 24 } = options;

  if (!videoId) {
    throw new Error('L\'ID de la vidéo est requis');
  }

  return fetchWithAuth<BunnySecureUrlResponse>(
    'generate-bunny-token',
    {
      method: 'POST',
      body: JSON.stringify({ videoId, expiryHours }),
    }
  );
}

/**
 * Upload une vidéo vers Bunny Stream
 * 
 * @param title - Titre de la vidéo
 * @param file - Fichier vidéo à uploader
 * @param onProgress - Callback de progression (0-100)
 * 
 * @example
 * const result = await uploadVideo('Ma vidéo', file, (progress) => {
 *   console.log(`Upload: ${progress}%`);
 * });
 */
export async function uploadVideo(
  title: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<BunnyUploadResponse> {
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

/**
 * Génère l'URL de la miniature d'une vidéo
 * 
 * Note: Cette URL est publique (non signée) car les miniatures
 * ne nécessitent pas de protection.
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
 */
export function isVideoReady(status: BunnyVideoStatus): boolean {
  return status === 3; // Statut "Terminé"
}

/**
 * Retourne un libellé lisible pour le statut d'une vidéo
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

// ============================================================================
// EXPORTS PAR DÉFAUT (pour compatibilité avec imports existants)
// ============================================================================

export default {
  listVideos,
  generateSecurePlaybackUrl,
  uploadVideo,
  getThumbnailUrl,
  isVideoReady,
  getVideoStatusLabel,
  formatDuration,
  formatFileSize,
};

