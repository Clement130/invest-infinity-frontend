import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getModules,
  getModuleById,
  getLessonsForModule,
  createOrUpdateModule,
  deleteModule,
  createOrUpdateLesson,
  deleteLesson,
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

// Mutations
export function useModuleMutations() {
  const queryClient = useQueryClient();

  const createUpdateModule = useMutation({
    mutationFn: (payload: Partial<TrainingModule> & { title: string }) => 
      createOrUpdateModule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.modules() });
    },
  });

  const removeModule = useMutation({
    mutationFn: (id: string) => deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.modules() });
    },
  });

  return { createUpdateModule, removeModule };
}

export function useLessonMutations(moduleId: string) {
  const queryClient = useQueryClient();

  const createUpdateLesson = useMutation({
    mutationFn: (payload: Partial<TrainingLesson> & { title: string; module_id: string }) =>
      createOrUpdateLesson(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.lessons(moduleId) });
    },
  });

  const removeLesson = useMutation({
    mutationFn: (id: string) => deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.lessons(moduleId) });
    },
  });

  return { createUpdateLesson, removeLesson };
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

