/**
 * FormationHeader - Header hero premium pour l'Espace Formation
 * 
 * Features:
 * - Design hero avec gradient et glassmorphism
 * - Stats animées (Total, Terminés, En cours, À démarrer)
 * - Message motivant dynamique
 * - Mobile-first: stack vertical avec respiration
 * - Desktop: grille premium avec effet glass
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Trophy, Flame, Target, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface FormationStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}

interface FormationHeaderProps {
  stats: FormationStats;
  userName?: string;
}

// Messages motivants selon la progression
const getMotivationalMessage = (stats: FormationStats): string => {
  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  
  if (completionRate === 100) return "🏆 Félicitations ! Tu as terminé tous les modules !";
  if (completionRate >= 75) return "🔥 Incroyable ! Tu approches de la ligne d'arrivée !";
  if (completionRate >= 50) return "💪 Tu es à mi-chemin, continue comme ça !";
  if (completionRate >= 25) return "🚀 Beau début ! La régularité est la clé du succès.";
  if (stats.inProgress > 0) return "✨ Tu as commencé, c'est le plus important !";
  return "🎯 Prêt à devenir un trader autonome ? C'est parti !";
};

// Stat card avec animation
const StatCard = memo(function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'pink' | 'green' | 'yellow' | 'gray';
  delay: number;
}) {
  const colorClasses = {
    pink: {
      bg: 'from-pink-500/20 to-purple-500/10',
      border: 'border-pink-500/30',
      text: 'text-pink-400',
      value: 'text-pink-300',
      icon: 'from-pink-500 to-purple-600',
      glow: 'shadow-pink-500/20',
    },
    green: {
      bg: 'from-green-500/20 to-emerald-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      value: 'text-green-300',
      icon: 'from-green-500 to-emerald-600',
      glow: 'shadow-green-500/20',
    },
    yellow: {
      bg: 'from-yellow-500/20 to-orange-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      value: 'text-yellow-300',
      icon: 'from-yellow-500 to-orange-600',
      glow: 'shadow-yellow-500/20',
    },
    gray: {
      bg: 'from-slate-500/20 to-slate-600/10',
      border: 'border-slate-500/30',
      text: 'text-gray-400',
      value: 'text-gray-300',
      icon: 'from-slate-500 to-slate-600',
      glow: 'shadow-slate-500/20',
    },
  };

  const c = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className={clsx(
        // Mobile-first: padding réduit, rounded plus petit
        'relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-3.5 lg:p-5',
        'bg-gradient-to-br backdrop-blur-sm',
        'border transition-all duration-300',
        `${c.bg} ${c.border}`,
        'sm:hover:shadow-lg sm:hover:scale-[1.02] sm:hover:-translate-y-0.5',
        c.glow,
        // Assure que la carte ne dépasse pas
        'w-full min-w-0'
      )}
    >
      {/* Glow effect - plus petit sur mobile */}
      <div className="absolute top-0 right-0 w-12 sm:w-20 h-12 sm:h-20 bg-white/5 rounded-full blur-2xl" />
      
      <div className="relative flex items-center gap-2 sm:gap-2.5 lg:gap-4">
        {/* Icon - plus petit sur mobile */}
        <div className={clsx(
          'w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0',
          'bg-gradient-to-br shadow-lg',
          c.icon, c.glow
        )}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
        </div>
        
        {/* Text - tronqué si nécessaire */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className={clsx('text-[10px] sm:text-xs lg:text-sm font-medium truncate', c.text)}>{label}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
            className={clsx('text-xl sm:text-2xl lg:text-3xl font-bold', c.value)}
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
});

function FormationHeader({ stats, userName }: FormationHeaderProps) {
  const motivationalMessage = getMotivationalMessage(stats);
  const greeting = userName ? `Continue ta progression, ${userName} !` : 'Continue ta progression !';

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden w-full max-w-full"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
      </div>

      <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 sm:gap-5"
        >
          {/* Icon - plus petit sur très petit mobile */}
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-xl shadow-pink-500/30 flex-shrink-0"
          >
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
          </motion.div>

          {/* Text */}
          <div className="space-y-0.5 sm:space-y-1 lg:space-y-2 min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white truncate">
              Espace Formation
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-400 truncate">
              {greeting}
            </p>
          </div>
        </motion.div>

        {/* Motivational Banner */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent border border-pink-500/20 w-full overflow-hidden"
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 flex-shrink-0" />
          <p className="text-xs sm:text-sm lg:text-base text-gray-300 truncate flex-1 min-w-0">{motivationalMessage}</p>
        </motion.div>

        {/* Stats Grid - Mobile: 2x2, Desktop: 4 columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 w-full">
          <StatCard
            label="Total"
            value={stats.total}
            icon={BookOpen}
            color="pink"
            delay={0.1}
          />
          <StatCard
            label="Terminés"
            value={stats.completed}
            icon={Trophy}
            color="green"
            delay={0.15}
          />
          <StatCard
            label="En cours"
            value={stats.inProgress}
            icon={Flame}
            color="yellow"
            delay={0.2}
          />
          <StatCard
            label="À démarrer"
            value={stats.notStarted}
            icon={Target}
            color="gray"
            delay={0.25}
          />
        </div>
      </div>
    </motion.header>
  );
}

export default memo(FormationHeader);

