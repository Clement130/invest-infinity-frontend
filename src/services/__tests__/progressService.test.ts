import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserProgressSummary } from '../progressService';
import type { TrainingModule, TrainingLesson, TrainingProgress } from '../../types/training';

// Mock Supabase
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  },
}));

// Mock trainingService
vi.mock('../trainingService', () => ({
  getModules: vi.fn(),
}));

describe('progressService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProgressSummary', () => {
    it('devrait retourner un objet vide si userId est vide', async () => {
      const result = await getUserProgressSummary('');
      expect(result).toEqual({
        modules: [],
        completedLessonIds: [],
      });
    });

    it('devrait calculer correctement la progression d\'un module', async () => {
      const { getModules } = await import('../trainingService');
      const { supabase } = await import('../../lib/supabaseClient');

      const mockModules: TrainingModule[] = [
        {
          id: 'module-1',
          title: 'Module Test',
          description: null,
          position: 0,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];

      const mockLessons: TrainingLesson[] = [
        {
          id: 'lesson-1',
          module_id: 'module-1',
          title: 'Leçon 1',
          description: null,
          bunny_video_id: null,
          position: 0,
          is_preview: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 'lesson-2',
          module_id: 'module-1',
          title: 'Leçon 2',
          description: null,
          bunny_video_id: null,
          position: 1,
          is_preview: false,
          created_at: new Date().toISOString(),
        },
      ];

      const mockProgress: TrainingProgress[] = [
        {
          id: 'progress-1',
          user_id: 'user-1',
          lesson_id: 'lesson-1',
          done: true,
          last_viewed: new Date().toISOString(),
        },
      ];

      vi.mocked(getModules).mockResolvedValue(mockModules);
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'training_lessons') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: mockLessons,
                  error: null,
                })),
              })),
            })),
          } as any;
        }
        if (table === 'training_progress') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: mockProgress,
                error: null,
              })),
            })),
          } as any;
        }
        return {} as any;
      });

      const result = await getUserProgressSummary('user-1');

      expect(result.modules).toHaveLength(1);
      expect(result.modules[0].completionRate).toBe(50); // 1 sur 2 leçons complétées
      expect(result.modules[0].completedLessons).toBe(1);
      expect(result.modules[0].totalLessons).toBe(2);
      expect(result.completedLessonIds).toContain('lesson-1');
    });

    it('devrait identifier la prochaine leçon à compléter', async () => {
      const { getModules } = await import('../trainingService');
      const { supabase } = await import('../../lib/supabaseClient');

      const mockModules: TrainingModule[] = [
        {
          id: 'module-1',
          title: 'Module Test',
          description: null,
          position: 0,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];

      const mockLessons: TrainingLesson[] = [
        {
          id: 'lesson-1',
          module_id: 'module-1',
          title: 'Leçon 1',
          description: null,
          bunny_video_id: null,
          position: 0,
          is_preview: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 'lesson-2',
          module_id: 'module-1',
          title: 'Leçon 2',
          description: null,
          bunny_video_id: null,
          position: 1,
          is_preview: false,
          created_at: new Date().toISOString(),
        },
      ];

      const mockProgress: TrainingProgress[] = [
        {
          id: 'progress-1',
          user_id: 'user-1',
          lesson_id: 'lesson-1',
          done: true,
          last_viewed: new Date().toISOString(),
        },
      ];

      vi.mocked(getModules).mockResolvedValue(mockModules);
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'training_lessons') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: mockLessons,
                  error: null,
                })),
              })),
            })),
          } as any;
        }
        if (table === 'training_progress') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: mockProgress,
                error: null,
              })),
            })),
          } as any;
        }
        return {} as any;
      });

      const result = await getUserProgressSummary('user-1');

      expect(result.modules[0].nextLessonId).toBe('lesson-2');
      expect(result.modules[0].nextLessonTitle).toBe('Leçon 2');
    });

    it('devrait identifier continueLearning avec la dernière leçon vue', async () => {
      const { getModules } = await import('../trainingService');
      const { supabase } = await import('../../lib/supabaseClient');

      const mockModules: TrainingModule[] = [
        {
          id: 'module-1',
          title: 'Module Test',
          description: null,
          position: 0,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];

      const mockLessons: TrainingLesson[] = [
        {
          id: 'lesson-1',
          module_id: 'module-1',
          title: 'Leçon 1',
          description: null,
          bunny_video_id: null,
          position: 0,
          is_preview: false,
          created_at: new Date().toISOString(),
        },
      ];

      const mockProgress: TrainingProgress[] = [
        {
          id: 'progress-1',
          user_id: 'user-1',
          lesson_id: 'lesson-1',
          done: false,
          last_viewed: new Date().toISOString(),
        },
      ];

      vi.mocked(getModules).mockResolvedValue(mockModules);
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'training_lessons') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: mockLessons,
                  error: null,
                })),
              })),
            })),
          } as any;
        }
        if (table === 'training_progress') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: mockProgress,
                error: null,
              })),
            })),
          } as any;
        }
        return {} as any;
      });

      const result = await getUserProgressSummary('user-1');

      expect(result.continueLearning).toBeDefined();
      expect(result.continueLearning?.lessonId).toBe('lesson-1');
      expect(result.continueLearning?.moduleId).toBe('module-1');
    });

    it('devrait retourner un module non complété comme continueLearning si aucune progression', async () => {
      const { getModules } = await import('../trainingService');
      const { supabase } = await import('../../lib/supabaseClient');

      const mockModules: TrainingModule[] = [
        {
          id: 'module-1',
          title: 'Module Test',
          description: null,
          position: 0,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];

      const mockLessons: TrainingLesson[] = [
        {
          id: 'lesson-1',
          module_id: 'module-1',
          title: 'Leçon 1',
          description: null,
          bunny_video_id: null,
          position: 0,
          is_preview: false,
          created_at: new Date().toISOString(),
        },
      ];

      vi.mocked(getModules).mockResolvedValue(mockModules);
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'training_lessons') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: mockLessons,
                  error: null,
                })),
              })),
            })),
          } as any;
        }
        if (table === 'training_progress') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          } as any;
        }
        return {} as any;
      });

      const result = await getUserProgressSummary('user-1');

      expect(result.continueLearning).toBeDefined();
      expect(result.continueLearning?.lessonId).toBe('lesson-1');
      expect(result.continueLearning?.moduleId).toBe('module-1');
    });
  });
});

