import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, X, Users, Crown, RefreshCw, Ban, ExternalLink, Mail, Save, Shield } from 'lucide-react';
import { listProfiles, updateProfileLicense, updateProfileRole, type LicenseType } from '../../services/profilesService';
import { getAccessList, revokeAccess } from '../../services/trainingService';
import { getPurchasesForAdmin } from '../../services/purchasesService';
import { getProgressSummary } from '../../services/progressService';
import { getModules } from '../../services/trainingService';
import type { Profile } from '../../services/profilesService';
import DataTable, { type Column } from '../../components/admin/DataTable';
import toast from 'react-hot-toast';

type FilterType = 'all' | 'client' | 'admin' | 'with-access' | 'without-access';

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<FilterType>('all');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

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
  }, [profiles, roleFilter, accessList]);

  const columns: Column<Profile & { accessCount: number }>[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value, row) => (
        <div className="min-w-0">
          <p className="text-white truncate">{value}</p>
          {row.full_name && (
            <p className="text-xs text-gray-400 truncate">{row.full_name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'license',
      label: 'Abonnement',
      sortable: true,
      render: (value) => {
        const licenseColors: Record<string, string> = {
          none: 'bg-gray-500/20 text-gray-400',
          starter: 'bg-blue-500/20 text-blue-400',
          entree: 'bg-blue-500/20 text-blue-400',
          pro: 'bg-purple-500/20 text-purple-400',
          transformation: 'bg-purple-500/20 text-purple-400',
          elite: 'bg-amber-500/20 text-amber-400',
          immersion: 'bg-amber-500/20 text-amber-400',
        };
        const licenseLabels: Record<string, string> = {
          none: 'Aucun',
          starter: 'Starter',
          entree: 'Starter',
          pro: 'Pro',
          transformation: 'Pro',
          elite: 'Elite',
          immersion: 'Elite',
        };
        const isElite = value === 'elite' || value === 'immersion';
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${licenseColors[value as string] || licenseColors.none}`}>
            {isElite && <Crown className="w-3 h-3" />}
            {licenseLabels[value as string] || 'Aucun'}
          </span>
        );
      },
    },
    {
      key: 'role',
      label: 'Rôle',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            value === 'admin' || value === 'developer'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}
        >
          {value === 'developer' ? 'Dev' : value}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Inscription',
      sortable: true,
      render: (value) =>
        value ? new Date(value).toLocaleDateString('fr-FR') : '-',
    },
    {
      key: 'accessCount',
      label: 'Accès',
      sortable: true,
      render: (value) => (
        <span className="text-gray-400">
          {value} formation{Number(value) > 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUser(row);
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm min-h-[36px]"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Détails</span>
        </button>
      ),
    },
  ];

  const tableData = filteredProfiles.map((profile) => {
    const userAccess = accessList.filter((a) => a.user_id === profile.id);
    return {
      ...profile,
      accessCount: userAccess.length,
    };
  });

  // Stats
  const totalUsers = profiles.length;
  const admins = profiles.filter((p) => p.role === 'admin' || p.role === 'developer').length;
  const clients = profiles.filter((p) => p.role === 'client').length;

  return (
    <div className="space-y-6">
      {/* Header responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
            Utilisateurs
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            {totalUsers} utilisateur{totalUsers > 1 ? 's' : ''} • {clients} client{clients > 1 ? 's' : ''} • {admins} admin{admins > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filtres */}
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

      {isLoading ? (
        <p className="text-gray-400 text-center py-8">Chargement des utilisateurs...</p>
      ) : (
        <DataTable
          data={tableData}
          columns={columns}
          getRowId={(row) => row.id}
          searchable={true}
          searchPlaceholder="Rechercher un utilisateur..."
          exportable={true}
          exportFilename="utilisateurs"
          pageSize={25}
          defaultSort={{ column: 'created_at', direction: 'desc' }}
          persistState={true}
          storageKey="users-table"
          onRowClick={(row) => setSelectedUser(row)}
        />
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
  const queryClient = useQueryClient();
  const [selectedLicense, setSelectedLicense] = useState<LicenseType>((user.license as LicenseType) || 'none');
  const [selectedRole, setSelectedRole] = useState<'client' | 'admin'>(user.role as 'client' | 'admin');
  const [isSaving, setIsSaving] = useState(false);

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

  const hasChanges = selectedLicense !== (user.license || 'none') || selectedRole !== user.role;

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const promises = [];
      
      if (selectedLicense !== (user.license || 'none')) {
        promises.push(updateProfileLicense(user.id, selectedLicense));
      }
      
      if (selectedRole !== user.role) {
        promises.push(updateProfileRole(user.id, selectedRole));
      }
      
      await Promise.all(promises);
      
      // Rafraîchir la liste des profils
      queryClient.invalidateQueries({ queryKey: ['admin', 'profiles'] });
      
      toast.success('Modifications enregistrées');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const licenseOptions: { value: LicenseType; label: string; color: string }[] = [
    { value: 'none', label: 'Aucune licence', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    { value: 'entree', label: 'Starter (Entrée)', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { value: 'transformation', label: 'Pro (Transformation)', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { value: 'immersion', label: 'Elite (Immersion)', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  ];

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
          {/* Gestion du statut - NOUVEAU */}
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Gestion du statut
            </h3>
            
            {/* Licence */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Licence / Abonnement</label>
              <div className="grid grid-cols-2 gap-2">
                {licenseOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedLicense(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                      selectedLicense === option.value
                        ? option.color
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {option.value === 'immersion' && <Crown className="w-3 h-3 inline mr-1" />}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rôle */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Rôle</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedRole('client')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                    selectedRole === 'client'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  Client
                </button>
                <button
                  onClick={() => setSelectedRole('admin')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                    selectedRole === 'admin'
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Bouton de sauvegarde */}
            {hasChanges && (
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="w-full mt-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            )}
          </div>

          {/* Informations générales */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Informations</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Rôle actuel:</span>
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


