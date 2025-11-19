import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getActiveModules } from '../services/trainingService';
import type { TrainingModule } from '../types/training';
import TrainingModuleCard from '../components/training/TrainingModuleCard';

export default function ClientApp() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  useEffect(() => {
    const loadModules = async () => {
      try {
        setLoadingModules(true);
        // Pour l'instant, on utilise getActiveModules()
        // Plus tard, on pourra utiliser getAccessibleModulesForUser(user.id) si user existe
        const data = await getActiveModules();
        setModules(data);
      } catch (error) {
        console.error('Erreur lors du chargement des modules:', error);
      } finally {
        setLoadingModules(false);
      }
    };

    loadModules();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleModuleClick = (moduleId: string) => {
    navigate(`/app/modules/${moduleId}`);
  };

  const continueModule = modules.length > 0 ? modules[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-black text-white py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Espace formation</h1>
            <p className="text-gray-400">
              Accède à tes modules et reprends là où tu t'es arrêté.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 transition font-medium text-red-300 hover:text-red-200"
          >
            <LogOut className="w-5 h-5" />
            Se déconnecter
          </button>
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
  );
}
