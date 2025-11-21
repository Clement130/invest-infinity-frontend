import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Download, Eye, Mail, UserCheck, UserX, X } from 'lucide-react';
import { listProfiles } from '../../services/profilesService';
import { getAccessList, grantAccess, revokeAccess } from '../../services/trainingService';
import { getPurchasesForAdmin } from '../../services/purchasesService';
import { getProgressSummary } from '../../services/progressService';
import { getModules } from '../../services/trainingService';
import type { Profile } from '../../services/profilesService';
import type { TrainingAccess } from '../../types/training';
import toast from 'react-hot-toast';

type FilterType = 'all' | 'client' | 'admin' | 'with-access' | 'without-access';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<FilterType>('all');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: () => listProfiles(),
  });

  const { data: accessList = [] } = useQuery({
    queryKey: ['admin', 'access'],
    queryFn: () => getAccessList(),
  });

  const filteredProfiles = useMemo(() => {
    let filtered = profiles;

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.email?.toLowerCase().includes(query) ||
          p.full_name?.toLowerCase().includes(query)
      );
    }

    // Filtre par rôle
    if (roleFilter === 'client') {
      filtered = filtered.filter((p) => p.role === 'client');
    } else if (roleFilter === 'admin') {
      filtered = filtered.filter((p) => p.role === 'admin');
    } else if (roleFilter === 'with-access') {
      const usersWithAccess = new Set(accessList.map((a) => a.user_id));
      filtered = filtered.filter((p) => usersWithAccess.has(p.id));
    } else if (roleFilter === 'without-access') {
      const usersWithAccess = new Set(accessList.map((a) => a.user_id));
      filtered = filtered.filter((p) => !usersWithAccess.has(p.id));
    }

    return filtered;
  }, [profiles, searchQuery, roleFilter, accessList]);

  const handleExportCSV = () => {
    const headers = ['Email', 'Nom', 'Rôle', 'Date inscription', 'Accès formations'];
    const rows = filteredProfiles.map((profile) => {
      const userAccess = accessList.filter((a) => a.user_id === profile.id);
      return [
        profile.email || '',
        profile.full_name || '',
        profile.role || 'client',
        profile.created_at
          ? new Date(profile.created_at).toLocaleDateString('fr-FR')
          : '',
        userAccess.length.toString(),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `utilisateurs-${new Date().toISOString().split('T')[0]}.csv`);
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
          <h1 className="text-3xl font-bold text-white mb-2">Utilisateurs</h1>
          <p className="text-gray-400">Gérez les utilisateurs de votre plateforme</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 relative min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
            showFilters || roleFilter !== 'all'
              ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtres
        </button>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Filtrer par</h3>
            <button
              onClick={() => {
                setRoleFilter('all');
                setShowFilters(false);
              }}
              className="text-xs text-gray-400 hover:text-white"
            >
              Réinitialiser
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { value: 'all', label: 'Tous' },
              { value: 'client', label: 'Clients' },
              { value: 'admin', label: 'Admins' },
              { value: 'with-access', label: 'Avec accès' },
              { value: 'without-access', label: 'Sans accès' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setRoleFilter(filter.value as FilterType)}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  roleFilter === filter.value
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-400 text-center py-8">Chargement des utilisateurs...</p>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Accès
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredProfiles.map((profile) => {
                  const userAccess = accessList.filter((a) => a.user_id === profile.id);
                  return (
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
                              ? 'bg-purple-500/20 text-purple-400'
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {userAccess.length} formation{userAccess.length > 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedUser(profile)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Voir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredProfiles.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              {searchQuery || roleFilter !== 'all'
                ? 'Aucun utilisateur trouvé'
                : 'Aucun utilisateur'}
            </div>
          )}
        </div>
      )}

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

function UserDetailModal({
  user,
  onClose,
}: {
  user: Profile;
  onClose: () => void;
}) {
  const { data: accessList = [] } = useQuery({
    queryKey: ['admin', 'access', user.id],
    queryFn: () => getAccessList(),
    select: (data) => data.filter((a) => a.user_id === user.id),
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['admin', 'purchases', user.id],
    queryFn: () => getPurchasesForAdmin(),
    select: (data) => data.filter((p) => p.user_id === user.id),
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: () => getModules({ includeInactive: true }),
  });

  const { data: progress } = useQuery({
    queryKey: ['admin', 'progress', user.id],
    queryFn: () => getProgressSummary(user.id),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-white/10 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{user.full_name || user.email}</h2>
            <p className="text-sm text-gray-400 mt-1">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Informations</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Rôle:</span>
                <span className="ml-2 text-white">{user.role}</span>
              </div>
              <div>
                <span className="text-gray-400">Inscription:</span>
                <span className="ml-2 text-white">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('fr-FR')
                    : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Accès aux formations */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Accès aux formations</h3>
              <span className="text-sm text-gray-400">{accessList.length} accès</span>
            </div>
            <div className="space-y-2">
              {accessList.map((access) => {
                const module = modules.find((m) => m.id === access.module_id);
                return (
                  <div
                    key={access.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/40"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {module?.title || 'Module inconnu'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Type: {access.access_type} • Accordé le{' '}
                        {new Date(access.granted_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Révoquer cet accès ?')) {
                          try {
                            await revokeAccess(access.id);
                            toast.success('Accès révoqué');
                          } catch (error) {
                            toast.error('Erreur lors de la révocation');
                          }
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition"
                    >
                      Révoquer
                    </button>
                  </div>
                );
              })}
              {accessList.length === 0 && (
                <p className="text-gray-400 text-sm">Aucun accès</p>
              )}
            </div>
          </div>

          {/* Historique des paiements */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Historique des paiements</h3>
            <div className="space-y-2">
              {purchases.map((purchase) => {
                const module = modules.find((m) => m.id === purchase.module_id);
                return (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/40"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {module?.title || 'Module inconnu'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(purchase.created_at).toLocaleDateString('fr-FR')} •{' '}
                        {purchase.status}
                      </p>
                    </div>
                    <p className="text-white font-semibold">
                      {purchase.amount ? `${(purchase.amount / 100).toFixed(2)} €` : '-'}
                    </p>
                  </div>
                );
              })}
              {purchases.length === 0 && (
                <p className="text-gray-400 text-sm">Aucun paiement</p>
              )}
            </div>
          </div>

          {/* Progression */}
          {progress && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Progression</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Leçons complétées:</span>
                  <span className="text-white font-semibold">
                    {progress.completedLessons} / {progress.totalLessons}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Modules complétés:</span>
                  <span className="text-white font-semibold">
                    {progress.completedModules} / {progress.totalModules}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


