import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Video, CreditCard, TrendingUp, TrendingDown, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getModules } from '../../services/trainingService';
import { listProfiles } from '../../services/profilesService';
import { getPurchasesForAdmin } from '../../services/purchasesService';
import { listLeads } from '../../services/leadsService';

export default function DashboardPage() {
  // Configuration optimisée des queries avec cache
  const modulesQuery = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: () => getModules({ includeInactive: true }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
    refetchOnWindowFocus: false,
  });

  const profilesQuery = useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: () => listProfiles(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const purchasesQuery = useQuery({
    queryKey: ['admin', 'purchases'],
    queryFn: () => getPurchasesForAdmin(),
    staleTime: 2 * 60 * 1000, // 2 minutes (données plus dynamiques)
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const leadsQuery = useQuery({
    queryKey: ['admin', 'leads'],
    queryFn: () => listLeads(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isLoading = modulesQuery.isLoading || profilesQuery.isLoading || purchasesQuery.isLoading || leadsQuery.isLoading;
  const hasError = modulesQuery.isError || profilesQuery.isError || purchasesQuery.isError || leadsQuery.isError;

  // Calculs optimisés avec useMemo
  const stats = useMemo(() => {
    const profiles = profilesQuery.data || [];
    const modules = modulesQuery.data || [];
    const purchases = purchasesQuery.data || [];
    const leads = leadsQuery.data || [];

    const completedPurchases = purchases.filter((p) => p.status === 'completed');
    const totalRevenue = completedPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

    // Calcul des tendances (comparaison avec période précédente simulée)
    const activeModules = modules.filter((m) => m.is_active).length;
    const admins = profiles.filter((p) => p.role === 'admin').length;
    const clients = profiles.filter((p) => p.role === 'client').length;
    const convertedLeads = leads.filter((l) => l.statut === 'Converti').length;
    const totalCapital = leads.reduce((sum, l) => sum + (Number(l.capital) || 0), 0);

    // Revenus des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPurchases = completedPurchases.filter(
      (p) => new Date(p.created_at) >= thirtyDaysAgo
    );
    const recentRevenue = recentPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

    return {
      totalUsers: profiles.length,
      totalClients: clients,
      totalAdmins: admins,
      totalModules: modules.length,
      activeModules,
      totalPurchases: purchases.length,
      completedPurchases: completedPurchases.length,
      totalRevenue,
      recentRevenue,
      totalLeads: leads.length,
      convertedLeads,
      conversionRate: leads.length > 0 ? ((convertedLeads / leads.length) * 100).toFixed(1) : '0',
      totalCapital,
    };
  }, [profilesQuery.data, modulesQuery.data, purchasesQuery.data, leadsQuery.data]);

  const handleRefresh = () => {
    modulesQuery.refetch();
    profilesQuery.refetch();
    purchasesQuery.refetch();
    leadsQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Vue d'ensemble de votre plateforme</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition disabled:opacity-50"
          title="Actualiser les données"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {hasError && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-200">
            Erreur lors du chargement des données. Veuillez réessayer.
          </p>
        </div>
      )}

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Utilisateurs"
          value={stats.totalUsers}
          subtitle={`${stats.totalClients} clients, ${stats.totalAdmins} admins`}
          color="blue"
          isLoading={isLoading}
        />
        <StatCard
          icon={Video}
          label="Modules"
          value={stats.totalModules}
          subtitle={`${stats.activeModules} actifs`}
          color="purple"
          isLoading={isLoading}
        />
        <StatCard
          icon={CreditCard}
          label="Achats"
          value={stats.totalPurchases}
          subtitle={`${stats.completedPurchases} complétés`}
          color="green"
          isLoading={isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Revenus"
          value={`€ ${stats.totalRevenue.toFixed(2)}`}
          subtitle={`€ ${stats.recentRevenue.toFixed(2)} (30j)`}
          color="pink"
          isLoading={isLoading}
          trend={stats.recentRevenue > 0 ? 'up' : undefined}
        />
      </div>

      {/* Statistiques secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Leads"
          value={stats.totalLeads}
          subtitle={`${stats.convertedLeads} convertis (${stats.conversionRate}%)`}
          color="yellow"
          isLoading={isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Capital Estimé"
          value={`€ ${stats.totalCapital.toLocaleString('fr-FR')}`}
          subtitle="Capital total des leads"
          color="cyan"
          isLoading={isLoading}
        />
        <StatCard
          icon={CreditCard}
          label="Taux de Conversion"
          value={`${stats.conversionRate}%`}
          subtitle={`${stats.convertedLeads} / ${stats.totalLeads} leads`}
          color="orange"
          isLoading={isLoading}
        />
      </div>

      {/* Activités récentes */}
      <RecentActivity
        purchases={purchasesQuery.data || []}
        leads={leadsQuery.data || []}
        isLoading={isLoading}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  isLoading,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  color: 'blue' | 'purple' | 'green' | 'pink' | 'yellow' | 'cyan' | 'orange';
  isLoading: boolean;
  trend?: 'up' | 'down';
}) {
  const colorClasses = {
    blue: { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
    green: { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    pink: { text: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30' },
    yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
    orange: { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  };

  const colors = colorClasses[color];

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-6 space-y-3 transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-6 h-6 ${colors.text}`} />
          <h3 className="text-sm font-medium text-gray-400">{label}</h3>
        </div>
        {trend && (
          <div className={`${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
          {subtitle && <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />}
        </div>
      ) : (
        <>
          <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </>
      )}
    </div>
  );
}

function RecentActivity({
  purchases,
  leads,
  isLoading,
}: {
  purchases: any[];
  leads: any[];
  isLoading: boolean;
}) {
  const recentItems = useMemo(() => {
    const items: Array<{ type: 'purchase' | 'lead'; data: any; date: Date }> = [];

    // Derniers achats
    purchases.slice(0, 5).forEach((p) => {
      items.push({
        type: 'purchase',
        data: p,
        date: new Date(p.created_at),
      });
    });

    // Derniers leads
    leads.slice(0, 5).forEach((l) => {
      items.push({
        type: 'lead',
        data: l,
        date: new Date(l.created_at),
      });
    });

    // Trier par date (plus récent en premier)
    return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [purchases, leads]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Activités récentes</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-bold text-white mb-4">Activités récentes</h2>
      {recentItems.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Aucune activité récente</p>
      ) : (
        <div className="space-y-3">
          {recentItems.map((item, index) => (
            <div
              key={`${item.type}-${item.data.id}-${index}`}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3">
                {item.type === 'purchase' ? (
                  <CreditCard className="w-5 h-5 text-green-400" />
                ) : (
                  <Users className="w-5 h-5 text-blue-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">
                    {item.type === 'purchase'
                      ? `Achat: ${item.data.stripe_session_id?.substring(0, 20)}...`
                      : `Nouveau lead: ${item.data.email}`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.date.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              {item.type === 'purchase' && (
                <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                  {item.data.status}
                </span>
              )}
              {item.type === 'lead' && (
                <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                  {item.data.statut}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
