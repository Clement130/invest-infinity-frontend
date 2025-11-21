import { useEffect, useMemo, useState, useCallback } from 'react';
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
  Filter,
  SortAsc,
  SortDesc,
  Edit2,
  X,
  Check,
  Plus,
  Trash2,
  Download,
  Upload,
  ExternalLink,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  BarChart3,
} from 'lucide-react';
import {
  getLessonsWithModules,
  createOrUpdateLesson,
  deleteLesson,
} from '../../services/trainingService';
import type { LessonWithModule } from '../../types/training';
import VideoUploadModal from '../../components/admin/VideoUploadModal';

type FeedbackState =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null;

type SortField = 'title' | 'module' | 'video' | 'position';
type SortDirection = 'asc' | 'desc';
type VideoFilter = 'all' | 'with-video' | 'without-video';

export default function VideosManagerPage() {
  const queryClient = useQueryClient();
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [videoFilter, setVideoFilter] = useState<VideoFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('position');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [compactMode, setCompactMode] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    bunnyVideoId: '',
  });
  const [inlineEditState, setInlineEditState] = useState<{
    id: string;
    title: string;
    bunnyVideoId: string;
  } | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const lessonsQuery = useQuery<LessonWithModule[]>({
    queryKey: ['admin', 'lessons-with-modules'],
    queryFn: getLessonsWithModules,
  });

  const lessons = lessonsQuery.data ?? [];

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId) ?? null,
    [lessons, selectedLessonId]
  );

  // Statistiques
  const stats = useMemo(() => {
    const total = lessons.length;
    const withVideo = lessons.filter((l) => l.bunny_video_id).length;
    const withoutVideo = total - withVideo;
    const completionRate = total > 0 ? Math.round((withVideo / total) * 100) : 0;
    return { total, withVideo, withoutVideo, completionRate };
  }, [lessons]);

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

  // Auto-expand tous les modules par défaut
  useEffect(() => {
    if (lessons.length > 0 && expandedModules.size === 0) {
      const moduleIds = new Set(lessons.map((l) => l.module_id));
      setExpandedModules(moduleIds);
    }
  }, [lessons, expandedModules.size]);

  const modulesMeta = useMemo(() => {
    const counts = new Map<
      string,
      { id: string; title: string; count: number; withVideo: number }
    >();
    lessons.forEach((lesson) => {
      if (!counts.has(lesson.module_id)) {
        counts.set(lesson.module_id, {
          id: lesson.module_id,
          title: lesson.module.title,
          count: 0,
          withVideo: 0,
        });
      }
      const module = counts.get(lesson.module_id)!;
      module.count += 1;
      if (lesson.bunny_video_id) module.withVideo += 1;
    });
    return Array.from(counts.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const term = search.trim().toLowerCase();
    let filtered = lessons.filter((lesson) => {
      const matchesModule =
        moduleFilter === 'all' || lesson.module_id === moduleFilter;
      const matchesVideo =
        videoFilter === 'all' ||
        (videoFilter === 'with-video' && Boolean(lesson.bunny_video_id)) ||
        (videoFilter === 'without-video' && !lesson.bunny_video_id);
      const matchesSearch =
        !term ||
        lesson.title.toLowerCase().includes(term) ||
        lesson.module.title.toLowerCase().includes(term) ||
        lesson.bunny_video_id?.toLowerCase().includes(term) ||
        lesson.description?.toLowerCase().includes(term);
      return matchesModule && matchesVideo && matchesSearch;
    });

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'module':
          comparison = a.module.title.localeCompare(b.module.title);
          break;
        case 'video':
          comparison = (a.bunny_video_id || '').localeCompare(b.bunny_video_id || '');
          break;
        case 'position':
          comparison = (a.position ?? 0) - (b.position ?? 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [lessons, moduleFilter, videoFilter, search, sortField, sortDirection]);

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
      { videoId: string; lessonTitle: string; moduleTitle: string; count: number }
    >();
    lessons.forEach((lesson) => {
      if (lesson.bunny_video_id) {
        if (!unique.has(lesson.bunny_video_id)) {
          unique.set(lesson.bunny_video_id, {
            videoId: lesson.bunny_video_id,
            lessonTitle: lesson.title,
            moduleTitle: lesson.module.title,
            count: 0,
          });
        }
        unique.get(lesson.bunny_video_id)!.count += 1;
      }
    });
    return Array.from(unique.values()).sort((a, b) =>
      a.lessonTitle.localeCompare(b.lessonTitle)
    );
  }, [lessons]);

  // Validation UUID
  const isValidVideoId = useCallback((id: string) => {
    if (!id.trim()) return true; // Vide est valide (pas de vidéo)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id.trim());
  }, []);

  const updateLessonMutation = useMutation({
    mutationFn: async (payload?: {
      id: string;
      title?: string;
      description?: string;
      bunnyVideoId?: string;
    }) => {
      const lesson = payload
        ? lessons.find((l) => l.id === payload.id)
        : selectedLesson;
      if (!lesson) return;

      const updateData = payload
        ? {
            id: payload.id,
            module_id: lesson.module_id,
            title: payload.title ?? lesson.title,
            description: payload.description ?? lesson.description ?? null,
            bunny_video_id: payload.bunnyVideoId ?? lesson.bunny_video_id ?? null,
            position: lesson.position,
            is_preview: lesson.is_preview,
          }
        : {
            id: lesson.id,
            module_id: lesson.module_id,
            title: formState.title.trim() || lesson.title,
            description: formState.description.trim() || null,
            bunny_video_id: formState.bunnyVideoId.trim() || null,
            position: lesson.position,
            is_preview: lesson.is_preview,
          };

      await createOrUpdateLesson(updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'lessons-with-modules'],
      });
      setFeedback({ type: 'success', message: 'Leçon mise à jour avec succès.' });
      setEditingLessonId(null);
      setInlineEditState(null);
    },
    onError: (error: any) => {
      console.error(error);
      setFeedback({
        type: 'error',
        message: error?.message || 'Impossible de sauvegarder la leçon.',
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const updates = Array.from(selectedLessons).map((lessonId) => {
        const lesson = lessons.find((l) => l.id === lessonId);
        if (!lesson) return null;
        return createOrUpdateLesson({
          id: lesson.id,
          module_id: lesson.module_id,
          title: lesson.title,
          description: lesson.description ?? null,
          bunny_video_id: videoId || null,
          position: lesson.position,
          is_preview: lesson.is_preview,
        });
      });
      await Promise.all(updates.filter(Boolean));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'lessons-with-modules'],
      });
      setFeedback({
        type: 'success',
        message: `${selectedLessons.size} leçon(s) mise(s) à jour avec succès.`,
      });
      setSelectedLessons(new Set());
    },
    onError: (error: any) => {
      setFeedback({
        type: 'error',
        message: error?.message || 'Impossible de mettre à jour les leçons.',
      });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteLesson(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'lessons-with-modules'],
      });
      setFeedback({ type: 'success', message: 'Leçon supprimée avec succès.' });
      if (selectedLessonId === id) setSelectedLessonId(null);
    },
    onError: (error: any) => {
      setFeedback({
        type: 'error',
        message: error?.message || 'Impossible de supprimer la leçon.',
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedLesson || updateLessonMutation.isPending) return;
    if (!isValidVideoId(formState.bunnyVideoId)) {
      setFeedback({
        type: 'error',
        message: "Format d'ID vidéo invalide. Utilisez un UUID valide.",
      });
      return;
    }
    updateLessonMutation.mutate();
  };

  const handleInlineEdit = (lesson: LessonWithModule) => {
    setInlineEditState({
      id: lesson.id,
      title: lesson.title,
      bunnyVideoId: lesson.bunny_video_id ?? '',
    });
    setEditingLessonId(lesson.id);
  };

  const handleInlineSave = (lessonId: string) => {
    if (!inlineEditState || inlineEditState.id !== lessonId) return;
    if (!isValidVideoId(inlineEditState.bunnyVideoId)) {
      setFeedback({
        type: 'error',
        message: "Format d'ID vidéo invalide.",
      });
      return;
    }
    updateLessonMutation.mutate({
      id: lessonId,
      title: inlineEditState.title,
      bunnyVideoId: inlineEditState.bunnyVideoId,
    });
  };

  const handleInlineCancel = () => {
    setInlineEditState(null);
    setEditingLessonId(null);
  };

  const handleApplyVideo = (videoId: string) => {
    if (selectedLessons.size > 0) {
      // Action en masse
      bulkUpdateMutation.mutate(videoId);
    } else if (selectedLesson) {
      // Action sur une seule leçon
      setFormState((prev) => ({
        ...prev,
        bunnyVideoId: videoId,
      }));
      setFeedback({
        type: 'success',
        message: 'Vidéo sélectionnée pour cette leçon (pensez à sauvegarder).',
      });
    }
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

  const handleToggleSelect = (lessonId: string) => {
    setSelectedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedLessons.size === filteredLessons.length) {
      setSelectedLessons(new Set());
    } else {
      setSelectedLessons(new Set(filteredLessons.map((l) => l.id)));
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompactMode(!compactMode)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 hover:border-white/30 text-sm font-medium text-white transition"
            title={compactMode ? 'Mode étendu' : 'Mode compact'}
          >
            {compactMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {compactMode ? 'Étendu' : 'Compact'}
          </button>
          <button
            onClick={() => lessonsQuery.refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 hover:border-white/30 text-sm font-medium text-white transition"
          >
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs">Avec vidéo</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.withVideo}</p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Sans vidéo</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.withoutVideo}</p>
        </div>
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <Layers className="w-4 h-4" />
            <span className="text-xs">Taux de complétion</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.completionRate}%</p>
        </div>
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

      {/* Actions en masse */}
      {selectedLessons.size > 0 && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-purple-300">
              <strong>{selectedLessons.size}</strong> leçon(s) sélectionnée(s)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedLessons(new Set())}
                className="text-xs text-gray-400 hover:text-white transition"
              >
                Tout désélectionner
              </button>
              <button
                onClick={() => bulkUpdateMutation.mutate('')}
                disabled={bulkUpdateMutation.isPending}
                className="text-xs text-red-400 hover:text-red-300 transition"
              >
                Retirer les vidéos
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Filtres et liste */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher un module, une leçon ou un ID vidéo..."
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {/* Filtres */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Filter className="w-3 h-3" />
                <span>Filtres</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setVideoFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    videoFilter === 'all'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setVideoFilter('with-video')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    videoFilter === 'with-video'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                  }`}
                >
                  Avec vidéo
                </button>
                <button
                  onClick={() => setVideoFilter('without-video')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    videoFilter === 'without-video'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                  }`}
                >
                  Sans vidéo
                </button>
              </div>
            </div>

            {/* Filtres modules */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Layers className="w-3 h-3" />
                <span>Modules</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
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
                    title={`${module.withVideo}/${module.count} avec vidéo`}
                  >
                    {module.title} ({module.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Tri */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <SortAsc className="w-3 h-3" />
                <span>Tri</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['title', 'module', 'video', 'position'] as SortField[]).map(
                  (field) => (
                    <button
                      key={field}
                      onClick={() => handleSort(field)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1 ${
                        sortField === field
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      {field === 'title' && 'Titre'}
                      {field === 'module' && 'Module'}
                      {field === 'video' && 'Vidéo'}
                      {field === 'position' && 'Position'}
                      {sortField === field &&
                        (sortDirection === 'asc' ? (
                          <SortAsc className="w-3 h-3" />
                        ) : (
                          <SortDesc className="w-3 h-3" />
                        ))}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Liste des leçons */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <VideoIcon className="w-4 h-4 text-purple-400" />
                <span>Leçons ({filteredLessons.length})</span>
              </div>
              {filteredLessons.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-gray-400 hover:text-white transition"
                >
                  {selectedLessons.size === filteredLessons.length
                    ? 'Tout désélectionner'
                    : 'Tout sélectionner'}
                </button>
              )}
            </div>

            {groupedLessons.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Aucun résultat. Essayez un autre filtre ou mot-clé.
              </p>
            ) : (
              groupedLessons.map((group) => {
                const moduleId = group.lessons[0]?.module_id || '';
                const isExpanded = expandedModules.has(moduleId);
                const moduleStats = modulesMeta.find((m) => m.id === moduleId);

                return (
                  <div key={group.moduleTitle} className="space-y-2">
                    <button
                      onClick={() => toggleModule(moduleId)}
                      className="w-full flex items-center justify-between text-xs uppercase text-gray-500 tracking-wide hover:text-gray-400 transition"
                    >
                      <span className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronUp className="w-3 h-3" />
                        )}
                        {group.moduleTitle}
                        {moduleStats && (
                          <span className="text-purple-400">
                            ({moduleStats.withVideo}/{moduleStats.count})
                          </span>
                        )}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="space-y-1 pl-4">
                        {group.lessons.map((lesson) => {
                          const isSelected = lesson.id === selectedLessonId;
                          const isEditing = editingLessonId === lesson.id;
                          const isMultiSelected = selectedLessons.has(lesson.id);
                          const hasVideo = Boolean(lesson.bunny_video_id);

                          if (isEditing && inlineEditState) {
                            return (
                              <div
                                key={lesson.id}
                                className="rounded-lg border border-purple-500/50 bg-purple-500/10 p-2 space-y-2"
                              >
                                <input
                                  type="text"
                                  value={inlineEditState.title}
                                  onChange={(e) =>
                                    setInlineEditState({
                                      ...inlineEditState,
                                      title: e.target.value,
                                    })
                                  }
                                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                  placeholder="Titre"
                                  autoFocus
                                />
                                <input
                                  type="text"
                                  value={inlineEditState.bunnyVideoId}
                                  onChange={(e) =>
                                    setInlineEditState({
                                      ...inlineEditState,
                                      bunnyVideoId: e.target.value,
                                    })
                                  }
                                  className={`w-full bg-black/40 border rounded px-2 py-1 text-xs font-mono text-white ${
                                    inlineEditState.bunnyVideoId &&
                                    !isValidVideoId(inlineEditState.bunnyVideoId)
                                      ? 'border-red-500/50'
                                      : 'border-white/10'
                                  }`}
                                  placeholder="ID vidéo (UUID)"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleInlineSave(lesson.id)}
                                    className="flex-1 flex items-center justify-center gap-1 rounded bg-green-500/20 text-green-300 px-2 py-1 text-xs hover:bg-green-500/30 transition"
                                  >
                                    <Check className="w-3 h-3" />
                                    Sauver
                                  </button>
                                  <button
                                    onClick={handleInlineCancel}
                                    className="flex-1 flex items-center justify-center gap-1 rounded bg-red-500/20 text-red-300 px-2 py-1 text-xs hover:bg-red-500/30 transition"
                                  >
                                    <X className="w-3 h-3" />
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={lesson.id}
                              className={`group relative flex items-center gap-2 rounded-lg border px-3 py-2 transition ${
                                isSelected
                                  ? 'border-purple-500/50 bg-purple-500/10'
                                  : isMultiSelected
                                  ? 'border-purple-500/30 bg-purple-500/5'
                                  : 'border-white/10 bg-black/40 hover:border-white/30'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isMultiSelected}
                                onChange={() => handleToggleSelect(lesson.id)}
                                className="w-4 h-4 rounded border-white/20 text-purple-500 focus:ring-purple-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                onClick={() => setSelectedLessonId(lesson.id)}
                                className="flex-1 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  {!compactMode && (
                                    <GripVertical className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition" />
                                  )}
                                  <span
                                    className={`text-sm font-medium ${
                                      isSelected ? 'text-white' : 'text-gray-300'
                                    }`}
                                  >
                                    {lesson.title}
                                  </span>
                                  {hasVideo ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                  )}
                                </div>
                                {!compactMode && hasVideo && (
                                  <code className="text-xs text-purple-300 mt-1 block truncate">
                                    {lesson.bunny_video_id}
                                  </code>
                                )}
                              </button>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInlineEdit(lesson);
                                  }}
                                  className="p-1 rounded hover:bg-white/10 transition"
                                  title="Édition rapide"
                                >
                                  <Edit2 className="w-3 h-3 text-blue-400" />
                                </button>
                                {hasVideo && (
                                  <a
                                    href={`https://bunny.net/stream/library/videos/${lesson.bunny_video_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 rounded hover:bg-white/10 transition"
                                    title="Voir sur Bunny Stream"
                                  >
                                    <ExternalLink className="w-3 h-3 text-purple-400" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne droite - Formulaire et bibliothèque */}
        <div className="lg:col-span-2 space-y-4">
          {/* Formulaire d'édition */}
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
                  <label className="text-sm text-gray-400">
                    Description (optionnel)
                  </label>
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
                  <label className="text-sm text-gray-400">
                    ID vidéo Bunny Stream
                  </label>
                  <input
                    type="text"
                    className={`w-full rounded-lg border px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white tracking-wide ${
                      formState.bunnyVideoId &&
                      !isValidVideoId(formState.bunnyVideoId)
                        ? 'border-red-500/50 bg-red-500/10'
                        : 'border-white/10 bg-black/40'
                    }`}
                    placeholder="ex: 8254f866-0ab0-498c-b1fe-5ef2b66a2ab8"
                    value={formState.bunnyVideoId}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        bunnyVideoId: event.target.value,
                      }))
                    }
                  />
                  {formState.bunnyVideoId &&
                    !isValidVideoId(formState.bunnyVideoId) && (
                      <p className="text-xs text-red-400">
                        Format invalide. Utilisez un UUID valide (ex:
                        8254f866-0ab0-498c-b1fe-5ef2b66a2ab8)
                      </p>
                    )}
                  <p className="text-xs text-gray-500">
                    Copiez-collez l'ID depuis Bunny Stream ou sélectionnez une vidéo
                    existante dans la bibliothèque ci-dessous.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white hover:from-purple-600 hover:to-pink-600 transition"
                  >
                    <Upload className="w-4 h-4" />
                    Uploader une nouvelle vidéo
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={
                      updateLessonMutation.isPending ||
                      (formState.bunnyVideoId &&
                        !isValidVideoId(formState.bunnyVideoId))
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
                    Réinitialiser
                  </button>
                  {selectedLesson.bunny_video_id && (
                    <a
                      href={`https://bunny.net/stream/library/videos/${selectedLesson.bunny_video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Voir sur Bunny
                    </a>
                  )}
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <VideoIcon className="w-12 h-12 mx-auto text-purple-400 mb-4" />
                <p>Sélectionnez une leçon dans la colonne de gauche pour la modifier.</p>
                {selectedLessons.size > 0 && (
                  <p className="text-sm mt-2 text-purple-300">
                    Ou utilisez une vidéo de la bibliothèque pour les{' '}
                    {selectedLessons.size} leçon(s) sélectionnée(s).
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bibliothèque des vidéos */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListVideo className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">
                  Bibliothèque des vidéos détectées
                </h3>
              </div>
              <span className="text-xs text-gray-400">
                {videoLibrary.length} vidéo(s) disponible(s)
              </span>
            </div>

            {videoLibrary.length === 0 ? (
              <p className="text-sm text-gray-400">
                Aucune vidéo enregistrée pour le moment. Associez vos premières vidéos
                via le formulaire ci-dessus.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 max-h-[400px] overflow-y-auto">
                {videoLibrary.map((video) => (
                  <div
                    key={video.videoId}
                    className="rounded-lg border border-white/10 bg-black/40 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase text-gray-500 truncate">
                          {video.moduleTitle}
                        </p>
                        <p className="text-sm font-semibold text-white truncate">
                          {video.lessonTitle}
                        </p>
                        {video.count > 1 && (
                          <p className="text-xs text-purple-400 mt-1">
                            Utilisée {video.count} fois
                          </p>
                        )}
                      </div>
                      <a
                        href={`https://bunny.net/stream/library/videos/${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-white/10 transition"
                        title="Voir sur Bunny Stream"
                      >
                        <ExternalLink className="w-3 h-3 text-purple-400" />
                      </a>
                    </div>
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
                        {selectedLessons.size > 0
                          ? `Utiliser (${selectedLessons.size})`
                          : 'Utiliser'}
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

      {/* Modal d'upload de vidéo */}
      <VideoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={(videoId, title) => {
          // Si une leçon est sélectionnée, mettre à jour automatiquement
          if (selectedLessonId) {
            setFormState((prev) => ({
              ...prev,
              bunnyVideoId: videoId,
            }));
            // Sauvegarder automatiquement
            updateLessonMutation.mutate({
              id: selectedLessonId,
              bunnyVideoId: videoId,
            });
          } else {
            // Sinon, juste mettre à jour le champ si une leçon est sélectionnée après
            setFormState((prev) => ({
              ...prev,
              bunnyVideoId: videoId,
            }));
          }
          setIsUploadModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['admin', 'lessons-with-modules'] });
        }}
      />
    </div>
  );
}
