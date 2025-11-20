import { useQuery } from '@tanstack/react-query';
import { Wallet, Users, Calendar, TrendingUp } from 'lucide-react';
import { getAnalyticsData } from '../../services/analyticsService';

export default function AnalyticsPage() {
  const { data: analytics, isLoading, isError } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => getAnalyticsData(),
  });

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        Erreur lors du chargement des analytiques
      </div>
    );
  }

  const weekly = analytics?.weekly || {
    revenue: 0,
    newUsers: 0,
    retentionRate: 0,
    averageEngagement: 0,
    revenueChange: 0,
    usersChange: 0,
    retentionChange: 0,
    engagementChange: 0,
  };

  const daily = analytics?.daily || days.map((day) => ({
    date: day,
    revenue: 0,
    newUsers: 0,
    lessonsCompleted: 0,
    engagementRate: 0,
  }));

  const maxRevenue = Math.max(...daily.map((d) => d.revenue), 1);
  const maxUsers = Math.max(...daily.map((d) => d.newUsers), 1);
  const maxLessons = Math.max(...daily.map((d) => d.lessonsCompleted), 1);
  const maxEngagement = Math.max(...daily.map((d) => d.engagementRate), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytiques</h1>
        <p className="text-gray-400">Consultez vos statistiques et métriques de performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Wallet}
          label="Revenus cette semaine"
          value={`€ ${weekly.revenue.toFixed(2)}`}
          change={weekly.revenueChange}
          isLoading={isLoading}
          color="purple"
        />
        <KPICard
          icon={Users}
          label="Nouveaux utilisateurs"
          value={weekly.newUsers.toString()}
          change={weekly.usersChange}
          isLoading={isLoading}
          color="purple"
        />
        <KPICard
          icon={Calendar}
          label="Taux de rétention"
          value={`${weekly.retentionRate.toFixed(1)}%`}
          change={weekly.retentionChange}
          isLoading={isLoading}
          color="purple"
        />
        <KPICard
          icon={TrendingUp}
          label="Engagement moyen"
          value={`${weekly.averageEngagement.toFixed(1)}%`}
          change={weekly.engagementChange}
          isLoading={isLoading}
          color="purple"
        />
      </div>

      {/* Daily Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DailyChart
          title="Revenus par jour"
          data={daily}
          maxValue={maxRevenue}
          getValue={(d) => d.revenue}
          color="pink"
          formatValue={(v) => `€ ${v.toFixed(2)}`}
        />
        <DailyChart
          title="Nouveaux utilisateurs par jour"
          data={daily}
          maxValue={maxUsers}
          getValue={(d) => d.newUsers}
          color="blue"
          formatValue={(v) => v.toString()}
        />
        <DailyChart
          title="Leçons complétées"
          data={daily}
          maxValue={maxLessons}
          getValue={(d) => d.lessonsCompleted}
          color="green"
          formatValue={(v) => v.toString()}
        />
        <DailyChart
          title="Taux d'engagement (%)"
          data={daily}
          maxValue={maxEngagement}
          getValue={(d) => d.engagementRate}
          color="purple"
          formatValue={(v) => `${v.toFixed(1)}%`}
        />
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-sm text-gray-400">Moyenne revenue/jour</p>
          <p className="text-lg font-semibold text-white">
            € {analytics?.averageRevenuePerDay.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Moyenne utilisateurs/jour</p>
          <p className="text-lg font-semibold text-white">
            {analytics?.averageUsersPerDay.toFixed(0) || '0'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Taux de rétention</p>
          <p className="text-lg font-semibold text-white">
            {analytics?.averageRetentionRate.toFixed(1) || '0'}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Engagement moyen</p>
          <p className="text-lg font-semibold text-white">
            {analytics?.averageEngagement.toFixed(1) || '0'}%
          </p>
        </div>
      </div>
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
  change: number;
  isLoading: boolean;
  color?: 'purple' | 'blue' | 'green' | 'pink';
}) {
  const isPositive = change >= 0;
  const colorClasses = {
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    pink: 'text-pink-400',
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Icon className={`w-6 h-6 ${colorClasses[color]}`} />
        <span
          className={`text-sm font-medium ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isPositive ? '+' : ''}
          {change.toFixed(0)}%
        </span>
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

function DailyChart({
  title,
  data,
  maxValue,
  getValue,
  color,
  formatValue,
}: {
  title: string;
  data: Array<{ date: string; [key: string]: any }>;
  maxValue: number;
  getValue: (d: any) => number;
  color: 'pink' | 'blue' | 'green' | 'purple';
  formatValue: (v: number) => string;
}) {
  const colorClasses = {
    pink: 'bg-pink-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((day, index) => {
          const value = getValue(day);
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center h-full">
                <div
                  className={`w-full ${colorClasses[color]} rounded-t transition-all`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{day.date}</span>
              <span className="text-xs text-gray-500">{formatValue(value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


