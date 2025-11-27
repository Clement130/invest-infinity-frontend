import { supabase } from '../lib/supabaseClient';

export type QuestType = 'daily' | 'weekly';

export interface QuestReward {
  xp?: number;
  item?: 'freeze_pass' | 'booster';
  focusCoins?: number;
}

export interface UserQuest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  progress: number;
  target: number;
  status: 'active' | 'claimed' | 'expired';
  expiresAt: string | null;
  reward: QuestReward;
  percentage: number;
}

type QuestRow = {
  id: string;
  status: string;
  progress: Record<string, unknown> | null;
  expires_at: string | null;
  template: {
    title: string;
    description: string | null;
    type: QuestType;
    target: Record<string, unknown> | null;
    reward: Record<string, unknown> | null;
  } | null;
};

function mapQuestRow(row: QuestRow): UserQuest {
  const targetPayload = (row.template?.target ?? {}) as Record<string, unknown>;
  const rewardPayload = (row.template?.reward ?? {}) as Record<string, unknown>;

  const target = Number(targetPayload?.value ?? 1);
  const progress = Number(row.progress?.['current'] ?? 0);
  const percentage = target > 0 ? Math.min(100, (progress / target) * 100) : 0;

  const xpRewardValue = rewardPayload?.xp;
  const focusRewardValue = rewardPayload?.focusCoins;
  const itemRewardValue = rewardPayload?.item;

  return {
    id: row.id,
    title: row.template?.title ?? 'Objectif',
    description: row.template?.description ?? '',
    type: row.template?.type ?? 'daily',
    progress,
    target: Math.max(target, 1),
    status: (row.status as UserQuest['status']) ?? 'active',
    expiresAt: row.expires_at,
    reward: {
      xp:
        typeof xpRewardValue === 'number'
          ? xpRewardValue
          : xpRewardValue
          ? Number(xpRewardValue)
          : undefined,
      item: (itemRewardValue as QuestReward['item']) ?? undefined,
      focusCoins:
        typeof focusRewardValue === 'number'
          ? focusRewardValue
          : focusRewardValue
          ? Number(focusRewardValue)
          : undefined,
    },
    percentage,
  };
}

export async function fetchUserQuests(userId: string): Promise<UserQuest[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_quests')
    .select(
      `
        id,
        status,
        progress,
        expires_at,
        template:quest_templates (
          title,
          description,
          type,
          target,
          reward
        )
      `,
    )
    .eq('user_id', userId)
    .order('expires_at', { ascending: true });

  if (error) {
    console.error('[fetchUserQuests] error', error);
    return [];
  }

  return (data as QuestRow[] | null)?.map(mapQuestRow) ?? [];
}

export async function claimQuestReward(questId: string, userId: string) {
  if (!questId || !userId) {
    throw new Error('Quest ou utilisateur manquant');
  }

  const { error } = await supabase.rpc('claim_user_quest', {
    p_quest_id: questId,
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }
}

