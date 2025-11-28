import { Loader2, Moon, Sparkles, Sunrise, Trophy } from 'lucide-react';
import type { DailyQuest } from '../../services/memberStatsService';
import clsx from 'clsx';

interface DailyGoalsCardProps {
  quests: DailyQuest[];
  onClaim?: (questId: string) => Promise<void>;
  claimingId?: string | null;
  isLoading?: boolean;
}

const TYPE_BADGE: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  daily: { label: 'Quête quotidienne', icon: Sunrise },
  weekly: { label: 'Quête hebdo', icon: Moon },
};

export default function DailyGoalsCard({
  quests,
  onClaim,
  claimingId,
  isLoading,
}: DailyGoalsCardProps) {
  if (!quests.length) {
    return (
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6 text-center text-gray-400 text-sm">
        Les quêtes arrivent bientôt. Reviens demain pour débloquer plus de récompenses !
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quests.map((quest) => {
        const questType = TYPE_BADGE[quest.type] ?? TYPE_BADGE.daily;
        const Icon = questType.icon;
        const progress = Math.min(100, quest.percentage);
        const isClaimable = quest.status === 'active' && quest.progress >= quest.target;
        const disabled = quest.status !== 'active';
        const waiting = claimingId === quest.id;

        return (
          <div
            key={quest.id}
            className={clsx(
              'rounded-2xl border bg-gradient-to-br p-4 relative overflow-hidden',
              quest.status === 'claimed'
                ? 'border-emerald-500/20 from-emerald-500/5 to-emerald-500/0'
                : 'border-white/5 from-slate-900/80 to-slate-950/80',
            )}
          >
            <div className="relative space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 uppercase">
                    <Icon className="w-3.5 h-3.5 text-pink-400" />
                    <span>{questType.label}</span>
                  </div>
                  <p className="text-base font-semibold text-white mt-1">{quest.title}</p>
                  {quest.description && (
                    <p className="text-sm text-gray-400">{quest.description}</p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <div>
                    <p className="text-xs text-gray-400">XP</p>
                    <p className="text-sm font-semibold text-pink-300 flex items-center gap-1 justify-end">
                      <Sparkles className="w-4 h-4" />
                      {quest.reward.xp ?? 25} XP
                    </p>
                  </div>
                  {quest.reward.item && (
                    <p className="text-xs text-purple-300 flex items-center gap-1 justify-end">
                      <Trophy className="w-3 h-3" />
                      {quest.reward.item === 'freeze_pass' ? 'Freeze Pass' : 'Booster'}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {quest.progress}/{quest.target}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p
                  className={clsx(
                    'text-xs',
                    quest.status === 'claimed' ? 'text-emerald-400' : 'text-gray-400',
                  )}
                >
                  {quest.status === 'claimed'
                    ? 'Récompense récupérée'
                    : quest.status === 'expired'
                    ? 'Quête expirée'
                    : quest.expiresAt
                    ? `Expire le ${new Date(quest.expiresAt).toLocaleDateString()}`
                    : 'Disponible'}
                </p>

                <button
                  type="button"
                  disabled={!isClaimable || waiting || isLoading}
                  onClick={() => onClaim?.(quest.id)}
                  className={clsx(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                    isClaimable
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30'
                      : 'bg-white/5 text-gray-400 cursor-not-allowed',
                  )}
                >
                  {waiting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {quest.status === 'claimed' ? 'Réclamé' : 'Réclamer'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

