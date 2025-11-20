import { useQuery } from '@tanstack/react-query';
import { getPurchasesForAdmin } from '../../services/purchasesService';

export default function PaiementsPage() {
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['admin', 'purchases'],
    queryFn: () => getPurchasesForAdmin(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Paiements</h1>
        <p className="text-gray-400">Gérez les transactions et paiements</p>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-center py-8">Chargement des paiements...</p>
      ) : purchases.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Aucun paiement enregistré pour le moment.
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {purchase.module_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {purchase.user_id?.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {purchase.created_at
                        ? new Date(purchase.created_at).toLocaleDateString('fr-FR')
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
  );
}


