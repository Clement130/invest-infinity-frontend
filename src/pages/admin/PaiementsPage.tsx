import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Euro } from 'lucide-react';
import { getPurchasesForAdmin } from '../../services/purchasesService';
import { getModules } from '../../services/trainingService';
import { listProfiles } from '../../services/profilesService';
import DataTable, { type Column } from '../../components/admin/DataTable';
import type { Purchase } from '../../types/training';

type StatusFilter = 'all' | 'completed' | 'pending' | 'failed';

type PurchaseWithDetails = Purchase & {
  moduleTitle?: string;
  userName?: string;
  userEmail?: string;
};

export default function PaiementsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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

  const purchasesWithDetails = useMemo(() => {
    return purchases.map((purchase) => {
      const module = modules.find((m) => m.id === purchase.module_id);
      const profile = profiles.find((pr) => pr.id === purchase.user_id);
      return {
        ...purchase,
        moduleTitle: module?.title,
        userName: profile?.full_name,
        userEmail: profile?.email,
      };
    });
  }, [purchases, modules, profiles]);

  const filteredPurchases = useMemo(() => {
    if (statusFilter === 'all') return purchasesWithDetails;
    return purchasesWithDetails.filter((p) => p.status === statusFilter);
  }, [purchasesWithDetails, statusFilter]);

  const totalRevenue = useMemo(() => {
    return purchasesWithDetails
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [purchasesWithDetails]);

  const columns: Column<PurchaseWithDetails>[] = [
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (value) =>
        value
          ? new Date(value).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-',
    },
    {
      key: 'moduleTitle',
      label: 'Module',
      sortable: true,
      render: (value) => value || 'Module inconnu',
    },
    {
      key: 'userName',
      label: 'Utilisateur',
      sortable: true,
      render: (value, row) => (
        <div>
          <div>{value || '-'}</div>
          <div className="text-xs text-gray-500">{row.userEmail || '-'}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Montant',
      sortable: true,
      render: (value) => (
        <span className="font-semibold">
          {value ? `${(Number(value) / 100).toFixed(2)} €` : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs rounded-full uppercase ${
            value === 'completed'
              ? 'bg-green-500/20 text-green-400'
              : value === 'pending'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

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
        </div>
      </div>

      {/* Filters */}
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

      {isLoading ? (
        <p className="text-gray-400 text-center py-8">Chargement des paiements...</p>
      ) : (
        <DataTable
          data={filteredPurchases}
          columns={columns}
          getRowId={(row) => row.id}
          searchable={true}
          searchPlaceholder="Rechercher par module ou utilisateur..."
          exportable={true}
          exportFilename="paiements"
          pageSize={25}
          defaultSort={{ column: 'created_at', direction: 'desc' }}
          persistState={true}
          storageKey="paiements-table"
        />
      )}
    </div>
  );
}


