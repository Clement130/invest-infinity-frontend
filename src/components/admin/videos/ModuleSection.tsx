import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, GripVertical } from 'lucide-react';
import { LessonRow } from './LessonRow';
import { StatusBadge } from './StatusIndicators';
import { SortableLessonList } from './SortableLessonList';
import type { TrainingModule, TrainingLesson } from '../../../types/training';

interface ModuleSectionProps {
  module: TrainingModule;
  lessons: TrainingLesson[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onAddLesson?: (moduleId: string) => void;
  onEditModule?: (module: TrainingModule) => void;
  onEditLesson?: (lesson: TrainingLesson) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onReplaceVideo?: (lessonId: string) => void;
  onAssignVideo?: (lessonId: string) => void;
  selectedLessonId?: string;
  selectedLessons?: Set<string>;
  onSelectLesson?: (lessonId: string) => void;
  onReorderLessons?: (lessons: TrainingLesson[]) => void;
}

export function ModuleSection({
  module,
  lessons,
  isExpanded = true,
  onToggleExpand,
  onAddLesson,
  onEditModule,
  onEditLesson,
  onDeleteLesson,
  onReplaceVideo,
  onAssignVideo,
  selectedLessonId,
  selectedLessons = new Set(),
  onSelectLesson,
  onReorderLessons,
}: ModuleSectionProps) {
  const lessonsWithVideo = lessons.filter((l) => l.bunny_video_id).length;
  const totalLessons = lessons.length;
  const completionRate = totalLessons > 0 ? Math.round((lessonsWithVideo / totalLessons) * 100) : 0;
  const isComplete = completionRate === 100 && totalLessons > 0;
  const isIncomplete = completionRate < 100 && totalLessons > 0;

  const getStatus = () => {
    if (isComplete) return 'success';
    if (isIncomplete) return 'warning';
    return 'neutral';
  };

  const getStatusLabel = () => {
    if (isComplete) return `COMPLÈTE (${lessonsWithVideo}/${totalLessons})`;
    if (isIncomplete) return `INCOMPLÈTE (${lessonsWithVideo}/${totalLessons})`;
    return 'VIDE';
  };

  return (
    <div className="space-y-2">
      {/* Header du module */}
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onToggleExpand}
            className="p-1 hover:bg-white/10 rounded transition"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <GripVertical className="w-4 h-4 text-gray-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-white">{module.title}</h3>
              <StatusBadge status={getStatus()} label={getStatusLabel()} size="sm" />
            </div>
            <div className="text-xs text-gray-400">
              {totalLessons} leçon{totalLessons > 1 ? 's' : ''} • {lessonsWithVideo} vidéo{lessonsWithVideo > 1 ? 's' : ''} ({completionRate}% complet)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onAddLesson && (
            <button
              onClick={() => onAddLesson(module.id)}
              className="p-2 rounded hover:bg-white/10 transition"
              title="Ajouter une leçon"
            >
              <Plus className="w-4 h-4 text-green-400" />
            </button>
          )}
          {onEditModule && (
            <button
              onClick={() => onEditModule(module)}
              className="p-2 rounded hover:bg-white/10 transition"
              title="Éditer le module"
            >
              <Edit2 className="w-4 h-4 text-blue-400" />
            </button>
          )}
        </div>
      </div>

      {/* Liste des leçons */}
      {isExpanded && (
        <div className="space-y-2 pl-8">
          {lessons.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">
              Aucune leçon. Cliquez sur + pour en ajouter une.
            </div>
          ) : onReorderLessons ? (
            <SortableLessonList
              lessons={lessons}
              selectedLessonId={selectedLessonId}
              selectedLessons={selectedLessons}
              onSelectLesson={onSelectLesson}
              onEditLesson={onEditLesson}
              onDeleteLesson={onDeleteLesson}
              onReplaceVideo={onReplaceVideo}
              onAssignVideo={onAssignVideo}
              onReorder={onReorderLessons}
            />
          ) : (
            lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                isSelected={selectedLessonId === lesson.id}
                isMultiSelected={selectedLessons.has(lesson.id)}
                onSelect={onSelectLesson}
                onEdit={onEditLesson}
                onDelete={onDeleteLesson}
                onReplaceVideo={onReplaceVideo}
                onAssignVideo={onAssignVideo}
                showCheckbox={true}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

