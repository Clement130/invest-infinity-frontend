import { supabase } from '../lib/supabaseClient';
import type { TrainingProgress } from '../types/training';

export interface DailyStats {
  date: string;
  revenue: number;
  newUsers: number;
  lessonsCompleted: number;
  engagementRate: number;
}

export interface WeeklyStats {
  revenue: number;
  newUsers: number;
  retentionRate: number;
  averageEngagement: number;
  revenueChange: number;
  usersChange: number;
  retentionChange: number;
  engagementChange: number;
}

export interface AnalyticsData {
  weekly: WeeklyStats;
  daily: DailyStats[];
  averageRevenuePerDay: number;
  averageUsersPerDay: number;
  averageRetentionRate: number;
  averageEngagement: number;
}

// Récupérer les données de progression pour les analytiques
export async function getProgressData(): Promise<TrainingProgress[]> {
  const { data, error } = await supabase
    .from('training_progress')
    .select('*')
    .order('last_viewed', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

// Calculer les statistiques hebdomadaires
export async function getWeeklyStats(): Promise<WeeklyStats> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Récupérer les profils
  const { data: profiles } = await supabase
    .from('profiles')
    .select('created_at, role')
    .order('created_at', { ascending: false });

  // Récupérer les achats
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false });

  // Récupérer les progressions
  const { data: progress } = await supabase
    .from('training_progress')
    .select('*')
    .order('last_viewed', { ascending: false });

  // Calculer les stats de cette semaine
  const thisWeekProfiles = profiles?.filter(
    (p) => new Date(p.created_at) >= weekAgo
  ) || [];
  const thisWeekPurchases = purchases?.filter(
    (p) => p.created_at && new Date(p.created_at) >= weekAgo
  ) || [];
  const thisWeekProgress = progress?.filter(
    (p) => p.last_viewed && new Date(p.last_viewed) >= weekAgo
  ) || [];

  // Calculer les stats de la semaine dernière
  const lastWeekProfiles = profiles?.filter(
    (p) => {
      const date = new Date(p.created_at);
      return date >= twoWeeksAgo && date < weekAgo;
    }
  ) || [];
  const lastWeekPurchases = purchases?.filter(
    (p) => {
      if (!p.created_at) return false;
      const date = new Date(p.created_at);
      return date >= twoWeeksAgo && date < weekAgo;
    }
  ) || [];
  const lastWeekProgress = progress?.filter(
    (p) => {
      if (!p.last_viewed) return false;
      const date = new Date(p.last_viewed);
      return date >= twoWeeksAgo && date < weekAgo;
    }
  ) || [];

  // Revenus
  const thisWeekRevenue = thisWeekPurchases
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const lastWeekRevenue = lastWeekPurchases
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const revenueChange = lastWeekRevenue > 0
    ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
    : 0;

  // Nouveaux utilisateurs
  const thisWeekNewUsers = thisWeekProfiles.filter((p) => p.role === 'client').length;
  const lastWeekNewUsers = lastWeekProfiles.filter((p) => p.role === 'client').length;
  const usersChange = lastWeekNewUsers > 0
    ? ((thisWeekNewUsers - lastWeekNewUsers) / lastWeekNewUsers) * 100
    : 0;

  // Taux de rétention (simplifié : utilisateurs actifs cette semaine / total utilisateurs)
  const totalUsers = profiles?.filter((p) => p.role === 'client').length || 0;
  const activeUsers = new Set(thisWeekProgress.map((p) => p.user_id)).size;
  const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
  const lastWeekActiveUsers = new Set(lastWeekProgress.map((p) => p.user_id)).size;
  const lastWeekRetention = totalUsers > 0 ? (lastWeekActiveUsers / totalUsers) * 100 : 0;
  const retentionChange = lastWeekRetention > 0
    ? retentionRate - lastWeekRetention
    : 0;

  // Engagement moyen (leçons complétées / utilisateurs actifs)
  const completedLessons = thisWeekProgress.filter((p) => p.done).length;
  const averageEngagement = activeUsers > 0 ? (completedLessons / activeUsers) * 100 : 0;
  const lastWeekCompleted = lastWeekProgress.filter((p) => p.done).length;
  const lastWeekEngagement = lastWeekActiveUsers > 0
    ? (lastWeekCompleted / lastWeekActiveUsers) * 100
    : 0;
  const engagementChange = lastWeekEngagement > 0
    ? averageEngagement - lastWeekEngagement
    : 0;

  return {
    revenue: thisWeekRevenue / 100, // Convertir centimes en euros
    newUsers: thisWeekNewUsers,
    retentionRate,
    averageEngagement,
    revenueChange,
    usersChange,
    retentionChange,
    engagementChange,
  };
}

// Calculer les statistiques quotidiennes
export async function getDailyStats(): Promise<DailyStats[]> {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const dailyStats: DailyStats[] = [];

  // Récupérer les données
  const { data: profiles } = await supabase
    .from('profiles')
    .select('created_at, role')
    .order('created_at', { ascending: false });

  const { data: purchases } = await supabase
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: progress } = await supabase
    .from('training_progress')
    .select('*')
    .order('last_viewed', { ascending: false });

  // Calculer pour chaque jour de la semaine
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const dayProfiles = profiles?.filter(
      (p) => {
        const created = new Date(p.created_at);
        return created >= dayStart && created <= dayEnd && p.role === 'client';
      }
    ) || [];

    const dayPurchases = purchases?.filter(
      (p) => {
        if (!p.created_at) return false;
        const created = new Date(p.created_at);
        return created >= dayStart && created <= dayEnd;
      }
    ) || [];

    const dayProgress = progress?.filter(
      (p) => {
        if (!p.last_viewed) return false;
        const viewed = new Date(p.last_viewed);
        return viewed >= dayStart && viewed <= dayEnd;
      }
    ) || [];

    const revenue = dayPurchases
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

    const newUsers = dayProfiles.length;
    const lessonsCompleted = dayProgress.filter((p) => p.done).length;
    const activeUsers = new Set(dayProgress.map((p) => p.user_id)).size;
    const engagementRate = activeUsers > 0 ? (lessonsCompleted / activeUsers) * 100 : 0;

    dailyStats.push({
      date: days[6 - i],
      revenue,
      newUsers,
      lessonsCompleted,
      engagementRate,
    });
  }

  return dailyStats;
}

// Récupérer toutes les données analytiques
export async function getAnalyticsData(): Promise<AnalyticsData> {
  const [weekly, daily] = await Promise.all([getWeeklyStats(), getDailyStats()]);

  const averageRevenuePerDay = daily.reduce((sum, d) => sum + d.revenue, 0) / 7;
  const averageUsersPerDay = daily.reduce((sum, d) => sum + d.newUsers, 0) / 7;
  const averageRetentionRate = weekly.retentionRate;
  const averageEngagement = daily.reduce((sum, d) => sum + d.engagementRate, 0) / 7;

  return {
    weekly,
    daily,
    averageRevenuePerDay,
    averageUsersPerDay,
    averageRetentionRate,
    averageEngagement,
  };
}


