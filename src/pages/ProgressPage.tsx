import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useSession } from '../hooks/useSession';
import { getUserStats } from '../services/memberStatsService';
import { getUserProgressSummary } from '../services/progressService';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ProgressPage() {
  const { user } = useSession();

  const statsQuery = useQuery({
    queryKey: ['member-stats', user?.id],
    queryFn: () => getUserStats(user?.id || ''),
    enabled: !!user?.id,
  });

  const modulesQuery = useQuery({
    queryKey: ['modules', 'client'],
    queryFn: () => getModules(),
  });

  const progressSummaryQuery = useQuery({
    queryKey: ['member-progress', user?.id],
    queryFn: () => getUserProgressSummary(user?.id || ''),
    enabled: !!user?.id,
  });

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
    if (!progressSummary || !modules.length) return 0;
    
    // Utiliser directement completedLessonIds pour être sûr d'avoir le bon nombre
    const totalCompleted = progressSummary.completedLessonIds.length;
    
    // Calculer le total de leçons depuis tous les modules (même ceux sans leçons)
    // Utiliser progressSummary.modules qui contient déjà le bon total par module
    const totalLessons = progressSummary.modules.reduce(
      (sum, module) => sum + (module.totalLessons || 0),
      0
    );
    
    // Si aucun module n'a de leçons, retourner 0
    if (totalLessons === 0) return 0;
    
    // Calculer le pourcentage arrondi
    const percentage = (totalCompleted / totalLessons) * 100;
    return Math.round(percentage);
  }, [progressSummary, modules]);

  const xpTracks = stats?.xpTracks ?? [];

  const isLoading = statsQuery.isLoading || progressSummaryQuery.isLoading || modulesQuery.isLoading;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Ma Progression</h1>
            <p className="text-gray-400">Suis ton évolution et tes accomplissements</p>
          </div>
        </div>
      </motion.header>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : !user ? (
        <EmptyState
          emoji="🔒"
          title="Session expirée"
          description="Votre session a expiré. Veuillez vous reconnecter pour voir votre progression."
        />
      ) : modules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Aucun module disponible"
          description="Il n'y a pas encore de modules de formation disponibles. Reviens bientôt pour commencer ton apprentissage !"
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Progress Overview */}
          <motion.section variants={itemVariants}>
            <GlassCard hover={false} glow="none" className="overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                {/* Progress Circle */}
                <div className="flex-shrink-0">
                  <div className="relative w-48 h-48 mx-auto lg:mx-0">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="85"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-slate-800"
                      />
                      <motion.circle
                        cx="96"
                        cy="96"
                        r="85"
                        stroke="url(#progressGradient2)"
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: '0 534' }}
                        animate={{ strokeDasharray: `${(globalProgress / 100) * 534} 534` }}
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                        className="text-5xl font-bold text-white"
                      >
                        {globalProgress}%
                      </motion.span>
                      <span className="text-sm text-gray-400">Progression globale</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {progressSummary 
                        ? progressSummary.modules.filter(m => m.isCompleted).length 
                        : stats?.completedModules || 0}/{modules.length}
                    </p>
                    <p className="text-xs text-gray-400">Modules</p>
                  </div>

                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {progressSummary 
                        ? progressSummary.completedLessonIds.length
                        : stats?.completedLessons || 0}/{progressSummary 
                        ? progressSummary.modules.reduce((sum, m) => sum + m.totalLessons, 0)
                        : stats?.totalLessons || 0}
                    </p>
                    <p className="text-xs text-gray-400">Leçons</p>
                  </div>

                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {Math.floor((stats?.totalTimeSpent || 0) / 60)}h
                    </p>
                    <p className="text-xs text-gray-400">Temps total</p>
                  </div>

                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stats?.level || 1}</p>
                    <p className="text-xs text-gray-400">Niveau actuel</p>
                    <p className="text-sm text-gray-500 mt-1">{stats?.xp || 0} XP</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.section>

          {xpTracks.length > 0 && (
            <motion.section variants={itemVariants}>
              <GlassCard hover={false} glow="none">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Maîtrise par compétence</h2>
                    <p className="text-sm text-gray-400">
                      Visualise ton XP sur chaque axe clé de la méthode ICT
                    </p>
                  </div>
                </div>
                <XpTrackMeter tracks={xpTracks} compact />
              </GlassCard>
            </motion.section>
          )}

          {/* Level Progress */}
          {stats && (
            <motion.section variants={itemVariants}>
              <GlassCard hover={false} glow="none">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Progression de niveau</h2>
                    <p className="text-sm text-gray-400">
                      {stats.nextLevelXp - stats.xp} XP avant le niveau {stats.level + 1}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <AnimatedProgress
                    value={stats.xp}
                    max={stats.nextLevelXp}
                    label={`Niveau ${stats.level} → Niveau ${stats.level + 1}`}
                    color="gradient"
                    size="lg"
                    showValue
                  />

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">XP actuel</p>
                      <p className="text-xl font-bold text-white">{stats.xp.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Prochain niveau</p>
                      <p className="text-xl font-bold text-purple-400">
                        {stats.nextLevelXp.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">XP restant</p>
                      <p className="text-xl font-bold text-pink-400">
                        {(stats.nextLevelXp - stats.xp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.section>
          )}

          {/* Module Progress */}
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
