/**
 * Types centralisés pour la gestion des vidéos
 * Ce fichier remplace les définitions dupliquées dans bunny.ts et bunnyStreamService.ts
 */

/** Statut de traitement d'une vidéo Bunny Stream */
export type BunnyVideoStatus = 
  | 0  // En attente
  | 1  // En cours de traitement
  | 2  // Transcodage en cours
  | 3  // Terminé
  | 4  // Erreur
  | 5  // Upload en cours
  | 6  // Téléchargement en cours;

/** Représentation complète d'une vidéo Bunny Stream */
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
export interface VideoUploadResponse {
  videoId: string;
  guid: string;
  title: string;
  success: boolean;
}

/** Réponse de la génération d'URL signée */
export interface SecurePlaybackUrlResponse {
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

/** Options pour l'URL de lecture */
export interface PlaybackUrlOptions {
  /** Durée de validité en heures (défaut: 24) */
  expiryHours?: number;
}

/** Réponse de la liste des vidéos */
export interface VideoListResponse {
  items: BunnyVideo[];
  totalItems: number;
}

/** Métadonnées d'une vidéo (pour mise à jour) */
export interface VideoMetadata {
  title?: string;
  description?: string;
  categoryId?: string;
}

/** Options d'upload */
export interface UploadOptions {
  title: string;
  file: File;
  onProgress?: (progress: number) => void;
}

/** Statut d'un upload */
export interface UploadStatus {
  id: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'ready' | 'error';
  videoId?: string;
  error?: string;
}

