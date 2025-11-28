import { supabase } from '../lib/supabaseClient';
import { getModules } from './trainingService';
import type { TrainingLesson, TrainingModule, TrainingProgress } from '../types/training';

export interface ModuleProgressDetail {
  moduleId: string;
  moduleTitle: string;
  totalLessons: number;
  completedLessons: number;
  completionRate: number;
  lastLessonId?: string;
  lastLessonTitle?: string;
  lastViewedAt?: string | null;
  nextLessonId?: string;
  nextLessonTitle?: string;
  isCompleted: boolean;
}

export interface ContinueLearningInfo {
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  completionRate: number;
}

export interface UserProgressSummary {
  modules: ModuleProgressDetail[];
  completedLessonIds: string[];
  continueLearning?: ContinueLearningInfo;
}

export async function getUserProgressSummary(userId: string): Promise<UserProgressSummary> {
  if (!userId) {
    return {
      modules: [],
      completedLessonIds: [],
    };
  }

  const [modules, lessonsResponse, progressResponse] = await Promise.all([
    getModules(),
    supabase
      .from('training_lessons')
      .select('*')
      .order('module_id', { ascending: true })
      .order('position', { ascending: true }),
    supabase.from('training_progress').select('*').eq('user_id', userId),
  ]);

  if (lessonsResponse.error) {
    console.error('[progressService] Erreur lors de la récupération des leçons:', lessonsResponse.error);
    throw lessonsResponse.error;
  }

  if (progressResponse.error) {
    console.error('[progressService] Erreur lors de la récupération de la progression:', progressResponse.error);
    throw progressResponse.error;
  }

  const lessons = (lessonsResponse.data ?? []) as TrainingLesson[];
  const progressEntries = (progressResponse.data ?? []) as TrainingProgress[];

  console.log('[progressService] getUserProgressSummary:', {
    userId,
    modulesCount: modules.length,
    lessonsCount: lessons.length,
    progressEntriesCount: progressEntries.length,
  });

  const moduleById = new Map<string, TrainingModule>();
  modules.forEach((module) => moduleById.set(module.id, module));

  const lessonsById = new Map<string, TrainingLesson>();
  const lessonsByModule = new Map<string, TrainingLesson[]>();
  lessons.forEach((lesson) => {
    lessonsById.set(lesson.id, lesson);
    const list = lessonsByModule.get(lesson.module_id) ?? [];
    list.push(lesson);
    lessonsByModule.set(lesson.module_id, list);
  });

  const progressByLessonId = new Map<string, TrainingProgress>();
  progressEntries.forEach((entry) => progressByLessonId.set(entry.lesson_id, entry));

  // Créer un Set des IDs de modules actifs pour filtrer les leçons
  const activeModuleIds = new Set(modules.map(m => m.id));
  
  // Filtrer les leçons complétées pour ne garder que celles des modules actifs
  const completedLessonIds = progressEntries
    .filter((entry) => {
      if (!entry.done) return false;
      const lesson = lessonsById.get(entry.lesson_id);
      return lesson && activeModuleIds.has(lesson.module_id);
    })
    .map((entry) => entry.lesson_id);

  console.log('[progressService] completedLessonIds:', {
    total: completedLessonIds.length,
    ids: completedLessonIds,
  });

  // Log détaillé pour chaque entrée de progression
  console.log('[progressService] Détails des entrées de progression:', {
    totalEntries: progressEntries.length,
    entriesDone: progressEntries.filter(e => e.done).length,
    entriesNotDone: progressEntries.filter(e => !e.done).length,
    entriesDetails: progressEntries.map(entry => {
      const lesson = lessonsById.get(entry.lesson_id);
      const isActiveModule = lesson ? activeModuleIds.has(lesson.module_id) : false;
      return {
        lessonId: entry.lesson_id,
        lessonTitle: lesson?.title || 'N/A',
        moduleId: lesson?.module_id || 'N/A',
        isActiveModule,
        done: entry.done,
        included: entry.done && isActiveModule,
      };
    }),
  });

  const moduleDetails: ModuleProgressDetail[] = modules.map((module) => {
    const moduleLessons = lessonsByModule.get(module.id) ?? [];
    const totalLessons = moduleLessons.length;

    const completedLessons = moduleLessons.filter((lesson) => progressByLessonId.get(lesson.id)?.done).length;
    const completionRate =
      totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    const moduleProgressTimeline = moduleLessons
      .map((lesson) => ({
        lesson,
        progress: progressByLessonId.get(lesson.id),
      }))
      .filter((item) => item.progress?.last_viewed)
      .sort((a, b) => {
        const aDate = new Date(a.progress!.last_viewed || '').getTime();
        const bDate = new Date(b.progress!.last_viewed || '').getTime();
        return bDate - aDate;
      });

    const lastActivity = moduleProgressTimeline[0];
    const nextLesson = moduleLessons.find((lesson) => !progressByLessonId.get(lesson.id)?.done);

    return {
      moduleId: module.id,
      moduleTitle: module.title,
      totalLessons,
      completedLessons,
      completionRate,
      lastLessonId: lastActivity?.lesson.id,
      lastLessonTitle: lastActivity?.lesson.title,
      lastViewedAt: lastActivity?.progress?.last_viewed ?? null,
      nextLessonId: nextLesson?.id,
      nextLessonTitle: nextLesson?.title,
      isCompleted: completionRate === 100,
    };
  });

  const sortedProgress = progressEntries
    .filter((entry) => entry.last_viewed)
    .sort((a, b) => {
      const aDate = new Date(a.last_viewed || '').getTime();
      const bDate = new Date(b.last_viewed || '').getTime();
      return bDate - aDate;
    });

  let continueLearning: ContinueLearningInfo | undefined;

  if (sortedProgress.length > 0) {
    const latestEntry = sortedProgress[0];
    const lesson = lessonsById.get(latestEntry.lesson_id);

    if (lesson) {
      const module = moduleById.get(lesson.module_id);
      const moduleDetail = moduleDetails.find((detail) => detail.moduleId === lesson.module_id);

      if (module && moduleDetail) {
        continueLearning = {
          moduleId: module.id,
          moduleTitle: module.title,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          completionRate: moduleDetail.completionRate,
        };
      }
    }
  }

  if (!continueLearning) {
    const firstModuleToStart = moduleDetails.find((detail) => !detail.isCompleted && detail.nextLessonId);
    if (firstModuleToStart) {
      continueLearning = {
        moduleId: firstModuleToStart.moduleId,
        moduleTitle: firstModuleToStart.moduleTitle,
        lessonId: firstModuleToStart.nextLessonId!,
        lessonTitle: firstModuleToStart.nextLessonTitle ?? 'Commencer le module',
        completionRate: firstModuleToStart.completionRate,
      };
    }
  }

  const result = {
    modules: moduleDetails,
    completedLessonIds,
    continueLearning,
  };

  const totalLessons = result.modules.reduce((sum, m) => sum + m.totalLessons, 0);
  const globalProgressCalc = totalLessons > 0 
    ? Math.round((result.completedLessonIds.length / totalLessons) * 100)
    : 0;

  console.log('[progressService] getUserProgressSummary result:', {
    modulesCount: result.modules.length,
    completedLessonIdsCount: result.completedLessonIds.length,
    totalLessons,
    globalProgressCalculated: globalProgressCalc,
    modulesDetails: result.modules.map(m => ({
      moduleId: m.moduleId,
      moduleTitle: m.moduleTitle,
      totalLessons: m.totalLessons,
      completedLessons: m.completedLessons,
      completionRate: m.completionRate,
    })),
  });

  return result;
}

// Alias pour compatibilité avec l'import existant
export const getProgressSummary = getUserProgressSummary;

