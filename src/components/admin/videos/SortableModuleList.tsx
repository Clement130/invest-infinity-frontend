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
import { ModuleSection } from './ModuleSection';
import type { ModuleWithLessons } from '../../../hooks/admin/useFormationsHierarchy';
import type { TrainingLesson } from '../../../types/training';

interface SortableModuleListProps {
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
  onMoveLesson?: (lesson: TrainingLesson) => void;
  onAddLesson?: (moduleId: string) => void;
  onEditModule?: (module: ModuleWithLessons) => void;
  onDeleteModule?: (moduleId: string) => void;
  onReorderLessons?: (lessons: TrainingLesson[]) => void;
  onReorderModules?: (modules: ModuleWithLessons[]) => void;
}

function SortableModuleItem({
  module,
  index,
  totalModules,
  onMoveUp,
  onMoveDown,
  ...props
}: {
  module: ModuleWithLessons;
  index: number;
  totalModules: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  selectedLessonId?: string;
  selectedLessons?: Set<string>;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onSelectLesson?: (lessonId: string) => void;
  onEditLesson?: (lesson: TrainingLesson) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onReplaceVideo?: (lessonId: string) => void;
  onAssignVideo?: (lessonId: string) => void;
  onAddLesson?: (moduleId: string) => void;
  onEditModule?: (module: ModuleWithLessons) => void;
  onDeleteModule?: (moduleId: string) => void;
  onReorderLessons?: (lessons: TrainingLesson[]) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Contrôles de réorganisation */}
      <div className="absolute -left-10 top-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-white/10 transition"
          title="Glisser pour réorganiser"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="Monter"
        >
          <ChevronUp className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === totalModules - 1}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="Descendre"
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      <ModuleSection
        module={module}
        lessons={module.lessons}
        {...props}
      />
    </div>
  );
}

export function SortableModuleList({
  modules,
  expandedModules = new Set(),
  onToggleModule,
  onReorderModules,
  onReorderLessons,
  ...props
}: SortableModuleListProps) {
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
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over.id);

      const newModules = arrayMove(modules, oldIndex, newIndex);
      
      // Mettre à jour les positions
      const updatedModules = newModules.map((module, index) => ({
        ...module,
        position: index,
      }));

      onReorderModules?.(updatedModules);
    }
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;

    const newModules = arrayMove(modules, index, newIndex);
    const updatedModules = newModules.map((module, idx) => ({
      ...module,
      position: idx,
    }));

    onReorderModules?.(updatedModules);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={modules.map((m) => m.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 pl-10">
          {modules.map((module, index) => (
            <SortableModuleItem
              key={module.id}
              module={module}
              index={index}
              totalModules={modules.length}
              onMoveUp={() => handleMoveModule(index, 'up')}
              onMoveDown={() => handleMoveModule(index, 'down')}
              isExpanded={expandedModules.has(module.id)}
              onToggleExpand={() => onToggleModule?.(module.id)}
              onReorderLessons={onReorderLessons}
              {...props}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

