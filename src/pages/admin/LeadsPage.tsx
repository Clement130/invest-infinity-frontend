import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Mail, Phone, Euro, Calendar, User } from 'lucide-react';
import { listLeads, updateLeadStatus } from '../../services/leadsService';
import type { Lead } from '../../services/leadsService';

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['admin', 'leads'],
    queryFn: () => listLeads(),
  });

  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.email?.toLowerCase().includes(query) ||
          lead.prenom?.toLowerCase().includes(query) ||
          lead.telephone?.toLowerCase().includes(query),
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.statut === statusFilter);
    }

    return filtered;
  }, [leads, searchQuery, statusFilter]);

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
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un lead (email, prénom, téléphone)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white"
          />
        </div>
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
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Prénom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Capital
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Segment
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
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {lead.prenom || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {lead.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {lead.telephone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4 text-gray-400" />
                        {lead.capital ? `${lead.capital.toLocaleString('fr-FR')} €` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          (lead.metadata as any)?.segment === 'high'
                            ? 'bg-green-500/20 text-green-400'
                            : (lead.metadata as any)?.segment === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {(lead.metadata as any)?.segment === 'high'
                          ? 'Élevé'
                          : (lead.metadata as any)?.segment === 'medium'
                            ? 'Moyen'
                            : 'Bas'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={lead.statut}
                        onChange={(e) => handleStatusChange(lead.email, e.target.value)}
                        className={`px-2 py-1 text-xs rounded-full border-0 bg-transparent ${
                          lead.statut === 'Client'
                            ? 'text-green-400'
                            : lead.statut === 'Lead'
                              ? 'text-blue-400'
                              : 'text-gray-400'
                        }`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(lead.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredLeads.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              {searchQuery || statusFilter !== 'all'
                ? 'Aucun lead trouvé'
                : 'Aucun lead'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

