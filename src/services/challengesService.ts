import { supabase } from '../lib/supabaseClient';
import type { Challenge } from './memberStatsService';

export interface ChallengeParticipation {
  id: string;
  challenge_id: string;
  user_id: string;
  progress_value: number;
  completed_at: string | null;
  reward_claimed: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ChallengeSubmission {
  id: string;
  participation_id: string;
  challenge_id: string;
  user_id: string;
  submission_type: string;
  content: string | null;
  file_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ChallengeWithParticipation extends Challenge {
  participation?: ChallengeParticipation;
  submission_count?: number;
}

// Récupérer tous les défis actifs
export async function getActiveChallenges(userId: string): Promise<ChallengeWithParticipation[]> {
  const now = new Date().toISOString();

  // Récupérer les défis actifs
  const { data: challenges, error: challengesError } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('created_at', { ascending: false });

  if (challengesError) {
    console.error('Error fetching challenges:', challengesError);
    throw challengesError;
  }

  if (!challenges || challenges.length === 0) {
    return [];
  }

  // Récupérer les participations de l'utilisateur
  const challengeIds = challenges.map((c) => c.id);
  const { data: participations, error: participationsError } = await supabase
    .from('challenge_participations')
    .select('*')
    .eq('user_id', userId)
    .in('challenge_id', challengeIds);

  if (participationsError) {
    console.error('Error fetching participations:', participationsError);
  }

  // Récupérer le nombre de participants pour chaque défi
  const { data: participantsCounts } = await supabase
    .from('challenge_participations')
    .select('challenge_id')
    .in('challenge_id', challengeIds);

  const participantsMap = new Map<string, number>();
  participantsCounts?.forEach((p) => {
    participantsMap.set(p.challenge_id, (participantsMap.get(p.challenge_id) || 0) + 1);
  });

  // Récupérer les soumissions pour calculer le nombre de soumissions par participation
  const participationIds = participations?.map((p) => p.id) || [];
  const { data: submissions } = await supabase
    .from('challenge_submissions')
    .select('participation_id')
    .in('participation_id', participationIds);

  const submissionsMap = new Map<string, number>();
  submissions?.forEach((s) => {
    submissionsMap.set(
      s.participation_id,
      (submissionsMap.get(s.participation_id) || 0) + 1
    );
  });

  // Calculer le classement pour chaque défi
  const rankings = await Promise.all(
    challenges.map(async (challenge) => {
      const { data: allParticipations } = await supabase
        .from('challenge_participations')
        .select('user_id, progress_value')
        .eq('challenge_id', challenge.id)
        .order('progress_value', { ascending: false })
        .order('updated_at', { ascending: true });

      const userParticipation = participations?.find((p) => p.challenge_id === challenge.id);
      if (!userParticipation) {
        return { challengeId: challenge.id, rank: undefined };
      }

      const rank =
        allParticipations?.findIndex((p) => p.user_id === userId) + 1 || undefined;

      return { challengeId: challenge.id, rank };
    })
  );

  const rankingsMap = new Map(rankings.map((r) => [r.challengeId, r.rank]));

  // Combiner les données
  return challenges.map((challenge) => {
    const participation = participations?.find((p) => p.challenge_id === challenge.id);
    const submissionCount = participation
      ? submissionsMap.get(participation.id) || 0
      : 0;

    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type as 'weekly' | 'monthly' | 'special',
      startDate: challenge.start_date,
      endDate: challenge.end_date,
      progress: participation?.progress_value || 0,
      target: challenge.target_value,
      reward: challenge.reward_description || `+${challenge.reward_xp || 0} XP`,
      participants: participantsMap.get(challenge.id) || 0,
      userRank: rankingsMap.get(challenge.id),
      participation,
      submission_count: submissionCount,
    };
  });
}

// Participer à un défi
export async function joinChallenge(challengeId: string, userId: string): Promise<ChallengeParticipation> {
  const { data, error } = await supabase
    .from('challenge_participations')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      progress_value: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error joining challenge:', error);
    throw error;
  }

  return data;
}

// Mettre à jour la progression d'un défi
export async function updateChallengeProgress(
  challengeId: string,
  userId: string,
  progressValue: number
): Promise<ChallengeParticipation> {
  // Vérifier si la participation existe
  const { data: existing } = await supabase
    .from('challenge_participations')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .single();

  if (!existing) {
    // Créer la participation si elle n'existe pas
    await joinChallenge(challengeId, userId);
  }

  // Récupérer le défi pour connaître la cible
  const { data: challenge } = await supabase
    .from('challenges')
    .select('target_value')
    .eq('id', challengeId)
    .single();

  const isCompleted = challenge && progressValue >= challenge.target_value;

  const updateData: Partial<ChallengeParticipation> = {
    progress_value: progressValue,
  };

  if (isCompleted && !existing?.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('challenge_participations')
    .update(updateData)
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating challenge progress:', error);
    throw error;
  }

  // Si le défi est complété, attribuer les récompenses
  if (isCompleted && !existing?.reward_claimed) {
    await claimChallengeReward(challengeId, userId);
  }

  return data;
}

// Soumettre une contribution pour un défi
export async function submitChallengeEntry(
  challengeId: string,
  userId: string,
  submissionType: string,
  content?: string,
  fileUrl?: string,
  metadata?: Record<string, unknown>
): Promise<ChallengeSubmission> {
  // Vérifier/créer la participation
  let { data: participation } = await supabase
    .from('challenge_participations')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .single();

  if (!participation) {
    participation = await joinChallenge(challengeId, userId);
  }

  // Créer la soumission
  const { data: submission, error: submissionError } = await supabase
    .from('challenge_submissions')
    .insert({
      participation_id: participation.id,
      challenge_id: challengeId,
      user_id: userId,
      submission_type: submissionType,
      content: content || null,
      file_url: fileUrl || null,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (submissionError) {
    console.error('Error submitting challenge entry:', submissionError);
    throw submissionError;
  }

  // Mettre à jour la progression (incrémenter de 1 pour chaque soumission)
  const newProgress = (participation.progress_value || 0) + 1;
  await updateChallengeProgress(challengeId, userId, newProgress);

  return submission;
}

// Récupérer les soumissions d'un utilisateur pour un défi
export async function getUserChallengeSubmissions(
  challengeId: string,
  userId: string
): Promise<ChallengeSubmission[]> {
  const { data, error } = await supabase
    .from('challenge_submissions')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }

  return data || [];
}

// Récupérer le classement d'un défi
export async function getChallengeLeaderboard(challengeId: string, limit = 10) {
  const { data, error } = await supabase
    .from('challenge_participations')
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        email
      )
    `)
    .eq('challenge_id', challengeId)
    .order('progress_value', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }

  return data || [];
}

// Réclamer la récompense d'un défi
async function claimChallengeReward(challengeId: string, userId: string): Promise<void> {
  const { data: challenge } = await supabase
    .from('challenges')
    .select('reward_xp, reward_badge_id')
    .eq('id', challengeId)
    .single();

  if (!challenge) return;

  // Marquer la récompense comme réclamée
  await supabase
    .from('challenge_participations')
    .update({ reward_claimed: true })
    .eq('challenge_id', challengeId)
    .eq('user_id', userId);

  // Attribuer le badge si présent
  if (challenge.reward_badge_id) {
    const { error: badgeError } = await supabase.from('user_badges').insert({
      user_id: userId,
      badge_id: challenge.reward_badge_id,
      source: 'challenge',
    });

    if (badgeError && badgeError.code !== '23505') {
      // 23505 = duplicate key, on ignore
      console.error('Error awarding badge:', badgeError);
    }
  }

  // TODO: Attribuer les XP (nécessite une table user_xp ou similaire)
  // Pour l'instant, on ne fait que marquer la récompense comme réclamée
}

// Récupérer les défis complétés par un utilisateur
export async function getCompletedChallenges(userId: string): Promise<ChallengeWithParticipation[]> {
  const { data: participations, error } = await supabase
    .from('challenge_participations')
    .select(`
      *,
      challenges:challenge_id (*)
    `)
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching completed challenges:', error);
    throw error;
  }

  return (
    participations?.map((p: any) => ({
      id: p.challenges.id,
      title: p.challenges.title,
      description: p.challenges.description,
      type: p.challenges.type,
      startDate: p.challenges.start_date,
      endDate: p.challenges.end_date,
      progress: p.progress_value,
      target: p.challenges.target_value,
      reward: p.challenges.reward_description || `+${p.challenges.reward_xp || 0} XP`,
      participants: 0, // Pas besoin pour les défis complétés
      participation: p,
    })) || []
  );
}

