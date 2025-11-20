import { useQuery } from '@tanstack/react-query';
import { Users, Video, CreditCard, TrendingUp } from 'lucide-react';
import { getModules } from '../../services/trainingService';
import { listProfiles } from '../../services/profilesService';
import { getPurchasesForAdmin } from '../../services/purchasesService';

export default function DashboardPage() {
  const modulesQuery = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: () => getModules({ includeInactive: true }),
  });

  const profilesQuery = useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: () => listProfiles(),
  });

  const purchasesQuery = useQuery({
    queryKey: ['admin', 'purchases'],
    queryFn: () => getPurchasesForAdmin(),
  });

  const isLoading = modulesQuery.isLoading || profilesQuery.isLoading || purchasesQuery.isLoading;

  const stats = {
    totalUsers: profilesQuery.data?.length || 0,
    totalModules: modulesQuery.data?.length || 0,
    totalPurchases: purchasesQuery.data?.length || 0,
    totalRevenue: (purchasesQuery.data || [])
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0) / 100,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Vue d'ensemble de votre plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Utilisateurs"
          value={stats.totalUsers}
          color="blue"
          isLoading={isLoading}
        />
        <StatCard
          icon={Video}
          label="Modules"
          value={stats.totalModules}
          color="purple"
          isLoading={isLoading}
        />
        <StatCard
          icon={CreditCard}
          label="Achats"
          value={stats.totalPurchases}
          color="green"
          isLoading={isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Revenus"
          value={`€ ${stats.totalRevenue.toFixed(2)}`}
          color="pink"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  isLoading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: 'blue' | 'purple' | 'green' | 'pink';
  isLoading: boolean;
}) {
  const colorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    pink: 'text-pink-400',
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-6 h-6 ${colorClasses[color]}`} />
        <h3 className="text-sm font-medium text-gray-400">{label}</h3>
      </div>
      {isLoading ? (
        <p className="text-2xl font-bold text-gray-500">...</p>
      ) : (
        <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
      )}
    </div>
  );
}


