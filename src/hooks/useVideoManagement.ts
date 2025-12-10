/**
 * Hook unifié pour la gestion des vidéos
 * 
 * Ce hook simplifie l'utilisation des vidéos dans les composants en centralisant :
 * - La liste des vidéos (avec cache React Query)
 * - L'upload de vidéos (avec suivi de progression)
 * - L'assignation aux leçons
 * - La génération d'URLs de lecture
 * 
 * @example
 * ```typescript
 * const { videos, isLoading, upload, assignToLesson } = useVideoManagement();
 * 
 * // Uploader une vidéo
 * await upload({ title: 'Ma vidéo', file: fileInput.files[0] });
 * 
 * // Assigner à une leçon
 * await assignToLesson('video-id', 'lesson-id');
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { VideoService } from '../services/videoService';
import { uploadVideo, listVideos, getPlaybackUrl } from '../services/videoService';
import type {
  BunnyVideo,
  VideoUploadResponse,
  UploadOptions,
  UploadStatus,
} from '../types/video';
import { createOrUpdateLesson } from '../services/trainingService';
import type { TrainingLesson } from '../types/training';

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export interface UseVideoManagementOptions {
  /** Auto-refetch après upload */
  autoRefetch?: boolean;
  /** Page par défaut pour la liste */
  defaultPage?: number;
  /** Items par page */
  itemsPerPage?: number;
}

export function useVideoManagement(options: UseVideoManagementOptions = {}) {
  const {
    autoRefetch = true,
    defaultPage = 1,
    itemsPerPage = 100,
  } = options;

  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<UploadStatus[]>([]);

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  /** Liste des vidéos avec cache optimisé */
  const videosQuery = useQuery({
    queryKey: ['videos', 'list', defaultPage, itemsPerPage],
    queryFn: () => listVideos({ page: defaultPage, itemsPerPage }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  /** Upload d'une vidéo */
  const uploadMutation = useMutation({
    mutationFn: (options: UploadOptions) => uploadVideo(options),
    onSuccess: (data) => {
      if (autoRefetch) {
        queryClient.invalidateQueries({ queryKey: ['videos'] });
      }
      toast.success(`Vidéo "${data.title}" uploadée avec succès`);
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'upload: ${error.message}`);
    },
  });

  /** Assignation d'une vidéo à une leçon */
  const assignMutation = useMutation({
    mutationFn: async ({
      videoId,
      lessonId,
      lesson,
    }: {
      videoId: string;
      lessonId: string;
      lesson: TrainingLesson;
    }) => {
      return createOrUpdateLesson({
        id: lessonId,
        module_id: lesson.module_id,
        title: lesson.title,
        description: lesson.description ?? null,
        bunny_video_id: videoId,
        position: lesson.position ?? 0,
        is_preview: lesson.is_preview ?? false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'formations-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Vidéo assignée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'assignation: ${error.message}`);
    },
  });

  /** Retrait d'une vidéo d'une leçon */
  const unassignMutation = useMutation({
    mutationFn: async ({
      lessonId,
      lesson,
    }: {
      lessonId: string;
      lesson: TrainingLesson;
    }) => {
      return createOrUpdateLesson({
        id: lessonId,
        module_id: lesson.module_id,
        title: lesson.title,
        description: lesson.description ?? null,
        bunny_video_id: null,
        position: lesson.position ?? 0,
        is_preview: lesson.is_preview ?? false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'formations-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Vidéo retirée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors du retrait: ${error.message}`);
    },
  });

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  /**
   * Upload une vidéo avec suivi de progression
   */
  const upload = useCallback(
    async (options: UploadOptions) => {
      const uploadId = `upload-${Date.now()}-${Math.random()}`;
      const fileName = options.file.name;

      // Ajouter l'upload à la liste
      setUploads((prev) => [
        ...prev,
        {
          id: uploadId,
          fileName,
          progress: 0,
          status: 'pending',
        },
      ]);

      try {
        // Démarrer l'upload
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId ? { ...u, status: 'uploading' } : u
          )
        );

        const result = await uploadVideo({
          ...options,
          onProgress: (progress) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadId ? { ...u, progress } : u
              )
            );
            options.onProgress?.(progress);
          },
        });

        // Marquer comme prêt
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? {
                  ...u,
                  status: 'ready',
                  progress: 100,
                  videoId: result.guid,
                }
              : u
          )
        );

        // Retirer de la liste après 3 secondes
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.id !== uploadId));
        }, 3000);

        return result;
      } catch (error: any) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? {
                  ...u,
                  status: 'error',
                  error: error.message || 'Erreur lors de l\'upload',
                }
              : u
          )
        );
        throw error;
      }
    },
    []
  );

  /**
   * Assigner une vidéo à une leçon
   */
  const assignToLesson = useCallback(
    async (videoId: string, lessonId: string, lesson: TrainingLesson) => {
      return assignMutation.mutateAsync({ videoId, lessonId, lesson });
    },
    [assignMutation]
  );

  /**
   * Retirer une vidéo d'une leçon
   */
  const unassignFromLesson = useCallback(
    async (lessonId: string, lesson: TrainingLesson) => {
      return unassignMutation.mutateAsync({ lessonId, lesson });
    },
    [unassignMutation]
  );

  /**
   * Générer une URL de lecture pour une vidéo
   */
  const getPlaybackUrlForVideo = useCallback(
    async (videoId: string, expiryHours?: number) => {
      const result = await getPlaybackUrl(videoId, { expiryHours });
      return result.embedUrl;
    },
    []
  );

  /**
   * Retirer un upload de la liste
   */
  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  /**
   * Rafraîchir la liste des vidéos
   */
  const refetch = useCallback(() => {
    return videosQuery.refetch();
  }, [videosQuery]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // Données
    videos: videosQuery.data?.items ?? [],
    totalVideos: videosQuery.data?.totalItems ?? 0,
    isLoading: videosQuery.isLoading,
    error: videosQuery.error,
    uploads,

    // Actions
    upload,
    assignToLesson,
    unassignFromLesson,
    getPlaybackUrl: getPlaybackUrlForVideo,
    removeUpload,
    refetch,

    // Utilitaires (délégués au service)
    getThumbnailUrl: VideoService.getThumbnailUrl,
    formatDuration: VideoService.formatDuration,
    formatFileSize: VideoService.formatFileSize,
    validateVideoId: VideoService.validateVideoId,
    isVideoReady: VideoService.isVideoReady,
    getVideoStatusLabel: VideoService.getVideoStatusLabel,

    // États des mutations
    isUploading: uploadMutation.isPending,
    isAssigning: assignMutation.isPending,
    isUnassigning: unassignMutation.isPending,
  };
}

