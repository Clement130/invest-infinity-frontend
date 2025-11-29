import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Euro, CreditCard, ExternalLink, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
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

  // Stats
  const completedCount = purchasesWithDetails.filter((p) => p.status === 'completed').length;
  const pendingCount = purchasesWithDetails.filter((p) => p.status === 'pending').length;
  const failedCount = purchasesWithDetails.filter((p) => p.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
            Paiements
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            {purchasesWithDetails.length} transaction{purchasesWithDetails.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Stats cards */}
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-lg font-semibold text-green-400">
                {(totalRevenue / 100).toFixed(2)} €
              </span>
            </div>
          </div>
          {/* Lien Stripe */}
          <a
            href="https://dashboard.stripe.com/payments"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition text-sm text-gray-300 hover:text-white"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Stripe</span>
          </a>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-lg font-semibold">{completedCount}</span>
          </div>
          <p className="text-xs text-gray-400">Complétés</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-lg font-semibold">{pendingCount}</span>
          </div>
          <p className="text-xs text-gray-400">En attente</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-lg font-semibold">{failedCount}</span>
          </div>
          <p className="text-xs text-gray-400">Échoués</p>
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


