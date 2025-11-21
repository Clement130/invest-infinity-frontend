import { useQuery } from '@tanstack/react-query';
import { Wallet, Users, Calendar, TrendingUp, Download, BarChart3, Video, BookOpen } from 'lucide-react';
import {
  getAnalyticsOverview,
  getRevenueStats,
  getUserStats,
  getModuleStats,
  getLessonStats,
} from '../../services/analyticsService';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'overview'],
    queryFn: () => getAnalyticsOverview(),
  });

  const { data: revenueStats, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'revenue'],
    queryFn: () => getRevenueStats(),
  });

  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'users'],
    queryFn: () => getUserStats(),
  });

  const { data: moduleStats, isLoading: moduleStatsLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'modules'],
    queryFn: () => getModuleStats(),
  });

  const { data: lessonStats, isLoading: lessonStatsLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'lessons'],
    queryFn: () => getLessonStats(),
  });

  const isLoading =
    overviewLoading || revenueLoading || userStatsLoading || moduleStatsLoading || lessonStatsLoading;

  const handleExportRevenue = () => {
    if (!revenueStats) return;
    const csvContent = [
      ['Mois', 'Revenus (€)', 'Nombre de ventes'].join(','),
      ...revenueStats.byMonth.map((m) =>
        [m.month, (m.revenue / 100).toFixed(2), m.count].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `revenus-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export CSV généré');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytiques</h1>
          <p className="text-gray-400">Consultez vos statistiques et métriques de performance</p>
        </div>
        {revenueStats && (
          <button
            onClick={handleExportRevenue}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <Download className="w-4 h-4" />
            Export revenus
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Wallet}
          label="Revenus totaux"
          value={overview ? `€ ${(overview.totalRevenue / 100).toFixed(2)}` : '€ 0.00'}
          isLoading={isLoading}
          color="purple"
        />
        <KPICard
          icon={Users}
          label="Utilisateurs actifs"
          value={overview ? `${overview.activeUsers}` : '0'}
          isLoading={isLoading}
          color="blue"
        />
        <KPICard
          icon={BookOpen}
          label="Modules actifs"
          value={overview ? `${overview.activeModules}` : '0'}
          isLoading={isLoading}
          color="green"
        />
        <KPICard
          icon={Video}
          label="Leçons totales"
          value={overview ? `${overview.totalLessons}` : '0'}
          isLoading={isLoading}
          color="pink"
        />
      </div>

      {/* Revenue Chart */}
      {revenueStats && revenueStats.byMonth.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenus par mois</h3>
          <MonthlyChart data={revenueStats.byMonth} />
        </div>
      )}

      {/* Module Stats */}
      {moduleStats && moduleStats.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Statistiques par formation</h3>
          <div className="space-y-3">
            {moduleStats.slice(0, 5).map((stat) => (
              <div key={stat.moduleId} className="p-4 rounded-lg bg-black/40">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{stat.moduleTitle}</h4>
                  <span className="text-sm text-gray-400">{stat.totalAccess} accès</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Taux de complétion: {(stat.completionRate ?? 0).toFixed(1)}%</span>
                  <span>Vues: {stat.totalViews ?? 0}</span>
                  <span>Progression moyenne: {(stat.averageProgress ?? 0).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Stats */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Inscriptions par mois</h3>
            {userStats.byMonth.length > 0 ? (
              <MonthlyChart
                data={userStats.byMonth.map((m) => ({ month: m.month, revenue: m.count, count: 0 }))}
                formatValue={(v) => v.toString()}
              />
            ) : (
              <p className="text-gray-400">Aucune donnée</p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Utilisateurs par rôle</h3>
            <div className="space-y-2">
              {userStats.byRole.map((role) => (
                <div key={role.role} className="flex items-center justify-between p-2 rounded-lg bg-black/40">
                  <span className="text-white capitalize">{role.role}</span>
                  <span className="text-purple-400 font-semibold">{role.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  change,
  isLoading,
  color = 'purple',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change?: number;
  isLoading: boolean;
  color?: 'purple' | 'blue' | 'green' | 'pink';
}) {
  const colorClasses = {
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    pink: 'text-pink-400',
  };

  const hasChange = change !== undefined && change !== null;
  const isPositive = hasChange && change >= 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Icon className={`w-6 h-6 ${colorClasses[color]}`} />
        {hasChange && (
          <span
            className={`text-sm font-medium ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {change.toFixed(0)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-400 mb-1">{label}</p>
        {isLoading ? (
          <p className="text-2xl font-bold text-gray-500">...</p>
        ) : (
          <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
        )}
      </div>
    </div>
  );
}

function MonthlyChart({
  data,
  formatValue = (v) => `€ ${(v / 100).toFixed(2)}`,
}: {
  data: Array<{ month: string; revenue: number; count: number }>;
  formatValue?: (v: number) => string;
}) {
  const maxValue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end justify-between gap-2 h-48">
      {data.map((item, index) => {
        const height = maxValue > 0 ? (item.revenue / maxValue) * 100 : 0;
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-end justify-center h-full">
              <div
                className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t transition-all"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{item.month}</span>
            <span className="text-xs text-gray-500">{formatValue(item.revenue)}</span>
          </div>
        );
      })}
    </div>
  );
}


