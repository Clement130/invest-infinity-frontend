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
import { GripVertical } from 'lucide-react';
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
  ...props
}: {
  lesson: TrainingLesson;
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
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded transition"
        >
          <GripVertical className="w-4 h-4 text-gray-600" />
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
    useSensor(PointerSensor),
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
          {lessons.map((lesson) => (
            <SortableLessonItem key={lesson.id} lesson={lesson} {...props} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

