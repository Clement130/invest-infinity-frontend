import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Video, Plus, Edit, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, Play } from 'lucide-react';
import {
  getModules,
  getLessonsForModule,
  createOrUpdateModule,
  createOrUpdateLesson,
  deleteModule,
  deleteLesson,
} from '../../services/trainingService';
import type { TrainingModule, TrainingLesson } from '../../types/training';

export default function ContenuPage() {
  const queryClient = useQueryClient();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<TrainingLesson | null>(null);
  const [parentModuleId, setParentModuleId] = useState<string | null>(null);

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: () => getModules({ includeInactive: true }),
  });

  const createModuleMutation = useMutation({
    mutationFn: createOrUpdateModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'modules'] });
      setModuleModalOpen(false);
      setEditingModule(null);
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'modules'] });
      if (selectedModule) setSelectedModule(null);
    },
  });

  const toggleModuleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return createOrUpdateModule({ id, is_active: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'modules'] });
    },
  });

  const lessonSaveMutation = useMutation({
    mutationFn: createOrUpdateLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'modules'] });
      setLessonModalOpen(false);
      setEditingLesson(null);
      setParentModuleId(null);
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'modules'] });
    },
  });

  const handleOpenModuleModal = (module?: TrainingModule) => {
    setEditingModule(module || null);
    setModuleModalOpen(true);
  };

  const handleOpenLessonModal = (moduleId: string, lesson?: TrainingLesson) => {
    setParentModuleId(moduleId);
    setEditingLesson(lesson || null);
    setLessonModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Contenu</h1>
          <p className="text-gray-400">Gérez le contenu de votre plateforme</p>
        </div>
        <button
          onClick={() => handleOpenModuleModal()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition"
        >
          <Plus className="w-4 h-4" />
          Ajouter un module
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-center py-8">Chargement du contenu...</p>
      ) : (
        <div className="space-y-4">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              isExpanded={selectedModule === module.id}
              onToggleExpand={() => setSelectedModule(selectedModule === module.id ? null : module.id)}
              onEdit={() => handleOpenModuleModal(module)}
              onDelete={() => {
                if (confirm(`Êtes-vous sûr de vouloir supprimer le module "${module.title}" ?`)) {
                  deleteModuleMutation.mutate(module.id);
                }
              }}
              onToggleActive={() =>
                toggleModuleActiveMutation.mutate({ id: module.id, isActive: module.is_active })
              }
              onAddLesson={() => handleOpenLessonModal(module.id)}
              onEditLesson={(lesson) => handleOpenLessonModal(module.id, lesson)}
              onDeleteLesson={(lessonId) => {
                if (confirm('Êtes-vous sûr de vouloir supprimer cette leçon ?')) {
                  deleteLessonMutation.mutate(lessonId);
                }
              }}
            />
          ))}
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

      {lessonModalOpen && parentModuleId && (
        <LessonModal
          lesson={editingLesson}
          moduleId={parentModuleId}
          onClose={() => {
            setLessonModalOpen(false);
            setEditingLesson(null);
            setParentModuleId(null);
          }}
          onSave={(data) => {
            lessonSaveMutation.mutate(data);
          }}
          isSaving={lessonSaveMutation.isPending}
        />
      )}
    </div>
  );
}

function ModuleCard({
  module,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleActive,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: {
  module: TrainingModule;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: TrainingLesson) => void;
  onDeleteLesson: (lessonId: string) => void;
}) {
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['admin', 'lessons', module.id],
    queryFn: () => getLessonsForModule(module.id),
    enabled: isExpanded,
  });

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onToggleExpand}
            className="p-2 hover:bg-white/5 rounded-lg transition"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <Video className="w-8 h-8 text-purple-400 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{module.title}</h3>
            <p className="text-sm text-gray-400">Module de formation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleActive}
            className={`p-2 rounded-lg transition ${
              module.is_active
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
            }`}
            title={module.is_active ? 'Désactiver' : 'Activer'}
          >
            {module.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {module.description && (
        <p className="text-sm text-gray-400 ml-12">{module.description}</p>
      )}

      {isExpanded && (
        <div className="ml-12 space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-white">Leçons ({lessons.length})</h4>
            <button
              onClick={onAddLesson}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter une leçon
            </button>
          </div>

          {lessonsLoading ? (
            <p className="text-gray-400 text-sm">Chargement des leçons...</p>
          ) : lessons.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune leçon dans ce module</p>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xs text-gray-500 w-6">{index + 1}</span>
                    <Play className="w-4 h-4 text-purple-400" />
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-white">{lesson.title}</h5>
                      {lesson.bunny_video_id && (
                        <p className="text-xs text-gray-500">Video ID: {lesson.bunny_video_id}</p>
                      )}
                    </div>
                    {lesson.is_preview && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
                        Aperçu
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditLesson(lesson)}
                      className="p-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                      title="Modifier"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteLesson(lesson.id)}
                      className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
    position: module?.position || 0,
    is_active: module?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(module ? { id: module.id } : {}),
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl border border-white/10 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-4">
          {module ? 'Modifier le module' : 'Nouveau module'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Titre *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <input
                type="number"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-8">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded bg-white/5 border-white/10 text-purple-500"
              />
              <label htmlFor="is_active" className="text-sm text-gray-300">
                Module actif
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition text-white disabled:opacity-50"
            >
              {isSaving ? 'Enregistrement...' : module ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LessonModal({
  lesson,
  moduleId,
  onClose,
  onSave,
  isSaving,
}: {
  lesson: TrainingLesson | null;
  moduleId: string;
  onClose: () => void;
  onSave: (data: Partial<TrainingLesson> & { title: string; module_id: string }) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    bunny_video_id: lesson?.bunny_video_id || '',
    position: lesson?.position || 0,
    is_preview: lesson?.is_preview || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(lesson ? { id: lesson.id } : {}),
      ...formData,
      module_id: moduleId,
      bunny_video_id: formData.bunny_video_id || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl border border-white/10 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-4">
          {lesson ? 'Modifier la leçon' : 'Nouvelle leçon'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Titre *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ID Vidéo Bunny Stream
            </label>
            <input
              type="text"
              value={formData.bunny_video_id}
              onChange={(e) => setFormData({ ...formData, bunny_video_id: e.target.value })}
              placeholder="Ex: 9295490a-0072-4752-996d-6f573306318b"
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              L'ID de la vidéo depuis votre bibliothèque Bunny Stream
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <input
                type="number"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-8">
              <input
                type="checkbox"
                id="is_preview"
                checked={formData.is_preview}
                onChange={(e) => setFormData({ ...formData, is_preview: e.target.checked })}
                className="w-4 h-4 rounded bg-white/5 border-white/10 text-purple-500"
              />
              <label htmlFor="is_preview" className="text-sm text-gray-300">
                Leçon en aperçu (gratuite)
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition text-white disabled:opacity-50"
            >
              {isSaving ? 'Enregistrement...' : lesson ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
