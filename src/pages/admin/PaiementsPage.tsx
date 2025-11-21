import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, Filter, Euro } from 'lucide-react';
import { getPurchasesForAdmin } from '../../services/purchasesService';
import { getModules } from '../../services/trainingService';
import { listProfiles } from '../../services/profilesService';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'completed' | 'pending' | 'failed';

export default function PaiementsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['admin', 'purchases'],
    queryFn: () => getPurchasesForAdmin(),
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: () => getModules({ includeInactive: true }),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: () => listProfiles(),
  });

  const filteredPurchases = useMemo(() => {
    let filtered = purchases;

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        const module = modules.find((m) => m.id === p.module_id);
        const profile = profiles.find((pr) => pr.id === p.user_id);
        return (
          module?.title?.toLowerCase().includes(query) ||
          profile?.email?.toLowerCase().includes(query) ||
          profile?.full_name?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [purchases, statusFilter, searchQuery, modules, profiles]);

  const totalRevenue = useMemo(() => {
    return filteredPurchases
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [filteredPurchases]);

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Module',
      'Utilisateur',
      'Email',
      'Montant (€)',
      'Statut',
      'ID Transaction',
    ];
    const rows = filteredPurchases.map((purchase) => {
      const module = modules.find((m) => m.id === purchase.module_id);
      const profile = profiles.find((pr) => pr.id === purchase.user_id);
      return [
        purchase.created_at
          ? new Date(purchase.created_at).toLocaleDateString('fr-FR')
          : '',
        module?.title || 'Module inconnu',
        profile?.full_name || '-',
        profile?.email || '-',
        purchase.amount ? (purchase.amount / 100).toFixed(2) : '0.00',
        purchase.status,
        purchase.id,
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
    link.setAttribute('download', `paiements-${new Date().toISOString().split('T')[0]}.csv`);
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
          <h1 className="text-3xl font-bold text-white mb-2">Paiements</h1>
          <p className="text-gray-400">Gérez les transactions et paiements</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2">
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Total:</span>
              <span className="text-lg font-semibold text-white">
                {(totalRevenue / 100).toFixed(2)} €
              </span>
            </div>
          </div>
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
            placeholder="Rechercher par module ou utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
            showFilters || statusFilter !== 'all'
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
            <h3 className="text-sm font-medium text-white">Filtrer par statut</h3>
            <button
              onClick={() => {
                setStatusFilter('all');
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
              { value: 'completed', label: 'Complétés' },
              { value: 'pending', label: 'En attente' },
              { value: 'failed', label: 'Échoués' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as StatusFilter)}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  statusFilter === filter.value
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
        <p className="text-gray-400 text-center py-8">Chargement des paiements...</p>
      ) : filteredPurchases.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          {searchQuery || statusFilter !== 'all'
            ? 'Aucun paiement trouvé'
            : 'Aucun paiement enregistré pour le moment.'}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Module
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
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredPurchases.map((purchase) => {
                  const module = modules.find((m) => m.id === purchase.module_id);
                  const profile = profiles.find((pr) => pr.id === purchase.user_id);
                  return (
                    <tr key={purchase.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {purchase.created_at
                          ? new Date(purchase.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {module?.title || 'Module inconnu'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div>
                          <div>{profile?.full_name || '-'}</div>
                          <div className="text-xs text-gray-500">{profile?.email || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                        {purchase.amount ? `${(purchase.amount / 100).toFixed(2)} €` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full uppercase ${
                            purchase.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : purchase.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {purchase.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


