import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import clsx from 'clsx';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'pink' | 'purple' | 'blue' | 'green' | 'orange' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  delay?: number;
}

const glowColors = {
  pink: 'hover:shadow-pink-500/20 hover:border-pink-500/30',
  purple: 'hover:shadow-purple-500/20 hover:border-purple-500/30',
  blue: 'hover:shadow-blue-500/20 hover:border-blue-500/30',
  green: 'hover:shadow-green-500/20 hover:border-green-500/30',
  orange: 'hover:shadow-orange-500/20 hover:border-orange-500/30',
  none: '',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function GlassCard({
  children,
  className,
  hover = true,
  glow = 'pink',
  padding = 'md',
  onClick,
  delay = 0,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      className={clsx(
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl transition-all duration-300',
        hover && 'cursor-pointer hover:bg-white/10 hover:shadow-2xl',
        glow !== 'none' && glowColors[glow],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </motion.div>
  );
}

