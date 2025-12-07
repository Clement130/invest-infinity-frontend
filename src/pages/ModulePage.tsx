import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, ChevronDown, ChevronUp, Trash2, GripVertical } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getModuleWithLessons, deleteModule, createOrUpdateLesson } from '../services/trainingService';
import { useSession } from '../hooks/useSession';
import { useToast } from '../hooks/useToast';
import { useEntitlements } from '../hooks/useEntitlements';
import type { ModuleWithLessons, TrainingLesson } from '../types/training';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Structure hiérarchique basée sur les images
// Chaque module peut avoir des sections, et chaque section peut avoir des leçons
interface Section {
  id: string;
  title: string;
  lessons: Array<{
    id: string;
    title: string;
    description?: string;
    is_preview?: boolean;
  }>;
}

type SectionLayout = {
  title: string;
  lessons: string[];
};

const moduleLayouts: Record<string, SectionLayout[]> = {
  'etape-1-la-fondation': [
    {
      title: 'La base du trading',
      lessons: [
        'La Base du Vocabulaire en Trading',
        'Les Différents Types de Marchés',
        'Les Différents Profils en Trading',
        'Les Différentes Stratégies En Trading',
      ],
    },
    {
      title: 'Gestion du Risque',
      lessons: [
        'Avoir son Money Management',
        'Avoir un Track Record & Data',
        'Faire des Trades Recaps',
      ],
    },
    {
      title: 'La psycho a adopté',
      lessons: ['La Clé de ton succès se joue ici.'],
    },
  ],
  'etape-2-les-bases-en-ict': [
    {
      title: 'La Fondation',
      lessons: [
        'La Structure de marché',
        'Le Breaker block & Mitigation block',
        'La FVG',
        "L'OB.",
        'La Liquidité',
        'La SMT',
      ],
    },
    {
      title: 'Concepts avancés',
      lessons: ['BreakerAway Gap', 'La IFVG', 'OB sans Corps'],
    },
  ],
  'etape-3-la-strategie-ict-mickael': [
    {
      title: 'Stratégie expliquée',
      lessons: [
        'Introduction',
        'Définir mon biais',
        'Définir mes zones',
        'Mes confirmations pour prendre position',
        'Où TP, SL et BE ?',
      ],
    },
    {
      title: 'Conditions de marché obligatoires',
      lessons: [
        'Displacement + création d’une FVG',
        'Si Accumulation (je ne la trade que sous condition)',
      ],
    },
  ],
  'metatrader-topstepx': [
    {
      title: 'MetaTrader',
      lessons: ['Comment installer son compte MetaTrader ?', 'Comment prendre un Trade sur MetaTrader ?'],
    },
    {
      title: 'TopStepX',
      lessons: ['TopStepX - Comment l’utiliser ?'],
    },
  ],
};

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Composant pour une leçon draggable (admin uniquement)
function SortableLessonItem({
  lesson,
  lessonIndex,
  totalLessons,
  isSelected,
  isAdmin,
  onMoveUp,
  onMoveDown,
  onClick,
}: {
  lesson: { id: string; title: string };
  lessonIndex: number;
  totalLessons: number;
  isSelected: boolean;
  isAdmin: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClick: () => void;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 hover:bg-white/5 transition-colors ${
        isSelected ? 'bg-pink-500/10 border-l-2 border-pink-500' : ''
      }`}
    >
      {/* Contrôles de réorganisation (admin uniquement) */}
      {isAdmin && (
        <div className="flex items-center gap-0.5 pl-2 opacity-40 hover:opacity-100 transition-opacity">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded transition"
            title="Glisser pour réorganiser"
          >
            <GripVertical className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex flex-col">
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              disabled={lessonIndex === 0}
              className="p-0.5 hover:bg-white/10 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
              title="Monter"
            >
              <ChevronUp className="w-3 h-3 text-gray-500" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              disabled={lessonIndex === totalLessons - 1}
              className="p-0.5 hover:bg-white/10 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
              title="Descendre"
            >
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        </div>
      )}
      
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-4 p-4 text-left"
      >
        <span className="text-sm font-medium text-gray-300 min-w-[2rem]">
          {lessonIndex + 1}.
        </span>
        <span className="flex-1 text-white font-medium">
          {lesson.title}
        </span>
        <Play className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>
    </div>
  );
}

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { role } = useSession();
  const entitlements = useEntitlements();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Vérifier si l'utilisateur est admin ou developer
  const isAdmin = role === 'admin' || role === 'developer';

  // Sensors pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutation pour réorganiser les leçons
  const reorderLessonsMutation = useMutation({
    mutationFn: async (lessons: { id: string; position: number; module_id: string; title: string }[]) => {
      await Promise.all(
        lessons.map((lesson) =>
          createOrUpdateLesson({
            id: lesson.id,
            module_id: lesson.module_id,
            title: lesson.title,
            position: lesson.position,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-with-lessons', moduleId] });
      toast.success('Ordre des leçons mis à jour');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Handler pour réorganiser les leçons
  const handleReorderLessons = useCallback((oldIndex: number, newIndex: number) => {
    if (!data?.lessons || !moduleId) return;
    
    const sortedLessons = [...data.lessons].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const reorderedLessons = arrayMove(sortedLessons, oldIndex, newIndex);
    
    const updatedLessons = reorderedLessons.map((lesson, index) => ({
      id: lesson.id,
      module_id: lesson.module_id,
      title: lesson.title,
      position: index,
    }));
    
    reorderLessonsMutation.mutate(updatedLessons);
  }, [data?.lessons, moduleId, reorderLessonsMutation]);

  // Handler pour le drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !data?.lessons) return;
    
    const sortedLessons = [...data.lessons].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const oldIndex = sortedLessons.findIndex((l) => l.id === active.id);
    const newIndex = sortedLessons.findIndex((l) => l.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      handleReorderLessons(oldIndex, newIndex);
    }
  }, [data?.lessons, handleReorderLessons]);

  // Handler pour la suppression du module
  const handleDeleteModule = async () => {
    if (!moduleId || !isAdmin) return;
    
    setIsDeleting(true);
    try {
      await deleteModule(moduleId);
      toast.success('Module supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      navigate('/app');
    } catch (error: any) {
      console.error('[ModulePage] Erreur lors de la suppression:', error);
      toast.error(error?.message || 'Erreur lors de la suppression du module');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const { data, isLoading, isError } = useQuery<ModuleWithLessons | null>({
    queryKey: ['module-with-lessons', moduleId],
    enabled: Boolean(moduleId),
    queryFn: () => getModuleWithLessons(moduleId!),
  });

  // Vérifier l'accès au module (sauf pour les admins)
  useEffect(() => {
    if (!isAdmin && data?.module && !entitlements.hasModuleAccess(data.module)) {
      toast.error('Vous n\'avez pas accès à ce module. Veuillez mettre à niveau votre offre.');
      navigate('/app');
    }
  }, [data?.module, entitlements, isAdmin, navigate, toast]);

  const sections = useMemo<Section[]>(() => {
    if (!data?.lessons || !data.module) return [];

    const lessons = (data.lessons ?? [])
      .map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        is_preview: lesson.is_preview,
        position: lesson.position,
        slug: slugify(lesson.title),
      }))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const moduleSlug = slugify(data.module.title);
    const layout = moduleLayouts[moduleSlug];

    if (!layout) {
      const sectionSize = 6;
      const sectionsList: Section[] = [];

      if (lessons.length <= sectionSize) {
        sectionsList.push({
          id: 'section-default',
          title: 'Leçons',
          lessons,
        });
      } else {
        const firstSection = lessons.slice(0, sectionSize);
        const secondSection = lessons.slice(sectionSize);

        sectionsList.push({
          id: 'section-1',
          title: 'La Fondation',
          lessons: firstSection,
        });

        if (secondSection.length > 0) {
          sectionsList.push({
            id: 'section-2',
            title: 'Concepts avancés',
            lessons: secondSection,
          });
        }
      }

      return sectionsList;
    }

    const usedLessons = new Set<string>();
    const layoutSections: Section[] = layout
      .map((section, sectionIndex) => {
        const sectionLessons = section.lessons
          .map((lessonTitle) => {
            const normalizedTitle = slugify(lessonTitle);
            const match = lessons.find(
              (lesson) => lesson.slug === normalizedTitle && !usedLessons.has(lesson.id)
            );

            if (match) {
              usedLessons.add(match.id);
            }

            return match ?? null;
          })
          .filter((lesson): lesson is Section['lessons'][number] => Boolean(lesson));

        return {
          id: `${moduleSlug}-section-${sectionIndex}`,
          title: section.title,
          lessons: sectionLessons,
        };
      })
      .filter((section) => section.lessons.length > 0);

    const remaining = lessons.filter((lesson) => !usedLessons.has(lesson.id));

    if (remaining.length > 0) {
      layoutSections.push({
        id: `${moduleSlug}-section-extra`,
        title: 'Autres leçons',
        lessons: remaining,
      });
    }

    return layoutSections;
  }, [data?.lessons, data?.module]);

  // Calculer la progression (simplifié pour l'instant)
  const progress = useMemo(() => {
    if (!data?.lessons || data.lessons.length === 0) return 0;
    // Pour l'instant, on retourne 0% - à implémenter avec le suivi de progression
    return 0;
  }, [data?.lessons]);

  // Initialiser les sections expandées par défaut (une seule fois au chargement)
  useEffect(() => {
    if (sections.length > 0) {
      setExpandedSections(prev => {
        // Ne mettre à jour que si c'est la première fois (set vide)
        if (prev.size === 0) {
          return new Set(sections.map(s => s.id));
        }
        return prev;
      });
    }
  }, [sections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleLessonClick = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    navigate(`/app/modules/${moduleId}/lessons/${lessonId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
          <p className="text-gray-400">Chargement du module...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <p className="text-xl text-gray-300">Module introuvable</p>
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

  const { module } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white py-8 px-4">
      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Supprimer ce module ?</h3>
            <p className="text-gray-400 mb-6">
              Cette action est irréversible. Toutes les leçons associées seront également supprimées.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition text-white font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteModule}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition text-white font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Bouton retour */}
        <button
          onClick={() => navigate('/app')}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux modules
        </button>

        {/* En-tête du module avec barre de progression */}
        <header className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-4xl font-bold">{module.title}</h1>
            </div>
            
            {/* Bouton Supprimer (admin/developer uniquement) */}
            {isAdmin && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 transition text-red-300 hover:text-red-200 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer le module
              </button>
            )}
          </div>
          
          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="w-full bg-gray-700/30 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-500 to-pink-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">{progress}% complété</p>
          </div>
        </header>

        {/* Liste des sections avec leçons */}
        <section className="space-y-2">
          {sections.map((section, sectionIndex) => {
            const isExpanded = expandedSections.has(section.id);

            return (
              <div
                key={section.id}
                className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
              >
                {/* En-tête de section */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-white">
                      {sectionIndex + 1}. {section.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Leçons de la section */}
                {isExpanded && (
                  <div className="border-t border-white/10">
                    {section.lessons.length === 0 ? (
                      <p className="p-4 text-gray-400 text-sm">Aucune leçon dans cette section.</p>
                    ) : isAdmin ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={section.lessons.map((l) => l.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="divide-y divide-white/10">
                            {section.lessons.map((lesson, lessonIndex) => {
                              const isSelected = selectedLessonId === lesson.id;
                              const allLessons = data?.lessons?.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) || [];
                              const globalIndex = allLessons.findIndex((l) => l.id === lesson.id);
                              
                              return (
                                <SortableLessonItem
                                  key={lesson.id}
                                  lesson={lesson}
                                  lessonIndex={lessonIndex}
                                  totalLessons={section.lessons.length}
                                  isSelected={isSelected}
                                  isAdmin={isAdmin}
                                  onMoveUp={() => {
                                    if (globalIndex > 0) {
                                      handleReorderLessons(globalIndex, globalIndex - 1);
                                    }
                                  }}
                                  onMoveDown={() => {
                                    if (globalIndex < allLessons.length - 1) {
                                      handleReorderLessons(globalIndex, globalIndex + 1);
                                    }
                                  }}
                                  onClick={() => handleLessonClick(lesson.id)}
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <div className="divide-y divide-white/10">
                        {section.lessons.map((lesson, lessonIndex) => {
                          const isSelected = selectedLessonId === lesson.id;
                          
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonClick(lesson.id)}
                              className={`w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left ${
                                isSelected ? 'bg-pink-500/10 border-l-2 border-pink-500' : ''
                              }`}
                            >
                              <span className="text-sm font-medium text-gray-300 min-w-[2rem]">
                                {lessonIndex + 1}.
                              </span>
                              <span className="flex-1 text-white font-medium">
                                {lesson.title}
                              </span>
                              <Play className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
