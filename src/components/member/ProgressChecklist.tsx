import { CheckCircle2, Circle, Trophy } from 'lucide-react';
import type { TrainingModule } from '../../types/training';
import type { ModuleProgressDetail } from '../../services/progressService';

interface ProgressChecklistProps {
  modules: TrainingModule[];
  moduleProgress?: Record<string, ModuleProgressDetail>;
}

export default function ProgressChecklist({ modules, moduleProgress }: ProgressChecklistProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">Checklist de progression</h3>
      </div>

      <div className="space-y-3">
        {modules.map((module) => {
          const progress = moduleProgress?.[module.id]?.completionRate ?? 0;
          const isCompleted = moduleProgress?.[module.id]?.isCompleted ?? false;
          const nextLessonTitle = moduleProgress?.[module.id]?.nextLessonTitle;

          return (
            <div
              key={module.id}
              className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <h4 className="font-medium text-white">{module.title}</h4>
                    <p className="text-sm text-gray-400">
                      {progress}% complété
                      {!isCompleted && nextLessonTitle ? ` · Prochaine: ${nextLessonTitle}` : ''}
                    </p>
                  </div>
                </div>
                {isCompleted && (
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
                    Certifié
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


