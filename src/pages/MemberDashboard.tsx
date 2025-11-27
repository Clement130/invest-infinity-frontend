import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useSession } from '../hooks/useSession';
import {
  getUserStats,
  getActiveChallenges,
  getUpcomingEvents,
} from '../services/memberStatsService';
import { getUserProgressSummary } from '../services/progressService';
import ProgressChecklist from '../components/member/ProgressChecklist';
import EventsCalendar from '../components/member/EventsCalendar';
import BadgesDisplay from '../components/member/BadgesDisplay';
import ChallengesList from '../components/member/ChallengesList';
import EmptyState from '../components/common/EmptyState';
import { DashboardSkeleton } from '../components/common/Skeleton';
import StatCard from '../components/ui/StatCard';
import GlassCard from '../components/ui/GlassCard';
import AnimatedProgress from '../components/ui/AnimatedProgress';
import XpTrackMeter from '../components/member/XpTrackMeter';
import DailyGoalsCard from '../components/member/DailyGoalsCard';
import EconomyTimeline from '../components/economy/EconomyTimeline';
import {
  TrendingUp,
  BookOpen,
  Clock,
  Award,
  Target,
  Rocket,
  Flame,
  Play,
  ChevronRight,
  Sparkles,
  Zap,
  Trophy,
  Snowflake,
  Coins,
  Mail,
  Smartphone,
} from 'lucide-react';
import { getModules } from '../services/trainingService';
import clsx from 'clsx';
import { claimQuestReward } from '../services/questsService';

// Hook pour la détection mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Composant mobile ultra-simplifié
function MobileDashboard({
  isLoading,
  user,
  firstName,
  globalProgress,
  continueLearning,
  navigate,
}: {
  isLoading: boolean;
  user: any;
  firstName: string;
  globalProgress: number;
  continueLearning: any;
  navigate: (path: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState
        emoji="🔒"
        title="Session expirée"
        description="Veuillez vous reconnecter."
        action={{
          label: 'Se reconnecter',
          onClick: () => navigate('/login'),
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header mobile simplifié */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Smartphone className="w-5 h-5 text-pink-400" />
          <span className="text-sm text-gray-400">Mode Mobile</span>
        </div>
        <h1 className="text-xl font-bold text-white">
          Bonjour {firstName} !
        </h1>
        <p className="text-sm text-gray-400">
          {globalProgress}% complété
        </p>
      </div>

      {/* CTA principal simplifié */}
      {continueLearning && (
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/app/modules/${continueLearning.moduleId}/lessons/${continueLearning.lessonId}`)}
          className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl p-4 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-500/30 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-pink-300" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white line-clamp-1">
                {continueLearning.lessonTitle}
              </div>
              <div className="text-xs text-gray-400">
                Continuer
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </motion.div>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/app/modules')}
          className="bg-white/5 hover:bg-white/10 rounded-xl p-4 text-center transition-colors"
        >
          <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-400" />
          <div className="text-sm font-medium text-white">Modules</div>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/app/progress')}
          className="bg-white/5 hover:bg-white/10 rounded-xl p-4 text-center transition-colors"
        >
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
          <div className="text-sm font-medium text-white">Progrès</div>
        </motion.button>
      </div>

      {/* Discord CTA mobile */}
      <a
        href="https://discord.gg/Y9RvKDCrWH"
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/30 rounded-xl p-4 text-center transition-colors"
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">💬</span>
          <span className="text-sm font-medium text-[#5865F2]">Rejoindre Discord</span>
        </div>
      </a>
    </motion.div>
  );
}

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

export default function MemberDashboard() {
  const { user, profile } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const statsQuery = useQuery({
    queryKey: ['member-stats', user?.id],
    queryFn: () => getUserStats(user?.id || ''),
    enabled: !!user?.id,
  });

  const claimQuestMutation = useMutation({
    mutationFn: (questId: string) => claimQuestReward(questId, user?.id || ''),
    onMutate: (questId) => {
      setClaimingQuestId(questId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-stats', user?.id] });
    },
    onSettled: () => {
      setClaimingQuestId(null);
    },
  });

  // Queries optimisées pour mobile - paresseuses
  const challengesQuery = useQuery({
    queryKey: ['member-challenges', user?.id],
    queryFn: () => getActiveChallenges(user?.id || ''),
    enabled: !!user?.id && !isMobile, // Désactivé sur mobile
  });

  const eventsQuery = useQuery({
    queryKey: ['member-events', user?.id],
    queryFn: () => getUpcomingEvents(user?.id || ''),
    enabled: !!user?.id && !isMobile, // Désactivé sur mobile
  });

  const modulesQuery = useQuery({
    queryKey: ['modules', 'client'],
    queryFn: () => getModules(),
    enabled: !isMobile, // Désactivé sur mobile, chargé à la demande
  });

  const progressQuery = useQuery({
    queryKey: ['member-progress', user?.id],
    queryFn: () => getUserProgressSummary(user?.id || ''),
    enabled: !!user?.id && !isMobile, // Désactivé sur mobile
  });

  const stats = statsQuery.data;
  const challenges = challengesQuery.data || [];
  const events = eventsQuery.data || [];
  const modules = modulesQuery.data || [];
  const progressSummary = progressQuery.data;

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

  const continueLearning = progressSummary?.continueLearning;

  const recommendedModules = useMemo(() => {
    return modules
      .map((module) => ({
        module,
        completion: moduleProgressMap[module.id]?.completionRate ?? 0,
        nextLesson: moduleProgressMap[module.id]?.nextLessonTitle,
      }))
      .filter((item) => item.completion < 100)
      .sort((a, b) => b.completion - a.completion)
      .slice(0, 3);
  }, [modules, moduleProgressMap]);

  const isLoading =
    statsQuery.isLoading ||
    (challengesQuery.isLoading && !isMobile) ||
    (eventsQuery.isLoading && !isMobile) ||
    (modulesQuery.isLoading && !isMobile) ||
    (progressQuery.isLoading && !isMobile);

  const firstName = profile?.full_name?.split(' ')[0] || 'Trader';
  const streak = stats?.streak || 7;
  const globalProgress = stats
    ? Math.round((stats.completedLessons / Math.max(stats.totalLessons, 1)) * 100)
    : 0;
  const xpTracks = stats?.xpTracks ?? [];
  const dailyQuests = stats?.dailyQuests ?? [];
  const freezePasses = stats?.freezePasses ?? 0;
  const walletBalance = stats?.walletBalance ?? 0;
  const totalCoinsEarned = stats?.totalCoinsEarned ?? 0;
  const activeBooster = stats?.activeBooster ?? null;

  // Version mobile ultra-simplifiée
  if (isMobile) {
    return (
      <div className="space-y-6 pb-6">
        <MobileDashboard
          isLoading={isLoading}
          user={user}
          firstName={firstName}
          globalProgress={globalProgress}
          continueLearning={continueLearning}
          navigate={navigate}
        />
      </div>
    );
  }

  // Version desktop complète
  return (
    <div className="space-y-8 pb-8">
        {isLoading ? (
          <DashboardSkeleton />
        ) : !user ? (
          <EmptyState
            emoji="🔒"
            title="Session expirée"
            description="Votre session a expiré. Veuillez vous reconnecter pour accéder à votre dashboard."
            action={{
              label: 'Se reconnecter',
              onClick: () => navigate('/login'),
            }}
          />
        ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
          style={{ willChange: isMobile ? 'auto' : 'transform' }} // Optimisation mobile
        >
          {/* Hero Section */}
          <motion.section variants={itemVariants} className="relative overflow-hidden">
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-white/10 p-6 md:p-8">
              {/* Background effects - simplifiés sur mobile */}
              {!isMobile && (
                <>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-conic from-pink-500/5 via-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
                </>
              )}
              {isMobile && (
                <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 rounded-full blur-2xl" />
              )}

              <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30"
                    >
                      <Zap className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-gray-400 text-sm">Bienvenue,</p>
                      <h1 className="text-2xl md:text-3xl font-bold text-white">
                        {firstName} !
                      </h1>
                    </div>
                  </div>

                  <p className="text-gray-400 max-w-lg">
                    Tu as complété <span className="text-pink-400 font-semibold">{globalProgress}%</span> de ta formation.
                    {globalProgress < 50
                      ? ' Continue comme ça, tu es sur la bonne voie ! 🚀'
                      : globalProgress < 100
                      ? ' Excellent travail, tu approches du but ! 💪'
                      : ' Félicitations, tu as tout terminé ! 🎉'}
                  </p>

                  {/* Quick Stats Row - simplifié sur mobile */}
                  <div className={`flex flex-wrap items-center gap-3 md:gap-4 pt-2 ${isMobile ? 'justify-center' : ''}`}>
                    <div className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <Flame className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                      <span className="text-orange-300 font-bold text-sm md:text-base">{streak}</span>
                      <span className="text-orange-400/70 text-xs md:text-sm">jours</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                      <span className="text-yellow-300 font-bold text-sm md:text-base">Niv. {stats?.level || 1}</span>
                    </div>
                    {!isMobile && (
                      <>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                          <Award className="w-5 h-5 text-purple-400" />
                          <span className="text-purple-300 font-bold">{stats?.badges?.filter(b => b.unlockedAt)?.length || 0}</span>
                          <span className="text-purple-400/70 text-sm">badges</span>
                        </div>
                        {freezePasses > 0 && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Snowflake className="w-5 h-5 text-blue-300" />
                            <span className="text-blue-200 font-bold">{freezePasses}</span>
                            <span className="text-blue-200/70 text-sm">Freeze pass</span>
                          </div>
                        )}
                        {activeBooster && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/15 border border-pink-500/30">
                            <Sparkles className="w-5 h-5 text-pink-200" />
                            <span className="text-pink-100 font-bold">
                              x{activeBooster.multiplier.toFixed(1)} XP
                            </span>
                            <span className="text-pink-100/70 text-sm">{activeBooster.remainingMinutes} min</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Global Progress Circle - simplifié sur mobile */}
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto lg:mx-0">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx={isMobile ? "64" : "80"}
                        cy={isMobile ? "64" : "80"}
                        r={isMobile ? "58" : "70"}
                        stroke="currentColor"
                        strokeWidth={isMobile ? "6" : "8"}
                        fill="none"
                        className="text-slate-800"
                      />
                      <motion.circle
                        cx={isMobile ? "64" : "80"}
                        cy={isMobile ? "64" : "80"}
                        r={isMobile ? "58" : "70"}
                        stroke="url(#progressGradient)"
                        strokeWidth={isMobile ? "6" : "8"}
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: '0 440' }}
                        animate={{ strokeDasharray: `${(globalProgress / 100) * (isMobile ? 364 : 440)} 440` }}
                        transition={{ duration: isMobile ? 0.8 : 1.5, ease: 'easeOut' }}
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`font-bold text-white ${isMobile ? 'text-2xl' : 'text-4xl'}`}>{globalProgress}%</span>
                      <span className="text-xs md:text-sm text-gray-400">Complété</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Continue Learning CTA */}
          {continueLearning && (
            <motion.section variants={itemVariants}>
              <GlassCard
                hover
                glow="pink"
                padding="none"
                onClick={() =>
                  navigate(
                    `/app/modules/${continueLearning.moduleId}/lessons/${continueLearning.lessonId}`
                  )
                }
                className="overflow-hidden"
              >
                <div className="relative">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 via-purple-600/10 to-transparent" />
                  
                  <div className="relative p-6 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        <span className="text-sm font-medium text-pink-400">Continuer la formation</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {continueLearning.lessonTitle}
                      </h3>
                      <p className="text-gray-400">
                        Module : {continueLearning.moduleTitle}
                      </p>
                      <AnimatedProgress
                        value={continueLearning.completionRate}
                        color="gradient"
                        size="sm"
                        showValue={false}
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-shadow"
                    >
                      <Play className="w-5 h-5" />
                      Reprendre
                    </motion.button>
                  </div>
                </div>
              </GlassCard>
            </motion.section>
          )}

          {/* Stats Grid - Optimisé pour mobile */}
          <motion.section variants={itemVariants}>
            <div className={`grid gap-3 md:gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
              <StatCard
                icon={BookOpen}
                label="Modules"
                value={`${stats?.completedModules || 0}/${stats?.totalModules || 0}`}
                color="blue"
                delay={isMobile ? 0 : 0}
              />
              <StatCard
                icon={TrendingUp}
                label="Leçons"
                value={`${stats?.completedLessons || 0}/${stats?.totalLessons || 0}`}
                color="purple"
                delay={isMobile ? 0 : 0.1}
              />
              {!isMobile && (
                <>
                  <StatCard
                    icon={Coins}
                    label="Coins"
                    value={walletBalance.toLocaleString()}
                    color="orange"
                    delay={0.2}
                  />
                  {/* Discord Card - Plus compact */}
                  <motion.a
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ y: -4 }}
                    href="https://discord.gg/Y9RvKDCrWH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative overflow-hidden rounded-2xl border border-[#5865F2]/30 bg-gradient-to-br from-[#5865F2]/20 to-[#5865F2]/5 p-4 group"
                  >
                    <div className="absolute -top-8 -right-8 w-20 h-20 bg-[#5865F2]/20 rounded-full blur-2xl group-hover:bg-[#5865F2]/30 transition" />
                    <div className="relative flex flex-col items-center text-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-[#5865F2] flex items-center justify-center shadow-lg shadow-[#5865F2]/30">
                        <img src="/discord-icon.webp" alt="Discord" className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Communauté</p>
                        <p className="text-sm font-bold text-[#5865F2] flex items-center justify-center gap-1">
                          Discord
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </p>
                      </div>
                    </div>
                  </motion.a>
                </>
              )}
              {isMobile && (
                <motion.a
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://discord.gg/Y9RvKDCrWH"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-2 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/30 rounded-xl p-4 text-center transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">💬</span>
                    <span className="text-sm font-medium text-[#5865F2]">Rejoindre Discord</span>
                  </div>
                </motion.a>
              )}
            </div>
          </motion.section>

          {/* Section compétences et quêtes - Masquée sur mobile */}
          {stats && (
            <motion.section variants={itemVariants} className="hidden md:block">
              <div className="grid gap-6 lg:grid-cols-2">
                <GlassCard hover={false} glow="none">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Compétences</h3>
                      <p className="text-xs text-gray-400">Tes progrès principaux</p>
                    </div>
                  </div>
                  {/* Version simplifiée - seulement les 2 premières compétences */}
                  <div className="space-y-3">
                    {xpTracks.slice(0, 2).map((track) => (
                      <div key={track.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-pink-400">L{track.level}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{track.name}</p>
                            <p className="text-xs text-gray-400">{track.xp} XP</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((track.xp / track.nextLevelXp) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard hover={false} glow="none">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Quêtes du jour</h3>
                      <p className="text-xs text-gray-400">Objectifs quotidiens</p>
                    </div>
                  </div>
                  {dailyQuests.length > 0 ? (
                    <div className="space-y-2">
                      {dailyQuests.slice(0, 3).map((quest) => (
                        <div key={quest.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              quest.completed ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {quest.completed ? '✓' : quest.progress + '/' + quest.target}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{quest.title}</p>
                              <p className="text-xs text-gray-400">+{quest.reward} coins</p>
                            </div>
                          </div>
                          {quest.completed && !quest.claimed && (
                            <button
                              onClick={() => claimQuestMutation.mutateAsync(quest.id)}
                              disabled={claimQuestMutation.isPending}
                              className="px-3 py-1 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-medium hover:shadow-lg transition-all"
                            >
                              {claimingQuestId === quest.id ? '...' : 'Claim'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">
                      Les quêtes arrivent bientôt !
                    </p>
                  )}
                </GlassCard>
              </div>
            </motion.section>
          )}

          {/* Section activité - Masquée sur mobile */}
          <motion.section variants={itemVariants} className="hidden md:block">
            <GlassCard hover={false} glow="none">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Activité récente</h3>
                  <p className="text-xs text-gray-400">Tes derniers gains</p>
                </div>
              </div>
              <div className="text-center py-6">
                <Coins className="w-8 h-8 mx-auto mb-2 text-yellow-400/50" />
                <p className="text-sm text-gray-400">Aucune activité récente</p>
                <p className="text-xs text-gray-500 mt-1">Termine des leçons pour gagner des coins !</p>
              </div>
            </GlassCard>
          </motion.section>

          {/* Level & XP Section - Simplifié */}
          {stats && (
            <motion.section variants={itemVariants}>
              <GlassCard hover={false} glow="none">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                      <span className="text-lg font-bold text-white">{stats.level}</span>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg"
                    >
                      <Award className="w-2.5 h-2.5 text-yellow-900" />
                    </motion.div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">Niveau {stats.level}</span>
                      <span className="text-xs text-gray-400">
                        {stats.nextLevelXp - stats.xp} XP restant
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.xp / stats.nextLevelXp) * 100}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{stats.xp.toLocaleString()} XP</span>
                      <span>{stats.nextLevelXp.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.section>
            )}

            {/* Modules recommandés - Simplifié */}
            {recommendedModules.length > 0 ? (
            <motion.section variants={itemVariants} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Continue ta progression</h3>
                  <p className="text-sm text-gray-400">Modules recommandés</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendedModules.slice(0, 2).map(({ module, completion, nextLesson }, index) => (
                  <motion.div
                      key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                    onClick={() => navigate(`/app/modules/${module.id}`)}
                    className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-4 cursor-pointer group hover:border-pink-500/30 transition-all"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/10 rounded-full blur-xl group-hover:bg-pink-500/20 transition" />

                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-medium">
                          {completion}%
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
                      </div>

                      <h4 className="font-semibold text-white group-hover:text-pink-200 transition-colors line-clamp-1 mb-1">
                        {module.title}
                      </h4>
                      {nextLesson && (
                        <p className="text-xs text-gray-400 line-clamp-1">
                          Prochaine: {nextLesson}
                        </p>
                      )}
                    </div>
                  </motion.div>
                  ))}
              </div>
            </motion.section>
            ) : (
              modules.length > 0 && (
              <motion.section variants={itemVariants}>
                <GlassCard hover={false} glow="none">
                  <EmptyState
                    icon={Rocket}
                    title="Tous tes modules sont complétés !"
                    description="Félicitations ! Tu as terminé tous tes modules. De nouveaux contenus seront bientôt disponibles."
                    action={{
                      label: 'Voir mes statistiques',
                      onClick: () => navigate('/app/progress'),
                    }}
                  />
                </GlassCard>
              </motion.section>
              )
            )}

            {/* Section détaillée - Masquée sur mobile */}
            <motion.section variants={itemVariants} className="hidden md:grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <GlassCard hover={false} glow="none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Checklist de progression</h3>
                    <p className="text-xs text-gray-400">{stats?.completedModules || 0} / {stats?.totalModules || 0} modules complétés</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {modules.slice(0, 3).map((module) => {
                    const progress = moduleProgressMap[module.id];
                    const completionRate = progress?.completionRate || 0;
                    return (
                      <div key={module.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          completionRate === 100 ? 'bg-green-500/20 text-green-400' :
                          completionRate > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {completionRate === 100 ? '✓' : completionRate > 0 ? '⟳' : '○'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white line-clamp-1">{module.title}</p>
                          <p className="text-xs text-gray-400">{completionRate}% complété</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Right Column */}
              <GlassCard hover={false} glow="none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Badges débloqués</h3>
                    <p className="text-xs text-gray-400">{(stats?.badges || []).filter(b => b.unlockedAt).length} / {(stats?.badges || []).length} badges</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(stats?.badges || []).slice(0, 6).map((badge) => (
                    <div key={badge.id} className={`relative p-2 rounded-lg text-center ${
                      badge.unlockedAt ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-gray-500/10 opacity-50'
                    }`}>
                      <div className="text-2xl mb-1">{badge.icon}</div>
                      <p className="text-xs text-white font-medium line-clamp-2">{badge.title}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.section>
        </motion.div>
      )}

      {/* Contact Section - Très discret */}
      <motion.section
        variants={itemVariants}
        className="mt-12 pt-8 border-t border-white/5"
      >
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">
            Besoin d'aide personnalisée ?
          </p>
          <a
            href="mailto:clement.ia.consulting@gmail.com"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-pink-400 transition-colors duration-200 group"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contactez Clement - Consultant IA & Créateur du site</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </motion.section>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
