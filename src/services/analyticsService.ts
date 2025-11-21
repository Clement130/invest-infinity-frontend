/**
 * Service pour les analytics et statistiques de la plateforme
 */

import { supabase } from '../lib/supabaseClient';
import { getModules, getAccessList } from './trainingService';
import { listProfiles } from './profilesService';
import { getPurchasesForAdmin } from './purchasesService';
import { getProgressSummary } from './progressService';
import type { TrainingModule, TrainingAccess } from '../types/training';
import type { Profile } from './profilesService';
import type { Purchase } from '../types/training';

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number; // Utilisateurs ayant accès à au moins une formation
  totalRevenue: number; // En centimes
  totalPurchases: number;
  completedPurchases: number;
  totalModules: number;
  activeModules: number;
  totalLessons: number;
  totalAccess: number;
}

export interface RevenueStats {
  total: number;
  byMonth: Array<{ month: string; revenue: number; count: number }>;
  byModule: Array<{ moduleId: string; moduleTitle: string; revenue: number; count: number }>;
}

export interface UserStats {
  total: number;
  byMonth: Array<{ month: string; count: number }>;
  byRole: Array<{ role: string; count: number }>;
}

export interface ModuleStats {
  moduleId: string;
  moduleTitle: string;
  totalAccess: number;
  totalCompletions: number;
  completionRate: number;
  averageProgress: number;
  totalViews: number;
}

export interface LessonStats {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  totalViews: number;
  totalCompletions: number;
  completionRate: number;
  averageWatchTime: number; // En secondes
}

/**
 * Récupère les statistiques générales de la plateforme
 */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const [profiles, modules, accessList, purchases] = await Promise.all([
    listProfiles(),
    getModules({ includeInactive: true }),
    getAccessList(),
    getPurchasesForAdmin(),
  ]);

  // Compter les leçons
  const { data: lessonsData } = await supabase
    .from('training_lessons')
    .select('id');

  const totalLessons = lessonsData?.length || 0;

  // Utilisateurs actifs (ayant au moins un accès)
  const usersWithAccess = new Set(accessList.map((a) => a.user_id));
  const activeUsers = usersWithAccess.size;

  // Revenus
  const completedPurchases = purchases.filter((p) => p.status === 'completed');
  const totalRevenue = completedPurchases.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  return {
    totalUsers: profiles.length,
    activeUsers,
    totalRevenue,
    totalPurchases: purchases.length,
    completedPurchases: completedPurchases.length,
    totalModules: modules.length,
    activeModules: modules.filter((m) => m.is_active).length,
    totalLessons,
    totalAccess: accessList.length,
  };
}

/**
 * Récupère les statistiques de revenus
 */
export async function getRevenueStats(): Promise<RevenueStats> {
  const purchases = await getPurchasesForAdmin();
  const modules = await getModules({ includeInactive: true });

  const completedPurchases = purchases.filter((p) => p.status === 'completed');

  // Revenus par mois
  const revenueByMonth = new Map<string, { revenue: number; count: number }>();
  completedPurchases.forEach((purchase) => {
    if (!purchase.created_at) return;
    const date = new Date(purchase.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const existing = revenueByMonth.get(monthKey) || { revenue: 0, count: 0 };
    revenueByMonth.set(monthKey, {
      revenue: existing.revenue + (purchase.amount || 0),
      count: existing.count + 1,
    });
  });

  // Revenus par module
  const revenueByModule = new Map<
    string,
    { moduleTitle: string; revenue: number; count: number }
  >();
  completedPurchases.forEach((purchase) => {
    if (!purchase.module_id) return;
    const module = modules.find((m) => m.id === purchase.module_id);
    const moduleTitle = module?.title || 'Module inconnu';

    const existing = revenueByModule.get(purchase.module_id) || {
      moduleTitle,
      revenue: 0,
      count: 0,
    };
    revenueByModule.set(purchase.module_id, {
      moduleTitle,
      revenue: existing.revenue + (purchase.amount || 0),
      count: existing.count + 1,
    });
  });

  return {
    total: completedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0),
    byMonth: Array.from(revenueByMonth.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    byModule: Array.from(revenueByModule.values()).sort(
      (a, b) => b.revenue - a.revenue
    ),
  };
}

/**
 * Récupère les statistiques des utilisateurs
 */
export async function getUserStats(): Promise<UserStats> {
  const profiles = await listProfiles();

  // Inscriptions par mois
  const registrationsByMonth = new Map<string, number>();
  profiles.forEach((profile) => {
    if (!profile.created_at) return;
    const date = new Date(profile.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    registrationsByMonth.set(
      monthKey,
      (registrationsByMonth.get(monthKey) || 0) + 1
    );
  });

  // Utilisateurs par rôle
  const usersByRole = new Map<string, number>();
  profiles.forEach((profile) => {
    const role = profile.role || 'client';
    usersByRole.set(role, (usersByRole.get(role) || 0) + 1);
  });

  return {
    total: profiles.length,
    byMonth: Array.from(registrationsByMonth.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    byRole: Array.from(usersByRole.entries()).map(([role, count]) => ({
      role,
      count,
    })),
  };
}

/**
 * Récupère les statistiques détaillées par module
 */
export async function getModuleStats(): Promise<ModuleStats[]> {
  const modules = await getModules({ includeInactive: true });
  const accessList = await getAccessList();

  // Récupérer les progressions
  const { data: progressData } = await supabase
    .from('training_progress')
    .select('*');

  const stats: ModuleStats[] = [];

  for (const module of modules) {
    const moduleAccess = accessList.filter((a) => a.module_id === module.id);
    const moduleProgress = progressData?.filter(
      (p) => p.module_id === module.id
    ) || [];

    // Compter les complétions (progress à 100%)
    const completions = moduleProgress.filter((p) => p.progress_percentage >= 100);

    // Calculer la progression moyenne
    const totalProgress =
      moduleProgress.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) /
      (moduleProgress.length || 1);

    // Compter les vues (progress > 0)
    const views = moduleProgress.filter((p) => (p.progress_percentage || 0) > 0).length;

    stats.push({
      moduleId: module.id,
      moduleTitle: module.title,
      totalAccess: moduleAccess.length,
      totalCompletions: completions.length,
      completionRate:
        moduleAccess.length > 0
          ? (completions.length / moduleAccess.length) * 100
          : 0,
      averageProgress: totalProgress,
      totalViews: views,
    });
  }

  return stats.sort((a, b) => b.totalAccess - a.totalAccess);
}

/**
 * Récupère les statistiques détaillées par leçon
 */
export async function getLessonStats(): Promise<LessonStats[]> {
  const { data: lessons } = await supabase
    .from('training_lessons')
    .select('*, module:training_modules(title)');

  const { data: progressData } = await supabase
    .from('training_progress')
    .select('*');

  if (!lessons) return [];

  const stats: LessonStats[] = [];

  for (const lesson of lessons) {
    const lessonProgress = progressData?.filter(
      (p) => p.lesson_id === lesson.id
    ) || [];

    // Compter les complétions (completed = true)
    const completions = lessonProgress.filter((p) => p.completed === true);

    // Calculer le temps de visionnage moyen
    // Note: On utilise une estimation basée sur la progression
    // Pour un suivi précis, il faudrait stocker le temps réel de visionnage
    const averageWatchTime = lessonProgress.length > 0
      ? lessonProgress.reduce((sum, p) => {
          // Estimation: si progress à 100%, on considère la vidéo complète (ex: 10 min = 600s)
          // Sinon, on estime proportionnellement
          const estimatedDuration = 600; // 10 minutes par défaut
          return sum + ((p.progress_percentage || 0) / 100) * estimatedDuration;
        }, 0) / lessonProgress.length
      : 0;

    // Compter les vues (progress > 0 ou completed = true)
    const views = lessonProgress.filter(
      (p) => (p.progress_percentage || 0) > 0 || p.completed === true
    ).length;

    stats.push({
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      moduleTitle: (lesson.module as any)?.title || 'Module inconnu',
      totalViews: views,
      totalCompletions: completions.length,
      completionRate: views > 0 ? (completions.length / views) * 100 : 0,
      averageWatchTime: Math.round(averageWatchTime),
    });
  }

  return stats.sort((a, b) => b.totalViews - a.totalViews);
}
