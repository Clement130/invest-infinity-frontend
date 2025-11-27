import { motion } from 'framer-motion';
import { Play, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import type { TrainingModule } from '../../types/training';
import clsx from 'clsx';

interface TrainingModuleCardProps {
  module: TrainingModule;
  onClick?: () => void;
  progress?: number;
}

export default function TrainingModuleCard({
  module,
  onClick,
  progress = 0,
}: TrainingModuleCardProps) {
  const isCompleted = progress === 100;
  const isInProgress = progress > 0 && progress < 100;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/10 shadow-xl transition-all duration-300 cursor-pointer hover:border-pink-500/30 hover:shadow-pink-500/10"
    >
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-purple-500/0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

      {/* Top gradient bar */}
      <div
        className={clsx(
          'h-1 w-full',
          isCompleted
            ? 'bg-gradient-to-r from-green-500 to-emerald-400'
            : isInProgress
            ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
            : 'bg-gradient-to-r from-pink-500 to-purple-500'
        )}
      />

      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className={clsx(
              'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg',
              isCompleted
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20'
                : isInProgress
                ? 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-yellow-500/20'
                : 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-pink-500/20'
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : (
              <BookOpen className="w-6 h-6 text-white" />
            )}
          </div>

          <span
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-semibold',
              isCompleted
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : isInProgress
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
            )}
          >
            {isCompleted ? 'Complété' : isInProgress ? 'En cours' : 'À démarrer'}
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white group-hover:text-pink-200 transition-colors line-clamp-2">
            {module.title}
          </h3>
          {module.description && (
            <p className="text-sm text-gray-400 line-clamp-2">{module.description}</p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Progression</span>
            <span
              className={clsx(
                'font-semibold',
                isCompleted ? 'text-green-400' : isInProgress ? 'text-yellow-400' : 'text-pink-400'
              )}
            >
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={clsx(
                'h-full rounded-full',
                isCompleted
                  ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                  : isInProgress
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
                  : 'bg-gradient-to-r from-pink-500 to-purple-500'
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{module.lessons_count || 0} leçons</span>
          </div>
          <motion.div
            initial={{ x: 0 }}
            whileHover={{ x: 4 }}
            className="flex items-center gap-1 text-sm font-medium text-pink-400 group-hover:text-pink-300"
          >
            <span>Voir le module</span>
            <Play className="w-4 h-4" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
