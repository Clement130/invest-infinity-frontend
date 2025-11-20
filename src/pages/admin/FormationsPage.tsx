import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { getModules } from '../../services/trainingService';
import type { TrainingModule } from '../../types/training';

export default function FormationsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: () => getModules({ includeInactive: true }),
  });

  const filteredModules = useMemo(() => {
    if (!searchQuery) return modules;
    const query = searchQuery.toLowerCase();
    return modules.filter(
      (m) =>
        m.title?.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
    );
  }, [modules, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Formations</h1>
        <p className="text-gray-400">Gérez vos modules de formation</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-white"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-center py-8">Chargement des modules...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      )}
      {filteredModules.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          {searchQuery ? 'Aucun module trouvé' : 'Aucun module'}
        </div>
      )}
    </div>
  );
}

function ModuleCard({ module }: { module: TrainingModule }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-white line-clamp-2">{module.title}</h3>
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
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Position: {module.position || '-'}</span>
        {module.created_at && (
          <span>{new Date(module.created_at).toLocaleDateString('fr-FR')}</span>
        )}
      </div>
    </div>
  );
}


