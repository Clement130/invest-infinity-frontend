import { supabase } from '../lib/supabaseClient';
import { getModules } from './trainingService';
import type { TrainingProgress, TrainingModule } from '../types/training';

export interface UserStats {
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  totalTimeSpent: number; // en minutes
  currentStreak: number; // jours consécutifs
  longestStreak: number;
  badges: Badge[];
  level: number;
  xp: number;
  nextLevelXp: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'special';
  startDate: string;
  endDate: string;
  progress: number;
  target: number;
  reward: string;
  participants: number;
  userRank?: number;
}

export interface ActivityDay {
  date: string;
  count: number;
  lessonsCompleted: number;
  timeSpent: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'live' | 'workshop' | 'masterclass' | 'event';
  date: string;
  duration: number; // en minutes
  speaker?: string;
  isExclusive: boolean;
  registrationRequired: boolean;
  registered: boolean;
}

// Récupérer les statistiques de l'utilisateur
export async function getUserStats(userId: string): Promise<UserStats> {
  // Récupérer les modules et leçons
  const modules = await getModules();
  const totalModules = modules.length;

  // Récupérer la progression
  const { data: progress } = await supabase
    .from('training_progress')
    .select('*')
    .eq('user_id', userId);

  const completedLessons = progress?.filter((p) => p.done).length || 0;
  const totalLessons = modules.reduce((sum, m) => sum + (m as any).lessons_count || 0, 0);

  // Calculer les modules complétés (toutes les leçons complétées)
  const { data: moduleProgress } = await supabase
    .from('training_progress')
    .select('lesson_id, done')
    .eq('user_id', userId)
    .eq('done', true);

  // Récupérer les leçons pour chaque module
  let completedModules = 0;
  for (const module of modules) {
    const { data: lessons } = await supabase
      .from('training_lessons')
      .select('id')
      .eq('module_id', module.id);

    const moduleLessons = lessons || [];
    const completedModuleLessons = moduleProgress?.filter((p) =>
      moduleLessons.some((l) => l.id === p.lesson_id)
    ).length || 0;

    if (moduleLessons.length > 0 && completedModuleLessons === moduleLessons.length) {
      completedModules++;
    }
  }

  // Calculer le streak (simplifié)
  const { data: recentProgress } = await supabase
    .from('training_progress')
    .select('last_viewed')
    .eq('user_id', userId)
    .order('last_viewed', { ascending: false })
    .limit(30);

  const currentStreak = calculateStreak(recentProgress || []);
  const longestStreak = currentStreak; // À améliorer avec historique

  // Calculer XP et niveau
  const xp = completedLessons * 10 + completedModules * 50;
  const level = Math.floor(xp / 100) + 1;
  const nextLevelXp = level * 100;

  // Badges (simplifié, à améliorer)
  const badges = await getUserBadges(userId, {
    completedLessons,
    completedModules,
    currentStreak,
    xp,
  });

  return {
    totalModules,
    completedModules,
    totalLessons,
    completedLessons,
    totalTimeSpent: completedLessons * 15, // Estimation : 15 min par leçon
    currentStreak,
    longestStreak,
    badges,
    level,
    xp: xp % 100,
    nextLevelXp: 100,
  };
}

// Calculer le streak de jours consécutifs
function calculateStreak(progress: Array<{ last_viewed: string | null }>): number {
  if (!progress || progress.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  for (const item of progress) {
    if (!item.last_viewed) continue;

    const viewedDate = new Date(item.last_viewed);
    viewedDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((currentDate.getTime() - viewedDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === streak) {
      streak++;
      currentDate = new Date(viewedDate);
    } else if (daysDiff > streak) {
      break;
    }
  }

  return streak;
}

// Récupérer les badges de l'utilisateur
async function getUserBadges(
  userId: string,
  stats: {
    completedLessons: number;
    completedModules: number;
    currentStreak: number;
    xp: number;
  }
): Promise<Badge[]> {
  const badges: Badge[] = [];

  // Badge première leçon
  if (stats.completedLessons >= 1) {
    badges.push({
      id: 'first-lesson',
      name: 'Premier Pas',
      description: 'A complété sa première leçon',
      icon: '🎯',
      unlockedAt: new Date().toISOString(),
      rarity: 'common',
    });
  }

  // Badge 10 leçons
  if (stats.completedLessons >= 10) {
    badges.push({
      id: '10-lessons',
      name: 'Étudiant Assidu',
      description: 'A complété 10 leçons',
      icon: '📚',
      unlockedAt: new Date().toISOString(),
      rarity: 'rare',
    });
  }

  // Badge premier module
  if (stats.completedModules >= 1) {
    badges.push({
      id: 'first-module',
      name: 'Module Master',
      description: 'A complété un module entier',
      icon: '🏆',
      unlockedAt: new Date().toISOString(),
      rarity: 'epic',
    });
  }

  // Badge streak 7 jours
  if (stats.currentStreak >= 7) {
    badges.push({
      id: '7-day-streak',
      name: 'Streak Warrior',
      description: '7 jours consécutifs d\'activité',
      icon: '🔥',
      unlockedAt: new Date().toISOString(),
      rarity: 'rare',
    });
  }

  return badges;
}

// Récupérer les défis actifs
export async function getActiveChallenges(userId: string): Promise<Challenge[]> {
  // Utiliser le nouveau service de défis
  const { getActiveChallenges: getChallenges } = await import('./challengesService');
  try {
    const challenges = await getChallenges(userId);
    
    // Convertir au format Challenge
    return challenges.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      type: c.type,
      startDate: c.startDate,
      endDate: c.endDate,
      progress: c.progress,
      target: c.target,
      reward: c.reward,
      participants: c.participants,
      userRank: c.userRank,
    }));
  } catch (error) {
    console.error('Error fetching challenges:', error);
    // Retourner une liste vide en cas d'erreur (table peut ne pas exister encore)
    return [];
  }
}

// Récupérer la heatmap d'activité (365 derniers jours)
export async function getActivityHeatmap(userId: string): Promise<ActivityDay[]> {
  const { data: progress } = await supabase
    .from('training_progress')
    .select('last_viewed, done')
    .eq('user_id', userId)
    .not('last_viewed', 'is', null)
    .order('last_viewed', { ascending: false })
    .limit(1000);

  // Grouper par jour
  const activityMap = new Map<string, ActivityDay>();

  progress?.forEach((p) => {
    if (!p.last_viewed) return;

    const date = new Date(p.last_viewed);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split('T')[0];

    const existing = activityMap.get(dateStr);
    if (existing) {
      existing.count++;
      if (p.done) existing.lessonsCompleted++;
    } else {
      activityMap.set(dateStr, {
        date: dateStr,
        count: 1,
        lessonsCompleted: p.done ? 1 : 0,
        timeSpent: 15, // Estimation
      });
    }
  });

  // Générer les 365 derniers jours
  const days: ActivityDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const activity = activityMap.get(dateStr) || {
      date: dateStr,
      count: 0,
      lessonsCompleted: 0,
      timeSpent: 0,
    };

    days.push(activity);
  }

  return days;
}

// Récupérer les événements à venir
export async function getUpcomingEvents(userId: string): Promise<Event[]> {
  // Pour l'instant, on retourne des événements mockés
  // À implémenter avec une vraie table d'événements
  const events: Event[] = [
    {
      id: 'live-1',
      title: 'Session Live : Analyse du Marché',
      description: 'Analyse en direct des mouvements du marché et opportunités du jour',
      type: 'live',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 60,
      speaker: 'Mentor Principal',
      isExclusive: false,
      registrationRequired: true,
      registered: false,
    },
    {
      id: 'workshop-1',
      title: 'Atelier : Risk Management Avancé',
      description: 'Apprenez les techniques avancées de gestion du risque',
      type: 'workshop',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 90,
      speaker: 'Expert Invité',
      isExclusive: true,
      registrationRequired: true,
      registered: true,
    },
    {
      id: 'masterclass-1',
      title: 'Masterclass : Trading Algorithmique',
      description: 'Masterclass exclusive avec un trader professionnel',
      type: 'masterclass',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 120,
      speaker: 'Trader Pro',
      isExclusive: true,
      registrationRequired: true,
      registered: false,
    },
  ];

  return events;
}


