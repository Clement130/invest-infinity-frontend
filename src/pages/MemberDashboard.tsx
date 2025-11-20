import { useQuery } from '@tanstack/react-query';
import { useSession } from '../hooks/useSession';
import {
  getUserStats,
  getActiveChallenges,
  getActivityHeatmap,
  getUpcomingEvents,
} from '../services/memberStatsService';
import ActivityHeatmap from '../components/member/ActivityHeatmap';
import ProgressChecklist from '../components/member/ProgressChecklist';
import EventsCalendar from '../components/member/EventsCalendar';
import BadgesDisplay from '../components/member/BadgesDisplay';
import ChallengesList from '../components/member/ChallengesList';
import {
  TrendingUp,
  BookOpen,
  Clock,
  Flame,
  Award,
  Target,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { getModules } from '../services/trainingService';

export default function MemberDashboard() {
  const { user } = useSession();

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

  const heatmapQuery = useQuery({
    queryKey: ['member-heatmap', user?.id],
    queryFn: () => getActivityHeatmap(user?.id || ''),
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

  const stats = statsQuery.data;
  const challenges = challengesQuery.data || [];
  const heatmap = heatmapQuery.data || [];
  const events = eventsQuery.data || [];
  const modules = modulesQuery.data || [];

  const isLoading =
    statsQuery.isLoading ||
    challengesQuery.isLoading ||
    heatmapQuery.isLoading ||
    eventsQuery.isLoading ||
    modulesQuery.isLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">Mon Dashboard</h1>
        <p className="text-gray-400">Suivez votre progression et vos performances</p>
      </header>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
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

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <ProgressChecklist
                  modules={modules}
                  completedLessons={new Set()}
                />
                <ActivityHeatmap data={heatmap} />
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

