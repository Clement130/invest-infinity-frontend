import { supabase } from '../lib/supabaseClient';
import { getModules } from './trainingService';
import type { TrainingProgress, TrainingModule } from '../types/training';
import { fetchUserQuests, type UserQuest } from './questsService';

export type TrackType = 'foundation' | 'execution' | 'mindset' | 'community';

export interface XpTrackStats {
  track: TrackType;
  label: string;
  xp: number;
  level: number;
  nextLevelXp: number;
  progress: number;
}

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
  streak: number; // jours consécutifs d'activité
  xpTracks: XpTrackStats[];
  dailyQuests: DailyQuest[];
  freezePasses: number;
  activeBooster: ActiveBooster | null;
}

export type DailyQuest = UserQuest;

export interface ActiveBooster {
  multiplier: number;
  expiresAt: string;
  remainingMinutes: number;
}

const TRACK_ORDER: TrackType[] = ['foundation', 'execution', 'mindset', 'community'];

const TRACK_META: Record<
  TrackType,
  {
    label: string;
    weight: number;
  }
> = {
  foundation: { label: 'Fondation ICT', weight: 0.4 },
  execution: { label: 'Execution & Entrées', weight: 0.3 },
  mindset: { label: 'Mindset & Gestion', weight: 0.2 },
  community: { label: 'Communauté & Partage', weight: 0.1 },
};

const TRACK_BASE_XP = 500;
const TRACK_INCREMENT_PER_LEVEL = 250;

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
  try {
  // Récupérer les modules et leçons
  const modules = await getModules();
  const totalModules = modules.length;

  // Récupérer la progression
  const { data: progress } = await supabase
    .from('training_progress')
    .select('*')
    .eq('user_id', userId);

  const completedLessons = progress?.filter((p) => p.done).length || 0;
  
  // Récupérer le nombre réel de leçons depuis la base de données
  const { data: allLessons } = await supabase
    .from('training_lessons')
    .select('id, module_id');
  
  const totalLessons = allLessons?.length || 0;

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

    // Badges (simplifié, à améliorer) - avec gestion d'erreur
    let badges: Badge[] = [];
    try {
      badges = await getUserBadges(userId, {
    completedLessons,
    completedModules,
    xp,
  });
    } catch (error) {
      console.error('[getUserStats] Erreur lors de la récupération des badges:', error);
    }

    // Calculer le streak (jours consécutifs d'activité) - avec gestion d'erreur
    let streak = 0;
    try {
      streak = await calculateStreak(userId);
    } catch (error) {
      console.error('[getUserStats] Erreur lors du calcul du streak:', error);
    }

    // Récupérer les données additionnelles avec gestion d'erreur
    let xpTracks: XpTrackStats[] = [];
    let dailyQuests: DailyQuest[] = [];
    let freezePasses = 0;
    let activeBooster: ActiveBooster | null = null;

    try {
      const results = await Promise.allSettled([
    fetchXpTrackStats(userId, xp),
    fetchUserQuests(userId),
    fetchFreezePassCount(userId),
    fetchActiveBooster(userId),
  ]);

      if (results[0].status === 'fulfilled') xpTracks = results[0].value;
      if (results[1].status === 'fulfilled') dailyQuests = results[1].value;
      if (results[2].status === 'fulfilled') freezePasses = results[2].value;
      if (results[3].status === 'fulfilled') activeBooster = results[3].value;
    } catch (error) {
      console.error('[getUserStats] Erreur lors de la récupération des données additionnelles:', error);
    }

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
    streak,
    xpTracks,
    dailyQuests,
    freezePasses,
    activeBooster,
  };
  } catch (error) {
    console.error('[getUserStats] Erreur globale:', error);
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      totalModules: 0,
      completedModules: 0,
      totalLessons: 0,
      completedLessons: 0,
      totalTimeSpent: 0,
      badges: [],
      level: 1,
      xp: 0,
      nextLevelXp: 100,
      streak: 0,
      xpTracks: [],
      dailyQuests: [],
      freezePasses: 0,
      activeBooster: null,
    };
  }
}

// Calculer le streak de l'utilisateur
async function calculateStreak(userId: string): Promise<number> {
  const { data: progress } = await supabase
    .from('training_progress')
    .select('last_viewed')
    .eq('user_id', userId)
    .not('last_viewed', 'is', null)
    .order('last_viewed', { ascending: false })
    .limit(365);

  if (!progress || progress.length === 0) {
    return 0;
  }

  // Extraire les dates uniques d'activité
  const activityDates = new Set<string>();
  progress.forEach((p) => {
    if (p.last_viewed) {
      const date = new Date(p.last_viewed);
      date.setHours(0, 0, 0, 0);
      activityDates.add(date.toISOString().split('T')[0]);
    }
  });

  // Trier les dates par ordre décroissant
  const sortedDates = Array.from(activityDates).sort((a, b) => b.localeCompare(a));

  // Vérifier si l'utilisateur a été actif aujourd'hui ou hier
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Si pas d'activité aujourd'hui ou hier, le streak est cassé
  if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
    return 0;
  }

  // Compter les jours consécutifs
  let streak = 1;
  let currentDate = new Date(sortedDates[0]);

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];

    if (sortedDates[i] === prevDateStr) {
      streak++;
      currentDate = prevDate;
    } else {
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

function computeTrackNextLevel(level: number) {
  return TRACK_BASE_XP + (level - 1) * TRACK_INCREMENT_PER_LEVEL;
}

async function fetchXpTrackStats(userId: string, fallbackXp: number): Promise<XpTrackStats[]> {
  if (!userId) return [];

  const { data } = await supabase
    .from('user_xp_tracks')
    .select('track, xp, level')
    .eq('user_id', userId);

  const rows = (data as Array<{ track: TrackType; xp: number; level: number }> | null) ?? [];

  return TRACK_ORDER.map((track) => {
    const row = rows.find((r) => r.track === track);
    const derivedXp = Math.round(fallbackXp * TRACK_META[track].weight);
    const trackXp = row?.xp ?? derivedXp;
    const level = row?.level ?? Math.max(1, Math.floor(trackXp / TRACK_BASE_XP) + 1);
    const nextLevelXp = computeTrackNextLevel(level);
    const progress = nextLevelXp > 0 ? Math.min(100, (trackXp / nextLevelXp) * 100) : 0;

    return {
      track,
      label: TRACK_META[track].label,
      xp: trackXp,
      level,
      nextLevelXp,
      progress,
    };
  });
}

async function fetchFreezePassCount(userId: string): Promise<number> {
  if (!userId) return 0;

  const { data, error } = await supabase
    .from('user_items')
    .select('quantity')
    .eq('user_id', userId)
    .eq('item', 'freeze_pass')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[fetchFreezePassCount] error', error);
  }

  return data?.quantity ?? 0;
}


async function fetchActiveBooster(userId: string): Promise<ActiveBooster | null> {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_boosters')
    .select('multiplier, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[fetchActiveBooster] error', error);
    return null;
  }

  if (!data) return null;

  const expiresAt = data.expires_at as string;
  const remainingMinutes = Math.max(
    0,
    Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000),
  );

  return {
    multiplier: Number(data.multiplier ?? 1),
    expiresAt,
    remainingMinutes,
  };
}

// Récupérer les événements à venir
export async function getUpcomingEvents(userId: string): Promise<Event[]> {
  const { supabase } = await import('../lib/supabaseClient');
  
  // Récupérer les événements actifs
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('date', { ascending: true });

  if (eventsError) {
    console.error('Error fetching events:', eventsError);
    return [];
  }

  if (!eventsData || eventsData.length === 0) {
    return [];
  }

  // Récupérer les inscriptions de l'utilisateur
  const { data: registrationsData, error: registrationsError } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', userId);

  if (registrationsError) {
    console.error('Error fetching registrations:', registrationsError);
  }

  const registeredEventIds = new Set(
    (registrationsData || []).map((r) => r.event_id)
  );

  // Transformer les données de la DB vers le format Event
  const events: Event[] = eventsData.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    type: event.type as 'live' | 'workshop' | 'masterclass' | 'event',
    date: event.date,
    duration: event.duration,
    speaker: event.speaker || undefined,
    isExclusive: event.is_exclusive,
    registrationRequired: event.registration_required,
    registered: registeredEventIds.has(event.id),
  }));

  return events;
}


