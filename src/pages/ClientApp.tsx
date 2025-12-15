/**
 * ClientApp - Espace Formation refactorisé
 * 
 * Structure:
 * 1. FormationHeader - Header hero avec stats
 * 2. ContinueModuleCard - Reprise de progression
 * 3. ModulesFilters - Recherche et filtres
 * 4. ModuleCards - Grille/Liste de modules
 * 
 * Mobile-first:
 * - Stack vertical avec respiration
 * - Cards en colonne sur mobile
 * - Filtres en scroll horizontal
 * - pb-24 pour éviter le chatbot
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, Play, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { getModules } from '../services/trainingService';
import { getUserProgressSummary } from '../services/progressService';
import { useSession } from '../hooks/useSession';
import { useEntitlements, useHasLicense } from '../hooks/useEntitlements';
import clsx from 'clsx';

// Components
import FormationHeader from '../components/training/FormationHeader';
import ContinueModuleCard from '../components/training/ContinueModuleCard';
import ModulesFilters, { type FilterKey, type ViewMode } from '../components/training/ModulesFilters';
import TrainingModuleCard from '../components/training/TrainingModuleCard';
import EmptyState from '../components/common/EmptyState';
import { ModuleCardSkeleton } from '../components/common/Skeleton';
import AnimatedProgress from '../components/ui/AnimatedProgress';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    }
  },
};

export default function ClientApp() {
  const navigate = useNavigate();
  const { user, profile } = useSession();
  const entitlements = useEntitlements();
  const hasLicense = useHasLicense();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Timeout de sécurité pour éviter le chargement infini
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const loadingStartRef = useRef<number>(Date.now());
  
  useEffect(() => {
    loadingStartRef.current = Date.now();
    setLoadingTimeout(false);
    
    const timer = setTimeout(() => {
      console.warn('[ClientApp] Timeout de chargement atteint après 10 secondes');
      setLoadingTimeout(true);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch modules
  const {
    data: modules = [],
    isLoading: loadingModulesQuery,
    isError,
  } = useQuery({
    queryKey: ['modules', 'client'],
    queryFn: () => getModules(),
    retry: 1,
    retryDelay: 1000,
  });

  const loadingModules = loadingTimeout ? false : loadingModulesQuery;

  // Fetch progress
  const progressSummaryQuery = useQuery({
    queryKey: ['member-progress', user?.id],
    queryFn: () => getUserProgressSummary(user?.id || ''),
    enabled: !!user?.id,
  });

  // Map progress by module
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

  // Continue learning info
  const continueInfo = progressSummaryQuery.data?.continueLearning;
  const continueModule = continueInfo
    ? modules.find((module) => module.id === continueInfo.moduleId) ?? null
    : modules[0] ?? null;

  // Filter modules avec vérification des entitlements
  const filteredModules = useMemo(() => {
    const term = search.trim().toLowerCase();
    
    // Filtrer d'abord par entitlements (droits d'accès)
    const accessibleModules = entitlements.accessibleModules(modules);
    
    return accessibleModules.filter((module) => {
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
  }, [modules, moduleProgressMap, search, filter, entitlements]);

  // Continue lesson info
  const continueLessonTitle =
    continueInfo?.lessonTitle ?? (continueModule ? 'Commencer ce module' : 'Aucun module disponible');
  const continueProgress = continueInfo
    ? continueInfo.completionRate
    : continueModule
    ? moduleProgressMap[continueModule.id]?.completionRate ?? 0
    : 0;

  // Stats data
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

  // Handlers
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

  const userName = profile?.full_name?.split(' ')[0];
  const isFirstTime = !continueInfo && modules.length > 0;

  return (
    // Mobile-first layout:
    // - pb-28 pour éviter le chevauchement avec le chatbot ET la BottomNav sur mobile
    // - w-full et overflow-x-hidden pour éviter le scroll horizontal
    // - space-y-4 mobile pour respiration compacte
    <div className="space-y-4 sm:space-y-5 lg:space-y-8 pb-28 lg:pb-8 w-full max-w-full overflow-x-hidden">
      {/* Header Hero */}
      <FormationHeader 
        stats={statsData}
        userName={userName}
      />

      {/* Continue Learning CTA - Seulement si l'utilisateur a une offre active */}
      {continueModule && hasLicense && (
        <ContinueModuleCard
          moduleTitle={continueModule.title}
          lessonTitle={continueLessonTitle}
          progress={continueProgress}
          lessonsCount={continueModule.lessons_count}
          onClick={handleContinueClick}
          isFirstTime={isFirstTime}
        />
      )}

      {/* Welcome message for new users without progress */}
      {!continueModule && !loadingModules && !progressSummaryQuery.isLoading && modules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/10 p-6 sm:p-8"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full md:blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
              <span className="text-3xl">🎉</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Bienvenue dans ton espace formation !
              </h3>
              <p className="text-gray-400 mt-2">
                Commence par explorer les modules ci-dessous et lance-toi dans ta première leçon.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search & Filters */}
      <ModulesFilters
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filteredCount={filteredModules.length}
        totalCount={modules.length}
      />

      {/* Modules Section */}
      <section className="space-y-5 sm:space-y-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0"
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-xl sm:text-2xl lg:text-3xl">🎬</span>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Tes modules</h2>
            <span className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-white/10 text-xs sm:text-sm text-gray-400 font-medium">
              {filteredModules.length} module{filteredModules.length > 1 ? 's' : ''}
            </span>
          </div>
        </motion.div>

        {/* Loading State */}
        {loadingModules || progressSummaryQuery.isLoading ? (
          <div className={clsx(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
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
                    label: 'Réinitialiser les filtres',
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
              key={`${viewMode}-${filter}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className={clsx(
                viewMode === 'grid'
                  // Mobile: 1 colonne, SM: 2 colonnes, LG: 3 colonnes
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
                  : 'space-y-4'
              )}
            >
              {filteredModules.map((module, index) => {
                const progress = moduleProgressMap[module.id]?.completionRate ?? 0;
                const isCompleted = progress === 100;
                const isInProgress = progress > 0 && progress < 100;
                const lastLesson = moduleProgressMap[module.id]?.lastLessonTitle;

                // List view
                if (viewMode === 'list') {
                  return (
                    <motion.div
                      key={module.id}
                      variants={itemVariants}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleModuleClick(module.id)}
                      className={clsx(
                        'group relative overflow-hidden rounded-xl sm:rounded-2xl',
                        'border border-white/10 bg-gradient-to-r from-slate-900/80 to-slate-950/80',
                        'p-4 sm:p-5 cursor-pointer',
                        'hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/10',
                        'transition-all duration-300'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={clsx(
                          'w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg',
                          isCompleted
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20'
                            : isInProgress
                            ? 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-yellow-500/20'
                            : 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-pink-500/20'
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          ) : isInProgress ? (
                            <Clock className="w-6 h-6 text-white" />
                          ) : (
                            <BookOpen className="w-6 h-6 text-white" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white group-hover:text-pink-200 transition-colors truncate">
                            {module.title}
                          </h3>
                          {module.description && (
                            <p className="text-sm text-gray-400 truncate mt-0.5">{module.description}</p>
                          )}
                          {/* Mobile: show progress inline */}
                          <div className="sm:hidden mt-2">
                            <AnimatedProgress
                              value={progress}
                              size="sm"
                              color={isCompleted ? 'green' : 'gradient'}
                              showValue
                              animated={false}
                            />
                          </div>
                        </div>

                        {/* Desktop: Progress + Arrow */}
                        <div className="hidden sm:flex items-center gap-4">
                          <div className="w-32">
                            <AnimatedProgress
                              value={progress}
                              size="sm"
                              color={isCompleted ? 'green' : 'gradient'}
                              showValue
                              animated={false}
                            />
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                // Grid view - use TrainingModuleCard
                return (
                  <motion.div key={module.id} variants={itemVariants}>
                    <TrainingModuleCard
                      module={module}
                      onClick={() => handleModuleClick(module.id)}
                      progress={progress}
                      lastLessonTitle={lastLesson}
                      // Mark first uncompleted module as recommended
                      isRecommended={index === 0 && !isCompleted && !isInProgress}
                      // Mark modules with 0% as "new" if user has progress elsewhere
                      isNew={progress === 0 && statsData.inProgress > 0}
                      // Mark essential modules (could be based on module data)
                      isEssential={(module as any).is_essential}
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
