import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { getModuleWithLessons } from '../services/trainingService';
import type { ModuleWithLessons } from '../types/training';

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ModuleWithLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!moduleId) {
      setError('Module ID manquant');
      setLoading(false);
      return;
    }

    const loadModule = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getModuleWithLessons(moduleId);
        if (!result) {
          setError('Module introuvable');
        } else {
          setData(result);
        }
      } catch (err) {
        console.error('Erreur lors du chargement du module:', err);
        setError('Erreur lors du chargement du module');
      } finally {
        setLoading(false);
      }
    };

    loadModule();
  }, [moduleId]);

  const handleLessonClick = (lessonId: string) => {
    navigate(`/app/modules/${moduleId}/lessons/${lessonId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
          <p className="text-gray-400">Chargement du module...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <p className="text-xl text-gray-300">{error || 'Module introuvable'}</p>
          <button
            onClick={() => navigate('/app')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 hover:border-pink-500/50 transition font-medium text-pink-300 hover:text-pink-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Revenir à l'espace formation
          </button>
        </div>
      </div>
    );
  }

  const { module, lessons } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Bouton retour */}
        <button
          onClick={() => navigate('/app')}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux modules
        </button>

        {/* En-tête du module */}
        <header className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-4xl font-bold">{module.title}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                module.is_active
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}
            >
              {module.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <p className="text-gray-400">
            {lessons.length} {lessons.length === 1 ? 'leçon' : 'leçons'}
          </p>
        </header>

        {/* Description */}
        {module.description && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">À propos de ce module</h2>
            <p className="text-gray-300 leading-relaxed">{module.description}</p>
          </section>
        )}

        {/* Liste des leçons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Leçons</h2>
          {lessons.length === 0 ? (
            <p className="text-gray-400">Aucune leçon disponible pour ce module.</p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  onClick={() => handleLessonClick(lesson.id)}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900/50 via-slate-950/50 to-black border border-white/5 hover:border-pink-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/20 cursor-pointer"
                >
                  {/* Glow effect au hover */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                  <div className="relative p-6 flex items-center gap-4">
                    {/* Numéro de leçon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500/20 to-pink-800/20 border border-pink-500/30 flex items-center justify-center text-lg font-bold text-pink-300">
                      {index + 1}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-white group-hover:text-pink-200 transition-colors">
                          {lesson.title}
                        </h3>
                        {lesson.is_preview && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            Preview
                          </span>
                        )}
                      </div>
                      {lesson.description && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {lesson.description}
                        </p>
                      )}
                    </div>

                    {/* Icône play */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-pink-500/20 group-hover:bg-pink-500/30 border border-pink-500/30 flex items-center justify-center transition-colors">
                        <Play className="w-5 h-5 text-pink-300" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


