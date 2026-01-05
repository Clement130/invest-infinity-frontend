/**
 * DashboardLayout - Layout principal de l'espace client
 * 
 * Structure mobile-first :
 * - Mobile (< lg): Header + Content + BottomNav (pas de sidebar visible)
 * - Desktop (lg+): Sidebar + Header + Content
 * 
 * Le chatbot flottant est géré séparément et doit être décalé
 * au-dessus de la BottomNav sur mobile.
 */

import { type ReactNode, memo } from 'react';
import { motion } from 'framer-motion';
import ClientSidebar from '../components/navigation/ClientSidebar';
import DashboardHeader from '../components/navigation/DashboardHeader';
import BottomNav from '../components/navigation/BottomNav';
import { useSession } from '../hooks/useSession';

interface DashboardLayoutProps {
  children: ReactNode;
}

const THEME_CONFIG = {
  default: {
    base: 'from-slate-950 via-black to-slate-950',
    orbs: ['bg-pink-500/8', 'bg-purple-500/8', 'bg-blue-500/6'],
  },
  aurora: {
    base: 'from-[#02121d] via-[#030712] to-[#050b16]',
    orbs: ['bg-emerald-500/15', 'bg-cyan-500/12', 'bg-indigo-500/10'],
  },
  eclipse: {
    base: 'from-[#1a0b2e] via-[#0f071a] to-[#050109]',
    orbs: ['bg-orange-500/12', 'bg-rose-500/12', 'bg-indigo-500/12'],
  },
} as const;

type ThemeKey = keyof typeof THEME_CONFIG;

// Background animé mémorisé pour éviter les re-renders
const AnimatedBackground = memo(function AnimatedBackground({ themeKey }: { themeKey: ThemeKey }) {
  const config = THEME_CONFIG[themeKey] ?? THEME_CONFIG.default;
  const [orbPrimary, orbSecondary, orbTertiary] = config.orbs;

  return (
    <div className="fixed inset-0 z-0">
      {/* Base gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.base}`} />
      
      {/* Animated gradient orbs - désactivés sur mobile pour perf */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`hidden md:block absolute top-0 left-1/4 w-[600px] h-[600px] ${orbPrimary} rounded-full blur-[120px]`}
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 80, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`hidden md:block absolute bottom-0 right-1/4 w-[500px] h-[500px] ${orbSecondary} rounded-full blur-[100px]`}
      />
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${orbTertiary} rounded-full blur-[150px]`}
      />

      {/* Static gradient for mobile - plus léger */}
      <div className={`md:hidden absolute top-0 left-0 w-full h-1/2 ${orbPrimary} blur-[100px] opacity-50`} />
      <div className={`md:hidden absolute bottom-0 right-0 w-full h-1/2 ${orbSecondary} blur-[100px] opacity-50`} />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Noise texture */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
});

// Composants mémorisés pour éviter les re-renders
const MemoizedSidebar = memo(ClientSidebar);
const MemoizedHeader = memo(DashboardHeader);
const MemoizedBottomNav = memo(BottomNav);

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile } = useSession();
  const themeKey = (profile?.theme as ThemeKey) ?? 'default';

  return (
    <div className="flex min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background - ne se re-render jamais */}
      <AnimatedBackground themeKey={themeKey} />

      {/* Sidebar - Desktop uniquement (géré dans ClientSidebar) */}
      <MemoizedSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 lg:ml-0">
        {/* Header - reste statique lors des navigations */}
        <MemoizedHeader />

        {/* Content - seule partie qui change */}
        {/* Padding réduit sur mobile pour éviter le rognage, mais conservé pour l'espacement */}
        <main className="flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 overflow-x-hidden overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full max-w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile uniquement */}
      <MemoizedBottomNav />
    </div>
  );
}
