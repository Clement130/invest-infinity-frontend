import { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Lazy load des composants lourds
const VideosDashboard = lazy(() => import('../../components/admin/videos/VideosDashboard').then(module => ({ default: module.VideosDashboard })));
const FormationTreeView = lazy(() => import('../../components/admin/videos/FormationTreeView').then(module => ({ default: module.FormationTreeView })));
const RealTimeGuide = lazy(() => import('../../components/admin/videos/RealTimeGuide').then(module => ({ default: module.RealTimeGuide })));
const BunnyUploadZone = lazy(() => import('../../components/admin/videos/BunnyUploadZone').then(module => ({ default: module.BunnyUploadZone })));
const VideoAssignmentWizard = lazy(() => import('../../components/admin/videos/VideoAssignmentWizard').then(module => ({ default: module.VideoAssignmentWizard })));
const LessonEditPanel = lazy(() => import('../../components/admin/videos/LessonEditPanel').then(module => ({ default: module.LessonEditPanel })));
const BunnyLibraryModal = lazy(() => import('../../components/admin/videos/BunnyLibraryModal').then(module => ({ default: module.BunnyLibraryModal })));
const ModuleModal = lazy(() => import('../../components/admin/videos/ModuleModal').then(module => ({ default: module.ModuleModal })));
const LessonModal = lazy(() => import('../../components/admin/videos/LessonModal').then(module => ({ default: module.LessonModal })));
const ConfirmDeleteModal = lazy(() => import('../../components/admin/videos/ConfirmDeleteModal').then(module => ({ default: module.ConfirmDeleteModal })));
const EnvironmentCheck = lazy(() => import('../../components/admin/videos/EnvironmentCheck').then(module => ({ default: module.EnvironmentCheck })));
const EnvDebug = lazy(() => import('../../components/admin/videos/EnvDebug').then(module => ({ default: module.EnvDebug })));
const VideoTutorial = lazy(() => import('../../components/admin/videos/VideoTutorial').then(module => ({ default: module.VideoTutorial })));

// Type pour RealTimeGuide
type GuideState = any;
import { useFormationsHierarchy } from '../../hooks/admin/useFormationsHierarchy';
import { useBunnyLibrary } from '../../hooks/admin/useBunnyLibrary';
import { createOrUpdateLesson, deleteLesson, createOrUpdateModule, deleteModule } from '../../services/trainingService';
import type { TrainingLesson, TrainingModule } from '../../types/training';

export default function VideosManagement() {
  const queryClient = useQueryClient();
  const { hierarchy, isLoading: isLoadingHierarchy, refetch } = useFormationsHierarchy();
  const { orphanVideos } = useBunnyLibrary();

  // State management
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [guideState, setGuideState] = useState<GuideState>('idle');
  const [guideContext, setGuideContext] = useState<any>({});
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssignmentWizard, setShowAssignmentWizard] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<TrainingLesson | null>(null);
  const [lessonModalModuleId, setLessonModalModuleId] = useState<string | null>(null);
  const [assignmentVideoId, setAssignmentVideoId] = useState<string | null>(null);
  const [assignmentVideoTitle, setAssignmentVideoTitle] = useState<string | null>(null);
  const [deleteModuleConfirm, setDeleteModuleConfirm] = useState<{ moduleId: string; moduleTitle: string; lessonsCount: number } | null>(null);

  // Auto-expand all modules by default (une seule fois au chargement initial)
  const [hasInitialized, setHasInitialized] = useState(false);
  useMemo(() => {
    if (hierarchy.modules.length > 0 && expandedModules.size === 0 && !hasInitialized) {
      setExpandedModules(new Set(hierarchy.modules.map((m) => m.id)));
      setHasInitialized(true);
    }
  }, [hierarchy.modules, expandedModules.size, hasInitialized]);

  const selectedLesson = useMemo(() => {
    if (!selectedLessonId) return null;
    for (const module of hierarchy.modules) {
      const lesson = module.lessons.find((l) => l.id === selectedLessonId);
      if (lesson) return lesson;
    }
    return null;
  }, [selectedLessonId, hierarchy.modules]);

  const selectedModule = useMemo(() => {
    if (!selectedLesson) return null;
    return hierarchy.modules.find((m) => m.lessons.some((l) => l.id === selectedLesson.id));
  }, [selectedLesson, hierarchy.modules]);

  // Mutations
  const updateLessonMutation = useMutation({
    mutationFn: async (data: Partial<TrainingLesson> & { id: string; module_id?: string; title?: string }) => {
      if (!data.id) throw new Error('ID de leçon requis');
      
      // Trouver la leçon actuelle
      const currentLesson = hierarchy.modules
        .flatMap((m) => m.lessons)
        .find((l) => l.id === data.id);
      
      if (!currentLesson) throw new Error('Leçon non trouvée');
      
      return createOrUpdateLesson({
        id: data.id,
        module_id: data.module_id || currentLesson.module_id,
        title: data.title || currentLesson.title,
        description: data.description ?? currentLesson.description ?? null,
        bunny_video_id: data.bunny_video_id !== undefined ? data.bunny_video_id : currentLesson.bunny_video_id ?? null,
        position: currentLesson.position ?? 0,
        is_preview: data.is_preview ?? currentLesson.is_preview ?? false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'formations-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bunny-library'] });
      toast.success('Leçon mise à jour avec succès');
      setGuideState('success');
      setTimeout(() => setGuideState('idle'), 2000);
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await deleteLesson(lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'formations-hierarchy'] });
      toast.success('Leçon supprimée');
      if (selectedLessonId) setSelectedLessonId(null);
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: Partial<TrainingModule> & { title: string }) => {
      return createOrUpdateModule(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'formations-hierarchy'] });
      toast.success('Module créé avec succès');
      setShowModuleModal(false);
      setEditingModule(null);
      setGuideState('idle');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async (data: Partial<TrainingModule> & { title: string; id: string }) => {
      return createOrUpdateModule(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'formations-hierarchy'] });
      toast.success('Module mis à jour');
      setShowModuleModal(false);
      setEditingModule(null);
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      await deleteModule(moduleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'formations-hierarchy'] });
      toast.success('Module supprimé');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async (data: Partial<TrainingLesson> & { title: string; module_id: string }) => {
      return createOrUpdateLesson(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'formations-hierarchy'] });
      toast.success('Leçon créée avec succès');
      setShowLessonModal(false);
      setEditingLesson(null);
      setLessonModalModuleId(null);
      setGuideState('idle');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const reorderLessonsMutation = useMutation({
    mutationFn: async (lessons: TrainingLesson[]) => {
      // Mettre à jour toutes les positions
      await Promise.all(
        lessons.map((lesson) =>
          createOrUpdateLesson({
            id: lesson.id,
            module_id: lesson.module_id,
            title: lesson.title,
            description: lesson.description ?? null,
            bunny_video_id: lesson.bunny_video_id ?? null,
            position: lesson.position,
            is_preview: lesson.is_preview,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'formations-hierarchy'] });
      toast.success('Ordre des leçons mis à jour');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const reorderModulesMutation = useMutation({
    mutationFn: async (modules: { id: string; position: number }[]) => {
      // Mettre à jour toutes les positions des modules
      await Promise.all(
        modules.map((module) =>
          createOrUpdateModule({
            id: module.id,
            position: module.position,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'formations-hierarchy'] });
      toast.success('Ordre des modules mis à jour');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Handlers
  const handleToggleModule = useCallback((moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }, []);

  const handleSelectLesson = useCallback((lessonId: string) => {
    setSelectedLessonId(lessonId);
    setGuideState('editing');
    const lesson = hierarchy.modules
      .flatMap((m) => m.lessons)
      .find((l) => l.id === lessonId);
    if (lesson) {
      setGuideContext({ lessonTitle: lesson.title });
    }
  }, [hierarchy.modules]);

  const handleEditLesson = useCallback((lesson: TrainingLesson) => {
    setSelectedLessonId(lesson.id);
    setGuideState('editing');
    setGuideContext({ lessonTitle: lesson.title });
  }, []);

  const handleSaveLesson = useCallback(async (data: Partial<TrainingLesson>) => {
    await updateLessonMutation.mutateAsync(data);
  }, [updateLessonMutation]);

  const handleUploadComplete = useCallback((videoId: string, fileName: string) => {
    setAssignmentVideoId(videoId);
    setAssignmentVideoTitle(fileName);
    setShowAssignmentWizard(true);
    setGuideState('assigning');
    setGuideContext({ selectedVideoId: videoId, fileName });
  }, []);

  const handleAssignVideo = useCallback(async (lessonId: string) => {
    if (!assignmentVideoId) return;

    const lesson = hierarchy.modules
      .flatMap((m) => m.lessons)
      .find((l) => l.id === lessonId);
    
    if (!lesson) return;

    await updateLessonMutation.mutateAsync({
      id: lessonId,
      module_id: lesson.module_id,
      title: lesson.title,
      bunny_video_id: assignmentVideoId,
      position: lesson.position,
      is_preview: lesson.is_preview,
    });

    setShowAssignmentWizard(false);
    setAssignmentVideoId(null);
    setAssignmentVideoTitle(null);
    setGuideState('idle');
  }, [assignmentVideoId, updateLessonMutation, hierarchy.modules]);

  const handleReplaceVideo = useCallback((lessonId: string) => {
    setShowUploadModal(true);
    setSelectedLessonId(lessonId);
    setGuideState('uploading');
  }, []);

  const handleOpenLibrary = useCallback(() => {
    setShowLibraryModal(true);
  }, []);

  const handleCreateModule = useCallback(() => {
    setEditingModule(null);
    setShowModuleModal(true);
    setGuideState('creating-formation');
  }, []);

  const handleEditModule = useCallback((module: TrainingModule) => {
    setEditingModule(module);
    setShowModuleModal(true);
  }, []);

  const handleSaveModule = useCallback(async (data: Partial<TrainingModule> & { title: string }) => {
    if (data.id) {
      await updateModuleMutation.mutateAsync(data as Partial<TrainingModule> & { title: string; id: string });
    } else {
      await createModuleMutation.mutateAsync(data);
    }
  }, [createModuleMutation, updateModuleMutation]);

  const handleDeleteModule = useCallback((moduleId: string) => {
    const module = hierarchy.modules.find((m) => m.id === moduleId);
    if (module) {
      setDeleteModuleConfirm({ 
        moduleId, 
        moduleTitle: module.title,
        lessonsCount: module.lessons.length
      });
    }
  }, [hierarchy.modules]);

  const handleConfirmDeleteModule = useCallback(() => {
    if (deleteModuleConfirm) {
      deleteModuleMutation.mutate(deleteModuleConfirm.moduleId, {
        onSuccess: () => {
          setDeleteModuleConfirm(null);
        },
      });
    }
  }, [deleteModuleConfirm, deleteModuleMutation]);

  const handleCreateLesson = useCallback((moduleId: string) => {
    setEditingLesson(null);
    setLessonModalModuleId(moduleId);
    setShowLessonModal(true);
    setGuideState('creating-lesson');
    const module = hierarchy.modules.find((m) => m.id === moduleId);
    if (module) {
      setGuideContext({ moduleTitle: module.title });
    }
  }, [hierarchy.modules]);

  const handleCreateLessonSave = useCallback(async (data: Partial<TrainingLesson> & { title: string; module_id: string }) => {
    await createLessonMutation.mutateAsync(data);
  }, [createLessonMutation]);

  const handleReorderLessons = useCallback((lessons: TrainingLesson[]) => {
    reorderLessonsMutation.mutate(lessons);
  }, [reorderLessonsMutation]);

  const handleReorderModules = useCallback((modules: TrainingModule[]) => {
    reorderModulesMutation.mutate(
      modules.map((m) => ({ id: m.id, position: m.position ?? 0 }))
    );
  }, [reorderModulesMutation]);

  const handleSelectVideoFromLibrary = useCallback((videoId: string) => {
    if (selectedLessonId) {
      updateLessonMutation.mutate({
        id: selectedLessonId,
        bunny_video_id: videoId,
      });
    }
  }, [selectedLessonId, updateLessonMutation]);

  const handleRemoveVideo = useCallback(async () => {
    if (!selectedLesson) return;
    await updateLessonMutation.mutateAsync({
      id: selectedLesson.id,
      bunny_video_id: null,
    });
  }, [selectedLesson, updateLessonMutation]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Vérification environnement (debug désactivé en prod) */}
        {import.meta.env.DEV && <EnvironmentCheck />}
        {import.meta.env.DEV && <EnvDebug />}

        {/* Dashboard */}
        <Suspense fallback={<div className="bg-white rounded-lg shadow p-6"><div className="animate-pulse h-48 bg-gray-200 rounded"></div></div>}>
          <VideosDashboard
            hierarchy={hierarchy}
            orphanVideosCount={orphanVideos.length}
            isLoading={isLoadingHierarchy}
            onNewFormation={handleCreateModule}
            onUpload={() => {
              setShowUploadModal(true);
              setGuideState('uploading');
            }}
          onAssignOrphans={() => {
            setShowLibraryModal(true);
            setGuideContext({ filterOrphans: true });
          }}
          onShowTutorial={() => setShowTutorial(true)}
          />
        </Suspense>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Tree view */}
          <div className="lg:col-span-2 space-y-6">
            {showUploadModal && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <BunnyUploadZone
                  onUploadComplete={handleUploadComplete}
                  multiple={false}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setGuideState('idle');
                    }}
                    className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}

            {showAssignmentWizard && assignmentVideoId && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <VideoAssignmentWizard
                  videoId={assignmentVideoId}
                  videoTitle={assignmentVideoTitle || undefined}
                  modules={hierarchy.modules}
                  onAssign={handleAssignVideo}
                  onCancel={() => {
                    setShowAssignmentWizard(false);
                    setAssignmentVideoId(null);
                    setAssignmentVideoTitle(null);
                    setGuideState('idle');
                  }}
                />
              </div>
            )}

            <Suspense fallback={<div className="bg-white rounded-lg shadow p-6"><div className="animate-pulse h-96 bg-gray-200 rounded"></div></div>}>
              <FormationTreeView
                modules={hierarchy.modules}
                selectedLessonId={selectedLessonId}
                selectedLessons={selectedLessons}
                expandedModules={expandedModules}
                onToggleModule={handleToggleModule}
                onSelectLesson={handleSelectLesson}
                onEditLesson={handleEditLesson}
                onDeleteLesson={(id) => {
                  if (confirm('Supprimer cette leçon ?')) {
                    deleteLessonMutation.mutate(id);
                  }
                }}
                onReplaceVideo={handleReplaceVideo}
                onAssignVideo={(id) => {
                  setShowLibraryModal(true);
                  setSelectedLessonId(id);
                }}
                onAddModule={handleCreateModule}
                onAddLesson={handleCreateLesson}
                onEditModule={handleEditModule}
                onDeleteModule={handleDeleteModule}
                onReorderLessons={handleReorderLessons}
                onReorderModules={handleReorderModules}
              />
            </Suspense>
          </div>

          {/* Right: Guide and Edit Panel */}
          <div className="space-y-6">
            <Suspense fallback={<div className="bg-white rounded-lg shadow p-6"><div className="animate-pulse h-32 bg-gray-200 rounded"></div></div>}>
              <RealTimeGuide state={guideState} context={guideContext} />
            </Suspense>
            
            <LessonEditPanel
              lesson={selectedLesson}
              moduleTitle={selectedModule?.title}
              onClose={() => {
                setSelectedLessonId(null);
                setGuideState('idle');
              }}
              onSave={handleSaveLesson}
              onUploadVideo={() => {
                setShowUploadModal(true);
                setGuideState('uploading');
              }}
              onReplaceVideo={() => {
                if (selectedLesson) handleReplaceVideo(selectedLesson.id);
              }}
              onRemoveVideo={handleRemoveVideo}
            />
          </div>
        </div>

        {/* Library Modal */}
        <BunnyLibraryModal
          isOpen={showLibraryModal}
          onClose={() => {
            setShowLibraryModal(false);
            setGuideState('idle');
          }}
          onSelectVideo={handleSelectVideoFromLibrary}
          onAssignVideo={(videoId) => {
            if (selectedLessonId) {
              handleAssignVideo(selectedLessonId);
            }
          }}
          selectedLessonTitle={selectedLesson?.title}
        />

        {/* Module Modal */}
        <ModuleModal
          module={editingModule}
          isOpen={showModuleModal}
          onClose={() => {
            setShowModuleModal(false);
            setEditingModule(null);
            setGuideState('idle');
          }}
          onSave={handleSaveModule}
          isSaving={createModuleMutation.isPending || updateModuleMutation.isPending}
        />

        {/* Lesson Modal */}
        <LessonModal
          lesson={editingLesson}
          moduleId={lessonModalModuleId || ''}
          isOpen={showLessonModal}
          onClose={() => {
            setShowLessonModal(false);
            setEditingLesson(null);
            setLessonModalModuleId(null);
            setGuideState('idle');
          }}
          onSave={handleCreateLessonSave}
          isSaving={createLessonMutation.isPending}
        />

        {/* Tutorial Modal */}
        {showTutorial && (
          <VideoTutorial onClose={() => setShowTutorial(false)} />
        )}

        {/* Confirm Delete Module Modal */}
        <ConfirmDeleteModal
          isOpen={!!deleteModuleConfirm}
          onClose={() => setDeleteModuleConfirm(null)}
          onConfirm={handleConfirmDeleteModule}
          title="Supprimer le module"
          message={
            deleteModuleConfirm?.lessonsCount && deleteModuleConfirm.lessonsCount > 0
              ? `Êtes-vous sûr de vouloir supprimer ce module ? Les ${deleteModuleConfirm.lessonsCount} leçon${deleteModuleConfirm.lessonsCount > 1 ? 's' : ''} associée${deleteModuleConfirm.lessonsCount > 1 ? 's' : ''} seront également supprimée${deleteModuleConfirm.lessonsCount > 1 ? 's' : ''}.`
              : 'Êtes-vous sûr de vouloir supprimer ce module ?'
          }
          itemName={deleteModuleConfirm?.moduleTitle}
          isDeleting={deleteModuleMutation.isPending}
        />
      </div>
    </div>
  );
}

