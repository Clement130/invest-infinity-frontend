/**
 * Utilitaires pour l'API Bunny Stream
 * Gestion des vidéos : création, upload, récupération
 */

const BUNNY_API_KEY = import.meta.env.VITE_BUNNY_STREAM_API_KEY;
const BUNNY_LIBRARY_ID = import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID;
const BUNNY_BASE_URL = 'https://video.bunnycdn.com';

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
 */
export const createBunnyVideo = async (title: string): Promise<CreateVideoResponse> => {
  if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
    throw new Error('BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être configurés');
  }

  const res = await fetch(
    `${BUNNY_BASE_URL}/library/${BUNNY_LIBRARY_ID}/videos`,
    {
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erreur création vidéo Bunny (${res.status}): ${errorText}`);
  }

  return await res.json();
};

/**
 * Upload une vidéo vers Bunny Stream avec suivi de progression
 */
export const uploadToBunny = async (
  videoId: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<void> => {
  if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
    throw new Error('BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être configurés');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${BUNNY_BASE_URL}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve();
      } else {
        reject(new Error(`Upload échoué: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Erreur réseau lors de l\'upload'));
    });

    xhr.open('PUT', url);
    xhr.setRequestHeader('AccessKey', BUNNY_API_KEY);
    xhr.send(file);
  });
};

/**
 * Récupère les métadonnées d'une vidéo
 */
export const getBunnyVideo = async (videoId: string): Promise<BunnyVideoMetadata> => {
  if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
    throw new Error('BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être configurés');
  }

  const res = await fetch(
    `${BUNNY_BASE_URL}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      headers: {
        'AccessKey': BUNNY_API_KEY,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Vidéo non trouvée (${res.status})`);
  }

  return await res.json();
};

/**
 * Liste toutes les vidéos de la bibliothèque
 */
export const listBunnyVideos = async (
  page: number = 1,
  itemsPerPage: number = 100
): Promise<{ items: BunnyVideoMetadata[]; totalItems: number }> => {
  if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
    throw new Error('BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être configurés');
  }

  const res = await fetch(
    `${BUNNY_BASE_URL}/library/${BUNNY_LIBRARY_ID}/videos?page=${page}&itemsPerPage=${itemsPerPage}&orderBy=date`,
    {
      headers: {
        'AccessKey': BUNNY_API_KEY,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Erreur liste vidéos (${res.status})`);
  }

  const data = await res.json();
  return {
    items: data.items || [],
    totalItems: data.totalItems || 0,
  };
};

/**
 * Génère l'URL de la miniature
 */
export const getBunnyThumbnail = (videoId: string): string => {
  if (!BUNNY_LIBRARY_ID) return '';
  return `https://vz-${BUNNY_LIBRARY_ID}.b-cdn.net/${videoId}/thumbnail.jpg`;
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

