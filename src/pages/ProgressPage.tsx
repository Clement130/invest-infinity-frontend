import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useSession } from '../hooks/useSession';
import { getUserStats } from '../services/memberStatsService';
import { useUserProgressSummary } from '../hooks/useTraining';
import ProgressChecklist from '../components/member/ProgressChecklist';
import XpTrackMeter from '../components/member/XpTrackMeter';
import EmptyState from '../components/common/EmptyState';
import { StatCardSkeleton } from '../components/common/Skeleton';
import GlassCard from '../components/ui/GlassCard';
import AnimatedProgress from '../components/ui/AnimatedProgress';
import { getModules } from '../services/trainingService';
import {
  TrendingUp,
  Award,
  BookOpen,
  Clock,
  Trophy,
  CheckCircle2,
} from 'lucide-react';

// Animation variants pour le container principal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Animation variants pour les éléments enfants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ============================================================================
// COMPOSANT: StatCard - Carte de statistique individuelle (mobile-first)
// ============================================================================
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  value: string | number;
  label: string;
  subValue?: string;
}

function StatCard({ icon: Icon, iconColor, value, label, subValue }: StatCardProps) {
  return (
    <div className="text-center p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
      <div className="flex items-center justify-center mb-1.5 sm:mb-2">
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
      </div>
      <p className="text-lg sm:text-2xl font-bold text-white leading-tight">{value}</p>
      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{label}</p>
      {subValue && <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{subValue}</p>}
    </div>
  );
}

// ============================================================================
// COMPOSANT: ProgressCircle - Cercle de progression globale (responsive)
// ============================================================================
interface ProgressCircleProps {
  progress: number;
}

function ProgressCircle({ progress }: ProgressCircleProps) {
  return (
    // Container avec taille adaptée aux petits écrans
    <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
        {/* Cercle de fond */}
        <circle
          cx="96"
          cy="96"
          r="85"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className="text-slate-800"
        />
        {/* Cercle de progression animé */}
        <motion.circle
          cx="96"
          cy="96"
          r="85"
          stroke="url(#progressGradient2)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: '0 534' }}
          animate={{ strokeDasharray: `${(progress / 100) * 534} 534` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="progressGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      {/* Contenu central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white"
        >
          {progress}%
        </motion.span>
        <span className="text-[10px] sm:text-xs md:text-sm text-gray-400">Progression</span>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL: ProgressPage
// ============================================================================
export default function ProgressPage() {
  const { user } = useSession();
  
  // Timeout de sécurité pour éviter le chargement infini
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn('[ProgressPage] Timeout de chargement atteint après 10 secondes');
      setLoadingTimeout(true);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [user?.id]);

  const statsQuery = useQuery({
    queryKey: ['member-stats', user?.id],
    queryFn: () => getUserStats(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  const modulesQuery = useQuery({
    queryKey: ['modules', 'client'],
    queryFn: () => getModules(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  const progressSummaryQuery = useUserProgressSummary(user?.id);

  const stats = statsQuery.data;
  const modules = modulesQuery.data || [];
  const progressSummary = progressSummaryQuery.data;
  
  const moduleProgressMap = useMemo(() => {
    if (!progressSummary) return {};
    return progressSummary.modules.reduce<Record<string, (typeof progressSummary.modules)[number]>>(
      (acc, detail) => {
        acc[detail.moduleId] = detail;
        return acc;
      },
      {},
    );
  }, [progressSummary]);

  // Calculer la progression globale à partir des données réelles de progression
  const globalProgress = useMemo(() => {
    // Logs de débogage
    console.log('[ProgressPage] Calcul de la progression globale:', {
      hasProgressSummary: !!progressSummary,
      modulesLength: modules.length,
      progressSummaryModules: progressSummary?.modules?.length || 0,
      completedLessonIds: progressSummary?.completedLessonIds?.length || 0,
    });

    if (!progressSummary) {
      console.log('[ProgressPage] Pas de progressSummary, retour 0');
      return 0;
    }

    if (!modules.length) {
      console.log('[ProgressPage] Pas de modules, retour 0');
      return 0;
    }
    
    // Utiliser directement completedLessonIds pour être sûr d'avoir le bon nombre
    const totalCompleted = progressSummary.completedLessonIds.length;
    
    // Calculer le total de leçons depuis tous les modules (même ceux sans leçons)
    // Utiliser progressSummary.modules qui contient déjà le bon total par module
    const totalLessons = progressSummary.modules.reduce(
      (sum, module) => sum + (module.totalLessons || 0),
      0
    );
    
    console.log('[ProgressPage] Détails du calcul:', {
      totalCompleted,
      totalLessons,
      modulesDetails: progressSummary.modules.map(m => ({
        moduleId: m.moduleId,
        moduleTitle: m.moduleTitle,
        totalLessons: m.totalLessons,
        completedLessons: m.completedLessons,
      })),
    });
    
    // Si aucun module n'a de leçons, retourner 0
    if (totalLessons === 0) {
      console.log('[ProgressPage] Aucune leçon trouvée, retour 0');
      return 0;
    }
    
    // Calculer le pourcentage arrondi
    const percentage = (totalCompleted / totalLessons) * 100;
    const rounded = Math.round(percentage);
    console.log('[ProgressPage] Progression calculée:', { percentage, rounded });
    return rounded;
  }, [progressSummary, modules]);

  const xpTracks = stats?.xpTracks ?? [];

  // Vérifier si les queries sont en chargement
  // Si user n'est pas défini, les queries dépendantes de user ne sont pas activées
  // donc on ne doit pas les considérer comme "loading"
  // Si timeout atteint, considérer le chargement comme terminé
  const isLoading = loadingTimeout ? false : (
    modulesQuery.isLoading || 
    (!!user?.id && (statsQuery.isLoading || progressSummaryQuery.isLoading))
  );

  return (
    // Container principal - padding-bottom pour le chatbot flottant sur mobile
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-20 sm:pb-8">
      
      {/* ================================================================== */}
      {/* HEADER - Mobile-first compact */}
      {/* ================================================================== */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Icône du header - plus petite sur mobile */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 flex-shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">Ma Progression</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-400 leading-tight">Suis ton évolution</p>
          </div>
        </div>
      </motion.header>

      {/* ================================================================== */}
      {/* ÉTATS DE CHARGEMENT / ERREUR / VIDE */}
      {/* ================================================================== */}
      {isLoading ? (
        <div className="space-y-4">
          {/* Skeleton responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : !user ? (
        <EmptyState
          emoji="🔒"
          title="Session expirée"
          description="Veuillez vous reconnecter pour voir votre progression."
        />
      ) : modules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Aucun module disponible"
          description="Reviens bientôt pour commencer ton apprentissage !"
        />
      ) : (
        /* ================================================================ */
        /* CONTENU PRINCIPAL - Layout mobile-first */
        /* ================================================================ */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4 sm:space-y-6 md:space-y-8"
        >
          {/* ============================================================ */}
          {/* SECTION 1: Progress Overview (Cercle + Stats) */}
          {/* ============================================================ */}
          <motion.section variants={itemVariants}>
            <GlassCard hover={false} glow="none" className="overflow-hidden">
              {/* Layout: toujours colonne sur mobile/tablette, row sur lg+ */}
              <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:gap-8">
                
                {/* Cercle de progression - centré */}
                <div className="flex-shrink-0 py-2">
                  <ProgressCircle progress={globalProgress} />
                </div>

                {/* Grille de stats - 2x2 sur mobile, 4 colonnes sur md+ */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  <StatCard
                    icon={BookOpen}
                    iconColor="text-blue-400"
                    value={`${progressSummary 
                      ? progressSummary.modules.filter(m => m.isCompleted).length 
                      : stats?.completedModules || 0}/${modules.length}`}
                    label="Modules"
                  />

                  <StatCard
                    icon={CheckCircle2}
                    iconColor="text-green-400"
                    value={`${progressSummary 
                      ? progressSummary.completedLessonIds.length
                      : stats?.completedLessons || 0}/${progressSummary 
                      ? progressSummary.modules.reduce((sum, m) => sum + m.totalLessons, 0)
                      : stats?.totalLessons || 0}`}
                    label="Leçons"
                  />

                  <StatCard
                    icon={Clock}
                    iconColor="text-purple-400"
                    value={`${Math.floor((stats?.totalTimeSpent || 0) / 60)}h`}
                    label="Temps"
                  />

                  <StatCard
                    icon={Award}
                    iconColor="text-yellow-400"
                    value={stats?.level || 1}
                    label="Niveau"
                    subValue={`${stats?.xp || 0} XP`}
                  />
                </div>
              </div>
            </GlassCard>
          </motion.section>

          {/* ============================================================ */}
          {/* SECTION 2: Maîtrise par compétence (XP Tracks) */}
          {/* ============================================================ */}
          {xpTracks.length > 0 && (
            <motion.section variants={itemVariants}>
              <GlassCard hover={false} glow="none">
                {/* Header de section - compact sur mobile */}
                <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm sm:text-base md:text-lg font-bold text-white leading-tight">Maîtrise par compétence</h2>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 leading-tight">
                      Ton XP sur chaque axe ICT
                    </p>
                  </div>
                </div>
                <XpTrackMeter tracks={xpTracks} compact />
              </GlassCard>
            </motion.section>
          )}

          {/* ============================================================ */}
          {/* SECTION 3: Progression de niveau */}
          {/* ============================================================ */}
          {stats && (
            <motion.section variants={itemVariants}>
              <GlassCard hover={false} glow="none">
                {/* Header de section - compact sur mobile */}
                <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm sm:text-base md:text-lg font-bold text-white leading-tight">Progression de niveau</h2>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 leading-tight">
                      {stats.nextLevelXp - stats.xp} XP → niveau {stats.level + 1}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                  <AnimatedProgress
                    value={stats.xp}
                    max={stats.nextLevelXp}
                    label={`Niveau ${stats.level} → ${stats.level + 1}`}
                    color="gradient"
                    size="lg"
                    showValue
                  />

                  {/* Stats XP - 3 colonnes compactes */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-3 pt-3 sm:pt-4 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-gray-400">Actuel</p>
                      <p className="text-sm sm:text-base md:text-xl font-bold text-white">{stats.xp.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-gray-400">Prochain</p>
                      <p className="text-sm sm:text-base md:text-xl font-bold text-purple-400">
                        {stats.nextLevelXp.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-gray-400">Restant</p>
                      <p className="text-sm sm:text-base md:text-xl font-bold text-pink-400">
                        {(stats.nextLevelXp - stats.xp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.section>
          )}

          {/* ============================================================ */}
          {/* SECTION 4: Checklist des modules */}
          {/* ============================================================ */}
          <motion.section variants={itemVariants}>
            <GlassCard hover={false} glow="none">
              <ProgressChecklist modules={modules} moduleProgress={moduleProgressMap} />
            </GlassCard>
          </motion.section>
        </motion.div>
      )}
    </div>
  );
}
