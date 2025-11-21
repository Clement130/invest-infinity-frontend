import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  getModules,
  getLessonsForModule,
  createOrUpdateModule,
  deleteModule,
} from '../../services/trainingService';
import type { TrainingModule } from '../../types/training';
import toast from 'react-hot-toast';

export default function FormationsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: () => getModules({ includeInactive: true }),
  });

  const filteredModules = useMemo(() => {
    if (!searchQuery) return modules;
    const query = searchQuery.toLowerCase();
    return modules.filter(
      (m) =>
        m.title?.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
    );
  }, [modules, searchQuery]);

  // Mutation pour réordonner les modules
  const reorderModulesMutation = useMutation({
    mutationFn: async (reorderedModules: TrainingModule[]) => {
      const updates = reorderedModules.map((module, index) => ({
        ...module,
        position: index,
      }));
      await Promise.all(updates.map((m) => createOrUpdateModule(m)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'modules'] });
      toast.success('Ordre des modules mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredModules.findIndex((m) => m.id === active.id);
    const newIndex = filteredModules.findIndex((m) => m.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(filteredModules, oldIndex, newIndex);
      reorderModulesMutation.mutate(reordered);
    }
  };

  const createModuleMutation = useMutation({
    mutationFn: createOrUpdateModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'modules'] });
      setModuleModalOpen(false);
      setEditingModule(null);
      toast.success('Module créé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création du module');
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'modules'] });
      if (selectedModule) setSelectedModule(null);
      toast.success('Module supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Formations</h1>
          <p className="text-gray-400">Gérez vos modules de formation</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
              previewMode
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {previewMode ? 'Mode édition' : 'Prévisualisation'}
          </button>
          <button
            onClick={() => {
              setEditingModule(null);
              setModuleModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition"
          >
            <Plus className="w-4 h-4" />
            Nouvelle formation
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white"
          />
        </div>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredModules.map((module) => (
                <SortableModuleCard
                  key={module.id}
                  module={module}
                  isSelected={selectedModule === module.id}
                  onSelect={() => setSelectedModule(selectedModule === module.id ? null : module.id)}
                  onEdit={() => {
                    setEditingModule(module);
                    setModuleModalOpen(true);
                  }}
                  onDelete={() => {
                    if (confirm(`Êtes-vous sûr de vouloir supprimer "${module.title}" ?`)) {
                      deleteModuleMutation.mutate(module.id);
                    }
                  }}
                  previewMode={previewMode}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {filteredModules.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          {searchQuery ? 'Aucun module trouvé' : 'Aucun module'}
        </div>
      )}

      {moduleModalOpen && (
        <ModuleModal
          module={editingModule}
          onClose={() => {
            setModuleModalOpen(false);
            setEditingModule(null);
          }}
          onSave={(data) => createModuleMutation.mutate(data)}
          isSaving={createModuleMutation.isPending}
        />
      )}
    </div>
  );
}

function SortableModuleCard({
  module,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  previewMode,
}: {
  module: TrainingModule;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
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

  const { data: lessons = [] } = useQuery({
    queryKey: ['admin', 'lessons', module.id],
    queryFn: () => getLessonsForModule(module.id),
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border ${
        isSelected
          ? 'border-purple-500/50 bg-purple-500/10'
          : 'border-white/10 bg-white/5'
      } p-6 space-y-3 hover:border-white/20 transition cursor-pointer`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1">
          {!previewMode && (
            <button
              {...attributes}
              {...listeners}
              className="p-1 hover:bg-white/10 rounded cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white line-clamp-2">{module.title}</h3>
            {module.description && (
              <p className="text-sm text-gray-400 line-clamp-2 mt-1">{module.description}</p>
            )}
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            module.is_active
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {module.is_active ? 'Publié' : 'Brouillon'}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Video className="w-3 h-3" />
          <span>{lessons.length} leçon{lessons.length > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>~{lessons.length * 10} min</span>
        </div>
      </div>

      {isSelected && (
        <div className="flex items-center gap-2 pt-3 border-t border-white/10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition text-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    onSave({
      ...(module ? { id: module.id } : {}),
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
            />
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


