import { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Upload, 
  Target, 
  FileVideo, 
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';

export type GuideState = 
  | 'idle' 
  | 'uploading' 
  | 'assigning' 
  | 'editing' 
  | 'success'
  | 'creating-formation'
  | 'creating-module'
  | 'creating-lesson';

interface RealTimeGuideProps {
  state: GuideState;
  context?: {
    fileName?: string;
    uploadProgress?: number;
    selectedVideoId?: string;
    formationTitle?: string;
    moduleTitle?: string;
    lessonTitle?: string;
  };
}

export function RealTimeGuide({ state, context = {} }: RealTimeGuideProps) {
  const renderContent = () => {
    switch (state) {
      case 'idle':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">Guide rapide</h3>
            </div>
            <p className="text-sm text-gray-400">
              Comment assigner une vidéo à une leçon :
            </p>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-green-400 font-bold">1.</span>
                  <span className="text-gray-300 flex-1">
                    Trouvez une leçon avec le bouton vert <strong>"Assigner vidéo"</strong>
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-green-400 font-bold">2.</span>
                  <span className="text-gray-300 flex-1">
                    Cliquez sur <strong>"Assigner vidéo"</strong> → La bibliothèque s'ouvre
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-green-400 font-bold">3.</span>
                  <span className="text-gray-300 flex-1">
                    Sélectionnez une vidéo → <strong>C'est fait ! ✅</strong>
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-gray-500 mb-2">
                💡 Astuce : Vous pouvez aussi uploader une vidéo puis l'assigner via le wizard automatique
              </p>
              <p className="text-xs text-gray-500">
                Sélectionnez une leçon pour l'éditer ou voir plus d'options
              </p>
            </div>
          </div>
        );

      case 'uploading':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Upload className="w-5 h-5 animate-pulse" />
              <h3 className="font-semibold">Upload en cours...</h3>
            </div>
            <p className="text-sm text-gray-400">
              Ne fermez pas cette page.
            </p>
            {context.fileName && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-white">
                  {context.fileName}
                </div>
                {context.uploadProgress !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Progression</span>
                      <span>{context.uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                        style={{ width: `${context.uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  ⏱️ Temps estimé : ~2 min
                </p>
              </div>
            )}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300">
                🎬 Après l'upload, vous pourrez assigner cette vidéo à une leçon
              </p>
            </div>
          </div>
        );

      case 'assigning':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Target className="w-5 h-5" />
              <h3 className="font-semibold">Assigner cette vidéo</h3>
            </div>
            <p className="text-sm text-gray-400">
              Sélectionnez Formation → Module → Leçon
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Naviguez dans l'arbre à gauche</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>La vidéo apparaîtra automatiquement</span>
              </div>
              <div className="flex items-center gap-2 text-amber-300">
                <span>⚠️</span>
                <span>Une leçon = une seule vidéo</span>
              </div>
            </div>
            {context.selectedVideoId && (
              <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded text-xs font-mono text-purple-300">
                ID: {context.selectedVideoId}
              </div>
            )}
          </div>
        );

      case 'editing':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <FileVideo className="w-5 h-5" />
              <h3 className="font-semibold">Édition de leçon</h3>
            </div>
            {context.lessonTitle && (
              <p className="text-sm text-white font-medium">
                {context.lessonTitle}
              </p>
            )}
            <div className="space-y-2 text-sm text-gray-400">
              <p>• Modifiez le titre et la description</p>
              <p>• Assignez ou remplacez la vidéo</p>
              <p>• Ajoutez des ressources complémentaires</p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-semibold">Action réussie !</h3>
            </div>
            <p className="text-sm text-gray-400">
              Votre modification a été enregistrée.
            </p>
          </div>
        );

      case 'creating-formation':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <h3 className="font-semibold">Création de formation</h3>
            </div>
            <p className="text-sm text-gray-400">
              Remplissez les informations de base de votre nouvelle formation.
            </p>
          </div>
        );

      case 'creating-module':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <h3 className="font-semibold">Création de module</h3>
            </div>
            {context.formationTitle && (
              <p className="text-sm text-gray-400">
                Ajout d'un module à : <span className="text-white">{context.formationTitle}</span>
              </p>
            )}
          </div>
        );

      case 'creating-lesson':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <h3 className="font-semibold">Création de leçon</h3>
            </div>
            {context.moduleTitle && (
              <p className="text-sm text-gray-400">
                Ajout d'une leçon à : <span className="text-white">{context.moduleTitle}</span>
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="sticky top-6 rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-xl">
      {renderContent()}
    </div>
  );
}

