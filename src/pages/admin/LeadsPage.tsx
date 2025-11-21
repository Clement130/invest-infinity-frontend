import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, Phone, Euro, Calendar, User } from 'lucide-react';
import { listLeads, updateLeadStatus } from '../../services/leadsService';
import type { Lead } from '../../services/leadsService';
import DataTable, { type Column } from '../../components/admin/DataTable';

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['admin', 'leads'],
    queryFn: () => listLeads(),
  });

  const filteredLeads = useMemo(() => {
    if (statusFilter === 'all') return leads;
    return leads.filter((lead) => lead.statut === statusFilter);
  }, [leads, statusFilter]);

  const handleStatusChange = async (email: string, newStatus: string) => {
    try {
      await updateLeadStatus(email, newStatus);
      refetch();
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus = leads.reduce(
      (acc, lead) => {
        acc[lead.statut] = (acc[lead.statut] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const totalCapital = leads.reduce((sum, lead) => sum + (lead.capital || 0), 0);

    return { total, byStatus, totalCapital };
  }, [leads]);

  const statusOptions = ['Lead', 'Client', 'Prospect', 'Inactif'];

  const columns: Column<Lead>[] = [
    {
      key: 'prenom',
      label: 'Prénom',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          {value || '-'}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          {value}
        </div>
      ),
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          {value || '-'}
        </div>
      ),
    },
    {
      key: 'capital',
      label: 'Capital',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Euro className="w-4 h-4 text-gray-400" />
          {value ? `${Number(value).toLocaleString('fr-FR')} €` : '-'}
        </div>
      ),
    },
    {
      key: 'segment',
      label: 'Segment',
      render: (_, row) => {
        const segment = (row.metadata as any)?.segment;
        return (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              segment === 'high'
                ? 'bg-green-500/20 text-green-400'
                : segment === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {segment === 'high' ? 'Élevé' : segment === 'medium' ? 'Moyen' : 'Bas'}
          </span>
        );
      },
    },
    {
      key: 'statut',
      label: 'Statut',
      sortable: true,
      render: (value, row) => (
        <select
          value={value}
          onChange={(e) => {
            e.stopPropagation();
            handleStatusChange(row.email, e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className={`px-2 py-1 text-xs rounded border bg-slate-800 ${
            value === 'Client'
              ? 'text-green-400 border-green-500/30'
              : value === 'Lead'
                ? 'text-blue-400 border-blue-500/30'
                : 'text-gray-400 border-gray-500/30'
          }`}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          {new Date(value).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Leads</h1>
        <p className="text-gray-400">Gérez les leads et prospects de votre plateforme</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-gray-400 text-sm mb-1">Total Leads</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-gray-400 text-sm mb-1">Capital Total</div>
          <div className="text-2xl font-bold text-white">
            {stats.totalCapital.toLocaleString('fr-FR')} €
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-gray-400 text-sm mb-1">Leads Actifs</div>
          <div className="text-2xl font-bold text-white">
            {stats.byStatus['Lead'] || 0}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-gray-400 text-sm mb-1">Clients</div>
          <div className="text-2xl font-bold text-white">
            {stats.byStatus['Client'] || 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white"
        >
          <option value="all">Tous les statuts</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-gray-400 text-center py-8">Chargement des leads...</p>
      ) : (
        <DataTable
          data={filteredLeads}
          columns={columns}
          getRowId={(row) => row.id}
          searchable={true}
          searchPlaceholder="Rechercher un lead (email, prénom, téléphone)..."
          exportable={true}
          exportFilename="leads"
          pageSize={25}
          defaultSort={{ column: 'created_at', direction: 'desc' }}
          persistState={true}
          storageKey="leads-table"
        />
      )}
    </div>
  );
}

