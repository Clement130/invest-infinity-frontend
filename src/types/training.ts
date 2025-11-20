import type { Tables } from './supabase';

export type UserRole = Tables<'profiles'>['role'];

export type TrainingModule = Tables<'training_modules'>;
export type TrainingLesson = Tables<'training_lessons'>;
export type TrainingProgress = Tables<'training_progress'>;
export type Purchase = Tables<'purchases'>;

export type AccessType = 'full' | 'trial' | 'preview';

type TrainingAccessRow = Tables<'training_access'>;

export type TrainingAccess = Omit<TrainingAccessRow, 'access_type'> & {
  access_type: AccessType;
};

export interface ModuleWithLessons {
  module: TrainingModule;
  lessons: TrainingLesson[];
}

export interface LessonProgressSnapshot {
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
}

export interface ModuleProgress {
  module_id: string;
  user_id: string;
  completed_lessons: number;
  total_lessons: number;
  completion_rate: number;
}
