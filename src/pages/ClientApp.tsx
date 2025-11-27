import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Sparkles, Grid3X3, List, Filter, Play, Clock, CheckCircle2 } from 'lucide-react';
import { getModules } from '../services/trainingService';
import { getUserProgressSummary } from '../services/progressService';
import TrainingModuleCard from '../components/training/TrainingModuleCard';
import { useSession } from '../hooks/useSession';
import EmptyState from '../components/common/EmptyState';
import { ModuleCardSkeleton } from '../components/common/Skeleton';
import GlassCard from '../components/ui/GlassCard';
import AnimatedProgress from '../components/ui/AnimatedProgress';
import clsx from 'clsx';

const FILTERS = [
  { key: 'all', label: 'Tous', icon: Grid3X3 },
  { key: 'in-progress', label: 'En cours', icon: Clock },
  { key: 'completed', label: 'Terminés', icon: CheckCircle2 },
  { key: 'not-started', label: 'À démarrer', icon: Play },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];
type ViewMode = 'grid' | 'list';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ClientApp() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const {
    data: modules = [],
    isLoading: loadingModules,
    isError,
  } = useQuery({
    queryKey: ['modules', 'client'],
    queryFn: () => getModules(),
    retry: 1,
    retryDelay: 1000,
  });

  const progressSummaryQuery = useQuery({
    queryKey: ['member-progress', user?.id],
    queryFn: () => getUserProgressSummary(user?.id || ''),
    enabled: !!user?.id,
  });

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

  const statsData = useMemo(() => {
    const total = modules.length;
    const completed = modules.filter((m) => moduleProgressMap[m.id]?.completionRate === 100).length;
    const inProgress = modules.filter(
      (m) => {
        const rate = moduleProgressMap[m.id]?.completionRate ?? 0;
        return rate > 0 && rate < 100;
      }
    ).length;
    const notStarted = total - completed - inProgress;
    return { total, completed, inProgress, notStarted };
  }, [modules, moduleProgressMap]);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Espace Formation</h1>
            <p className="text-gray-400">Accède à tes modules et progresse à ton rythme</p>
          </div>
        </div>
      </motion.header>

      {/* Quick Stats */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 p-4">
          <p className="text-sm text-gray-400">Total</p>
          <p className="text-2xl font-bold text-white">{statsData.total}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 p-4">
          <p className="text-sm text-green-400">Terminés</p>
          <p className="text-2xl font-bold text-green-300">{statsData.completed}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 p-4">
          <p className="text-sm text-yellow-400">En cours</p>
          <p className="text-2xl font-bold text-yellow-300">{statsData.inProgress}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20 p-4">
          <p className="text-sm text-gray-400">À démarrer</p>
          <p className="text-2xl font-bold text-gray-300">{statsData.notStarted}</p>
        </div>
      </motion.section>

      {/* Continue Learning CTA */}
      {continueModule ? (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard
            hover
            glow="pink"
            padding="none"
            onClick={handleContinueClick}
            className="overflow-hidden"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-pink-500/10 to-transparent" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />

              <div className="relative p-6 flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-shrink-0">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/30"
                  >
                    <span className="text-3xl">🔥</span>
                  </motion.div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-medium text-pink-400">Reprends où tu t'es arrêté</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{continueLessonTitle}</h3>
                  <p className="text-gray-400">Module : {continueModule.title}</p>
                  <div className="max-w-md">
                    <AnimatedProgress
                      value={continueProgress}
                      color="gradient"
                      size="sm"
                      label="Progression du module"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-shadow"
                >
                  <Play className="w-5 h-5" />
                  Continuer
                </motion.button>
              </div>
            </div>
          </GlassCard>
        </motion.section>
      ) : (
        !loadingModules && !progressSummaryQuery.isLoading && modules.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard hover={false} glow="purple" className="overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">Bienvenue dans ton espace formation ! 🎉</h3>
                  <p className="text-gray-400 mt-1">
                    Commence par explorer les modules ci-dessous et lance-toi dans ta première leçon.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.section>
        )
      )}

      {/* Search & Filters */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un module..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/40 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            {FILTERS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                    filter === item.key
                      ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-lg transition-all',
                viewMode === 'grid' ? 'bg-pink-500/20 text-pink-400' : 'text-gray-400 hover:text-white'
              )}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded-lg transition-all',
                viewMode === 'list' ? 'bg-pink-500/20 text-pink-400' : 'text-gray-400 hover:text-white'
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Modules Grid/List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <h2 className="text-xl font-bold text-white">Tes modules</h2>
            <span className="px-2 py-1 rounded-lg bg-white/10 text-sm text-gray-400">
              {filteredModules.length} module{filteredModules.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {loadingModules || progressSummaryQuery.isLoading ? (
          <div className={clsx(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          )}>
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
                    label: 'Réinitialiser',
                    onClick: () => {
                      setSearch('');
                      setFilter('all');
                    },
                  }
                : undefined
            }
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className={clsx(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              )}
            >
              {filteredModules.map((module, index) => {
                const progress = moduleProgressMap[module.id]?.completionRate ?? 0;
                const isCompleted = progress === 100;
                const isInProgress = progress > 0 && progress < 100;

                if (viewMode === 'list') {
                  return (
                    <motion.div
                      key={module.id}
                      variants={itemVariants}
                      whileHover={{ x: 4 }}
                      onClick={() => handleModuleClick(module.id)}
                      className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/80 to-slate-950/80 p-4 cursor-pointer hover:border-pink-500/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={clsx(
                          'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                          isCompleted
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                            : isInProgress
                            ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
                            : 'bg-gradient-to-br from-gray-600 to-gray-700'
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          ) : (
                            <BookOpen className="w-6 h-6 text-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white group-hover:text-pink-200 transition-colors truncate">
                            {module.title}
                          </h3>
                          {module.description && (
                            <p className="text-sm text-gray-400 truncate">{module.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="w-32 hidden sm:block">
                            <AnimatedProgress
                              value={progress}
                              size="sm"
                              color={isCompleted ? 'green' : 'gradient'}
                              showValue
                              animated={false}
                            />
                          </div>
                          <Play className="w-5 h-5 text-gray-500 group-hover:text-pink-400 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div key={module.id} variants={itemVariants}>
                    <TrainingModuleCard
                      module={module}
                      onClick={() => handleModuleClick(module.id)}
                      progress={progress}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </section>
    </div>
  );
}
