import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { LessonRow } from './LessonRow';
import type { TrainingLesson } from '../../../types/training';

interface SortableLessonListProps {
  lessons: TrainingLesson[];
  selectedLessonId?: string;
  selectedLessons?: Set<string>;
  onSelectLesson?: (lessonId: string) => void;
  onEditLesson?: (lesson: TrainingLesson) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onReplaceVideo?: (lessonId: string) => void;
  onAssignVideo?: (lessonId: string) => void;
  onReorder?: (lessons: TrainingLesson[]) => void;
}

function SortableLessonItem({
  lesson,
  index,
  totalLessons,
  onMoveUp,
  onMoveDown,
  ...props
}: {
  lesson: TrainingLesson;
  index: number;
  totalLessons: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  selectedLessonId?: string;
  selectedLessons?: Set<string>;
  onSelectLesson?: (lessonId: string) => void;
  onEditLesson?: (lesson: TrainingLesson) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onReplaceVideo?: (lessonId: string) => void;
  onAssignVideo?: (lessonId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div className="flex items-center gap-1">
        {/* Contrôles de réorganisation */}
        <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded transition"
            title="Glisser pour réorganiser"
          >
            <GripVertical className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex flex-col">
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              disabled={index === 0}
              className="p-0.5 hover:bg-white/10 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
              title="Monter"
            >
              <ChevronUp className="w-3 h-3 text-gray-500" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              disabled={index === totalLessons - 1}
              className="p-0.5 hover:bg-white/10 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
              title="Descendre"
            >
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex-1">
          <LessonRow lesson={lesson} {...props} showCheckbox={true} />
        </div>
      </div>
    </div>
  );
}

export function SortableLessonList({
  lessons,
  onReorder,
  ...props
}: SortableLessonListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);

      const newLessons = arrayMove(lessons, oldIndex, newIndex);
      
      // Mettre à jour les positions
      const updatedLessons = newLessons.map((lesson, index) => ({
        ...lesson,
        position: index,
      }));

      onReorder?.(updatedLessons);
    }
  };

  const handleMoveLesson = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= lessons.length) return;

    const newLessons = arrayMove(lessons, index, newIndex);
    const updatedLessons = newLessons.map((lesson, idx) => ({
      ...lesson,
      position: idx,
    }));

    onReorder?.(updatedLessons);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={lessons.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {lessons.map((lesson, index) => (
            <SortableLessonItem
              key={lesson.id}
              lesson={lesson}
              index={index}
              totalLessons={lessons.length}
              onMoveUp={() => handleMoveLesson(index, 'up')}
              onMoveDown={() => handleMoveLesson(index, 'down')}
              {...props}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

