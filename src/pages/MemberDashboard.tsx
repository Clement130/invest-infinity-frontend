import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../hooks/useSession';
import {
  getUserStats,
  getActiveChallenges,
  getUpcomingEvents,
} from '../services/memberStatsService';
import { getUserProgressSummary } from '../services/progressService';
import ProgressChecklist from '../components/member/ProgressChecklist';
import EventsCalendar from '../components/member/EventsCalendar';
import BadgesDisplay from '../components/member/BadgesDisplay';
import ChallengesList from '../components/member/ChallengesList';
import EmptyState from '../components/common/EmptyState';
import { DashboardSkeleton } from '../components/common/Skeleton';
import {
  TrendingUp,
  BookOpen,
  Clock,
  Flame,
  Award,
  Target,
  Calendar,
  BarChart3,
  Rocket,
} from 'lucide-react';
import { getModules } from '../services/trainingService';

export default function MemberDashboard() {
  const { user } = useSession();
  const navigate = useNavigate();

  const statsQuery = useQuery({
    queryKey: ['member-stats', user?.id],
    queryFn: () => getUserStats(user?.id || ''),
    enabled: !!user?.id,
  });

  const challengesQuery = useQuery({
    queryKey: ['member-challenges', user?.id],
    queryFn: () => getActiveChallenges(user?.id || ''),
    enabled: !!user?.id,
  });

  const eventsQuery = useQuery({
    queryKey: ['member-events', user?.id],
    queryFn: () => getUpcomingEvents(user?.id || ''),
    enabled: !!user?.id,
  });

  const modulesQuery = useQuery({
    queryKey: ['modules', 'client'],
    queryFn: () => getModules(),
  });

  const progressQuery = useQuery({
    queryKey: ['member-progress', user?.id],
    queryFn: () => getUserProgressSummary(user?.id || ''),
    enabled: !!user?.id,
  });

  const stats = statsQuery.data;
  const challenges = challengesQuery.data || [];
  const events = eventsQuery.data || [];
  const modules = modulesQuery.data || [];
  const progressSummary = progressQuery.data;

  const moduleProgressMap = useMemo(() => {
    if (!progressSummary) return {};
    return progressSummary.modules.reduce<Record<string, (typeof progressSummary.modules)[number]>>(
      (acc, detail) => {
        acc[detail.moduleId] = detail;
        return acc;
      },
      {},
    );
  }, [progressSummary]);

  const continueLearning = progressSummary?.continueLearning;

  const recommendedModules = useMemo(() => {
    return modules
      .map((module) => ({
        module,
        completion: moduleProgressMap[module.id]?.completionRate ?? 0,
        nextLesson: moduleProgressMap[module.id]?.nextLessonTitle,
      }))
      .filter((item) => item.completion < 100)
      .sort((a, b) => a.completion - b.completion)
      .slice(0, 2);
  }, [modules, moduleProgressMap]);

  const quickActions = useMemo(() => {
    const actions: Array<{
      title: string;
      description: string;
      cta?: () => void;
    }> = [];

    if (continueLearning) {
      actions.push({
        title: 'Reprendre ta formation',
        description: `${continueLearning.lessonTitle} (${continueLearning.completionRate}% du module "${continueLearning.moduleTitle}")`,
        cta: () =>
          navigate(`/app/modules/${continueLearning.moduleId}/lessons/${continueLearning.lessonId}`),
      });
    }

    if (challenges.length > 0) {
      const challenge = challenges[0];
      actions.push({
        title: 'Défi en cours',
        description: `${challenge.title} · ${challenge.progress}/${challenge.target}`,
      });
    }

    if (events.length > 0) {
      const nextEvent = events[0];
      const date = new Date(nextEvent.date);
      actions.push({
        title: 'Prochain événement',
        description: `${nextEvent.title} · ${date.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}`,
      });
    }

    return actions;
  }, [continueLearning, challenges, events, navigate]);

  const isLoading =
    statsQuery.isLoading ||
    challengesQuery.isLoading ||
    eventsQuery.isLoading ||
    modulesQuery.isLoading ||
    progressQuery.isLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">Mon Dashboard</h1>
        <p className="text-gray-400">Suivez votre progression et vos performances</p>
      </header>

        {isLoading ? (
          <DashboardSkeleton />
        ) : !user ? (
          <EmptyState
            emoji="🔒"
            title="Session expirée"
            description="Votre session a expiré. Veuillez vous reconnecter pour accéder à votre dashboard."
            action={{
              label: 'Se reconnecter',
              onClick: () => navigate('/login'),
            }}
          />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={BookOpen}
                label="Modules complétés"
                value={`${stats?.completedModules || 0} / ${stats?.totalModules || 0}`}
                color="blue"
              />
              <StatCard
                icon={TrendingUp}
                label="Leçons complétées"
                value={`${stats?.completedLessons || 0} / ${stats?.totalLessons || 0}`}
                color="purple"
              />
              <StatCard
                icon={Clock}
                label="Temps total"
                value={`${Math.floor((stats?.totalTimeSpent || 0) / 60)}h ${(stats?.totalTimeSpent || 0) % 60}min`}
                color="green"
              />
              <StatCard
                icon={Flame}
                label="Streak actuel"
                value={`${stats?.currentStreak || 0} jours`}
                color="orange"
              />
            </div>

            {/* Continue Learning */}
            {continueLearning && (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-purple-600/20 to-pink-600/10 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-wide text-pink-300">Continuer</p>
                  <h3 className="text-2xl font-semibold text-white mt-1">
                    {continueLearning.lessonTitle}
                  </h3>
                  <p className="text-gray-300">
                    Module {continueLearning.moduleTitle} · {continueLearning.completionRate}% complété
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate(
                      `/app/modules/${continueLearning.moduleId}/lessons/${continueLearning.lessonId}`,
                    )
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-pink-500/90 hover:bg-pink-500 px-6 py-3 font-medium text-white transition"
                >
                  Reprendre la leçon
                </button>
              </div>
            )}

            {/* Quick Actions */}
            {quickActions.length > 0 && (
              <div className="rounded-xl border border-white/5 bg-white/5 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-pink-400" />
                  <h3 className="text-lg font-semibold">Actions rapides</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quickActions.map((action) => (
                    <div
                      key={action.title}
                      className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-2"
                    >
                      <p className="text-sm text-gray-400">{action.title}</p>
                      <p className="text-white font-medium">{action.description}</p>
                      {action.cta && (
                        <button
                          onClick={action.cta}
                          className="text-sm text-pink-400 hover:text-pink-300 transition"
                        >
                          Voir
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Level & XP */}
            {stats && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Niveau {stats.level}</h3>
                    <p className="text-sm text-gray-400">
                      {stats.xp} / {stats.nextLevelXp} XP
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                    style={{ width: `${(stats.xp / stats.nextLevelXp) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendedModules.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Recommandations personnalisées</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedModules.map(({ module, completion, nextLesson }) => (
                    <div
                      key={module.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Module</p>
                          <h4 className="text-xl font-semibold text-white">{module.title}</h4>
                        </div>
                        <span className="text-pink-400 font-semibold">{completion}%</span>
                      </div>
                      {nextLesson && (
                        <p className="text-sm text-gray-400">Prochaine leçon : {nextLesson}</p>
                      )}
                      <button
                        onClick={() => navigate(`/app/modules/${module.id}`)}
                        className="text-sm text-pink-400 hover:text-pink-300 transition"
                      >
                        Ouvrir le module
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              modules.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <EmptyState
                    icon={Rocket}
                    title="Tous tes modules sont complétés !"
                    description="Félicitations ! Tu as terminé tous tes modules. De nouveaux contenus seront bientôt disponibles."
                    action={{
                      label: 'Voir mes statistiques',
                      onClick: () => navigate('/app/progress'),
                    }}
                  />
                </div>
              )
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <ProgressChecklist
                  modules={modules}
                  moduleProgress={moduleProgressMap}
                />
                <BadgesDisplay badges={stats?.badges || []} />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <ChallengesList challenges={challenges} />
                <EventsCalendar events={events} />
              </div>
            </div>
          </>
        )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}) {
  const colorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
        <h3 className="text-sm font-medium text-gray-400">{label}</h3>
      </div>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}

