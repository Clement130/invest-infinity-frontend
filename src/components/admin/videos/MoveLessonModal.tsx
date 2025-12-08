import { useState } from 'react';
import { X, ArrowRight, FolderOpen } from 'lucide-react';
import type { ModuleWithLessons } from '../../../hooks/admin/useFormationsHierarchy';
import type { TrainingLesson } from '../../../types/training';

interface MoveLessonModalProps {
  isOpen: boolean;
  lesson: TrainingLesson | null;
  modules: ModuleWithLessons[];
  currentModuleId: string;
  onClose: () => void;
  onMove: (lessonId: string, newModuleId: string) => Promise<void>;
}

export function MoveLessonModal({
  isOpen,
  lesson,
  modules,
  currentModuleId,
  onClose,
  onMove,
}: MoveLessonModalProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false);

  if (!isOpen || !lesson) return null;

  // Filtrer le module actuel de la liste
  const availableModules = modules.filter((m) => m.id !== currentModuleId);
  const currentModule = modules.find((m) => m.id === currentModuleId);

  const handleMove = async () => {
    if (!selectedModuleId || !lesson) return;

    setIsMoving(true);
    try {
      await onMove(lesson.id, selectedModuleId);
      onClose();
      setSelectedModuleId('');
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">📦 Déplacer la leçon</h2>
            <p className="text-sm text-gray-400">
              {lesson.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white/10 transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Module actuel */}
          {currentModule && (
            <div className="p-3 rounded-lg border border-white/10 bg-black/40">
              <div className="text-xs text-gray-400 mb-1">Module actuel</div>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-white">{currentModule.title}</span>
              </div>
            </div>
          )}

          {/* Liste des modules disponibles */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">
              Sélectionner le module de destination
            </label>
            {availableModules.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm rounded-lg border border-white/10 bg-black/40">
                Aucun autre module disponible
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableModules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => setSelectedModuleId(module.id)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      selectedModuleId === module.id
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-white/10 bg-black/40 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{module.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {module.lessons.length} leçon{module.lessons.length > 1 ? 's' : ''}
                        </div>
                      </div>
                      {selectedModuleId === module.id && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <ArrowRight className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={isMoving}
            className="px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleMove}
            disabled={!selectedModuleId || isMoving}
            className="px-6 py-2 rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isMoving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Déplacement...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Déplacer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

