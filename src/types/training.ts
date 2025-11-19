export type UserRole = 'client' | 'admin';

export interface TrainingModule {
  id: string;
  title: string;
  description: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingLesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  bunny_video_id: string | null;
  position: number;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingAccess {
  id: string;
  user_id: string;
  module_id: string;
  access_type: 'full' | 'preview' | 'trial';
  granted_at: string;
}

export interface ModuleWithLessons {
  module: TrainingModule;
  lessons: TrainingLesson[];
}

export interface LessonProgress {
  lesson_id: string;
  user_id: string;
  completed_at: string | null;
  last_played_at: string | null;
  playback_position: number | null;
}

export interface ModuleProgress {
  module_id: string;
  user_id: string;
  completed_lessons: number;
  total_lessons: number;
  completion_rate: number;
}
