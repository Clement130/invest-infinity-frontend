import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { getModules } from '../services/trainingService';
import clsx from 'clsx';
import { claimQuestReward } from '../services/questsService';

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

  const challengesQuery = useQuery({
    queryKey: ['member-challenges', user?.id],
    queryFn: () => getActiveChallenges(user?.id || ''),
    enabled: !!user?.id,
  });

  const eventsQuery = useQuery({
    queryKey: ['member-events', user?.id],
    queryFn: () => getUpcomingEvents(user?.id || ''),
    enabled: !!user?.id,
  });

  const modulesQuery = useQuery({
    queryKey: ['modules', 'client'],
    queryFn: () => getModules(),
  });

  const progressQuery = useQuery({
    queryKey: ['member-progress', user?.id],
    queryFn: () => getUserProgressSummary(user?.id || ''),
    enabled: !!user?.id,
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
    challengesQuery.isLoading ||
    eventsQuery.isLoading ||
    modulesQuery.isLoading ||
    progressQuery.isLoading;

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
        >
          {/* Hero Section */}
          <motion.section variants={itemVariants} className="relative overflow-hidden">
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-white/10 p-6 md:p-8">
              {/* Background effects */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-conic from-pink-500/5 via-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />

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

                  {/* Quick Stats Row */}
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span className="text-orange-300 font-bold">{streak}</span>
                      <span className="text-orange-400/70 text-sm">jours de streak</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-300 font-bold">Niveau {stats?.level || 1}</span>
                    </div>
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
                  </div>
                </div>

                {/* Global Progress Circle */}
                <div className="flex-shrink-0">
                  <div className="relative w-40 h-40 mx-auto lg:mx-0">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-slate-800"
                      />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="url(#progressGradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: '0 440' }}
                        animate={{ strokeDasharray: `${(globalProgress / 100) * 440} 440` }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-white">{globalProgress}%</span>
                      <span className="text-sm text-gray-400">Complété</span>
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

          {/* Stats Grid */}
          <motion.section variants={itemVariants}>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                icon={BookOpen}
                label="Modules complétés"
                value={`${stats?.completedModules || 0}/${stats?.totalModules || 0}`}
                color="blue"
                delay={0}
              />
              <StatCard
                icon={TrendingUp}
                label="Leçons complétées"
                value={`${stats?.completedLessons || 0}/${stats?.totalLessons || 0}`}
                color="purple"
                delay={0.1}
              />
              <StatCard
                icon={Clock}
                label="Temps total"
                value={`${Math.floor((stats?.totalTimeSpent || 0) / 60)}h`}
                subValue={`${(stats?.totalTimeSpent || 0) % 60}min`}
                color="green"
                delay={0.2}
              />
              <StatCard
                icon={Coins}
                label="Focus Coins"
                value={walletBalance.toLocaleString()}
                subValue={`${totalCoinsEarned.toLocaleString()} gagnés`}
                color="orange"
                delay={0.3}
              />
              {/* Discord Card */}
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -4 }}
                href="https://discord.gg/Y9RvKDCrWH"
                target="_blank"
                rel="noopener noreferrer"
                className="relative overflow-hidden rounded-2xl border border-[#5865F2]/30 bg-gradient-to-br from-[#5865F2]/20 to-[#5865F2]/5 p-5 group"
              >
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#5865F2]/20 rounded-full blur-2xl group-hover:bg-[#5865F2]/30 transition" />
                <div className="relative space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#5865F2] flex items-center justify-center shadow-lg shadow-[#5865F2]/30">
                    <img src="/discord-icon.webp" alt="Discord" className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Communauté</p>
                    <p className="text-xl font-bold text-[#5865F2] flex items-center gap-2">
                      Discord
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </div>
              </motion.a>
            </div>
          </motion.section>

          {stats && (
            <motion.section variants={itemVariants}>
              <div className="grid gap-6 lg:grid-cols-2">
                <GlassCard hover={false} glow="none">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Maîtrise par compétences</h2>
                      <p className="text-sm text-gray-400">Suis tes progrès sur chaque axe clé</p>
                    </div>
                  </div>
                  <XpTrackMeter tracks={xpTracks} />
                </GlassCard>

                <GlassCard hover={false} glow="none">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Quêtes du jour</h2>
                      <p className="text-sm text-gray-400">Complète des objectifs rapides pour gagner du boost</p>
                    </div>
                  </div>
                  <DailyGoalsCard
                    quests={dailyQuests}
                    onClaim={(questId) => claimQuestMutation.mutateAsync(questId)}
                    claimingId={claimingQuestId}
                    isLoading={claimQuestMutation.isPending}
                  />
                </GlassCard>
              </div>
            </motion.section>
          )}

          <motion.section variants={itemVariants}>
            <GlassCard hover={false} glow="none">
              <EconomyTimeline />
            </GlassCard>
          </motion.section>

          {/* Level & XP Section */}
          {stats && (
            <motion.section variants={itemVariants}>
              <GlassCard hover={false} glow="none" className="overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <span className="text-2xl font-bold text-white">{stats.level}</span>
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg"
                      >
                        <Award className="w-3 h-3 text-yellow-900" />
                      </motion.div>
                    </div>
                <div>
                      <h3 className="text-lg font-bold text-white">Niveau {stats.level}</h3>
                      <p className="text-sm text-gray-400">
                        {stats.nextLevelXp - stats.xp} XP avant le niveau {stats.level + 1}
                  </p>
                </div>
              </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">
                        {stats.xp.toLocaleString()} XP
                      </span>
                      <span className="text-purple-400 font-medium">
                        {stats.nextLevelXp.toLocaleString()} XP
                      </span>
                </div>
                    <div className="h-3 bg-slate-800/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.xp / stats.nextLevelXp) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.section>
            )}

            {/* Recommendations */}
            {recommendedModules.length > 0 ? (
            <motion.section variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Continue ta progression</h2>
                  <p className="text-sm text-gray-400">Modules recommandés pour toi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendedModules.map(({ module, completion, nextLesson }, index) => (
                  <motion.div
                      key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/app/modules/${module.id}`)}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-5 cursor-pointer group hover:border-pink-500/30 transition-all"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition" />
                    
                    <div className="relative space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-medium">
                          {completion}% complété
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                      </div>

                      <div>
                        <h3 className="font-bold text-white group-hover:text-pink-200 transition-colors line-clamp-1">
                          {module.title}
                        </h3>
                      {nextLesson && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                            Prochaine : {nextLesson}
                          </p>
                      )}
                      </div>

                      <AnimatedProgress
                        value={completion}
                        color="gradient"
                        size="sm"
                        showValue={false}
                        animated={false}
                      />
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

            {/* Main Grid */}
          <motion.section variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
              <GlassCard hover={false} glow="none">
                <ProgressChecklist
                  modules={modules}
                  moduleProgress={moduleProgressMap}
                />
              </GlassCard>
              <GlassCard hover={false} glow="none">
                <BadgesDisplay badges={stats?.badges || []} />
              </GlassCard>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
              <GlassCard hover={false} glow="none">
                <ChallengesList challenges={challenges} />
              </GlassCard>
              <GlassCard hover={false} glow="none">
                <EventsCalendar events={events} />
              </GlassCard>
            </div>
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
