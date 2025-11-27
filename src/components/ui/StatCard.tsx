import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'pink' | 'purple' | 'blue' | 'green' | 'orange' | 'yellow' | 'cyan';
  delay?: number;
  size?: 'sm' | 'md' | 'lg';
}

const colorConfig = {
  pink: {
    icon: 'from-pink-500 to-rose-600',
    text: 'text-pink-400',
    bg: 'bg-pink-500/10',
    shadow: 'shadow-pink-500/20',
    glow: 'group-hover:shadow-pink-500/30',
  },
  purple: {
    icon: 'from-purple-500 to-violet-600',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    shadow: 'shadow-purple-500/20',
    glow: 'group-hover:shadow-purple-500/30',
  },
  blue: {
    icon: 'from-blue-500 to-cyan-600',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    shadow: 'shadow-blue-500/20',
    glow: 'group-hover:shadow-blue-500/30',
  },
  green: {
    icon: 'from-green-500 to-emerald-600',
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    shadow: 'shadow-green-500/20',
    glow: 'group-hover:shadow-green-500/30',
  },
  orange: {
    icon: 'from-orange-500 to-amber-600',
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    shadow: 'shadow-orange-500/20',
    glow: 'group-hover:shadow-orange-500/30',
  },
  yellow: {
    icon: 'from-yellow-500 to-amber-500',
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    shadow: 'shadow-yellow-500/20',
    glow: 'group-hover:shadow-yellow-500/30',
  },
  cyan: {
    icon: 'from-cyan-500 to-teal-600',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    shadow: 'shadow-cyan-500/20',
    glow: 'group-hover:shadow-cyan-500/30',
  },
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color,
  delay = 0,
  size = 'md',
}: StatCardProps) {
  const config = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={clsx(
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:shadow-xl',
        config.glow,
        size === 'sm' && 'p-4',
        size === 'md' && 'p-5',
        size === 'lg' && 'p-6'
      )}
    >
      {/* Background glow effect */}
      <div
        className={clsx(
          'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40',
          config.bg
        )}
      />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div
            className={clsx(
              'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
              config.icon,
              config.shadow
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>

          {trend && (
            <div
              className={clsx(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
                trend.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              )}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <motion.p
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: delay + 0.2 }}
              className={clsx(
                'font-bold',
                config.text,
                size === 'sm' && 'text-xl',
                size === 'md' && 'text-2xl',
                size === 'lg' && 'text-3xl'
              )}
            >
              {value}
            </motion.p>
            {subValue && <span className="text-sm text-gray-500">{subValue}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

