import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { TrainingModule, TrainingLesson } from '../../types/training';

export interface Formation {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  level: 'essentiel' | 'premium';
  thumbnail_url?: string;
  duration_hours?: number;
  is_published: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  formation_id: string;
  title: string;
  description?: string;
  order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  bunny_video_id?: string;
  video_duration?: number;
  order: number;
  is_published: boolean;
  is_free: boolean;
  resources?: string[];
  created_at: string;
  updated_at: string;
}

// Pour l'instant, on utilise les modules comme formations
export interface ModuleWithLessons extends TrainingModule {
  lessons: TrainingLesson[];
}

export interface FormationHierarchy {
  modules: ModuleWithLessons[];
  totalLessons: number;
  totalVideos: number;
  completionRate: number;
}

export const useFormationsHierarchy = () => {
  const [hierarchy, setHierarchy] = useState<FormationHierarchy>({
    modules: [],
    totalLessons: 0,
    totalVideos: 0,
    completionRate: 0,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'formations-hierarchy'],
    queryFn: async () => {
      // Récupérer tous les modules avec leurs leçons
      const { data: modulesData, error: modulesError } = await supabase
        .from('training_modules')
        .select(`
          *,
          training_lessons (
            *
          )
        `)
        .order('position', { ascending: true });

      if (modulesError) throw modulesError;

      const modulesWithLessons: ModuleWithLessons[] = (modulesData || []).map((module: any) => ({
        ...module,
        // Trier les leçons par position
        lessons: ((module.training_lessons || []) as TrainingLesson[])
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      }));

      // Calculer les statistiques
      const totalLessons = modulesWithLessons.reduce(
        (acc, m) => acc + m.lessons.length,
        0
      );
      const totalVideos = modulesWithLessons.reduce(
        (acc, m) => acc + m.lessons.filter((l) => l.bunny_video_id).length,
        0
      );
      const completionRate =
        totalLessons > 0 ? Math.round((totalVideos / totalLessons) * 100) : 0;

      return {
        modules: modulesWithLessons,
        totalLessons,
        totalVideos,
        completionRate,
      };
    },
  });

  useEffect(() => {
    if (data) {
      setHierarchy(data);
    }
  }, [data]);

  return {
    hierarchy,
    isLoading,
    error,
    refetch,
  };
};

