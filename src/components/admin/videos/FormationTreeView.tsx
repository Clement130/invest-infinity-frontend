import { useState, useMemo } from 'react';
import { Plus, Edit2, BarChart3, Eye, Settings } from 'lucide-react';
import { ModuleSection } from './ModuleSection';
import type { ModuleWithLessons } from '../../hooks/admin/useFormationsHierarchy';
import type { TrainingLesson } from '../../../types/training';

interface FormationTreeViewProps {
  modules: ModuleWithLessons[];
  selectedLessonId?: string;
  selectedLessons?: Set<string>;
  expandedModules?: Set<string>;
  onToggleModule?: (moduleId: string) => void;
  onSelectLesson?: (lessonId: string) => void;
  onEditLesson?: (lesson: TrainingLesson) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onReplaceVideo?: (lessonId: string) => void;
  onAssignVideo?: (lessonId: string) => void;
  onAddModule?: () => void;
  onAddLesson?: (moduleId: string) => void;
  onEditModule?: (module: ModuleWithLessons) => void;
  onReorderLessons?: (lessons: TrainingLesson[]) => void;
}

export function FormationTreeView({
  modules,
  selectedLessonId,
  selectedLessons = new Set(),
  expandedModules = new Set(),
  onToggleModule,
  onSelectLesson,
  onEditLesson,
  onDeleteLesson,
  onReplaceVideo,
  onAssignVideo,
  onAddModule,
  onAddLesson,
  onEditModule,
  onReorderLessons,
}: FormationTreeViewProps) {
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalVideos = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.bunny_video_id).length,
    0
  );
  const completionRate = totalLessons > 0 ? Math.round((totalVideos / totalLessons) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">📚 Structure des formations</h2>
          <p className="text-sm text-gray-400">
            {modules.length} module{modules.length > 1 ? 's' : ''} • {totalLessons} leçon{totalLessons > 1 ? 's' : ''} • {totalVideos} vidéo{totalVideos > 1 ? 's' : ''} ({completionRate}% complet)
          </p>
        </div>
        {onAddModule && (
          <button
            onClick={onAddModule}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition"
          >
            <Plus className="w-4 h-4" />
            Ajouter un module
          </button>
        )}
      </div>

      {/* Liste des modules */}
      <div className="space-y-3">
        {modules.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="mb-4">Aucun module pour le moment.</p>
            {onAddModule && (
              <button
                onClick={onAddModule}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
              >
                <Plus className="w-4 h-4" />
                Créer le premier module
              </button>
            )}
          </div>
        ) : (
          modules.map((module) => (
            <ModuleSection
              key={module.id}
              module={module}
              lessons={module.lessons}
              isExpanded={expandedModules.has(module.id)}
              onToggleExpand={() => onToggleModule?.(module.id)}
              onAddLesson={onAddLesson}
              onEditModule={onEditModule}
              onEditLesson={onEditLesson}
              onDeleteLesson={onDeleteLesson}
              onReplaceVideo={onReplaceVideo}
              onAssignVideo={onAssignVideo}
              selectedLessonId={selectedLessonId}
              selectedLessons={selectedLessons}
              onSelectLesson={onSelectLesson}
              onReorderLessons={(lessons) => onReorderLessons?.(lessons)}
            />
          ))
        )}
      </div>
    </div>
  );
}

