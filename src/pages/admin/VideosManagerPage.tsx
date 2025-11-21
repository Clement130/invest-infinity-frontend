import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  RefreshCw,
  Video as VideoIcon,
  AlertCircle,
  CheckCircle2,
  Copy,
  ListVideo,
  Save,
} from 'lucide-react';
import {
  getLessonsWithModules,
  createOrUpdateLesson,
} from '../../services/trainingService';
import type { LessonWithModule } from '../../types/training';

type FeedbackState =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null;

export default function VideosManagerPage() {
  const queryClient = useQueryClient();
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    bunnyVideoId: '',
  });

  const lessonsQuery = useQuery<LessonWithModule[]>({
    queryKey: ['admin', 'lessons-with-modules'],
    queryFn: getLessonsWithModules,
  });

  const lessons = lessonsQuery.data ?? [];

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) ?? null,
    [lessons, selectedLessonId]
  );

  useEffect(() => {
    if (selectedLesson) {
      setFormState({
        title: selectedLesson.title,
        description: selectedLesson.description ?? '',
        bunnyVideoId: selectedLesson.bunny_video_id ?? '',
      });
    } else {
      setFormState({
        title: '',
        description: '',
        bunnyVideoId: '',
      });
    }
  }, [selectedLesson]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const modulesMeta = useMemo(() => {
    const counts = new Map<
      string,
      { id: string; title: string; count: number }
    >();
    lessons.forEach((lesson) => {
      if (!counts.has(lesson.module_id)) {
        counts.set(lesson.module_id, {
          id: lesson.module_id,
          title: lesson.module.title,
          count: 0,
        });
      }
      counts.get(lesson.module_id)!.count += 1;
    });
    return Array.from(counts.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const term = search.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchesModule =
        moduleFilter === 'all' || lesson.module_id === moduleFilter;
      const matchesSearch =
        !term ||
        lesson.title.toLowerCase().includes(term) ||
        lesson.module.title.toLowerCase().includes(term) ||
        lesson.bunny_video_id?.toLowerCase().includes(term);
      return matchesModule && matchesSearch;
    });
  }, [lessons, moduleFilter, search]);

  const groupedLessons = useMemo(() => {
    const map = new Map<
      string,
      { moduleTitle: string; lessons: LessonWithModule[] }
    >();
    filteredLessons.forEach((lesson) => {
      if (!map.has(lesson.module_id)) {
        map.set(lesson.module_id, {
          moduleTitle: lesson.module.title,
          lessons: [],
        });
      }
      map.get(lesson.module_id)!.lessons.push(lesson);
    });
    return Array.from(map.values()).sort((a, b) =>
      a.moduleTitle.localeCompare(b.moduleTitle)
    );
  }, [filteredLessons]);

  const videoLibrary = useMemo(() => {
    const unique = new Map<
      string,
      { videoId: string; lessonTitle: string; moduleTitle: string }
    >();
    lessons.forEach((lesson) => {
      if (lesson.bunny_video_id) {
        unique.set(lesson.bunny_video_id, {
          videoId: lesson.bunny_video_id,
          lessonTitle: lesson.title,
          moduleTitle: lesson.module.title,
        });
      }
    });
    return Array.from(unique.values());
  }, [lessons]);

  const updateLessonMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLesson) return;
      await createOrUpdateLesson({
        id: selectedLesson.id,
        module_id: selectedLesson.module_id,
        title: formState.title.trim() || selectedLesson.title,
        description: formState.description.trim() || null,
        bunny_video_id: formState.bunnyVideoId.trim() || null,
        position: selectedLesson.position,
        is_preview: selectedLesson.is_preview,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'lessons-with-modules'],
      });
      setFeedback({ type: 'success', message: 'Leçon mise à jour avec succès.' });
    },
    onError: (error: any) => {
      console.error(error);
      setFeedback({
        type: 'error',
        message: error?.message || 'Impossible de sauvegarder la leçon.',
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedLesson || updateLessonMutation.isPending) return;
    updateLessonMutation.mutate();
  };

  const handleApplyVideo = (videoId: string) => {
    setFormState((prev) => ({
      ...prev,
      bunnyVideoId: videoId,
    }));
    setFeedback({
      type: 'success',
      message: 'Vidéo sélectionnée pour cette leçon (pensez à sauvegarder).',
    });
  };

  const handleCopyVideoId = async (videoId: string) => {
    try {
      await navigator.clipboard?.writeText(videoId);
      setFeedback({
        type: 'success',
        message: 'ID vidéo copié dans le presse-papiers.',
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        type: 'error',
        message: "Impossible de copier l'ID vidéo.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Gestion intuitive des vidéos
          </h1>
          <p className="text-gray-400">
            Renommez vos leçons et associez facilement chaque vidéo Bunny Stream
            au bon module.
          </p>
        </div>
        <button
          onClick={() => lessonsQuery.refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 hover:border-white/30 text-sm font-medium text-white transition"
        >
          <RefreshCw className="w-4 h-4" />
          Rafraîchir
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
            feedback.type === 'success'
              ? 'border-green-500/30 bg-green-500/10 text-green-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p className="text-sm">{feedback.message}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher un module, une leçon ou un ID vidéo..."
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setModuleFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  moduleFilter === 'all'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                }`}
              >
                Tous ({lessons.length})
              </button>
              {modulesMeta.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setModuleFilter(module.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    moduleFilter === module.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                  }`}
                >
                  {module.title} ({module.count})
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <VideoIcon className="w-4 h-4 text-purple-400" />
              <span>Leçons ({filteredLessons.length})</span>
            </div>

            {groupedLessons.length === 0 ? (
              <p className="text-sm text-gray-400">
                Aucun résultat. Essayez un autre filtre ou mot-clé.
              </p>
            ) : (
              groupedLessons.map((group) => (
                <div key={group.moduleTitle} className="space-y-2">
                  <p className="text-xs uppercase text-gray-500 tracking-wide">
                    {group.moduleTitle}
                  </p>
                  <div className="space-y-1">
                    {group.lessons.map((lesson) => {
                      const isSelected = lesson.id === selectedLessonId;
                      const hasVideo = Boolean(lesson.bunny_video_id);
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                            isSelected
                              ? 'border-purple-500/50 bg-purple-500/10 text-white'
                              : 'border-white/10 bg-black/40 text-gray-300 hover:border-white/30'
                          }`}
                        >
                          <span className="text-sm font-medium">
                            {lesson.title}
                          </span>
                          {hasVideo ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            {selectedLesson ? (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-gray-400">
                      Module :{' '}
                      <span className="text-white font-semibold">
                        {selectedLesson.module.title}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Position #{selectedLesson.position + 1}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLessonId(null)}
                    className="text-xs text-gray-400 hover:text-white transition"
                  >
                    Désélectionner
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Titre de la leçon</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white"
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Description (optionnel)</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white"
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">ID vidéo Bunny Stream</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white tracking-wide"
                    placeholder="ex: 8254f866-0ab0-498c-b1fe-5ef2b66a2ab8"
                    value={formState.bunnyVideoId}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        bunnyVideoId: event.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Copiez-collez l'ID depuis Bunny Stream ou sélectionnez une vidéo
                    existante dans la bibliothèque ci-dessous.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={updateLessonMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 transition disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {updateLessonMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormState({
                        title: selectedLesson.title,
                        description: selectedLesson.description ?? '',
                        bunnyVideoId: selectedLesson.bunny_video_id ?? '',
                      })
                    }
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    Réinitialiser les champs
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <VideoIcon className="w-12 h-12 mx-auto text-purple-400 mb-4" />
                <p>Sélectionnez une leçon dans la colonne de gauche pour la modifier.</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListVideo className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">
                  Bibliothèque des vidéos détectées
                </h3>
              </div>
              <span className="text-xs text-gray-400">
                {videoLibrary.length} vidéo(s) disponibles
              </span>
            </div>

            {videoLibrary.length === 0 ? (
              <p className="text-sm text-gray-400">
                Aucune vidéo enregistrée pour le moment. Associez vos premières vidéos
                via le formulaire ci-dessus.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {videoLibrary.map((video) => (
                  <div
                    key={video.videoId}
                    className="rounded-lg border border-white/10 bg-black/40 p-3 space-y-2"
                  >
                    <p className="text-xs uppercase text-gray-500">
                      {video.moduleTitle}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {video.lessonTitle}
                    </p>
                    <code className="block text-xs text-purple-200 bg-purple-500/10 rounded px-2 py-1 break-all">
                      {video.videoId}
                    </code>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyVideoId(video.videoId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-300 hover:border-white/30 transition"
                      >
                        <Copy className="w-3 h-3" />
                        Copier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyVideo(video.videoId)}
                        className="inline-flex items-center gap-1 rounded-lg bg-purple-500/20 px-2 py-1 text-xs text-purple-200 hover:bg-purple-500/30 transition"
                      >
                        <VideoIcon className="w-3 h-3" />
                        Utiliser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {lessonsQuery.isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Chargement des leçons...
        </div>
      )}
      {lessonsQuery.isError && (
        <div className="flex items-center gap-2 text-sm text-red-300">
          <AlertCircle className="w-4 h-4" />
          Impossible de charger les leçons. Vérifiez votre connexion et réessayez.
        </div>
      )}
    </div>
  );
}


