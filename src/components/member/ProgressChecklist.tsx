import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Trophy, ChevronRight, Play } from 'lucide-react';
import type { TrainingModule } from '../../types/training';
import type { ModuleProgressDetail } from '../../services/progressService';
import clsx from 'clsx';

interface ProgressChecklistProps {
  modules: TrainingModule[];
  moduleProgress?: Record<string, ModuleProgressDetail>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export default function ProgressChecklist({ modules, moduleProgress }: ProgressChecklistProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header - compact sur mobile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-white leading-tight">Checklist de progression</h3>
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 leading-tight">
            {modules.filter((m) => moduleProgress?.[m.id]?.isCompleted).length}/{modules.length} modules complétés
          </p>
        </div>
      </div>

      {/* Checklist - mobile-first */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2 sm:space-y-2.5 md:space-y-3"
      >
        {modules.map((module) => {
          const progress = moduleProgress?.[module.id]?.completionRate ?? 0;
          const isCompleted = moduleProgress?.[module.id]?.isCompleted ?? false;
          const nextLessonTitle = moduleProgress?.[module.id]?.nextLessonTitle;
          const isInProgress = progress > 0 && progress < 100;

          return (
            <motion.div
              key={module.id}
              variants={itemVariants}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/app/modules/${module.id}`)}
              className={clsx(
                'group relative overflow-hidden rounded-lg sm:rounded-xl border p-2.5 sm:p-3 md:p-4 cursor-pointer transition-all duration-200 active:scale-[0.98]',
                isCompleted
                  ? 'bg-green-500/10 border-green-500/30'
                  : isInProgress
                  ? 'bg-yellow-500/5 border-yellow-500/20'
                  : 'bg-white/5 border-white/10'
              )}
            >
              {/* Layout mobile-first */}
              <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4">
                {/* Status Icon - compact sur mobile */}
                <div
                  className={clsx(
                    'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                    isCompleted
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20'
                      : isInProgress
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg shadow-yellow-500/20'
                      : 'bg-white/10'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : isInProgress ? (
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-white">{progress}%</span>
                  ) : (
                    <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  )}
                </div>

                {/* Content - flex-1 avec overflow hidden */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h4
                      className={clsx(
                        'text-xs sm:text-sm md:text-base font-semibold truncate transition-colors',
                        isCompleted
                          ? 'text-green-300'
                          : isInProgress
                          ? 'text-yellow-300'
                          : 'text-white'
                      )}
                    >
                      {module.title}
                    </h4>
                    {isCompleted && (
                      <span className="px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[8px] sm:text-[9px] font-semibold whitespace-nowrap">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 truncate">
                    {isCompleted
                      ? 'Terminé !'
                      : nextLessonTitle
                      ? nextLessonTitle
                      : 'Commencer'}
                  </p>
                  
                  {/* Progress bar - toujours visible sur mobile */}
                  <div className="mt-1.5 sm:mt-2">
                    <div className="h-1 sm:h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
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
                </div>

                {/* Arrow - compact */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-500" />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty state */}
      {modules.length === 0 && (
        <div className="text-center py-4 sm:py-6 md:py-8">
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto text-gray-600 mb-2 sm:mb-3" />
          <p className="text-xs sm:text-sm md:text-base text-gray-400">Aucun module disponible</p>
        </div>
      )}
    </div>
  );
}
