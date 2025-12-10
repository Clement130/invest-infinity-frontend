import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  gradient?: boolean;
}

export const GlassCard = ({ 
  children, 
  className,
  hoverEffect = true,
  gradient = false
}: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hoverEffect ? { y: -5, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md",
        "shadow-xl shadow-black/20",
        className
      )}
    >
      {/* Gradient Overlay */}
      {gradient && (
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 pointer-events-none" />
      )}

      {/* Shimmer Border Effect on Hover */}
      {hoverEffect && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
        </div>
      )}

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

