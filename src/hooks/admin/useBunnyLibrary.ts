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
  const { data: bunnyVideos, isLoading: isLoadingBunny, error: bunnyError } = useQuery({
    queryKey: ['admin', 'bunny-library'],
    queryFn: async () => {
      const { items } = await listBunnyVideos(1, 1000);
      return items;
    },
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
    refetch: async () => {
      // Refetch sera géré par react-query
    },
  };
};

