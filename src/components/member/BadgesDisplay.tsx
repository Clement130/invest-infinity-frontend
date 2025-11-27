import { motion } from 'framer-motion';
import { Award, Lock, Sparkles } from 'lucide-react';
import type { Badge } from '../../services/memberStatsService';
import clsx from 'clsx';

interface BadgesDisplayProps {
  badges: Badge[];
}

const rarityConfig = {
  common: {
    bg: 'from-gray-500/20 to-gray-600/10',
    border: 'border-gray-500/30',
    text: 'text-gray-400',
    glow: 'group-hover:shadow-gray-500/20',
    label: 'Commun',
  },
  rare: {
    bg: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'group-hover:shadow-blue-500/20',
    label: 'Rare',
  },
  epic: {
    bg: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'group-hover:shadow-purple-500/20',
    label: 'Épique',
  },
  legendary: {
    bg: 'from-yellow-500/20 to-amber-600/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    glow: 'group-hover:shadow-yellow-500/20',
    label: 'Légendaire',
  },
};

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
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

export default function BadgesDisplay({ badges }: BadgesDisplayProps) {
  const unlockedBadges = badges.filter((b) => b.unlockedAt);
  const lockedBadges = badges.filter((b) => !b.unlockedAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Badges</h3>
            <p className="text-sm text-gray-400">
              {unlockedBadges.length} / {badges.length} débloqués
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(unlockedBadges.length / Math.max(badges.length, 1)) * 100}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
            />
          </div>
          <span className="text-sm text-gray-400">
            {Math.round((unlockedBadges.length / Math.max(badges.length, 1)) * 100)}%
          </span>
        </div>
      </div>

      {/* Badges Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
      >
        {badges.map((badge, index) => {
          const isUnlocked = !!badge.unlockedAt;
          const config = rarityConfig[badge.rarity];

          return (
            <motion.div
              key={badge.id}
              variants={itemVariants}
              whileHover={isUnlocked ? { scale: 1.05, y: -4 } : undefined}
              className={clsx(
                'group relative overflow-hidden rounded-xl border p-4 transition-all duration-300',
                isUnlocked
                  ? `bg-gradient-to-br ${config.bg} ${config.border} hover:shadow-lg ${config.glow} cursor-pointer`
                  : 'bg-slate-900/50 border-slate-700/50 opacity-60'
              )}
            >
              {/* Rarity indicator */}
              {isUnlocked && badge.rarity === 'legendary' && (
                <div className="absolute top-2 right-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                </div>
              )}

              <div className="text-center space-y-3">
                {/* Icon */}
                <div className="relative mx-auto w-14 h-14 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  {isUnlocked ? (
                    <span className="text-3xl">{badge.icon}</span>
                  ) : (
                    <Lock className="w-6 h-6 text-gray-600" />
                  )}
                </div>

                {/* Info */}
                <div>
                  <h4 className={clsx('font-semibold text-sm', isUnlocked ? 'text-white' : 'text-gray-500')}>
                    {badge.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{badge.description}</p>
                </div>

                {/* Rarity badge */}
                {isUnlocked && (
                  <span className={clsx('inline-block px-2 py-0.5 rounded-full text-[10px] font-medium', config.text, 'bg-white/10')}>
                    {config.label}
                  </span>
                )}

                {/* Unlock date */}
                {isUnlocked && badge.unlockedAt && (
                  <p className="text-[10px] text-gray-500">
                    {new Date(badge.unlockedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty state */}
      {badges.length === 0 && (
        <div className="text-center py-8">
          <Award className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">Aucun badge disponible pour le moment</p>
          <p className="text-sm text-gray-500 mt-1">
            Continue ta progression pour débloquer des badges !
          </p>
        </div>
      )}
    </div>
  );
}
