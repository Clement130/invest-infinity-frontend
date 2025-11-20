import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getModuleWithLessons } from '../services/trainingService';
import type { ModuleWithLessons } from '../types/training';

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

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<ModuleWithLessons | null>({
    queryKey: ['module-with-lessons', moduleId],
    enabled: Boolean(moduleId),
    queryFn: () => getModuleWithLessons(moduleId!),
  });

  // Organiser les leçons en sections basées sur leur position
  // Les sections sont créées en groupant les leçons par groupes de 6 (ou selon la logique métier)
  const sections = useMemo<Section[]>(() => {
    if (!data?.lessons || data.lessons.length === 0) return [];

    const lessons = data.lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      is_preview: lesson.is_preview,
      position: lesson.position,
    }));

    // Organiser en sections : 
    // - Si moins de 6 leçons, une seule section
    // - Sinon, créer des sections de ~6 leçons chacune
    // Pour "Etape 2 - Les Bases en ICT", on crée 2 sections basées sur les positions
    const sectionSize = 6;
    const sectionsList: Section[] = [];

    if (lessons.length <= sectionSize) {
      // Une seule section
      sectionsList.push({
        id: 'section-1',
        title: 'La Fondation',
        lessons: lessons,
      });
    } else {
      // Plusieurs sections
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
  }, [data?.lessons]);

  // Calculer la progression (simplifié pour l'instant)
  const progress = useMemo(() => {
    if (!data?.lessons || data.lessons.length === 0) return 0;
    // Pour l'instant, on retourne 0% - à implémenter avec le suivi de progression
    return 0;
  }, [data?.lessons]);

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
              <button className="p-2 hover:bg-white/5 rounded-lg transition">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>
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
            const isFirstSection = sectionIndex === 0;
            
            // Expand toutes les sections par défaut (comme dans l'image)
            if (expandedSections.size === 0 && sectionIndex === 0) {
              setTimeout(() => {
                setExpandedSections(new Set(sections.map(s => s.id)));
              }, 0);
            }

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
