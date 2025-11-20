import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getModules } from '../services/trainingService';
import TrainingModuleCard from '../components/training/TrainingModuleCard';

export default function ClientApp() {
  const navigate = useNavigate();
  const {
    data: modules = [],
    isLoading: loadingModules,
    isError,
    error: modulesError,
  } = useQuery({
    queryKey: ['modules', 'client'],
    queryFn: () => {
      console.log('[ClientApp] Chargement des modules...');
      return getModules();
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Log des erreurs pour déboguer
  if (modulesError) {
    console.error('[ClientApp] Erreur lors du chargement des modules:', modulesError);
  }

  const handleModuleClick = (moduleId: string) => {
    navigate(`/app/modules/${moduleId}`);
  };

  const continueModule = modules.length > 0 ? modules[0] : null;

  return (
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
  );
}
