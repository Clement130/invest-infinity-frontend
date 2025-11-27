import { motion } from 'framer-motion';
import clsx from 'clsx';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'pink' | 'purple' | 'blue' | 'green' | 'orange' | 'gradient';
  animated?: boolean;
  delay?: number;
}

const colorClasses = {
  pink: 'bg-pink-500',
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  gradient: 'bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500',
};

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export default function AnimatedProgress({
  value,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  color = 'gradient',
  animated = true,
  delay = 0,
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-2">
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-gray-400">{label}</span>}
          {showValue && (
            <span className="text-gray-300 font-medium">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        className={clsx(
          'w-full bg-slate-800/50 rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animated ? 1 : 0, delay, ease: 'easeOut' }}
          className={clsx('h-full rounded-full relative', colorClasses[color])}
        >
          {animated && color === 'gradient' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </motion.div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

