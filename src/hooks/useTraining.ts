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

