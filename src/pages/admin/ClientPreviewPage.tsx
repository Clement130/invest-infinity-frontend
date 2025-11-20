import { useQuery } from '@tanstack/react-query';
import { getModules } from '../../services/trainingService';
import TrainingModuleCard from '../../components/training/TrainingModuleCard';
import { Eye, ExternalLink } from 'lucide-react';

export default function ClientPreviewPage() {
  
  const {
    data: modules = [],
    isLoading: loadingModules,
    isError,
    error: modulesError,
  } = useQuery({
    queryKey: ['modules', 'client'],
    queryFn: () => {
      console.log('[ClientPreview] Chargement des modules...');
      return getModules();
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Log des erreurs pour déboguer
  if (modulesError) {
    console.error('[ClientPreview] Erreur lors du chargement des modules:', modulesError);
  }

  const handleModuleClick = (moduleId: string) => {
    // Ouvrir dans un nouvel onglet pour prévisualiser
    window.open(`/app/modules/${moduleId}`, '_blank');
  };

  const continueModule = modules.length > 0 ? modules[0] : null;

  return (
    <div className="space-y-6">
      {/* Header avec badge de prévisualisation */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Prévisualisation Client</h1>
            <span className="px-3 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">
              Vue Client
            </span>
          </div>
          <p className="text-gray-400">
            Voici exactement ce que voient vos clients dans leur espace formation
          </p>
        </div>
        <button
          onClick={() => window.open('/app', '_blank')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 transition"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir dans un nouvel onglet
        </button>
      </div>

      {/* Contenu exact de ClientApp */}
      <div className="bg-gradient-to-br from-slate-900/50 to-black/50 rounded-xl border border-white/10 p-8">
        <div className="space-y-8">
          {/* Header */}
          <header className="space-y-2 mb-8">
            <h1 className="text-4xl font-bold">Espace formation</h1>
            <p className="text-gray-400">
              Accède à tes modules et reprends là où tu t'es arrêté.
            </p>
          </header>

          {/* Section "Continuer là où tu t'es arrêté" */}
          {continueModule && (
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                Continuer là où tu t'es arrêté
              </h2>
              <div className="max-w-md">
                <TrainingModuleCard
                  module={continueModule}
                  onClick={() => handleModuleClick(continueModule.id)}
                  progress={40}
                />
              </div>
            </section>
          )}

          {/* Section "Tes modules" */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="text-2xl">🎬</span>
              Tes modules
            </h2>

            {loadingModules ? (
              <div className="text-center py-12 text-gray-400">
                Chargement des modules...
              </div>
            ) : isError ? (
              <div className="text-center py-12 text-red-400">
                Impossible de charger les modules pour le moment.
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                Aucun module disponible pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                  <TrainingModuleCard
                    key={module.id}
                    module={module}
                    onClick={() => handleModuleClick(module.id)}
                    progress={40}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Info pour l'admin */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Note :</strong> Cette vue montre exactement ce que voient vos clients. 
          Les modules affichés sont ceux qui sont actifs et accessibles aux clients.
          Cliquez sur un module pour le prévisualiser dans un nouvel onglet.
        </p>
      </div>
    </div>
  );
}

