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
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-500/20">
                <HelpCircle className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">📚 Guide d'assignation de vidéos</h3>
                <p className="text-sm text-gray-400">Apprenez à assigner des vidéos aux leçons en 2 méthodes simples</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Video className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Méthode 1 : Depuis la bibliothèque</h4>
                    <p className="text-sm text-gray-400 mb-2">
                      Assignez une vidéo existante à une leçon en 2 clics
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1 ml-4 list-disc">
                      <li>Cliquez sur "Assigner vidéo" sur une leçon</li>
                      <li>Sélectionnez une vidéo dans la bibliothèque</li>
                      <li>C'est fait ! ✅</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Upload className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Méthode 2 : Upload puis assignation</h4>
                    <p className="text-sm text-gray-400 mb-2">
                      Uploadez une nouvelle vidéo puis assignez-la
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1 ml-4 list-disc">
                      <li>Cliquez sur "Upload" en haut</li>
                      <li>Uploadez votre fichier vidéo</li>
                      <li>Choisissez la leçon dans le wizard</li>
                      <li>C'est fait ! ✅</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('method1')}
                className="flex-1 px-4 py-3 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 transition font-medium flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                Voir méthode 1
              </button>
              <button
                onClick={() => setCurrentStep('method2')}
                className="flex-1 px-4 py-3 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 transition font-medium flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Voir méthode 2
              </button>
            </div>
          </div>
        );

      case 'method1':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/20">
                <Video className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Méthode 1 : Assigner depuis la bibliothèque</h3>
                <p className="text-sm text-gray-400">La méthode la plus rapide</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-green-500/50"></div>
                <div className="pl-6 space-y-4">
                  <StepCard
                    number={1}
                    title="Trouvez une leçon sans vidéo"
                    description="Cherchez une leçon avec le badge 'Vidéo manquante' et le bouton vert 'Assigner vidéo'"
                    icon={<BookOpen className="w-5 h-5" />}
                    color="green"
                  />
                  <StepCard
                    number={2}
                    title="Cliquez sur 'Assigner vidéo'"
                    description="Le bouton vert est toujours visible sur les leçons sans vidéo"
                    icon={<Video className="w-5 h-5" />}
                    color="green"
                  />
                  <StepCard
                    number={3}
                    title="Sélectionnez une vidéo"
                    description="La bibliothèque Bunny Stream s'ouvre. Cliquez sur la vidéo que vous voulez assigner"
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    color="green"
                  />
                  <StepCard
                    number={4}
                    title="C'est terminé !"
                    description="La vidéo est automatiquement assignée à la leçon. Vous verrez le badge 'Complet' apparaître"
                    icon={<Sparkles className="w-5 h-5" />}
                    color="green"
                    isLast
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-300 mb-1">💡 Astuce</h4>
                  <p className="text-sm text-gray-300">
                    Vous pouvez aussi cliquer directement sur une leçon pour l'éditer, puis utiliser le panneau de droite pour assigner une vidéo.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('intro')}
                className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
              >
                ← Retour
              </button>
              <button
                onClick={() => setCurrentStep('method2')}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 transition"
              >
                Voir méthode 2 →
              </button>
            </div>
          </div>
        );

      case 'method2':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Upload className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Méthode 2 : Upload puis assignation</h3>
                <p className="text-sm text-gray-400">Pour ajouter une nouvelle vidéo</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-blue-500/50"></div>
                <div className="pl-6 space-y-4">
                  <StepCard
                    number={1}
                    title="Cliquez sur 'Upload'"
                    description="Le bouton 'Upload' se trouve en haut de la page, à côté de 'Nouvelle Formation'"
                    icon={<Upload className="w-5 h-5" />}
                    color="blue"
                  />
                  <StepCard
                    number={2}
                    title="Uploadez votre vidéo"
                    description="Glissez-déposez votre fichier ou cliquez pour sélectionner. Formats acceptés : MP4, MOV, AVI, MKV (max 5 GB)"
                    icon={<Play className="w-5 h-5" />}
                    color="blue"
                  />
                  <StepCard
                    number={3}
                    title="Le wizard d'assignation s'ouvre"
                    description="Après l'upload, un assistant vous guide pour assigner la vidéo à une leçon"
                    icon={<ArrowRight className="w-5 h-5" />}
                    color="blue"
                  />
                  <StepCard
                    number={4}
                    title="Choisissez le module"
                    description="Sélectionnez le module (formation) dans lequel se trouve la leçon"
                    icon={<BookOpen className="w-5 h-5" />}
                    color="blue"
                  />
                  <StepCard
                    number={5}
                    title="Choisissez la leçon"
                    description="Sélectionnez la leçon à laquelle vous voulez assigner la vidéo"
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    color="blue"
                  />
                  <StepCard
                    number={6}
                    title="C'est terminé !"
                    description="La vidéo est assignée et apparaît dans la leçon. Vous pouvez aussi créer une nouvelle leçon si besoin"
                    icon={<Sparkles className="w-5 h-5" />}
                    color="blue"
                    isLast
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-300 mb-1">💡 Astuce</h4>
                  <p className="text-sm text-gray-300">
                    Si vous annulez le wizard après l'upload, la vidéo sera disponible dans la bibliothèque et vous pourrez l'assigner plus tard avec la méthode 1.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('method1')}
                className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
              >
                ← Retour méthode 1
              </button>
              <button
                onClick={() => setCurrentStep('complete')}
                className="flex-1 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition"
              >
                Terminer le tutoriel
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
              <h3 className="text-2xl font-bold text-white mb-2">🎉 Tutoriel terminé !</h3>
              <p className="text-gray-400">
                Vous savez maintenant comment assigner des vidéos aux leçons. N'hésitez pas à réouvrir ce tutoriel si besoin.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/10">
              <h4 className="font-semibold text-purple-300 mb-2">Résumé rapide :</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p>✅ <strong>Méthode 1</strong> : Cliquez sur "Assigner vidéo" → Choisissez dans la bibliothèque</p>
                <p>✅ <strong>Méthode 2</strong> : Upload → Wizard d'assignation automatique</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 transition font-medium"
            >
              Commencer à utiliser
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
              <h2 className="text-xl font-bold text-white">Guide d'assignation de vidéos</h2>
              <p className="text-sm text-gray-400">Tutoriel interactif</p>
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

        {/* Progress indicator */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {currentStep === 'intro' && 'Introduction'}
              {currentStep === 'method1' && 'Méthode 1 : Bibliothèque'}
              {currentStep === 'method2' && 'Méthode 2 : Upload'}
              {currentStep === 'complete' && 'Terminé'}
            </span>
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full ${currentStep === 'intro' ? 'bg-purple-400' : 'bg-gray-600'}`} />
              <div className={`w-2 h-2 rounded-full ${currentStep === 'method1' ? 'bg-green-400' : 'bg-gray-600'}`} />
              <div className={`w-2 h-2 rounded-full ${currentStep === 'method2' ? 'bg-blue-400' : 'bg-gray-600'}`} />
              <div className={`w-2 h-2 rounded-full ${currentStep === 'complete' ? 'bg-green-400' : 'bg-gray-600'}`} />
            </div>
          </div>
        </div>
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

