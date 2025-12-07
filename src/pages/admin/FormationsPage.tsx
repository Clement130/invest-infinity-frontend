import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  X,
  Video,
  Clock,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Shield,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useModules, useModuleMutations, useLessons, useLessonMutations } from '../../hooks/useTraining';
import type { TrainingModule, TrainingLesson } from '../../types/training';
import toast from 'react-hot-toast';

export default function FormationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<TrainingLesson | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: modules = [], isLoading } = useModules({ includeInactive: true });
  const { createUpdateModule, removeModule, reorderModulesMutation } = useModuleMutations();

  // Trier les modules par position
  const sortedModules = useMemo(() => {
    return [...modules].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [modules]);

  const filteredModules = useMemo(() => {
    if (!searchQuery) return sortedModules;
    const query = searchQuery.toLowerCase();
    return sortedModules.filter(
      (m) =>
        m.title?.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
    );
  }, [sortedModules, searchQuery]);

  // Mutation pour réordonner les modules via drag & drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredModules.findIndex((m) => m.id === active.id);
    const newIndex = filteredModules.findIndex((m) => m.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(filteredModules, oldIndex, newIndex);
      const moduleIds = reordered.map((m) => m.id);
      
      try {
        await reorderModulesMutation.mutateAsync(moduleIds);
        toast.success('Ordre des modules mis à jour');
      } catch (error) {
        toast.error('Erreur lors de la mise à jour de l\'ordre');
      }
    }
  };

  // Déplacer un module vers le haut
  const handleMoveUp = async (moduleId: string) => {
    const index = filteredModules.findIndex((m) => m.id === moduleId);
    if (index <= 0) return;

    const reordered = arrayMove(filteredModules, index, index - 1);
    const moduleIds = reordered.map((m) => m.id);

    try {
      await reorderModulesMutation.mutateAsync(moduleIds);
      toast.success('Module déplacé');
    } catch (error) {
      toast.error('Erreur lors du déplacement');
    }
  };

  // Déplacer un module vers le bas
  const handleMoveDown = async (moduleId: string) => {
    const index = filteredModules.findIndex((m) => m.id === moduleId);
    if (index === -1 || index >= filteredModules.length - 1) return;

    const reordered = arrayMove(filteredModules, index, index + 1);
    const moduleIds = reordered.map((m) => m.id);

    try {
      await reorderModulesMutation.mutateAsync(moduleIds);
      toast.success('Module déplacé');
    } catch (error) {
      toast.error('Erreur lors du déplacement');
    }
  };

  const handleCreateOrUpdateModule = (data: Partial<TrainingModule> & { title: string }) => {
    createUpdateModule.mutate(data, {
      onSuccess: () => {
        setModuleModalOpen(false);
        setEditingModule(null);
        toast.success(data.id ? 'Module mis à jour' : 'Module créé avec succès');
      },
      onError: () => {
        toast.error('Erreur lors de l\'enregistrement du module');
      },
    });
  };

  const handleDeleteModule = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce module ?\n\nCette action est irréversible et supprimera toutes les leçons associées.')) {
      removeModule.mutate(id, {
        onSuccess: () => {
          if (expandedModule === id) setExpandedModule(null);
          if (editingModule?.id === id) setEditingModule(null);
          if (moduleModalOpen) setModuleModalOpen(false);
          toast.success('Module supprimé avec succès');
        },
        onError: (error: any) => {
          console.error('Erreur suppression module:', error);
          toast.error(`Erreur lors de la suppression: ${error?.message || 'Une erreur est survenue'}`);
        },
      });
    }
  };

  // Stats globales
  const activeModulesCount = modules.filter((m) => m.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
            Gestion des Formations
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            {modules.length} module{modules.length > 1 ? 's' : ''} • {activeModulesCount} actif{activeModulesCount > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border transition text-sm ${
              previewMode
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">{previewMode ? 'Mode édition' : 'Prévisualisation'}</span>
          </button>
          <button
            onClick={() => {
              setEditingModule(null);
              setModuleModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau module</span>
            <span className="sm:hidden">Créer</span>
          </button>
        </div>
      </div>

      {/* Info box sur le réordonnancement */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-300">Organiser vos formations</h3>
            <p className="text-xs text-blue-200/80 mt-1">
              Glissez-déposez les modules pour les réordonner, ou utilisez les flèches. Cliquez sur un module pour gérer ses leçons.
            </p>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un module..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white placeholder-gray-500"
        />
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-center py-8">Chargement des modules...</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredModules.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {filteredModules.map((module, index) => (
                <SortableModuleRow
                  key={module.id}
                  module={module}
                  index={index}
                  totalCount={filteredModules.length}
                  isExpanded={expandedModule === module.id}
                  onToggle={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                  onEdit={() => {
                    setEditingModule(module);
                    setModuleModalOpen(true);
                  }}
                  onDelete={(e) => handleDeleteModule(module.id, e)}
                  onMoveUp={() => handleMoveUp(module.id)}
                  onMoveDown={() => handleMoveDown(module.id)}
                  onAddLesson={() => {
                    setActiveModuleId(module.id);
                    setEditingLesson(null);
                    setLessonModalOpen(true);
                  }}
                  onEditLesson={(lesson) => {
                    setActiveModuleId(module.id);
                    setEditingLesson(lesson);
                    setLessonModalOpen(true);
                  }}
                  previewMode={previewMode}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {filteredModules.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-400">
          {searchQuery ? 'Aucun module trouvé' : 'Aucun module. Créez votre premier module !'}
        </div>
      )}

      {moduleModalOpen && (
        <ModuleModal
          module={editingModule}
          onClose={() => {
            setModuleModalOpen(false);
            setEditingModule(null);
          }}
          onSave={handleCreateOrUpdateModule}
          isSaving={createUpdateModule.isPending}
        />
      )}

      {lessonModalOpen && activeModuleId && (
        <LessonModal
          lesson={editingLesson}
          moduleId={activeModuleId}
          onClose={() => {
            setLessonModalOpen(false);
            setEditingLesson(null);
            setActiveModuleId(null);
          }}
        />
      )}
    </div>
  );
}

// Composant pour une ligne de module triable
function SortableModuleRow({
  module,
  index,
  totalCount,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddLesson,
  onEditLesson,
  previewMode,
}: {
  module: TrainingModule;
  index: number;
  totalCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: (e?: React.MouseEvent) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: TrainingLesson) => void;
  previewMode: boolean;
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
  };

  const { data: lessons = [] } = useLessons(module.id);

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      {/* En-tête du module */}
      <div
        className={`rounded-xl border ${
          isExpanded
            ? 'border-purple-500/50 bg-purple-500/10'
            : 'border-white/10 bg-white/5'
        } p-4 transition`}
      >
        <div className="flex items-center gap-3">
          {/* Handle de drag */}
          {!previewMode && (
            <button
              {...attributes}
              {...listeners}
              className="p-1 hover:bg-white/10 rounded cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-5 h-5 text-gray-400" />
            </button>
          )}

          {/* Position */}
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
            {index + 1}
          </div>

          {/* Bouton d'expansion */}
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/10 rounded transition"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Infos du module */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white truncate">{module.title}</h3>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  module.is_active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {module.is_active ? 'Publié' : 'Brouillon'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Video className="w-3 h-3" />
                {lessons.length} leçon{lessons.length > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ~{lessons.length * 10} min
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {module.required_license || 'starter'}
              </span>
            </div>
          </div>

          {/* Actions */}
          {!previewMode && (
            <div className="flex items-center gap-1">
              {/* Flèches de déplacement */}
              <button
                onClick={onMoveUp}
                disabled={index === 0}
                className="p-2 rounded hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                title="Monter"
              >
                <ArrowUp className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={onMoveDown}
                disabled={index === totalCount - 1}
                className="p-2 rounded hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                title="Descendre"
              >
                <ArrowDown className="w-4 h-4 text-gray-400" />
              </button>
              
              <div className="w-px h-6 bg-white/10 mx-1" />
              
              <button
                onClick={onAddLesson}
                className="p-2 rounded hover:bg-white/10 transition"
                title="Ajouter une leçon"
              >
                <Plus className="w-4 h-4 text-green-400" />
              </button>
              <button
                onClick={onEdit}
                className="p-2 rounded hover:bg-white/10 transition"
                title="Modifier le module"
              >
                <Edit className="w-4 h-4 text-blue-400" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 rounded hover:bg-white/10 transition"
                title="Supprimer le module"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Liste des leçons (expandable) */}
      {isExpanded && (
        <LessonsManager
          moduleId={module.id}
          lessons={lessons}
          onEditLesson={onEditLesson}
          onAddLesson={onAddLesson}
        />
      )}
    </div>
  );
}

// Composant pour gérer les leçons d'un module
function LessonsManager({
  moduleId,
  lessons,
  onEditLesson,
  onAddLesson,
}: {
  moduleId: string;
  lessons: TrainingLesson[];
  onEditLesson: (lesson: TrainingLesson) => void;
  onAddLesson: () => void;
}) {
  const { removeLesson, reorderLessonsMutation } = useLessonMutations(moduleId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Trier les leçons par position
  const sortedLessons = useMemo(() => {
    return [...lessons].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [lessons]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedLessons.findIndex((l) => l.id === active.id);
    const newIndex = sortedLessons.findIndex((l) => l.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(sortedLessons, oldIndex, newIndex);
      const lessonIds = reordered.map((l) => l.id);

      try {
        await reorderLessonsMutation.mutateAsync(lessonIds);
        toast.success('Ordre des leçons mis à jour');
      } catch (error) {
        toast.error('Erreur lors de la mise à jour de l\'ordre');
      }
    }
  };

  const handleMoveUp = async (lessonId: string) => {
    const index = sortedLessons.findIndex((l) => l.id === lessonId);
    if (index <= 0) return;

    const reordered = arrayMove(sortedLessons, index, index - 1);
    const lessonIds = reordered.map((l) => l.id);

    try {
      await reorderLessonsMutation.mutateAsync(lessonIds);
      toast.success('Leçon déplacée');
    } catch (error) {
      toast.error('Erreur lors du déplacement');
    }
  };

  const handleMoveDown = async (lessonId: string) => {
    const index = sortedLessons.findIndex((l) => l.id === lessonId);
    if (index === -1 || index >= sortedLessons.length - 1) return;

    const reordered = arrayMove(sortedLessons, index, index + 1);
    const lessonIds = reordered.map((l) => l.id);

    try {
      await reorderLessonsMutation.mutateAsync(lessonIds);
      toast.success('Leçon déplacée');
    } catch (error) {
      toast.error('Erreur lors du déplacement');
    }
  };

  const handleDelete = (lessonId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette leçon ?')) {
      removeLesson.mutate(lessonId, {
        onSuccess: () => toast.success('Leçon supprimée'),
        onError: () => toast.error('Erreur lors de la suppression'),
      });
    }
  };

  if (sortedLessons.length === 0) {
    return (
      <div className="ml-12 p-4 rounded-lg border border-dashed border-white/10 text-center">
        <p className="text-gray-400 text-sm mb-3">Aucune leçon dans ce module</p>
        <button
          onClick={onAddLesson}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter la première leçon
        </button>
      </div>
    );
  }

  return (
    <div className="ml-12 space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedLessons.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedLessons.map((lesson, index) => (
            <SortableLessonRow
              key={lesson.id}
              lesson={lesson}
              index={index}
              totalCount={sortedLessons.length}
              onEdit={() => onEditLesson(lesson)}
              onDelete={() => handleDelete(lesson.id)}
              onMoveUp={() => handleMoveUp(lesson.id)}
              onMoveDown={() => handleMoveDown(lesson.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

// Composant pour une ligne de leçon triable
function SortableLessonRow({
  lesson,
  index,
  totalCount,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  lesson: TrainingLesson;
  index: number;
  totalCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
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

  const hasVideo = Boolean(lesson.bunny_video_id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 rounded-lg border border-white/10 bg-black/30 hover:border-white/20 transition"
    >
      {/* Handle de drag */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 hover:bg-white/10 rounded cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-gray-500" />
      </button>

      {/* Position */}
      <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-gray-400 text-xs font-mono">
        {index + 1}
      </div>

      {/* Indicateur vidéo */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          hasVideo ? 'bg-green-500/20' : 'bg-amber-500/20'
        }`}
      >
        <Video className={`w-4 h-4 ${hasVideo ? 'text-green-400' : 'text-amber-400'}`} />
      </div>

      {/* Titre */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{lesson.title}</p>
        {lesson.description && (
          <p className="text-xs text-gray-500 truncate">{lesson.description}</p>
        )}
      </div>

      {/* Badge preview */}
      {lesson.is_preview && (
        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
          Aperçu
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1.5 rounded hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="Monter"
        >
          <ChevronUp className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === totalCount - 1}
          className="p-1.5 rounded hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="Descendre"
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 rounded hover:bg-white/10 transition"
          title="Modifier"
        >
          <Edit className="w-4 h-4 text-blue-400" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-white/10 transition"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}

// Modal de création/édition de module
function ModuleModal({
  module,
  onClose,
  onSave,
  isSaving,
}: {
  module: TrainingModule | null;
  onClose: () => void;
  onSave: (data: Partial<TrainingModule> & { title: string }) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    title: module?.title || '',
    description: module?.description || '',
    is_active: module?.is_active ?? true,
    required_license: module?.required_license || 'starter',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    onSave({
      ...(module ? { id: module.id, position: module.position } : {}),
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {module ? 'Modifier le module' : 'Nouveau module'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white"
              placeholder="Ex: Introduction au Trading"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white"
              placeholder="Description du module..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Licence requise
            </label>
            <select
              value={formData.required_license}
              onChange={(e) => setFormData({ ...formData, required_license: e.target.value as any })}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white"
            >
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-white/10 bg-black/40"
              />
              <span className="text-sm text-gray-400">Publier immédiatement</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de création/édition de leçon
function LessonModal({
  lesson,
  moduleId,
  onClose,
}: {
  lesson: TrainingLesson | null;
  moduleId: string;
  onClose: () => void;
}) {
  const { createUpdateLesson } = useLessonMutations(moduleId);
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    bunny_video_id: lesson?.bunny_video_id || '',
    is_preview: lesson?.is_preview ?? false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    createUpdateLesson.mutate(
      {
        ...(lesson ? { id: lesson.id, position: lesson.position } : {}),
        module_id: moduleId,
        title: formData.title,
        description: formData.description || null,
        bunny_video_id: formData.bunny_video_id || null,
        is_preview: formData.is_preview,
      },
      {
        onSuccess: () => {
          toast.success(lesson ? 'Leçon mise à jour' : 'Leçon créée');
          onClose();
        },
        onError: () => {
          toast.error('Erreur lors de l\'enregistrement');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {lesson ? 'Modifier la leçon' : 'Nouvelle leçon'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white"
              placeholder="Ex: Les bases du marché"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white"
              placeholder="Description de la leçon..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              ID Vidéo Bunny Stream
            </label>
            <input
              type="text"
              value={formData.bunny_video_id}
              onChange={(e) => setFormData({ ...formData, bunny_video_id: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white font-mono text-sm"
              placeholder="Ex: 8254f866-0ab0-498c-b1fe-5ef2b66a2ab8"
            />
            <p className="text-xs text-gray-500 mt-1">
              Copiez l'ID depuis Bunny Stream. Laissez vide si pas de vidéo.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_preview}
                onChange={(e) => setFormData({ ...formData, is_preview: e.target.checked })}
                className="rounded border-white/10 bg-black/40"
              />
              <span className="text-sm text-gray-400">Leçon en aperçu gratuit</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={createUpdateLesson.isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {createUpdateLesson.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
