import { useState } from 'react';
import { X, Play, Upload, Video, BookOpen, CheckCircle2, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';

interface VideoTutorialProps {
  onClose?: () => void;
}

type TutorialStep = 'intro' | 'method1' | 'method2' | 'complete';

export function VideoTutorial({ onClose }: VideoTutorialProps) {
  const [currentStep, setCurrentStep] = useState<TutorialStep>('intro');
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex p-4 rounded-full bg-purple-500/20 mb-4">
                <HelpCircle className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">🎬 Comment assigner une vidéo ?</h3>
              <p className="text-gray-400">C'est très simple, suivez les étapes ci-dessous</p>
            </div>

            <div className="space-y-3">
              <div className="p-5 rounded-xl border-2 border-green-500/50 bg-green-500/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">1️⃣</div>
                  <h4 className="text-lg font-bold text-white">Trouvez une leçon sans vidéo</h4>
                </div>
                <p className="text-gray-300 ml-11">
                  Cherchez le bouton vert <span className="font-semibold text-green-400">"Assigner une vidéo"</span> sur une leçon
                </p>
              </div>

              <div className="p-5 rounded-xl border-2 border-green-500/50 bg-green-500/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">2️⃣</div>
                  <h4 className="text-lg font-bold text-white">Cliquez sur le bouton vert</h4>
                </div>
                <p className="text-gray-300 ml-11">
                  La bibliothèque de vidéos s'ouvre automatiquement
                </p>
              </div>

              <div className="p-5 rounded-xl border-2 border-green-500/50 bg-green-500/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">3️⃣</div>
                  <h4 className="text-lg font-bold text-white">Choisissez une vidéo</h4>
                </div>
                <p className="text-gray-300 ml-11">
                  Cliquez sur la vidéo que vous voulez → <span className="font-semibold text-green-400">C'est fait ! ✅</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
              <div className="flex items-start gap-3">
                <Upload className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-300 mb-1">💡 Vous voulez uploader une nouvelle vidéo ?</h4>
                  <p className="text-sm text-gray-300">
                    Cliquez sur <span className="font-semibold">"Upload"</span> en haut de la page, puis suivez le guide automatique
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-6 py-3 rounded-lg bg-green-500/20 border-2 border-green-500/50 text-green-300 hover:bg-green-500/30 transition font-bold text-lg"
            >
              J'ai compris, fermer le tutoriel ✅
            </button>
          </div>
        );

      case 'method1':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex p-3 rounded-full bg-green-500/20 mb-3">
                <Video className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">📚 Assigner une vidéo existante</h3>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-green-500/40 bg-green-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold text-green-400">1.</span>
                  <h4 className="font-semibold text-white">Trouvez le bouton vert</h4>
                </div>
                <p className="text-sm text-gray-300 ml-8">
                  Sur chaque leçon sans vidéo, vous verrez un bouton vert <span className="font-semibold text-green-400">"Assigner une vidéo"</span>
                </p>
              </div>

              <div className="p-4 rounded-lg border border-green-500/40 bg-green-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold text-green-400">2.</span>
                  <h4 className="font-semibold text-white">Cliquez dessus</h4>
                </div>
                <p className="text-sm text-gray-300 ml-8">
                  La bibliothèque s'ouvre avec toutes vos vidéos disponibles
                </p>
              </div>

              <div className="p-4 rounded-lg border border-green-500/40 bg-green-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold text-green-400">3.</span>
                  <h4 className="font-semibold text-white">Choisissez votre vidéo</h4>
                </div>
                <p className="text-sm text-gray-300 ml-8">
                  Cliquez sur la vidéo → Elle est assignée automatiquement ! ✅
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('intro')}
                className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
              >
                ← Retour
              </button>
              <button
                onClick={() => setCurrentStep('method2')}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 transition"
              >
                Upload vidéo →
              </button>
            </div>
          </div>
        );

      case 'method2':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex p-3 rounded-full bg-blue-500/20 mb-3">
                <Upload className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">⬆️ Uploader une nouvelle vidéo</h3>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-blue-500/40 bg-blue-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold text-blue-400">1.</span>
                  <h4 className="font-semibold text-white">Cliquez sur "Upload"</h4>
                </div>
                <p className="text-sm text-gray-300 ml-8">
                  Le bouton se trouve en haut de la page, à côté de "Nouvelle Formation"
                </p>
              </div>

              <div className="p-4 rounded-lg border border-blue-500/40 bg-blue-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold text-blue-400">2.</span>
                  <h4 className="font-semibold text-white">Glissez votre vidéo</h4>
                </div>
                <p className="text-sm text-gray-300 ml-8">
                  Ou cliquez pour sélectionner un fichier (MP4, MOV, AVI, MKV - max 5 GB)
                </p>
              </div>

              <div className="p-4 rounded-lg border border-blue-500/40 bg-blue-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold text-blue-400">3.</span>
                  <h4 className="font-semibold text-white">Suivez le guide</h4>
                </div>
                <p className="text-sm text-gray-300 ml-8">
                  Un assistant s'ouvre automatiquement → Choisissez le module → Choisissez la leçon → C'est fait ! ✅
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-blue-300">Astuce :</span> Si vous annulez, la vidéo reste dans la bibliothèque et vous pourrez l'assigner plus tard
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('method1')}
                className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
              >
                ← Retour
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 transition font-semibold"
              >
                J'ai compris ✅
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-green-500/20">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">🎉 C'est tout !</h3>
              <p className="text-gray-400 text-lg">
                Vous savez maintenant comment assigner des vidéos. C'est aussi simple que ça !
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full px-6 py-4 rounded-lg bg-green-500/20 border-2 border-green-500/50 text-green-300 hover:bg-green-500/30 transition font-bold text-lg"
            >
              Commencer ✅
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-xl border border-white/10 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <HelpCircle className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">🎬 Comment assigner une vidéo ?</h2>
              <p className="text-sm text-gray-400">Guide simple en 3 étapes</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            title="Fermer"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStep()}
        </div>

        {/* Progress indicator - simplifié */}
        {currentStep !== 'intro' && (
          <div className="px-6 py-3 border-t border-white/10 bg-slate-900/50">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <span>
                {currentStep === 'method1' && '📚 Assigner une vidéo existante'}
                {currentStep === 'method2' && '⬆️ Uploader une nouvelle vidéo'}
                {currentStep === 'complete' && '✅ Terminé'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'green' | 'blue';
  isLast?: boolean;
}

function StepCard({ number, title, description, icon, color, isLast }: StepCardProps) {
  const colorClasses = {
    green: {
      bg: 'bg-green-500/20',
      border: 'border-green-500/40',
      text: 'text-green-300',
      icon: 'text-green-400',
    },
    blue: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/40',
      text: 'text-blue-300',
      icon: 'text-blue-400',
    },
  };

  const classes = colorClasses[color];

  return (
    <div className="relative">
      <div className={`p-4 rounded-lg border ${classes.border} ${classes.bg}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${classes.bg} ${classes.icon} flex-shrink-0`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold ${classes.text} px-2 py-0.5 rounded ${classes.bg}`}>
                Étape {number}
              </span>
              <h4 className="font-semibold text-white">{title}</h4>
            </div>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>
      </div>
      {!isLast && (
        <div className={`absolute left-0 top-full w-0.5 h-4 ${classes.bg} opacity-50`} style={{ marginLeft: '1.5rem' }} />
      )}
    </div>
  );
}

