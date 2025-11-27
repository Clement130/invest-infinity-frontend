import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck, Check, Loader2, Palette, Sparkles, Store } from 'lucide-react';
import clsx from 'clsx';
import {
  getUserInventory,
  equipInventoryItem,
  toggleThemeItem,
  activateBoosterItem,
  type InventoryItem,
} from '../../services/economyService';
import { useSession } from '../../hooks/useSession';
import { useToast } from '../../hooks/useToast';

interface InventoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenStore: () => void;
}

const typeAccent: Record<string, string> = {
  theme: 'from-indigo-500 to-blue-500',
  booster: 'from-pink-500 to-purple-600',
  freeze_pass: 'from-blue-400 to-cyan-400',
  avatar: 'from-amber-400 to-orange-500',
};

export default function InventoryDrawer({ open, onClose, onOpenStore }: InventoryDrawerProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();

  const inventoryQuery = useQuery({
    queryKey: ['inventory', user?.id],
    queryFn: () => getUserInventory(user?.id || ''),
    enabled: open && !!user?.id,
  });

  const equipMutation = useMutation({
    mutationFn: ({ item, equipped }: { item: InventoryItem; equipped: boolean }) => {
      if (item.type === 'theme') {
        return toggleThemeItem({
          inventoryId: equipped ? item.id : null,
          userId: user?.id || '',
          equipped,
          themeKey: item.themeKey,
        });
      }
      return equipInventoryItem(item.id, equipped);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['member-stats', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['wallet', user?.id] });
    },
  });

  const boosterMutation = useMutation({
    mutationFn: (item: InventoryItem) =>
      activateBoosterItem({
        inventoryId: item.id,
        userId: user?.id || '',
        multiplier: Number(item.metadata.multiplier ?? 1.5),
        durationMinutes: Number(item.metadata.durationMinutes ?? 60),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['member-stats', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['economy-events', user?.id] });
      toast.success('Booster activé, XP x2 prêt !');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Impossible d’activer le booster');
    },
  });

  if (!open) return null;

  const items = inventoryQuery.data ?? [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end bg-black/60"
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="w-full max-w-md h-full bg-slate-950/95 border-l border-white/10 shadow-2xl shadow-black/40 flex flex-col"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-[0.3em]">Inventaire</p>
              <h2 className="text-xl font-bold text-white">Personnalisation & Boosters</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onOpenStore}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/30"
              >
                <Store className="w-4 h-4" />
                Boutique
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 text-sm text-white hover:bg-white/20"
              >
                Fermer
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {inventoryQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-24 rounded-2xl border border-white/5 bg-white/5 animate-pulse" />
              ))
            ) : items.length === 0 ? (
              <div className="text-center text-gray-400 text-sm">
                Ton inventaire est vide. Passe par la boutique pour débloquer des items exclusifs.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-white">{item.name}</p>
                      <p className="text-xs uppercase text-gray-400">{item.type}</p>
                    </div>
                    {item.type === 'theme' && item.equipped && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <BadgeCheck className="w-3 h-3" />
                        Actif
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">Quantité : {item.quantity}</div>
                    {item.type === 'theme' && (
                      <button
                        disabled={equipMutation.isPending || !user}
                        onClick={() => equipMutation.mutate({ item, equipped: !item.equipped })}
                        className={clsx(
                          'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold',
                          item.equipped
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                            : 'bg-white/10 text-white border border-white/10',
                        )}
                      >
                        {equipMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Palette className="w-3 h-3" />}
                        {item.equipped ? 'Retirer' : 'Activer'}
                      </button>
                    )}
                    {item.type === 'booster' && (
                      <button
                        disabled={boosterMutation.isPending || !user}
                        onClick={() => boosterMutation.mutate(item)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-500/20 to-purple-500/30 text-pink-100 border border-pink-500/40"
                      >
                        {boosterMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        Activer
                      </button>
                    )}
                    {item.type === 'freeze_pass' && (
                      <span className="text-xs text-blue-300 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Disponible
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

