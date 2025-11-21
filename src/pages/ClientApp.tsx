import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Sparkles } from 'lucide-react';
import { getModules } from '../services/trainingService';
import { getUserProgressSummary } from '../services/progressService';
import TrainingModuleCard from '../components/training/TrainingModuleCard';
import { useSession } from '../hooks/useSession';
import EmptyState from '../components/common/EmptyState';
import { ModuleCardSkeleton } from '../components/common/Skeleton';

const FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'in-progress', label: 'En cours' },
  { key: 'completed', label: 'Terminés' },
  { key: 'not-started', label: 'À démarrer' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

export default function ClientApp() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

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

  const progressSummaryQuery = useQuery({
    queryKey: ['member-progress', user?.id],
    queryFn: () => getUserProgressSummary(user?.id || ''),
    enabled: !!user?.id,
  });

  if (modulesError) {
    console.error('[ClientApp] Erreur lors du chargement des modules:', modulesError);
  }

  const moduleProgressMap = useMemo(() => {
    const summary = progressSummaryQuery.data;
    if (!summary) return {};
    return summary.modules.reduce<Record<string, (typeof summary.modules)[number]>>(
      (acc, detail) => {
        acc[detail.moduleId] = detail;
        return acc;
      },
      {},
    );
  }, [progressSummaryQuery.data]);

  const continueInfo = progressSummaryQuery.data?.continueLearning;
  const continueModule = continueInfo
    ? modules.find((module) => module.id === continueInfo.moduleId) ?? null
    : modules[0] ?? null;

  const filteredModules = useMemo(() => {
    const term = search.trim().toLowerCase();
    return modules.filter((module) => {
      const completion = moduleProgressMap[module.id]?.completionRate ?? 0;
      const matchesSearch =
        term.length === 0 ||
        module.title.toLowerCase().includes(term) ||
        (module.description?.toLowerCase().includes(term) ?? false);

      if (!matchesSearch) return false;

      if (filter === 'completed') return completion === 100;
      if (filter === 'in-progress') return completion > 0 && completion < 100;
      if (filter === 'not-started') return completion === 0;
      return true;
    });
  }, [modules, moduleProgressMap, search, filter]);

  const continueLessonTitle =
    continueInfo?.lessonTitle ?? (continueModule ? 'Commencer ce module' : 'Aucun module disponible');
  const continueProgress = continueInfo
    ? continueInfo.completionRate
    : continueModule
    ? moduleProgressMap[continueModule.id]?.completionRate ?? 0
    : 0;

  const handleModuleClick = (moduleId: string) => {
    navigate(`/app/modules/${moduleId}`);
  };

  const handleContinueClick = () => {
    if (continueInfo) {
      navigate(`/app/modules/${continueInfo.moduleId}/lessons/${continueInfo.lessonId}`);
      return;
    }

    if (continueModule) {
      navigate(`/app/modules/${continueModule.id}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2 mb-8">
        <h1 className="text-4xl font-bold">Espace formation</h1>
        <p className="text-gray-400">Accède à tes modules et reprends là où tu t'es arrêté.</p>
      </header>

      {/* Section "Continuer là où tu t'es arrêté" */}
      {continueModule ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            Continuer là où tu t'es arrêté
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-gray-400">Module : {continueModule.title}</p>
              <p className="text-white text-xl font-semibold">{continueLessonTitle}</p>
              <p className="text-sm text-gray-400">{continueProgress}% du module complété</p>
            </div>
            <button
              onClick={handleContinueClick}
              className="inline-flex items-center justify-center rounded-xl bg-pink-500/80 hover:bg-pink-500 px-6 py-3 font-medium text-white transition"
            >
              Reprendre
            </button>
          </div>
        </section>
      ) : (
        !loadingModules && !progressSummaryQuery.isLoading && modules.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-pink-400" />
              Prêt à commencer ?
            </h2>
            <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-r from-pink-500/10 to-purple-500/10 p-6">
              <p className="text-white text-lg font-medium mb-2">
                Bienvenue dans ton espace de formation ! 🎉
              </p>
              <p className="text-gray-300">
                Commence par explorer les modules disponibles ci-dessous et lance-toi dans ta première leçon.
              </p>
            </div>
          </section>
        )
      )}

      {/* Search & Filters */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un module ou une leçon"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`px-4 py-2 rounded-full text-sm border transition ${
                  filter === item.key
                    ? 'bg-pink-500/20 border-pink-400 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section "Tes modules" */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span className="text-2xl">🎬</span>
          Tes modules
        </h2>

        {loadingModules || progressSummaryQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ModuleCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            emoji="⚠️"
            title="Erreur de chargement"
            description="Impossible de charger les modules pour le moment. Veuillez réessayer plus tard."
            action={{
              label: 'Réessayer',
              onClick: () => window.location.reload(),
            }}
          />
        ) : modules.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Aucun module disponible"
            description="Il n'y a pas encore de modules de formation disponibles. Reviens bientôt pour découvrir du nouveau contenu !"
          />
        ) : filteredModules.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucun résultat"
            description={`Aucun module ne correspond à ta recherche "${search}". Essaie avec d'autres mots-clés ou change de filtre.`}
            action={
              search || filter !== 'all'
                ? {
                    label: 'Réinitialiser la recherche',
                    onClick: () => {
                      setSearch('');
                      setFilter('all');
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <TrainingModuleCard
                key={module.id}
                module={module}
                onClick={() => handleModuleClick(module.id)}
                progress={moduleProgressMap[module.id]?.completionRate ?? 0}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
