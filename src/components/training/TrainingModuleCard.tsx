/**
 * TrainingModuleCard - Carte module premium
 * 
 * Features:
 * - Design premium avec glassmorphism et glow
 * - Header avec icône et badge de statut
 * - Progression visuelle animée avec pulse
 * - Badges motivants (Essentiel, Recommandé, Nouveau)
 * - Meta infos: nombre de leçons, durée, niveau
 * - Hover: glow dynamique et border animée
 * - Mobile-first: full width, tap-friendly
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  ArrowRight,
  Sparkles,
  Star,
  Zap,
  Trophy
} from 'lucide-react';
import type { TrainingModule } from '../../types/training';
import clsx from 'clsx';

// Extended module type with optional computed fields
interface ExtendedModule extends TrainingModule {
  lessons_count?: number;
  duration?: string;
  is_essential?: boolean;
}

interface TrainingModuleCardProps {
  module: ExtendedModule;
  onClick?: () => void;
  progress?: number;
  lastLessonTitle?: string;
  isRecommended?: boolean;
  isNew?: boolean;
  isEssential?: boolean;
}

// Badge component
const ModuleBadge = memo(function ModuleBadge({
  type,
}: {
  type: 'recommended' | 'new' | 'essential';
}) {
  const config = {
    recommended: {
      icon: Star,
      label: 'Recommandé',
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    },
    new: {
      icon: Sparkles,
      label: 'Nouveau',
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    essential: {
      icon: Zap,
      label: 'Essentiel',
      className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
  };

  const { icon: Icon, label, className } = config[type];

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </motion.span>
  );
});

function TrainingModuleCard({
  module,
  onClick,
  progress = 0,
  lastLessonTitle,
  isRecommended,
  isNew,
  isEssential,
}: TrainingModuleCardProps) {
  const isCompleted = progress === 100;
  const isInProgress = progress > 0 && progress < 100;
  const isNotStarted = progress === 0;

  // Status config
  const statusConfig = {
    completed: {
      label: 'Complété',
      icon: Trophy,
      gradient: 'from-green-500 to-emerald-600',
      border: 'border-green-500/30',
      badge: 'bg-green-500/20 text-green-400 border-green-500/30',
      progress: 'from-green-500 to-emerald-400',
      glow: 'group-hover:shadow-green-500/20',
      text: 'text-green-400',
    },
    inProgress: {
      label: 'En cours',
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-600',
      border: 'border-yellow-500/30',
      badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      progress: 'from-yellow-500 to-orange-400',
      glow: 'group-hover:shadow-yellow-500/20',
      text: 'text-yellow-400',
    },
    notStarted: {
      label: 'À démarrer',
      icon: Play,
      gradient: 'from-pink-500 to-purple-600',
      border: 'border-pink-500/30',
      badge: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      progress: 'from-pink-500 to-purple-500',
      glow: 'group-hover:shadow-pink-500/20',
      text: 'text-pink-400',
    },
  };

  const status = isCompleted ? 'completed' : isInProgress ? 'inProgress' : 'notStarted';
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={clsx(
        'group relative overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer',
        'bg-gradient-to-br from-slate-900 via-slate-950 to-black',
        'border border-white/10 shadow-xl',
        'transition-all duration-500',
        'hover:border-white/20',
        config.glow,
        'hover:shadow-2xl'
      )}
    >
      {/* Glow effect on hover */}
      <div className={clsx(
        'absolute -inset-1 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10',
        `bg-gradient-to-r ${config.progress}`
      )} />

      {/* Top gradient bar - animated on hover */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={clsx(
          'h-1.5 w-full origin-left',
          `bg-gradient-to-r ${config.progress}`
        )}
      />

      {/* Content */}
      <div className="relative p-5 sm:p-6 space-y-4 sm:space-y-5">
        {/* Header: Icon + Badge */}
        <div className="flex items-start justify-between gap-3">
          {/* Icon */}
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
            className={clsx(
              'w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg',
              `bg-gradient-to-br ${config.gradient}`,
              isCompleted ? 'shadow-green-500/20' : isInProgress ? 'shadow-yellow-500/20' : 'shadow-pink-500/20'
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            ) : (
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            )}
          </motion.div>

          {/* Status Badge */}
          <motion.span
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-bold border',
              config.badge
            )}
          >
            {config.label}
          </motion.span>
        </div>

        {/* Motivational Badges */}
        {(isRecommended || isNew || isEssential) && (
          <div className="flex flex-wrap gap-1.5">
            {isEssential && <ModuleBadge type="essential" />}
            {isRecommended && <ModuleBadge type="recommended" />}
            {isNew && <ModuleBadge type="new" />}
          </div>
        )}

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-pink-100 transition-colors line-clamp-2">
            {module.title}
          </h3>
          {module.description && (
            <p className="text-sm text-gray-400 line-clamp-2 group-hover:text-gray-300 transition-colors">
              {module.description}
            </p>
          )}
        </div>

        {/* Last lesson indicator */}
        {lastLessonTitle && isInProgress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
          >
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs text-yellow-300 truncate">
              Dernière leçon : {lastLessonTitle}
            </span>
          </motion.div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Progression</span>
            <span className={clsx('font-bold', config.text)}>
              {progress}%
            </span>
          </div>
          <div className="h-2.5 sm:h-3 bg-slate-800/80 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className={clsx(
                'relative h-full rounded-full',
                `bg-gradient-to-r ${config.progress}`
              )}
            >
              {/* Shimmer effect */}
              {progress > 0 && (
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              )}
            </motion.div>
          </div>
        </div>

        {/* Footer: Meta + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          {/* Meta info */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {module.lessons_count || 0} leçons
            </span>
            {module.duration && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {module.duration}
              </span>
            )}
          </div>

          {/* CTA */}
          <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center gap-1.5 text-sm font-semibold text-pink-400 group-hover:text-pink-300 transition-colors"
          >
            <span className="hidden sm:inline">Voir le module</span>
            <span className="sm:hidden">Voir</span>
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(TrainingModuleCard);
