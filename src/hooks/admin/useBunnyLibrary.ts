import { useQuery } from '@tanstack/react-query';
import { listBunnyVideos, type BunnyVideoMetadata } from '../../utils/admin/bunnyStreamAPI';
import { supabase } from '../../lib/supabaseClient';

export interface BunnyVideoWithAssignment extends BunnyVideoMetadata {
  assignedToLessonId?: string;
  assignedToLessonTitle?: string;
  assignedToModuleTitle?: string;
  isOrphan: boolean;
}

export const useBunnyLibrary = () => {
  // ⚠️ SÉCURITÉ: Les clés API ne sont plus utilisées côté client
  // Toutes les opérations passent par les Edge Functions
  // Mais nous avons toujours besoin des variables d'environnement pour les URLs CDN et le lecteur vidéo
  const bunnyLibraryId = import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID;
  const bunnyEmbedUrl = import.meta.env.VITE_BUNNY_EMBED_BASE_URL;
  
  // Debug: vérifier les valeurs réelles
  if (typeof window !== 'undefined') {
    console.log('[useBunnyLibrary] Debug configuration:', {
      bunnyLibraryId,
      bunnyEmbedUrl,
      bunnyLibraryIdType: typeof bunnyLibraryId,
      bunnyEmbedUrlType: typeof bunnyEmbedUrl,
      bunnyLibraryIdTruthy: !!bunnyLibraryId,
      bunnyEmbedUrlTruthy: !!bunnyEmbedUrl,
      bunnyLibraryIdLength: bunnyLibraryId?.length,
      bunnyEmbedUrlLength: bunnyEmbedUrl?.length,
    });
  }
  
  // Vérifier que les variables existent ET ne sont pas des chaînes vides
  // Convertir en chaîne pour gérer les cas où les variables sont des nombres
  const bunnyLibraryIdStr = String(bunnyLibraryId || '').trim();
  const bunnyEmbedUrlStr = String(bunnyEmbedUrl || '').trim();
  
  const isConfigured = Boolean(
    bunnyLibraryIdStr && 
    bunnyEmbedUrlStr
  );
  
  // Debug: ajouter isConfigured au log
  if (typeof window !== 'undefined') {
    console.log('[useBunnyLibrary] isConfigured:', isConfigured, {
      bunnyLibraryIdStr,
      bunnyEmbedUrlStr,
      bunnyLibraryIdStrLength: bunnyLibraryIdStr.length,
      bunnyEmbedUrlStrLength: bunnyEmbedUrlStr.length,
    });
  }

  const { data: bunnyVideos, isLoading: isLoadingBunny, error: bunnyError } = useQuery({
    queryKey: ['admin', 'bunny-library'],
    queryFn: async () => {
      if (!isConfigured) {
        // Retourner un tableau vide si les variables ne sont pas configurées
        // plutôt que de lancer une erreur
        return [];
      }
      try {
        const { items } = await listBunnyVideos(1, 1000);
        return items;
      } catch (error: any) {
        console.error('[useBunnyLibrary] Erreur lors du chargement des vidéos:', error);
        // Retourner un tableau vide en cas d'erreur plutôt que de casser l'interface
        return [];
      }
    },
    enabled: isConfigured, // Ne pas faire la requête si les variables ne sont pas configurées
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: lessons, isLoading: isLoadingLessons } = useQuery({
    queryKey: ['admin', 'lessons-for-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_lessons')
        .select(`
          id,
          title,
          bunny_video_id,
          training_modules!inner (
            id,
            title
          )
        `);

      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        title: string;
        bunny_video_id: string | null;
        training_modules: {
          id: string;
          title: string;
        };
      }>;
    },
  });

  // Combiner les données Bunny avec les assignations
  const videosWithAssignments: BunnyVideoWithAssignment[] = (bunnyVideos || []).map((video) => {
    const lesson = lessons?.find((l) => l.bunny_video_id === video.guid);
    return {
      ...video,
      assignedToLessonId: lesson?.id,
      assignedToLessonTitle: lesson?.title,
      assignedToModuleTitle: (lesson as any)?.training_modules?.title,
      isOrphan: !lesson,
    };
  });

  const orphanVideos = videosWithAssignments.filter((v) => v.isOrphan);
  const assignedVideos = videosWithAssignments.filter((v) => !v.isOrphan);

  return {
    videos: videosWithAssignments,
    orphanVideos,
    assignedVideos,
    isLoading: isLoadingBunny || isLoadingLessons,
    error: bunnyError,
    isConfigured,
    refetch: async () => {
      // Refetch sera géré par react-query
    },
  };
};

