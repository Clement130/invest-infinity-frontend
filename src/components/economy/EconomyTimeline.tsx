import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Coins, Gift, ShoppingBag, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { getEconomyEvents, type EconomyEvent } from '../../services/economyService';
import { useSession } from '../../hooks/useSession';

const ICON_BY_TYPE: Record<string, React.ComponentType<{ className?: string }>> = {
  coins_gain: Gift,
  coins_spent: ShoppingBag,
  purchase: ShoppingBag,
  booster_activated: Sparkles,
};

const COLOR_BY_TYPE: Record<string, string> = {
  coins_gain: 'text-emerald-300 bg-emerald-500/10',
  coins_spent: 'text-red-300 bg-red-500/10',
  purchase: 'text-blue-300 bg-blue-500/10',
  booster_activated: 'text-pink-300 bg-pink-500/10',
};

function formatEvent(event: EconomyEvent) {
  const payload = event.payload ?? {};
  const date = new Date(event.createdAt);
  const locale = 'fr-FR';
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const icon = ICON_BY_TYPE[event.type] ?? Coins;
  const colorClass = COLOR_BY_TYPE[event.type] ?? 'text-gray-300 bg-white/10';
  let title = 'Événement';
  let description = '';

  switch (event.type) {
    case 'coins_gain': {
      const delta = Number((payload as any).delta ?? 0);
      title = '+ Focus Coins';
      description = `+${delta} coins`;
      break;
    }
    case 'coins_spent': {
      const delta = Number((payload as any).delta ?? 0);
      title = 'Coins dépensés';
      description = `${delta} coins`;
      break;
    }
    case 'purchase':
      title = 'Achat boutique';
      description = `${(payload as any).itemName ?? 'Item'} (-${(payload as any).cost} FC)`;
      break;
    case 'booster_activated':
      title = 'Booster activé';
      description = `x${(payload as any).multiplier} pendant ${(payload as any).durationMinutes} min`;
      break;
    default:
      title = event.type;
      description = '';
  }

  return { title, description, time, icon, colorClass };
}

export default function EconomyTimeline() {
  const { user } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['economy-events', user?.id],
    queryFn: () => getEconomyEvents(user?.id || ''),
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-gray-500 tracking-[0.3em]">Activité</p>
          <h3 className="text-lg font-semibold text-white">Historique Focus Coins</h3>
        </div>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {isLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-16 rounded-2xl border border-white/5 bg-white/5 animate-pulse" />
            ))
          : (data ?? []).map((event) => {
              const formatted = formatEvent(event);
              const Icon = formatted.icon;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', formatted.colorClass)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{formatted.title}</p>
                    <p className="text-xs text-gray-400">{formatted.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">{formatted.time}</span>
                </motion.div>
              );
            })}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="text-center text-sm text-gray-400">Pas encore d’activité. Achète un item ou termine une quête !</p>
        )}
      </div>
    </div>
  );
}

