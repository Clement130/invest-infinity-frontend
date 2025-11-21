/**
 * Service pour l'intégration avec Bunny Stream API
 * Permet de lister, uploader et gérer les vidéos
 */

const BUNNY_STREAM_LIBRARY_ID = import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID;
const BUNNY_STREAM_API_KEY = import.meta.env.VITE_BUNNY_STREAM_API_KEY;
const BUNNY_STREAM_BASE_URL = 'https://video.bunnycdn.com';

export interface BunnyVideo {
  videoId: string;
  guid: string;
  title: string;
  dateUploaded: string;
  views: number;
  isPublic: boolean;
  length: number; // en secondes
  status: number;
  thumbnailFileName: string;
  thumbnailCount: number;
  framerate: number;
  rotation: number;
  width: number;
  height: number;
  availableResolutions: string;
  categoryId: string;
  chapters: any[];
  moments: any[];
  metaTags: any[];
  transcodingStatus: number;
  storageSize: number;
  videos: any[];
  thumbnailUrl?: string;
}

export interface BunnyVideoUploadResponse {
  videoId: string;
  videoLibraryId: string;
  guid: string;
  title: string;
  dateUploaded: string;
  views: number;
  isPublic: boolean;
  length: number;
  status: number;
  framerate: number;
  rotation: number;
  width: number;
  height: number;
  availableResolutions: string;
  thumbnailCount: number;
  encodeProgress: number;
  storageSize: number;
  captions: any[];
  chapters: any[];
  moments: any[];
  metaTags: any[];
  transcodingMessages: any[];
}

/**
 * Liste toutes les vidéos de la bibliothèque Bunny Stream
 */
export async function listBunnyVideos(
  page: number = 1,
  itemsPerPage: number = 100
): Promise<{ items: BunnyVideo[]; totalItems: number }> {
  if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
    throw new Error(
      'BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être configurés'
    );
  }

  const url = `${BUNNY_STREAM_BASE_URL}/library/${BUNNY_STREAM_LIBRARY_ID}/videos?page=${page}&itemsPerPage=${itemsPerPage}&orderBy=date`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      AccessKey: BUNNY_STREAM_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erreur API Bunny Stream (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  return {
    items: data.items || [],
    totalItems: data.totalItems || 0,
  };
}

/**
 * Récupère les détails d'une vidéo spécifique
 */
export async function getBunnyVideo(videoId: string): Promise<BunnyVideo> {
  if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
    throw new Error(
      'BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être configurés'
    );
  }

  const url = `${BUNNY_STREAM_BASE_URL}/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      AccessKey: BUNNY_STREAM_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erreur API Bunny Stream (${response.status}): ${errorText}`
    );
  }

  return await response.json();
}

/**
 * Crée une vidéo dans Bunny Stream (prépare l'upload)
 */
export async function createBunnyVideo(
  title: string
): Promise<BunnyVideoUploadResponse> {
  if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
    throw new Error(
      'BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être configurés'
    );
  }

  const url = `${BUNNY_STREAM_BASE_URL}/library/${BUNNY_STREAM_LIBRARY_ID}/videos`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      AccessKey: BUNNY_STREAM_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erreur API Bunny Stream (${response.status}): ${errorText}`
    );
  }

  return await response.json();
}

/**
 * Upload une vidéo vers Bunny Stream via Edge Function Supabase
 */
export async function uploadBunnyVideo(
  title: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<BunnyVideoUploadResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL doit être configuré');
  }

  // Récupérer le token d'authentification
  const { supabase } = await import('../lib/supabaseClient');
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Vous devez être connecté pour uploader une vidéo');
  }

  // Créer FormData pour l'upload
  const formData = new FormData();
  formData.append('title', title);
  formData.append('file', file);

  // Utiliser XMLHttpRequest pour le suivi de progression
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const functionUrl = `${supabaseUrl}/functions/v1/upload-bunny-video`;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
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
              videoLibraryId: '',
              guid: response.guid || response.videoId,
              title: response.title || title,
              dateUploaded: new Date().toISOString(),
              views: 0,
              isPublic: false,
              length: 0,
              status: 0,
              framerate: 0,
              rotation: 0,
              width: 0,
              height: 0,
              availableResolutions: '',
              thumbnailCount: 0,
              encodeProgress: 0,
              storageSize: 0,
              captions: [],
              chapters: [],
              moments: [],
              metaTags: [],
              transcodingMessages: [],
            });
          } else {
            reject(new Error(response.error || 'Upload failed'));
          }
        } catch (err) {
          reject(new Error('Failed to parse response'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || `Upload failed: ${xhr.statusText}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed: network error'));
    });

    xhr.open('POST', functionUrl);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.send(formData);
  });
}

/**
 * Supprime une vidéo de Bunny Stream
 */
export async function deleteBunnyVideo(videoId: string): Promise<void> {
  if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
    throw new Error(
      'BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être configurés'
    );
  }

  const url = `${BUNNY_STREAM_BASE_URL}/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      AccessKey: BUNNY_STREAM_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erreur API Bunny Stream (${response.status}): ${errorText}`
    );
  }
}

/**
 * Met à jour les métadonnées d'une vidéo
 */
export async function updateBunnyVideo(
  videoId: string,
  updates: { title?: string; description?: string }
): Promise<BunnyVideo> {
  if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY) {
    throw new Error(
      'BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être configurés'
    );
  }

  const url = `${BUNNY_STREAM_BASE_URL}/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${videoId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      AccessKey: BUNNY_STREAM_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erreur API Bunny Stream (${response.status}): ${errorText}`
    );
  }

  return await response.json();
}

