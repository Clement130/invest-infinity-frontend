import { CheckCircle2, AlertCircle, Edit2, Trash2, Video as VideoIcon, ExternalLink, GripVertical } from 'lucide-react';
import { LessonStatusIndicator } from './StatusIndicators';
import type { TrainingLesson } from '../../../types/training';
import { formatDuration } from '../../../utils/admin/bunnyStreamAPI';

interface LessonRowProps {
  lesson: TrainingLesson;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  onSelect?: (lessonId: string) => void;
  onEdit?: (lesson: TrainingLesson) => void;
  onDelete?: (lessonId: string) => void;
  onReplaceVideo?: (lessonId: string) => void;
  onAssignVideo?: (lessonId: string) => void;
  showCheckbox?: boolean;
}

export function LessonRow({
  lesson,
  isSelected = false,
  isMultiSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onReplaceVideo,
  onAssignVideo,
  showCheckbox = false,
}: LessonRowProps) {
  const hasVideo = Boolean(lesson.bunny_video_id);

  return (
    <div
      className={`group relative flex items-center gap-3 rounded-lg border px-4 py-3 transition ${
        isSelected
          ? 'border-purple-500/50 bg-purple-500/10'
          : isMultiSelected
          ? 'border-purple-500/30 bg-purple-500/5'
          : 'border-white/10 bg-black/40 hover:border-white/30'
      }`}
    >
      {showCheckbox && (
        <input
          type="checkbox"
          checked={isMultiSelected}
          onChange={() => onSelect?.(lesson.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-white/20 text-purple-500 focus:ring-purple-500"
        />
      )}

      <GripVertical className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
            {lesson.title}
          </span>
          {hasVideo ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          )}
        </div>
        {hasVideo && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <VideoIcon className="w-3 h-3" />
            <code className="text-purple-300 font-mono">{lesson.bunny_video_id}</code>
          </div>
        )}
        <div className="mt-1">
          <LessonStatusIndicator
            hasVideo={hasVideo}
            isPublished={lesson.is_preview}
            isComplete={hasVideo}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(lesson);
            }}
            className="p-1.5 rounded hover:bg-white/10 transition"
            title="Éditer"
          >
            <Edit2 className="w-4 h-4 text-blue-400" />
          </button>
        )}
        {hasVideo && onReplaceVideo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReplaceVideo(lesson.id);
            }}
            className="p-1.5 rounded hover:bg-white/10 transition"
            title="Remplacer la vidéo"
          >
            <VideoIcon className="w-4 h-4 text-purple-400" />
          </button>
        )}
        {!hasVideo && onAssignVideo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAssignVideo(lesson.id);
            }}
            className="p-1.5 rounded hover:bg-white/10 transition"
            title="Assigner une vidéo"
          >
            <VideoIcon className="w-4 h-4 text-green-400" />
          </button>
        )}
        {hasVideo && (
          <a
            href={`https://bunny.net/stream/library/videos/${lesson.bunny_video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded hover:bg-white/10 transition"
            title="Voir sur Bunny Stream"
          >
            <ExternalLink className="w-4 h-4 text-purple-400" />
          </a>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Supprimer la leçon "${lesson.title}" ?`)) {
                onDelete(lesson.id);
              }
            }}
            className="p-1.5 rounded hover:bg-white/10 transition"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
}

