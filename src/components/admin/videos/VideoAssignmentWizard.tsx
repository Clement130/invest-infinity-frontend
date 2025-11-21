import { useState } from 'react';
import { ChevronRight, ChevronLeft, Plus, CheckCircle2 } from 'lucide-react';
import type { ModuleWithLessons } from '../../../hooks/admin/useFormationsHierarchy';
import type { TrainingLesson } from '../../../types/training';

interface VideoAssignmentWizardProps {
  videoId: string;
  videoTitle?: string;
  modules: ModuleWithLessons[];
  onAssign: (lessonId: string) => void;
  onCreateLesson?: (moduleId: string, videoId: string) => void;
  onCancel?: () => void;
}

type WizardStep = 1 | 2 | 3;

export function VideoAssignmentWizard({
  videoId,
  videoTitle,
  modules,
  onAssign,
  onCreateLesson,
  onCancel,
}: VideoAssignmentWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const selectedModule = modules.find((m) => m.id === selectedModuleId);
  const lessonsWithoutVideo = selectedModule?.lessons.filter((l) => !l.bunny_video_id) || [];
  const lessonsWithVideo = selectedModule?.lessons.filter((l) => l.bunny_video_id) || [];

  const handleStep1Next = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setStep(2);
  };

  const handleStep2Next = () => {
    setStep(3);
  };

  const handleAssign = (lessonId: string) => {
    onAssign(lessonId);
  };

  const handleCreateLesson = () => {
    if (selectedModuleId && onCreateLesson) {
      onCreateLesson(selectedModuleId, videoId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
          1
        </div>
        <div className={`h-1 w-16 ${step >= 2 ? 'bg-purple-500' : 'bg-gray-700'}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
          2
        </div>
        <div className={`h-1 w-16 ${step >= 3 ? 'bg-purple-500' : 'bg-gray-700'}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
          3
        </div>
      </div>

      {/* Step 1: Select Module */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              📚 Étape 1/3 : Sélectionnez le module
            </h3>
            <p className="text-sm text-gray-400">
              Choisissez le module qui contiendra cette vidéo
            </p>
          </div>

          <div className="grid gap-3">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => handleStep1Next(module.id)}
                className="text-left p-4 rounded-lg border border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition"
              >
                <div className="font-semibold text-white mb-1">{module.title}</div>
                <div className="text-xs text-gray-400">
                  {module.lessons.length} leçon{module.lessons.length > 1 ? 's' : ''}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Confirm Module */}
      {step === 2 && selectedModule && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              📂 Étape 2/3 : Confirmez le module
            </h3>
            <p className="text-sm text-gray-400">
              Module sélectionné : <span className="text-white font-semibold">{selectedModule.title}</span>
            </p>
          </div>

          <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/10">
            <div className="font-semibold text-white mb-2">{selectedModule.title}</div>
            <div className="text-sm text-gray-400">
              {selectedModule.lessons.length} leçon{selectedModule.lessons.length > 1 ? 's' : ''} au total
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              onClick={handleStep2Next}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select/Create Lesson */}
      {step === 3 && selectedModule && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              🎬 Étape 3/3 : Assignez à une leçon
            </h3>
            <p className="text-sm text-gray-400">
              {selectedModule.title} → 🎬 ?
            </p>
          </div>

          {videoTitle && (
            <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10">
              <div className="text-sm text-gray-400 mb-1">Vidéo à assigner :</div>
              <div className="font-semibold text-white">{videoTitle}</div>
            </div>
          )}

          {/* Leçons existantes sans vidéo */}
          {lessonsWithoutVideo.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-400">Leçons existantes sans vidéo :</div>
              {lessonsWithoutVideo.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => handleAssign(lesson.id)}
                  className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/5 hover:border-green-500/50 hover:bg-green-500/10 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{lesson.title}</div>
                      <div className="text-xs text-gray-400">📭 Aucune vidéo</div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Leçons avec vidéo (remplacement) */}
          {lessonsWithVideo.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-400">Leçons avec vidéo (remplacer) :</div>
              {lessonsWithVideo.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => {
                    if (confirm(`Remplacer la vidéo de "${lesson.title}" ?`)) {
                      handleAssign(lesson.id);
                    }
                  }}
                  className="w-full text-left p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:border-amber-500/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{lesson.title}</div>
                      <div className="text-xs text-amber-400">⚠️ Déjà une vidéo - Remplacer ?</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Créer une nouvelle leçon */}
          {onCreateLesson && (
            <button
              onClick={handleCreateLesson}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 transition"
            >
              <Plus className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-purple-300">
                Créer une nouvelle leçon avec cette vidéo
              </span>
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 transition"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

