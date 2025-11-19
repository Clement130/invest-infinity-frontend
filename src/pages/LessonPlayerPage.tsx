import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { getModuleWithLessons, getLessonById } from '../services/trainingService';
import type { TrainingLesson } from '../types/training';
import BunnyPlayer from '../components/training/BunnyPlayer';

export default function LessonPlayerPage() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<TrainingLesson | null>(null);
  const [allLessons, setAllLessons] = useState<TrainingLesson[]>([]);
  const [moduleTitle, setModuleTitle] = useState<string>('Module');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLesson = async () => {
      if (!moduleId || !lessonId) {
        setError('Module ID ou Lesson ID manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Option 1: Charger le module avec toutes les leçons
        const moduleData = await getModuleWithLessons(moduleId);
        if (!moduleData) {
          setError('Module introuvable');
          setLoading(false);
          return;
        }

        setModuleTitle(moduleData.module.title);
        setAllLessons(moduleData.lessons);

        // Trouver la leçon courante
        const currentLesson = moduleData.lessons.find((l) => l.id === lessonId);
        if (!currentLesson) {
          // Option 2: Essayer de charger directement la leçon
          const directLesson = await getLessonById(lessonId);
          if (!directLesson) {
            setError('Leçon introuvable');
            setLoading(false);
            return;
          }
          setLesson(directLesson);
        } else {
          setLesson(currentLesson);
        }
      } catch (err) {
        console.error('Erreur lors du chargement de la leçon:', err);
        setError('Erreur lors du chargement de la leçon');
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [moduleId, lessonId]);

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
          <p className="text-gray-400">Chargement de la leçon...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <p className="text-xl text-gray-300">{error || 'Leçon introuvable'}</p>
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
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white py-8 px-4">
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
          <BunnyPlayer videoId={lesson.bunny_video_id || ''} />
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


