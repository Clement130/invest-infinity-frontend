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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Checklist de progression</h3>
          <p className="text-sm text-gray-400">
            {modules.filter((m) => moduleProgress?.[m.id]?.isCompleted).length} / {modules.length} modules complétés
          </p>
        </div>
      </div>

      {/* Checklist */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {modules.map((module, index) => {
          const progress = moduleProgress?.[module.id]?.completionRate ?? 0;
          const isCompleted = moduleProgress?.[module.id]?.isCompleted ?? false;
          const nextLessonTitle = moduleProgress?.[module.id]?.nextLessonTitle;
          const isInProgress = progress > 0 && progress < 100;

          return (
            <motion.div
              key={module.id}
              variants={itemVariants}
              whileHover={{ x: 4 }}
              onClick={() => navigate(`/app/modules/${module.id}`)}
              className={clsx(
                'group relative overflow-hidden rounded-xl border p-4 cursor-pointer transition-all duration-200',
                isCompleted
                  ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                  : isInProgress
                  ? 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40'
                  : 'bg-white/5 border-white/10 hover:border-pink-500/30'
              )}
            >
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                <div
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                    isCompleted
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20'
                      : isInProgress
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg shadow-yellow-500/20'
                      : 'bg-white/10 group-hover:bg-gradient-to-br group-hover:from-pink-500 group-hover:to-purple-600'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : isInProgress ? (
                    <span className="text-xs font-bold text-white">{progress}%</span>
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className={clsx(
                        'font-semibold truncate transition-colors',
                        isCompleted
                          ? 'text-green-300'
                          : isInProgress
                          ? 'text-yellow-300'
                          : 'text-white group-hover:text-pink-200'
                      )}
                    >
                      {module.title}
                    </h4>
                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-semibold">
                        Certifié
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {isCompleted
                      ? 'Module terminé !'
                      : nextLessonTitle
                      ? `Prochaine : ${nextLessonTitle}`
                      : 'Commencer ce module'}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="hidden sm:block w-24">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
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

                {/* Arrow */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <ChevronRight className="w-5 h-5 text-green-400 group-hover:translate-x-1 transition-transform" />
                  ) : (
                    <Play className="w-5 h-5 text-gray-500 group-hover:text-pink-400 transition-colors" />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty state */}
      {modules.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">Aucun module disponible</p>
        </div>
      )}
    </div>
  );
}
