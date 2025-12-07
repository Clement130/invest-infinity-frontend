import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getModules,
  getModuleById,
  getLessonsForModule,
  createOrUpdateModule,
  deleteModule,
  createOrUpdateLesson,
  deleteLesson,
  reorderModules,
  reorderLessons,
  moveLessonToModule,
} from '../services/trainingService';
import { getUserProgressSummary } from '../services/progressService';
import { markLessonAsViewed, markLessonAsCompleted } from '../services/progressTrackingService';
import type { TrainingModule, TrainingLesson } from '../types/training';

export const TRAINING_KEYS = {
  all: ['training'] as const,
  modules: () => [...TRAINING_KEYS.all, 'modules'] as const,
  module: (id: string) => [...TRAINING_KEYS.modules(), id] as const,
  lessons: (moduleId: string) => [...TRAINING_KEYS.module(moduleId), 'lessons'] as const,
};

export function useModules(options?: { includeInactive?: boolean }) {
  return useQuery({
    queryKey: [...TRAINING_KEYS.modules(), options],
    queryFn: () => getModules(options),
  });
}

export function useModule(id: string | undefined) {
  return useQuery({
    queryKey: TRAINING_KEYS.module(id!),
    queryFn: () => getModuleById(id!),
    enabled: !!id,
  });
}

export function useLessons(moduleId: string | undefined) {
  return useQuery({
    queryKey: TRAINING_KEYS.lessons(moduleId!),
    queryFn: () => getLessonsForModule(moduleId!),
    enabled: !!moduleId,
  });
}

// Mutations avec optimistic updates
export function useModuleMutations() {
  const queryClient = useQueryClient();

  const createUpdateModule = useMutation({
    mutationFn: (payload: Partial<TrainingModule> & { title: string }) =>
      createOrUpdateModule(payload),
    onMutate: async (newModule) => {
      // Annuler les queries en cours
      await queryClient.cancelQueries({ queryKey: TRAINING_KEYS.modules() });

      // Snapshot de l'état actuel
      const previousModules = queryClient.getQueryData(TRAINING_KEYS.modules());

      // Mise à jour optimiste
      queryClient.setQueryData(TRAINING_KEYS.modules(), (old: TrainingModule[] | undefined) => {
        if (!old) return old;

        if (newModule.id) {
          // Update existant
          return old.map(module =>
            module.id === newModule.id
              ? { ...module, ...newModule }
              : module
          );
        } else {
          // Nouveau module avec ID temporaire
          const tempModule: TrainingModule = {
            id: `temp-${Date.now()}`,
            title: newModule.title,
            description: newModule.description || '',
            is_active: newModule.is_active ?? true,
            position: old.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return [...old, tempModule];
        }
      });

      return { previousModules };
    },
    onError: (err, newModule, context) => {
      // Rollback en cas d'erreur
      if (context?.previousModules) {
        queryClient.setQueryData(TRAINING_KEYS.modules(), context.previousModules);
      }
    },
    onSettled: () => {
      // Refetch pour synchroniser
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.modules() });
    },
  });

  const removeModule = useMutation({
    mutationFn: (id: string) => deleteModule(id),
    onMutate: async (deletedId) => {
      // Annuler les queries en cours
      await queryClient.cancelQueries({ queryKey: TRAINING_KEYS.modules() });

      // Snapshot de l'état actuel
      const previousModules = queryClient.getQueryData(TRAINING_KEYS.modules());

      // Mise à jour optimiste - supprimer le module
      queryClient.setQueryData(TRAINING_KEYS.modules(), (old: TrainingModule[] | undefined) =>
        old?.filter(module => module.id !== deletedId) || []
      );

      return { previousModules, deletedId };
    },
    onError: (err, deletedId, context) => {
      // Rollback en cas d'erreur
      if (context?.previousModules) {
        queryClient.setQueryData(TRAINING_KEYS.modules(), context.previousModules);
      }
    },
    onSettled: () => {
      // Refetch pour synchroniser
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.modules() });
    },
  });

  const reorderModulesMutation = useMutation({
    mutationFn: (moduleIds: string[]) => reorderModules(moduleIds),
    onMutate: async (moduleIds) => {
      // Annuler les queries en cours
      await queryClient.cancelQueries({ queryKey: TRAINING_KEYS.modules() });

      // Snapshot de l'état actuel
      const previousModules = queryClient.getQueryData(TRAINING_KEYS.modules());

      // Mise à jour optimiste - réordonner les modules selon l'ordre des IDs
      queryClient.setQueryData(TRAINING_KEYS.modules(), (old: TrainingModule[] | undefined) => {
        if (!old) return old;
        
        // Créer une map pour un accès rapide
        const moduleMap = new Map(old.map(m => [m.id, m]));
        
        // Reconstruire le tableau dans le nouvel ordre avec les positions mises à jour
        return moduleIds
          .map((id, index) => {
            const module = moduleMap.get(id);
            if (!module) return null;
            return { ...module, position: index };
          })
          .filter(Boolean) as TrainingModule[];
      });

      return { previousModules };
    },
    onError: (err, moduleIds, context) => {
      // Rollback en cas d'erreur
      if (context?.previousModules) {
        queryClient.setQueryData(TRAINING_KEYS.modules(), context.previousModules);
      }
    },
    onSettled: () => {
      // Refetch pour synchroniser
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.modules() });
    },
  });

  return { createUpdateModule, removeModule, reorderModulesMutation };
}

export function useLessonMutations(moduleId: string) {
  const queryClient = useQueryClient();

  const createUpdateLesson = useMutation({
    mutationFn: (payload: Partial<TrainingLesson> & { title: string; module_id: string }) =>
      createOrUpdateLesson(payload),
    onMutate: async (newLesson) => {
      // Annuler les queries en cours
      await queryClient.cancelQueries({ queryKey: TRAINING_KEYS.lessons(moduleId) });

      // Snapshot de l'état actuel
      const previousLessons = queryClient.getQueryData(TRAINING_KEYS.lessons(moduleId));

      // Mise à jour optimiste
      queryClient.setQueryData(TRAINING_KEYS.lessons(moduleId), (old: TrainingLesson[] | undefined) => {
        if (!old) return old;

        if (newLesson.id) {
          // Update existant
          return old.map(lesson =>
            lesson.id === newLesson.id
              ? { ...lesson, ...newLesson }
              : lesson
          );
        } else {
          // Nouvelle leçon avec ID temporaire
          const tempLesson: TrainingLesson = {
            id: `temp-${Date.now()}`,
            title: newLesson.title,
            description: newLesson.description || '',
            module_id: newLesson.module_id,
            position: old.length,
            video_url: newLesson.video_url || null,
            duration: newLesson.duration || 0,
            is_active: newLesson.is_active ?? true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return [...old, tempLesson];
        }
      });

      return { previousLessons };
    },
    onError: (err, newLesson, context) => {
      // Rollback en cas d'erreur
      if (context?.previousLessons) {
        queryClient.setQueryData(TRAINING_KEYS.lessons(moduleId), context.previousLessons);
      }
    },
    onSettled: () => {
      // Refetch pour synchroniser
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.lessons(moduleId) });
    },
  });

  const removeLesson = useMutation({
    mutationFn: (id: string) => deleteLesson(id),
    onMutate: async (deletedId) => {
      // Annuler les queries en cours
      await queryClient.cancelQueries({ queryKey: TRAINING_KEYS.lessons(moduleId) });

      // Snapshot de l'état actuel
      const previousLessons = queryClient.getQueryData(TRAINING_KEYS.lessons(moduleId));

      // Mise à jour optimiste - supprimer la leçon
      queryClient.setQueryData(TRAINING_KEYS.lessons(moduleId), (old: TrainingLesson[] | undefined) =>
        old?.filter(lesson => lesson.id !== deletedId) || []
      );

      return { previousLessons, deletedId };
    },
    onError: (err, deletedId, context) => {
      // Rollback en cas d'erreur
      if (context?.previousLessons) {
        queryClient.setQueryData(TRAINING_KEYS.lessons(moduleId), context.previousLessons);
      }
    },
    onSettled: () => {
      // Refetch pour synchroniser
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.lessons(moduleId) });
    },
  });

  const reorderLessonsMutation = useMutation({
    mutationFn: (lessonIds: string[]) => reorderLessons(moduleId, lessonIds),
    onMutate: async (lessonIds) => {
      // Annuler les queries en cours
      await queryClient.cancelQueries({ queryKey: TRAINING_KEYS.lessons(moduleId) });

      // Snapshot de l'état actuel
      const previousLessons = queryClient.getQueryData(TRAINING_KEYS.lessons(moduleId));

      // Mise à jour optimiste - réordonner les leçons selon l'ordre des IDs
      queryClient.setQueryData(TRAINING_KEYS.lessons(moduleId), (old: TrainingLesson[] | undefined) => {
        if (!old) return old;
        
        // Créer une map pour un accès rapide
        const lessonMap = new Map(old.map(l => [l.id, l]));
        
        // Reconstruire le tableau dans le nouvel ordre avec les positions mises à jour
        return lessonIds
          .map((id, index) => {
            const lesson = lessonMap.get(id);
            if (!lesson) return null;
            return { ...lesson, position: index };
          })
          .filter(Boolean) as TrainingLesson[];
      });

      return { previousLessons };
    },
    onError: (err, lessonIds, context) => {
      // Rollback en cas d'erreur
      if (context?.previousLessons) {
        queryClient.setQueryData(TRAINING_KEYS.lessons(moduleId), context.previousLessons);
      }
    },
    onSettled: () => {
      // Refetch pour synchroniser
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.lessons(moduleId) });
    },
  });

  const moveLessonMutation = useMutation({
    mutationFn: ({ lessonId, newModuleId, position }: { lessonId: string; newModuleId: string; position?: number }) =>
      moveLessonToModule(lessonId, newModuleId, position),
    onSuccess: (_, { newModuleId }) => {
      // Invalider les deux modules concernés
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.lessons(moduleId) });
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.lessons(newModuleId) });
    },
  });

  return { createUpdateLesson, removeLesson, reorderLessonsMutation, moveLessonMutation };
}

// Clés de cache pour la progression
export const PROGRESS_KEYS = {
  all: ['progress'] as const,
  summary: (userId: string) => [...PROGRESS_KEYS.all, 'summary', userId] as const,
};

export function useUserProgressSummary(userId: string | undefined) {
  return useQuery({
    queryKey: PROGRESS_KEYS.summary(userId!),
    queryFn: () => getUserProgressSummary(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

export function useProgressMutations(userId: string | undefined) {
  const queryClient = useQueryClient();

  const markViewed = useMutation({
    mutationFn: ({ lessonId }: { lessonId: string }) =>
      markLessonAsViewed(userId!, lessonId),
    onSuccess: () => {
      // Invalider le cache de progression après marquage comme vue
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.summary(userId!) });
    },
  });

  const markCompleted = useMutation({
    mutationFn: ({ lessonId }: { lessonId: string }) =>
      markLessonAsCompleted(userId!, lessonId),
    onSuccess: () => {
      // Invalider le cache de progression après complétion
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.summary(userId!) });
    },
  });

  return { markViewed, markCompleted };
}

