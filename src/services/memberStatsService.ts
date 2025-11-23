import { supabase } from '../lib/supabaseClient';
import { getModules } from './trainingService';
import type { TrainingProgress, TrainingModule } from '../types/training';

export interface UserStats {
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  totalTimeSpent: number; // en minutes
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

  // Calculer XP et niveau
  const xp = completedLessons * 10 + completedModules * 50;
  const level = Math.floor(xp / 100) + 1;
  const nextLevelXp = level * 100;

  // Badges (simplifié, à améliorer)
  const badges = await getUserBadges(userId, {
    completedLessons,
    completedModules,
    xp,
  });

  return {
    totalModules,
    completedModules,
    totalLessons,
    completedLessons,
    totalTimeSpent: completedLessons * 15, // Estimation : 15 min par leçon
    badges,
    level,
    xp: xp % 100,
    nextLevelXp: 100,
  };
}

// Récupérer les badges de l'utilisateur
async function getUserBadges(
  userId: string,
  stats: {
    completedLessons: number;
    completedModules: number;
    xp: number;
  }
): Promise<Badge[]> {
  const allBadges: Badge[] = [];

  // 1. Récupérer tous les badges disponibles depuis la base de données
  const { data: dbBadges, error: badgesError } = await supabase
    .from('badges')
    .select('*')
    .order('rarity', { ascending: false })
    .order('name', { ascending: true });

  if (badgesError) {
    console.error('[getUserBadges] Erreur lors de la récupération des badges:', badgesError);
  } else {
    console.log(`[getUserBadges] ${dbBadges?.length || 0} badges récupérés depuis la base de données`);
  }

  // 2. Récupérer les badges débloqués par l'utilisateur
  const { data: userBadges, error: userBadgesError } = await supabase
    .from('user_badges')
    .select('badge_id, unlocked_at')
    .eq('user_id', userId);

  if (userBadgesError) {
    console.error('[getUserBadges] Erreur lors de la récupération des badges utilisateur:', userBadgesError);
  } else {
    console.log(`[getUserBadges] ${userBadges?.length || 0} badges débloqués par l'utilisateur`);
  }

  // Créer une map des badges débloqués pour un accès rapide
  const unlockedBadgesMap = new Map<string, string>();
  userBadges?.forEach((ub) => {
    unlockedBadgesMap.set(ub.badge_id, ub.unlocked_at);
  });

  // 3. Convertir les badges de la base de données au format Badge
  dbBadges?.forEach((dbBadge) => {
    const unlockedAt = unlockedBadgesMap.get(dbBadge.id);
    allBadges.push({
      id: dbBadge.id,
      name: dbBadge.name,
      description: dbBadge.description || '',
      icon: dbBadge.icon || '🏅',
      unlockedAt: unlockedAt || null,
      rarity: (dbBadge.rarity as 'common' | 'rare' | 'epic' | 'legendary') || 'common',
    });
  });

  // 4. Gérer les badges calculés dynamiquement (accomplissements)
  const dynamicBadges: Array<{ id: string; name: string; description: string; icon: string; rarity: 'common' | 'rare' | 'epic' | 'legendary'; condition: boolean }> = [
    {
      id: 'first-lesson',
      name: 'Premier Pas',
      description: 'A complété sa première leçon',
      icon: '🎯',
      rarity: 'common',
      condition: stats.completedLessons >= 1,
    },
    {
      id: '10-lessons',
      name: 'Étudiant Assidu',
      description: 'A complété 10 leçons',
      icon: '📚',
      rarity: 'rare',
      condition: stats.completedLessons >= 10,
    },
    {
      id: 'first-module',
      name: 'Module Master',
      description: 'A complété un module entier',
      icon: '🏆',
      rarity: 'epic',
      condition: stats.completedModules >= 1,
    },
  ];

  // Synchroniser les badges d'accomplissement dans la base de données
  for (const dynamicBadge of dynamicBadges) {
    const existingBadge = allBadges.find((b) => b.id === dynamicBadge.id);
    
    if (dynamicBadge.condition) {
      // L'utilisateur remplit la condition
      if (!existingBadge) {
        // Badge n'existe pas en base, l'ajouter à la liste (sera créé en base si nécessaire)
        allBadges.push({
          id: dynamicBadge.id,
          name: dynamicBadge.name,
          description: dynamicBadge.description,
          icon: dynamicBadge.icon,
          unlockedAt: new Date().toISOString(),
          rarity: dynamicBadge.rarity,
        });
      } else if (!existingBadge.unlockedAt) {
        // Badge existe en base mais n'est pas débloqué, le débloquer
        existingBadge.unlockedAt = new Date().toISOString();
        
        // Synchroniser dans la base de données (en arrière-plan, ne pas bloquer)
        supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: dynamicBadge.id,
            source: 'achievement',
          })
          .catch((error) => {
            // Ignorer les erreurs de doublon (23505)
            if (error.code !== '23505') {
              console.error(`[getUserBadges] Erreur lors de la synchronisation du badge ${dynamicBadge.id}:`, error);
            }
          });
      }
    } else if (existingBadge && !existingBadge.unlockedAt) {
      // Badge existe mais condition non remplie, garder comme verrouillé
      // (ne rien faire, le badge reste dans la liste mais verrouillé)
    }
  }

  // 5. Trier les badges : débloqués en premier, puis par rareté
  allBadges.sort((a, b) => {
    // Débloqués en premier
    if (a.unlockedAt && !b.unlockedAt) return -1;
    if (!a.unlockedAt && b.unlockedAt) return 1;
    
    // Puis par rareté (legendary > epic > rare > common)
    const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
    const rarityDiff = rarityOrder[b.rarity] - rarityOrder[a.rarity];
    if (rarityDiff !== 0) return rarityDiff;
    
    // Enfin par nom
    return a.name.localeCompare(b.name);
  });

  console.log(`[getUserBadges] Total de ${allBadges.length} badges retournés (${allBadges.filter(b => b.unlockedAt).length} débloqués)`);
  return allBadges;
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


