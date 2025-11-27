import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useSession } from '../hooks/useSession';
import { getActiveChallenges } from '../services/memberStatsService';
import ChallengesList from '../components/member/ChallengesList';
import GlassCard from '../components/ui/GlassCard';
import StatCard from '../components/ui/StatCard';
import { Target, Trophy, TrendingUp, Flame, Award, Zap } from 'lucide-react';

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

export default function ChallengesPage() {
  const { user } = useSession();

  const challengesQuery = useQuery({
    queryKey: ['member-challenges', user?.id],
    queryFn: () => getActiveChallenges(user?.id || ''),
    enabled: !!user?.id,
  });

  const challenges = challengesQuery.data || [];
  const activeChallenges = challenges.filter((c) => c.progress < c.target);
  const completedChallenges = challenges.filter((c) => c.progress >= c.target);
  const bestRank = Math.min(
    ...challenges.filter((c) => c.userRank).map((c) => c.userRank || 999)
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Défis</h1>
            <p className="text-gray-400">
              Relève des défis et monte dans le classement pour gagner des récompenses
            </p>
          </div>
        </div>
      </motion.header>

      {challengesQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-6 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
              <div className="h-4 bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Hero Banner */}
          <motion.section variants={itemVariants}>
            <GlassCard hover={false} glow="none" className="overflow-hidden">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-transparent" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center gap-6 p-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-orange-500/30"
                  >
                    <Flame className="w-10 h-10 text-white" />
                  </motion.div>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      🔥 Défis de la semaine
                    </h2>
                    <p className="text-gray-400">
                      Participe aux défis hebdomadaires pour débloquer des récompenses exclusives
                      et te mesurer à la communauté !
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-orange-400">{activeChallenges.length}</p>
                      <p className="text-xs text-gray-400">Défis actifs</p>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-400">{completedChallenges.length}</p>
                      <p className="text-xs text-gray-400">Complétés</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.section>

          {/* Stats Cards */}
          <motion.section variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={Target}
                label="Défis Actifs"
                value={activeChallenges.length}
                color="orange"
                delay={0}
              />
              <StatCard
                icon={Trophy}
                label="Défis Complétés"
                value={completedChallenges.length}
                color="yellow"
                delay={0.1}
              />
              <StatCard
                icon={TrendingUp}
                label="Meilleur Rang"
                value={bestRank < 999 ? `#${bestRank}` : '-'}
                color="green"
                delay={0.2}
              />
            </div>
          </motion.section>

          {/* Rewards Section */}
          {completedChallenges.length > 0 && (
            <motion.section variants={itemVariants}>
              <GlassCard hover={false} glow="yellow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Récompenses gagnées</h3>
                    <p className="text-sm text-gray-400">
                      Tu as complété {completedChallenges.length} défi
                      {completedChallenges.length > 1 ? 's' : ''} !
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {completedChallenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
                    >
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-yellow-300">{challenge.reward}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.section>
          )}

          {/* Challenges List */}
          <motion.section variants={itemVariants}>
            <GlassCard hover={false} glow="none">
              <ChallengesList challenges={challenges} />
            </GlassCard>
          </motion.section>
        </motion.div>
      )}
    </div>
  );
}
