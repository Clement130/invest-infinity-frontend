import { useMemo, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getModuleWithLessons, getLessonById } from '../services/trainingService';
import type { TrainingLesson } from '../types/training';
import BunnyPlayer from '../components/training/BunnyPlayer';
import { VideoPlayerSkeleton } from '../components/common/Skeleton';
import { useSession } from '../hooks/useSession';
import { useToast } from '../hooks/useToast';
import { useEntitlements } from '../hooks/useEntitlements';
import { markLessonAsCompleted } from '../services/progressTrackingService';
import type { VideoProgressEvent } from '../services/progressTrackingService';
import { PROGRESS_KEYS } from '../hooks/useTraining';

export default function LessonPlayerPage() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user, role } = useSession();
  const entitlements = useEntitlements();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Vérifier si l'utilisateur est admin ou developer
  const isAdmin = role === 'admin' || role === 'developer';

  // Logging pour le débogage
  useEffect(() => {
    console.log('[LessonPlayerPage] Initialisation:', { moduleId, lessonId, userId: user?.id });
  }, [moduleId, lessonId, user?.id]);

  const moduleQuery = useQuery({
    queryKey: ['module-with-lessons', moduleId],
    enabled: Boolean(moduleId),
    queryFn: () => getModuleWithLessons(moduleId!),
    onError: (error) => {
      console.error('[LessonPlayerPage] Erreur moduleQuery:', error);
    },
    onSuccess: (data) => {
      console.log('[LessonPlayerPage] Module chargé:', { 
        moduleTitle: data?.module.title, 
        lessonsCount: data?.lessons.length 
      });
    },
  });

  const lessonQuery = useQuery({
    queryKey: ['lesson', lessonId],
    enabled: Boolean(lessonId) && !moduleQuery.data?.lessons?.find((l) => l.id === lessonId),
    queryFn: () => getLessonById(lessonId!),
    onError: (error) => {
      console.error('[LessonPlayerPage] Erreur lessonQuery:', error);
    },
    onSuccess: (data) => {
      console.log('[LessonPlayerPage] Leçon chargée:', { 
        lessonTitle: data?.title, 
        videoId: data?.bunny_video_id 
      });
    },
  });

  const lesson = useMemo<TrainingLesson | null>(() => {
    if (moduleQuery.data) {
      const found = moduleQuery.data.lessons.find((l) => l.id === lessonId);
      if (!found) {
        console.warn('[LessonPlayerPage] Leçon non trouvée dans les leçons du module:', lessonId);
      }
      return found ?? null;
    }

    return lessonQuery.data ?? null;
  }, [lessonId, lessonQuery.data, moduleQuery.data]);

  // Log quand la leçon change
  useEffect(() => {
    if (lesson) {
      console.log('[LessonPlayerPage] Leçon disponible:', {
        id: lesson.id,
        title: lesson.title,
        videoId: lesson.bunny_video_id,
      });
    } else if (!moduleQuery.isLoading && !lessonQuery.isLoading) {
      console.warn('[LessonPlayerPage] Aucune leçon disponible après chargement');
    }
  }, [lesson, moduleQuery.isLoading, lessonQuery.isLoading]);

  // Vérifier l'accès au module (sauf pour les admins)
  useEffect(() => {
    if (!isAdmin && moduleQuery.data?.module && !entitlements.hasModuleAccess(moduleQuery.data.module)) {
      toast.error('Vous n\'avez pas accès à ce module. Veuillez mettre à niveau votre offre.');
      navigate('/app');
    }
  }, [moduleQuery.data?.module, entitlements, isAdmin, navigate, toast]);

  const allLessons = moduleQuery.data?.lessons ?? [];
  const moduleTitle = moduleQuery.data?.module.title ?? 'Module';

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  const isLoading = moduleQuery.isLoading || lessonQuery.isLoading;
  
  // Amélioration de la détection d'erreur
  const hasError =
    !moduleId || 
    !lessonId || 
    moduleQuery.isError || 
    lessonQuery.isError || 
    (!isLoading && !moduleQuery.data && !lessonQuery.data) ||
    (!isLoading && moduleQuery.data && !lesson);
  
  const errorMessage = !moduleId || !lessonId 
    ? 'Module ID ou Lesson ID manquant' 
    : moduleQuery.isError || lessonQuery.isError
    ? 'Erreur lors du chargement des données'
    : !lesson
    ? 'Leçon introuvable'
    : 'Erreur inconnue';

  const handlePreviousLesson = () => {
    if (previousLesson && moduleId) {
      navigate(`/app/modules/${moduleId}/lessons/${previousLesson.id}`);
    }
  };

  const handleNextLesson = () => {
    if (nextLesson && moduleId) {
      navigate(`/app/modules/${moduleId}/lessons/${nextLesson.id}`);
    }
  };

  const [isCompleted, setIsCompleted] = useState(false);
  // Ref pour éviter le spam de notifications (les closures ne voient pas les mises à jour de state)
  const hasShownCompletionToastRef = useRef(false);

  // Réinitialiser quand on change de leçon
  useEffect(() => {
    setIsCompleted(false);
    hasShownCompletionToastRef.current = false;
  }, [lessonId]);

  // Mutation pour marquer comme complétée manuellement
  const markCompletedMutation = useMutation({
    mutationFn: () => markLessonAsCompleted(user!.id, lessonId!),
    onSuccess: () => {
      setIsCompleted(true);
      toast.success('Leçon marquée comme complétée ! 🎉', { duration: 3000 });
      // Invalider le cache de progression
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.summary(user.id) });
        queryClient.invalidateQueries({ queryKey: ['member-progress', user.id] });
        queryClient.invalidateQueries({ queryKey: ['member-stats', user.id] });
      }
    },
    onError: (error: any) => {
      toast.error('Erreur lors du marquage de la leçon', { duration: 3000 });
      console.error('[LessonPlayerPage] Erreur markCompleted:', error);
    },
  });

  const handleProgress = async (event: VideoProgressEvent) => {
    // Ne rien faire si déjà complétée (éviter les appels inutiles)
    if (hasShownCompletionToastRef.current) return;
    
    // Marquer comme complétée silencieusement quand 90% atteint (pas de toast - trop de spam)
    if (user?.id && event.percentage >= 90) {
      hasShownCompletionToastRef.current = true;
      setIsCompleted(true);
      // Invalider le cache pour mettre à jour l'UI
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.summary(user.id) });
      queryClient.invalidateQueries({ queryKey: ['member-progress', user.id] });
      queryClient.invalidateQueries({ queryKey: ['member-stats', user.id] });
    }
  };

  const handleMarkAsCompleted = () => {
    if (user?.id && lessonId && !isCompleted) {
      markCompletedMutation.mutate();
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-b from-black via-slate-950 to-black text-white -m-6 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <VideoPlayerSkeleton />
          <div className="space-y-4">
            <div className="h-8 bg-white/10 rounded-lg w-3/4 animate-pulse" />
            <div className="h-4 bg-white/10 rounded-lg w-full animate-pulse" />
            <div className="h-4 bg-white/10 rounded-lg w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur ou leçon introuvable
  if (hasError || !lesson) {
    return (
      <div className="w-full min-h-[60vh] bg-gradient-to-b from-black via-slate-950 to-black text-white -m-6 flex items-center justify-center px-4 py-16">
        <div className="text-center space-y-6 max-w-md">
          <p className="text-xl text-gray-300">{errorMessage}</p>
          {moduleQuery.data && (
            <p className="text-sm text-gray-500">
              Module: {moduleQuery.data.module.title}
            </p>
          )}
          <button
            onClick={() => navigate(moduleId ? `/app/modules/${moduleId}` : '/app')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 hover:border-pink-500/50 transition font-medium text-pink-300 hover:text-pink-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au module
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-black via-slate-950 to-black text-white -m-6 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Fil d'Ariane */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate(moduleId ? `/app/modules/${moduleId}` : '/app')}
            className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au module
          </button>
          <span className="text-gray-600">•</span>
          <span className="text-gray-400">{moduleTitle}</span>
        </div>

        {/* Lecteur vidéo */}
        <div className="space-y-4">
          <BunnyPlayer
            videoId={lesson.bunny_video_id || ''}
            userId={user?.id}
            lessonId={lessonId}
            onProgress={handleProgress}
          />
        </div>

        {/* Informations de la leçon */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-gray-300 leading-relaxed">{lesson.description}</p>
            )}
          </div>

          {/* Navigation entre leçons */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/10">
            <button
              onClick={handlePreviousLesson}
              disabled={!previousLesson}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
                previousLesson
                  ? 'bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-300 hover:text-pink-200 cursor-pointer'
                  : 'bg-gray-500/10 border border-gray-500/20 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Leçon précédente
            </button>

            <div className="flex-1" />

            <button
              onClick={handleNextLesson}
              disabled={!nextLesson}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
                nextLesson
                  ? 'bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 hover:border-pink-500/50 text-pink-300 hover:text-pink-200 cursor-pointer'
                  : 'bg-gray-500/10 border border-gray-500/20 text-gray-500 cursor-not-allowed'
              }`}
            >
              Leçon suivante
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


