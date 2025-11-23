import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../hooks/useSession';
import { getUserStats } from '../services/memberStatsService';
import { getUserProgressSummary } from '../services/progressService';
import ProgressChecklist from '../components/member/ProgressChecklist';
import EmptyState from '../components/common/EmptyState';
import { StatCardSkeleton } from '../components/common/Skeleton';
import { getModules } from '../services/trainingService';
import { TrendingUp, Award, Calendar, Target, BookOpen } from 'lucide-react';

export default function ProgressPage() {
  const { user } = useSession();

  const statsQuery = useQuery({
    queryKey: ['member-stats', user?.id],
    queryFn: () => getUserStats(user?.id || ''),
    enabled: !!user?.id,
  });

  const modulesQuery = useQuery({
    queryKey: ['modules', 'client'],
    queryFn: () => getModules(),
  });

  const progressSummaryQuery = useQuery({
    queryKey: ['member-progress', user?.id],
    queryFn: () => getUserProgressSummary(user?.id || ''),
    enabled: !!user?.id,
  });

  const stats = statsQuery.data;
  const modules = modulesQuery.data || [];
  const moduleProgressMap = useMemo(() => {
    const summary = progressSummaryQuery.data;
    if (!summary) return {};
    return summary.modules.reduce<Record<string, (typeof summary.modules)[number]>>(
      (acc, detail) => {
        acc[detail.moduleId] = detail;
        return acc;
      },
      {},
    );
  }, [progressSummaryQuery.data]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Ma Progression</h1>
        <p className="text-gray-400">Suivez votre évolution et vos accomplissements</p>
      </header>

      {statsQuery.isLoading || progressSummaryQuery.isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-1/2" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-white/10 rounded" />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-1/2" />
              <div className="h-64 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      ) : !user ? (
        <EmptyState
          emoji="🔒"
          title="Session expirée"
          description="Votre session a expiré. Veuillez vous reconnecter pour voir votre progression."
        />
      ) : modules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Aucun module disponible"
          description="Il n'y a pas encore de modules de formation disponibles. Reviens bientôt pour commencer ton apprentissage !"
        />
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="text-sm font-medium text-gray-400">Progression Globale</h3>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {stats
                  ? Math.round(
                      (stats.completedLessons / Math.max(stats.totalLessons, 1)) * 100
                    )
                  : 0}
                %
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <h3 className="text-sm font-medium text-gray-400">Niveau</h3>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{stats?.level || 1}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-medium text-gray-400">Modules Complétés</h3>
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {stats?.completedModules || 0} / {stats?.totalModules || 0}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-400" />
                <h3 className="text-sm font-medium text-gray-400">Streak</h3>
              </div>
              <p className="text-2xl font-bold text-pink-400">
                {stats?.currentStreak || 0} jours
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-6">
            <ProgressChecklist modules={modules} moduleProgress={moduleProgressMap} />
          </div>
        </>
      )}
    </div>
  );
}


