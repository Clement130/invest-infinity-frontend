import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Loader2, ShoppingBag, ShieldHalf, Sparkles, Wand2 } from 'lucide-react';
import {
  getStoreItems,
  getUserWallet,
  purchaseStoreItem,
  type StoreItem,
} from '../../services/economyService';
import { useSession } from '../../hooks/useSession';
import clsx from 'clsx';
import { useToast } from '../../hooks/useToast';

interface StoreModalProps {
  open: boolean;
  onClose: () => void;
  onOpenInventory: () => void;
}

type Filter = 'all' | 'theme' | 'booster' | 'freeze_pass' | 'avatar';

const typeLabels: Record<Filter, string> = {
  all: 'Tous',
  theme: 'Thèmes',
  booster: 'Boosters',
  freeze_pass: 'Freeze pass',
  avatar: 'Avatars',
};

const typeIcon: Record<Filter, React.ComponentType<{ className?: string }>> = {
  all: ShoppingBag,
  theme: Wand2,
  booster: Sparkles,
  freeze_pass: ShieldHalf,
  avatar: Coins,
};

export default function StoreModal({ open, onClose, onOpenInventory }: StoreModalProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const toast = useToast();

  const walletQuery = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: () => getUserWallet(user?.id || ''),
    enabled: open && !!user?.id,
  });

  const storeItemsQuery = useQuery({
    queryKey: ['store-items'],
    queryFn: getStoreItems,
    enabled: open,
  });

  const purchaseMutation = useMutation({
    mutationFn: (itemId: string) => purchaseStoreItem(user?.id || '', itemId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['wallet', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['economy-events', user?.id] });
      toast.success(`"${result?.itemName ?? 'Objet'}" ajouté à ton inventaire !`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Achat impossible');
    },
  });

  const filteredItems = useMemo(() => {
    const items = storeItemsQuery.data ?? [];
    if (filter === 'all') return items;
    return items.filter((item) => item.type === filter);
  }, [storeItemsQuery.data, filter]);

  if (!open) return null;

  const balance = walletQuery.data;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-black/40 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 blur-[120px]" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-[0.2em]">Boutique premium</p>
                <h2 className="text-2xl font-bold text-white">Store & Boosters</h2>
                <p className="text-gray-400 text-sm">
                  Convertis tes Focus Coins en thèmes exclusifs et boosters d’XP.
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Balance</p>
                  <p className="text-xl font-bold text-white">
                    {balance?.focusCoins?.toLocaleString() ?? '—'} Focus Coins
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(typeLabels) as Filter[]).map((key) => {
                const Icon = typeIcon[key];
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={clsx(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors',
                      filter === key
                        ? 'border-pink-500 text-white bg-pink-500/10'
                        : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {typeLabels[key]}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[55vh] overflow-y-auto pr-2">
              {storeItemsQuery.isLoading
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-40 rounded-2xl border border-white/5 bg-white/5 animate-pulse"
                    />
                  ))
                : filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <span className="text-xs uppercase text-gray-400">{typeLabels[item.type]}</span>
                      </div>
                      {item.description && <p className="text-sm text-gray-400">{item.description}</p>}
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-pink-300 flex items-center gap-2">
                          <Coins className="w-4 h-4" />
                          {item.cost}
                        </p>
                        <button
                          type="button"
                          disabled={!user || purchaseMutation.isPending}
                          onClick={() => purchaseMutation.mutate(item.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 disabled:opacity-50"
                        >
                          {purchaseMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ShoppingBag className="w-4 h-4" />
                          )}
                          Acheter
                        </button>
                      </div>
                    </div>
                  ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-white/5">
              <div className="text-xs text-gray-500">
                Les achats ajoutent automatiquement les items à ton inventaire. Tu peux équiper tes thèmes et boosters
                depuis l’inventaire.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenInventory();
                  }}
                  className="px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-all"
                >
                  Voir mon inventaire
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/10 text-sm text-white hover:bg-white/20 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

