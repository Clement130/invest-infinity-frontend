import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { VideosDashboard } from '../../components/admin/videos/VideosDashboard';
import { FormationTreeView } from '../../components/admin/videos/FormationTreeView';
import { RealTimeGuide, type GuideState } from '../../components/admin/videos/RealTimeGuide';
import { BunnyUploadZone } from '../../components/admin/videos/BunnyUploadZone';
import { VideoAssignmentWizard } from '../../components/admin/videos/VideoAssignmentWizard';
import { LessonEditPanel } from '../../components/admin/videos/LessonEditPanel';
import { BunnyLibraryModal } from '../../components/admin/videos/BunnyLibraryModal';
import { ModuleModal } from '../../components/admin/videos/ModuleModal';
import { LessonModal } from '../../components/admin/videos/LessonModal';
import { EnvironmentCheck } from '../../components/admin/videos/EnvironmentCheck';
import { EnvDebug } from '../../components/admin/videos/EnvDebug';
import { VideoTutorial } from '../../components/admin/videos/VideoTutorial';
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
    if (confirm('Supprimer ce module et toutes ses leçons ?')) {
      deleteModuleMutation.mutate(moduleId);
    }
  }, [deleteModuleMutation]);

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
        {/* Vérification environnement */}
        <EnvironmentCheck />
        <EnvDebug />

        {/* Dashboard */}
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
              onReorderLessons={handleReorderLessons}
            />
          </div>

          {/* Right: Guide and Edit Panel */}
          <div className="space-y-6">
            <RealTimeGuide state={guideState} context={guideContext} />
            
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
      </div>
    </div>
  );
}

