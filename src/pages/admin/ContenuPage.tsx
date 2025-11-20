import { useQuery } from '@tanstack/react-query';
import { getModules } from '../../services/trainingService';
import { Video, Plus } from 'lucide-react';

export default function ContenuPage() {
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: () => getModules({ includeInactive: true }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Contenu</h1>
          <p className="text-gray-400">Gérez le contenu de votre plateforme</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition">
          <Plus className="w-4 h-4" />
          Ajouter du contenu
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-center py-8">Chargement du contenu...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <div
              key={module.id}
              className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Video className="w-8 h-8 text-purple-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                    <p className="text-sm text-gray-400">Module de formation</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    module.is_active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {module.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              {module.description && (
                <p className="text-sm text-gray-400 line-clamp-2">{module.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


