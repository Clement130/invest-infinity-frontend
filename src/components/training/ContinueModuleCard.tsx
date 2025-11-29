/**
 * ContinueModuleCard - Composant "Reprends où tu t'es arrêté"
 * 
 * Features:
 * - Design premium avec gradient et glow
 * - Thumbnail du module si disponible
 * - Barre de progression animée avec pulse
 * - Bouton "Continuer" large et visible
 * - Mobile-first: full width, lisible, tap-friendly
 * - Affiche la dernière leçon vue
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, Clock, BookOpen, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface ContinueModuleCardProps {
  moduleTitle: string;
  lessonTitle: string;
  progress: number;
  estimatedTime?: string;
  lessonsCount?: number;
  thumbnail?: string;
  onClick: () => void;
  isFirstTime?: boolean; // Premier accès = message différent
}

function ContinueModuleCard({
  moduleTitle,
  lessonTitle,
  progress,
  estimatedTime,
  lessonsCount,
  thumbnail,
  onClick,
  isFirstTime = false,
}: ContinueModuleCardProps) {
  const isStarting = progress === 0;
  const isAlmostDone = progress >= 80 && progress < 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer"
    >
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-pink-500/15 to-purple-500/10" />
      
      {/* Glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
      
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Border */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-white/10 group-hover:border-pink-500/30 transition-colors duration-300" />

      {/* Content */}
      {/* Mobile-first: padding réduit, gap réduit */}
      <div className="relative p-4 sm:p-5 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
          {/* Left: Icon/Thumbnail - plus petit sur mobile */}
          <div className="flex-shrink-0">
            {thumbnail ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl shadow-pink-500/20"
              >
                <img
                  src={thumbnail}
                  alt={moduleTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-pink-500 flex items-center justify-center">
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 text-white ml-0.5" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3,
                  ease: 'easeInOut'
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-xl shadow-pink-500/30"
              >
                <span className="text-3xl sm:text-4xl lg:text-5xl">🔥</span>
              </motion.div>
            )}
          </div>

          {/* Center: Info */}
          {/* Mobile-first: espacement réduit */}
          <div className="flex-1 space-y-2.5 sm:space-y-3 lg:space-y-4 min-w-0 overflow-hidden">
            {/* Badge - plus compact sur mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-pink-500/20 border border-pink-500/30"
              >
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-400" />
                <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-pink-300">
                  {isFirstTime 
                    ? 'Commence ton aventure' 
                    : isAlmostDone 
                    ? 'Presque terminé !' 
                    : 'Reprends où tu t\'es arrêté'}
                </span>
              </motion.div>
              
              {/* Meta info badges - cachés sur très petits écrans */}
              <div className="hidden xs:flex items-center gap-1.5 sm:gap-2">
                {lessonsCount !== undefined && (
                  <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-white/5 text-[10px] sm:text-xs text-gray-400">
                    <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {lessonsCount} leçons
                  </span>
                )}
                {estimatedTime && (
                  <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-white/5 text-[10px] sm:text-xs text-gray-400">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {estimatedTime}
                  </span>
                )}
              </div>
            </div>

            {/* Title - taille adaptative, line-clamp pour éviter débordement */}
            <div className="space-y-0.5 sm:space-y-1">
              <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white group-hover:text-pink-100 transition-colors line-clamp-2">
                {lessonTitle}
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-400 truncate">
                Module : <span className="text-gray-300">{moduleTitle}</span>
              </p>
            </div>

            {/* Progress Bar - plus compact sur mobile */}
            <div className="max-w-lg space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-400">Progression</span>
                <span className={clsx(
                  'font-bold',
                  progress === 100 ? 'text-green-400' : 'text-pink-400'
                )}>
                  {progress}%
                </span>
              </div>
              <div className="h-2 sm:h-2.5 lg:h-3 bg-slate-800/80 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                  className="relative h-full rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500"
                >
                  {/* Shimmer effect */}
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                  {/* Pulse at the end */}
                  {progress > 0 && progress < 100 && (
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"
                    />
                  )}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Right: CTA Button */}
          {/* Mobile-first: bouton plus compact mais toujours tap-friendly */}
          <div className="flex-shrink-0 w-full lg:w-auto mt-1 sm:mt-0">
            <motion.button
              whileHover={{ scale: 1.03, x: 3 }}
              whileTap={{ scale: 0.97 }}
              className={clsx(
                'w-full lg:w-auto flex items-center justify-center gap-2 sm:gap-3',
                'px-5 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 rounded-xl lg:rounded-2xl',
                'bg-gradient-to-r from-pink-500 to-purple-600',
                'text-white font-bold text-sm sm:text-base lg:text-lg',
                'shadow-xl shadow-pink-500/30',
                'hover:shadow-pink-500/50 hover:from-pink-400 hover:to-purple-500',
                'transition-all duration-300',
                'min-h-[48px] sm:min-h-[52px] lg:min-h-[56px]' // Tap-friendly
              )}
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              <span>{isStarting ? 'Commencer' : 'Continuer'}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 opacity-70" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(ContinueModuleCard);

