import { ShieldCheck, Users, LogOut, Video, BarChart3, Home, Search, Filter } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { getModules, getAccessList } from '../services/trainingService';
import { listProfiles } from '../services/profilesService';
import { getPaymentsForAdmin } from '../services/purchasesService';
import type { Profile } from '../services/profilesService';
import type { TrainingModule } from '../types/training';

type Tab = 'overview' | 'users' | 'modules' | 'payments';

export default function AdminDashboard() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const modulesQuery = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: () => getModules({ includeInactive: true }),
  });

  const profilesQuery = useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: () => listProfiles(),
  });

  const accessQuery = useQuery({
    queryKey: ['admin', 'access'],
    queryFn: () => getAccessList(),
  });

  const paymentsQuery = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => getPaymentsForAdmin(),
  });

  const isLoading =
    modulesQuery.isLoading ||
    profilesQuery.isLoading ||
    accessQuery.isLoading ||
    paymentsQuery.isLoading;

  const hasError =
    modulesQuery.isError ||
    profilesQuery.isError ||
    accessQuery.isError ||
    paymentsQuery.isError;

  const stats = useMemo(() => {
    const modules = modulesQuery.data ?? [];
    const profiles = profilesQuery.data ?? [];
    const accessList = accessQuery.data ?? [];
    const payments = paymentsQuery.data ?? [];

    const activeModules = modules.filter((m) => m.is_active).length;
    const inactiveModules = modules.length - activeModules;

    const clients = profiles.filter((p) => p.role === 'client').length;
    const admins = profiles.filter((p) => p.role === 'admin').length;

    // Calculer le revenu total (inclure les paiements complétés et en attente de mot de passe)
    const totalRevenue = payments
      .filter((p) => p.status === 'completed' || p.status === 'pending_password')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Paiements par statut
    const paymentsByStatus = payments.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      modules,
      profiles,
      accessList,
      payments,
      activeModules,
      inactiveModules,
      clients,
      admins,
      totalRevenue,
      paymentsByStatus,
    };
  }, [accessQuery.data, modulesQuery.data, profilesQuery.data, paymentsQuery.data]);

  // Filtrer les profils selon la recherche
  const filteredProfiles = useMemo(() => {
    if (!searchQuery) return stats.profiles;
    const query = searchQuery.toLowerCase();
    return stats.profiles.filter(
      (p) =>
        p.email?.toLowerCase().includes(query) ||
        p.full_name?.toLowerCase().includes(query)
    );
  }, [stats.profiles, searchQuery]);

  // Filtrer les modules selon la recherche
  const filteredModules = useMemo(() => {
    if (!searchQuery) return stats.modules;
    const query = searchQuery.toLowerCase();
    return stats.modules.filter(
      (m) =>
        m.title?.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
    );
  }, [stats.modules, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
            <div>
              <h1 className="text-3xl font-bold">Administration</h1>
              <p className="text-gray-400 text-sm">Connecté en tant que {user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition text-sm"
            >
              <Home className="w-4 h-4" />
              Voir l'app client
            </button>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition text-sm"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {[
            { id: 'overview' as Tab, label: 'Vue d\'ensemble', icon: BarChart3 },
            { id: 'users' as Tab, label: 'Utilisateurs', icon: Users },
            { id: 'modules' as Tab, label: 'Modules', icon: Video },
            { id: 'payments' as Tab, label: 'Paiements', icon: BarChart3 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === id
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {hasError && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Impossible de charger toutes les données administrateur pour l'instant.
          </div>
        )}

        {/* Vue d'ensemble */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Users}
                label="Clients"
                value={stats.clients}
                color="emerald"
                isLoading={isLoading}
              />
              <StatCard
                icon={ShieldCheck}
                label="Admins"
                value={stats.admins}
                color="blue"
                isLoading={isLoading}
              />
              <StatCard
                icon={Video}
                label="Modules actifs"
                value={stats.activeModules}
                color="pink"
                isLoading={isLoading}
              />
              <StatCard
                icon={BarChart3}
                label="Revenu total"
                value={`${(stats.totalRevenue / 100).toFixed(2)} €`}
                color="sky"
                isLoading={isLoading}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                <h3 className="text-lg font-semibold">Modules de formation</h3>
                {isLoading ? (
                  <p className="text-gray-400">Chargement...</p>
                ) : (
                  <div className="space-y-2 text-gray-300">
                    <p>
                      Modules actifs :{' '}
                      <span className="font-semibold text-white">{stats.activeModules}</span>
                    </p>
                    <p>
                      Modules inactifs :{' '}
                      <span className="font-semibold text-white">{stats.inactiveModules}</span>
                    </p>
                    <p>
                      Total modules :{' '}
                      <span className="font-semibold text-white">{stats.modules.length}</span>
                    </p>
                    <p>
                      Accès attribués :{' '}
                      <span className="font-semibold text-white">{stats.accessList.length}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                <h3 className="text-lg font-semibold">Paiements</h3>
                {isLoading ? (
                  <p className="text-gray-400">Chargement...</p>
                ) : (
                  <div className="space-y-2 text-gray-300">
                    <p>
                      Total paiements :{' '}
                      <span className="font-semibold text-white">{stats.payments.length}</span>
                    </p>
                    {Object.entries(stats.paymentsByStatus).map(([status, count]) => (
                      <p key={status}>
                        {status} : <span className="font-semibold text-white">{count}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Liste des utilisateurs */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                />
              </div>
            </div>

            {isLoading ? (
              <p className="text-gray-400 text-center py-8">Chargement des utilisateurs...</p>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Nom
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Rôle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Date d'inscription
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredProfiles.map((profile) => (
                        <tr key={profile.id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {profile.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {profile.full_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                profile.role === 'admin'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {profile.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {profile.created_at
                              ? new Date(profile.created_at).toLocaleDateString('fr-FR')
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredProfiles.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Liste des modules */}
        {activeTab === 'modules' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un module..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-pink-400/50"
                />
              </div>
            </div>

            {isLoading ? (
              <p className="text-gray-400 text-center py-8">Chargement des modules...</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredModules.map((module) => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>
            )}
            {filteredModules.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                {searchQuery ? 'Aucun module trouvé' : 'Aucun module'}
              </div>
            )}
          </div>
        )}

        {/* Liste des paiements */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-gray-400 text-center py-8">Chargement des paiements...</p>
            ) : stats.payments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Aucun paiement enregistré pour le moment.
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Formule
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {stats.payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {payment.license_type || 'Inconnu'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {payment.user_id?.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {payment.amount ? `${(payment.amount / 100).toFixed(2)} €` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full uppercase ${
                                payment.status === 'completed' || payment.status === 'pending_password'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : payment.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {payment.created_at
                              ? new Date(payment.created_at).toLocaleDateString('fr-FR')
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour les cartes de statistiques
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
  color: 'emerald' | 'blue' | 'pink' | 'sky';
  isLoading: boolean;
}) {
  const colorClasses = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    pink: 'text-pink-400',
    sky: 'text-sky-400',
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
        <h3 className="text-sm font-medium text-gray-400">{label}</h3>
      </div>
      {isLoading ? (
        <p className="text-gray-400">...</p>
      ) : (
        <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
      )}
    </div>
  );
}

// Composant pour les cartes de modules
function ModuleCard({ module }: { module: TrainingModule }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-white line-clamp-2">{module.title}</h3>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            module.is_active
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {module.is_active ? 'Actif' : 'Inactif'}
        </span>
      </div>
      {module.description && (
        <p className="text-sm text-gray-400 line-clamp-2">{module.description}</p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Position: {module.position || '-'}</span>
        {module.created_at && (
          <span>{new Date(module.created_at).toLocaleDateString('fr-FR')}</span>
        )}
      </div>
    </div>
  );
}

