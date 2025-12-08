/**
 * Service pour les analytics et statistiques de la plateforme
 */

import { supabase } from '../lib/supabaseClient';
import { getModules, getAccessList } from './trainingService';
import { listProfiles } from './profilesService';
import { getPaymentsForAdmin } from './purchasesService';
import { getProgressSummary } from './progressService';
import type { TrainingModule, TrainingAccess, Payment } from '../types/training';
import type { Profile } from './profilesService';

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number; // Utilisateurs ayant accès à au moins une formation
  totalRevenue: number; // En centimes
  totalPayments: number;
  completedPayments: number;
  totalModules: number;
  activeModules: number;
  totalLessons: number;
  totalAccess: number;
}

export interface RevenueStats {
  total: number;
  byMonth: Array<{ month: string; revenue: number; count: number }>;
  byLicense: Array<{ licenseType: string; licenseLabel: string; revenue: number; count: number }>;
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
  const [profiles, modules, accessList, payments] = await Promise.all([
    listProfiles(),
    getModules({ includeInactive: true }),
    getAccessList(),
    getPaymentsForAdmin(),
  ]);

  // Compter les leçons
  const { data: lessonsData } = await supabase
    .from('training_lessons')
    .select('id');

  const totalLessons = lessonsData?.length || 0;

  // Utilisateurs actifs (ayant au moins un accès)
  const usersWithAccess = new Set(accessList.map((a) => a.user_id));
  const activeUsers = usersWithAccess.size;

  // Revenus (inclure les paiements complétés et en attente de mot de passe)
  const completedPayments = payments.filter((p) => p.status === 'completed' || p.status === 'pending_password');
  const totalRevenue = completedPayments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  return {
    totalUsers: profiles.length,
    activeUsers,
    totalRevenue,
    totalPayments: payments.length,
    completedPayments: completedPayments.length,
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
  const payments = await getPaymentsForAdmin();

  const completedPayments = payments.filter((p) => p.status === 'completed' || p.status === 'pending_password');

  // Libellés des licences
  const licenseLabels: Record<string, string> = {
    starter: 'Starter',
    pro: 'Premium',
    elite: 'Bootcamp Élite',
  };

  // Revenus par mois
  const revenueByMonth = new Map<string, { revenue: number; count: number }>();
  completedPayments.forEach((payment) => {
    if (!payment.created_at) return;
    const date = new Date(payment.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const existing = revenueByMonth.get(monthKey) || { revenue: 0, count: 0 };
    revenueByMonth.set(monthKey, {
      revenue: existing.revenue + (payment.amount || 0),
      count: existing.count + 1,
    });
  });

  // Revenus par type de licence
  const revenueByLicense = new Map<
    string,
    { licenseLabel: string; revenue: number; count: number }
  >();
  completedPayments.forEach((payment) => {
    const licenseType = payment.license_type || 'unknown';
    const licenseLabel = licenseLabels[licenseType] || 'Inconnu';

    const existing = revenueByLicense.get(licenseType) || {
      licenseLabel,
      revenue: 0,
      count: 0,
    };
    revenueByLicense.set(licenseType, {
      licenseLabel,
      revenue: existing.revenue + (payment.amount || 0),
      count: existing.count + 1,
    });
  });

  return {
    total: completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    byMonth: Array.from(revenueByMonth.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    byLicense: Array.from(revenueByLicense.entries())
      .map(([licenseType, data]) => ({ licenseType, ...data }))
      .sort((a, b) => b.revenue - a.revenue),
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

  // Récupérer les leçons avec leur module_id
  const { data: lessonsData } = await supabase
    .from('training_lessons')
    .select('id, module_id');

  // Récupérer les progressions
  const { data: progressData } = await supabase
    .from('training_progress')
    .select('*');

  // Créer un map lesson_id -> module_id pour faciliter les recherches
  const lessonToModule = new Map<string, string>();
  lessonsData?.forEach((lesson) => {
    lessonToModule.set(lesson.id, lesson.module_id);
  });

  // Créer un map module_id -> liste de leçons
  const lessonsByModule = new Map<string, string[]>();
  lessonsData?.forEach((lesson) => {
    const list = lessonsByModule.get(lesson.module_id) || [];
    list.push(lesson.id);
    lessonsByModule.set(lesson.module_id, list);
  });

  const stats: ModuleStats[] = [];

  for (const module of modules) {
    // Utilisateurs ayant accès à ce module
    const moduleAccess = accessList.filter((a) => a.module_id === module.id);
    const usersWithAccess = new Set(moduleAccess.map((a) => a.user_id));

    // Filtrer les progressions pour ce module (via les leçons)
    const moduleLessons = lessonsByModule.get(module.id) || [];
    const moduleProgress = progressData?.filter((p) => {
      const lessonModuleId = lessonToModule.get(p.lesson_id);
      return lessonModuleId === module.id;
    }) || [];

    // Grouper les progressions par utilisateur pour calculer la progression du module
    const progressByUser = new Map<string, { completed: number; viewed: number }>();
    moduleProgress.forEach((p) => {
      const userId = p.user_id;
      const existing = progressByUser.get(userId) || { completed: 0, viewed: 0 };
      
      if (p.done) {
        existing.completed++;
      }
      if (p.last_viewed) {
        existing.viewed++;
      }
      progressByUser.set(userId, existing);
    });

    // Compter les utilisateurs ayant complété le module (toutes les leçons complétées)
    const totalLessonsInModule = moduleLessons.length;
    let usersCompleted = 0;
    let totalProgressSum = 0;
    let usersWithViews = 0;

    usersWithAccess.forEach((userId) => {
      const userProgress = progressByUser.get(userId) || { completed: 0, viewed: 0 };
      const progressPercentage = totalLessonsInModule > 0
        ? (userProgress.completed / totalLessonsInModule) * 100
        : 0;
      
      totalProgressSum += progressPercentage;
      
      if (userProgress.completed === totalLessonsInModule && totalLessonsInModule > 0) {
        usersCompleted++;
      }
      
      if (userProgress.viewed > 0) {
        usersWithViews++;
      }
    });

    // Taux de complétion : % d'utilisateurs ayant complété toutes les leçons
    const completionRate = usersWithAccess.size > 0
      ? (usersCompleted / usersWithAccess.size) * 100
      : 0;

    // Progression moyenne : moyenne des % de complétion par utilisateur
    const averageProgress = usersWithAccess.size > 0
      ? totalProgressSum / usersWithAccess.size
      : 0;

    stats.push({
      moduleId: module.id,
      moduleTitle: module.title,
      totalAccess: moduleAccess.length,
      totalCompletions: usersCompleted,
      completionRate,
      averageProgress,
      totalViews: usersWithViews,
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

    // Compter les complétions (done = true)
    const completions = lessonProgress.filter((p) => p.done === true);

    // Compter les vues (last_viewed existe = la leçon a été vue)
    const views = lessonProgress.filter((p) => p.last_viewed !== null).length;

    // Calculer le temps de visionnage moyen
    // Note: On utilise une estimation basée sur la complétion
    // Pour un suivi précis, il faudrait stocker le temps réel de visionnage
    const estimatedDuration = 600; // 10 minutes par défaut (600 secondes)
    const averageWatchTime = lessonProgress.length > 0
      ? lessonProgress.reduce((sum, p) => {
          // Si complété (done = true), on considère la vidéo complète
          // Sinon, on estime à 50% de la durée (vue mais pas complétée)
          return sum + (p.done ? estimatedDuration : estimatedDuration * 0.5);
        }, 0) / lessonProgress.length
      : 0;

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
