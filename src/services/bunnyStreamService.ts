/**
 * Service pour l'intégration avec Bunny Stream API
 * ⚠️ SÉCURITÉ: Toutes les opérations passent par les Edge Functions Supabase
 * Les clés API ne sont jamais exposées côté client
 */

const FUNCTIONS_BASE_URL =
  import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ??
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

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
 * ⚠️ SÉCURITÉ: Passe par l'Edge Function pour éviter d'exposer les clés API
 */
export async function listBunnyVideos(
  page: number = 1,
  itemsPerPage: number = 100
): Promise<{ items: BunnyVideo[]; totalItems: number }> {
  // Récupérer le token d'authentification
  const { supabase } = await import('../lib/supabaseClient');
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Vous devez être connecté pour lister les vidéos');
  }

  const url = `${FUNCTIONS_BASE_URL}/list-bunny-videos?page=${page}&itemsPerPage=${itemsPerPage}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = `Erreur API Bunny Stream (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
        // Si c'est une erreur de configuration, utiliser un message plus clair
        if (errorMessage.includes('Bunny Stream configuration missing') || 
            errorMessage.includes('BUNNY_STREAM_LIBRARY_ID') ||
            errorMessage.includes('BUNNY_STREAM_API_KEY')) {
          errorMessage = 'BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être configurés dans les secrets Supabase';
        }
      }
    } catch {
      // Si la réponse n'est pas du JSON, utiliser le texte brut
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Récupère les détails d'une vidéo spécifique
 * ⚠️ SÉCURITÉ: Cette fonction doit être implémentée via une Edge Function
 * Pour l'instant, elle n'est pas utilisée dans le code
 */
export async function getBunnyVideo(videoId: string): Promise<BunnyVideo> {
  throw new Error(
    'Cette fonction doit être implémentée via une Edge Function. ' +
    'Les clés API ne doivent pas être exposées côté client.'
  );
}

/**
 * Crée une vidéo dans Bunny Stream (prépare l'upload)
 * ⚠️ SÉCURITÉ: Cette fonction est gérée par l'Edge Function upload-bunny-video
 * Ne pas appeler directement l'API Bunny Stream
 */
export async function createBunnyVideo(
  title: string
): Promise<BunnyVideoUploadResponse> {
  throw new Error(
    'Cette fonction est gérée par l\'Edge Function upload-bunny-video. ' +
    'Utilisez uploadBunnyVideo() à la place.'
  );
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
 * ⚠️ SÉCURITÉ: Cette fonction doit être implémentée via une Edge Function
 */
export async function deleteBunnyVideo(videoId: string): Promise<void> {
  throw new Error(
    'Cette fonction doit être implémentée via une Edge Function. ' +
    'Les clés API ne doivent pas être exposées côté client.'
  );
}

/**
 * Génère une URL d'embed sécurisée avec token d'authentification
 * ⚠️ SÉCURITÉ: Utilise une Edge Function pour générer les tokens côté serveur
 */
export async function getSecureEmbedUrl(
  videoId: string,
  expiryHours: number = 24
): Promise<string> {
  // Récupérer le token d'authentification
  const { supabase } = await import('../lib/supabaseClient');
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Vous devez être connecté pour accéder aux vidéos');
  }

  const functionsBaseUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ??
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  const url = `${functionsBaseUrl}/generate-bunny-token`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      videoId,
      expiryHours,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Erreur génération token sécurisé (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
        // Si c'est une erreur de configuration, utiliser un message plus clair
        if (errorMessage.includes('BUNNY_EMBED_TOKEN_KEY')) {
          errorMessage = 'Clé de sécurité Bunny Stream non configurée. Veuillez contacter l\'administrateur.';
        }
      }
    } catch {
      // Si la réponse n'est pas du JSON, utiliser le texte brut
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result.embedUrl;
}

/**
 * Met à jour les métadonnées d'une vidéo
 * ⚠️ SÉCURITÉ: Cette fonction doit être implémentée via une Edge Function
 */
export async function updateBunnyVideo(
  videoId: string,
  updates: { title?: string; description?: string }
): Promise<BunnyVideo> {
  throw new Error(
    'Cette fonction doit être implémentée via une Edge Function. ' +
    'Les clés API ne doivent pas être exposées côté client.'
  );
}

