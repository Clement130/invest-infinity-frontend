/**
 * ClientSidebar - Sidebar de navigation pour l'espace client
 * 
 * Structure :
 * - Desktop (lg+): Sidebar fixe à gauche, toujours visible
 * - Mobile (< lg): Drawer accessible via BottomNav "Menu" ou geste
 * 
 * Le bouton burger en haut à gauche est supprimé car la navigation
 * principale sur mobile est gérée par la BottomNav.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Target,
  Calendar,
  Settings,
  LogOut,
  X,
  Award,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useSession } from '../../hooks/useSession';
import { useQuery } from '@tanstack/react-query';
import { getUserStats } from '../../services/memberStatsService';
import clsx from 'clsx';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
  gradient?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/app/dashboard',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    label: 'Mes Formations',
    icon: BookOpen,
    path: '/app',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    label: 'Ma Progression',
    icon: TrendingUp,
    path: '/app/progress',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    label: 'Défis',
    icon: Target,
    path: '/app/challenges',
    badge: 2,
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    label: 'Événements',
    icon: Calendar,
    path: '/app/events',
    gradient: 'from-purple-500 to-violet-500',
  },
];

const sidebarVariants = {
  open: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  closed: {
    x: '-100%',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

// Export pour permettre l'ouverture du drawer depuis l'extérieur (BottomNav)
export const useMobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
};

function ClientSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Track if this is the initial mount to prevent animations on subsequent renders
  const isInitialMount = useRef(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const timer = setTimeout(() => setHasAnimated(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Fermer le drawer quand on change de page
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const { data: stats } = useQuery({
    queryKey: ['member-stats', user?.id],
    queryFn: () => getUserStats(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const handleNavClick = useCallback((path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  const isActive = useCallback((path: string) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const firstName = profile?.full_name?.split(' ')[0] || 'Trader';
  const level = stats?.level || 1;
  const xp = stats?.xp || 0;
  const nextLevelXp = stats?.nextLevelXp || 1000;
  const xpProgress = (xp / nextLevelXp) * 100;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Invest Infinity
              </h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                Trading Academy
              </p>
            </div>
          </div>
          {/* Bouton fermer - visible uniquement dans le drawer mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* User Card */}
      <div className="p-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 p-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />

          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center ring-2 ring-pink-500/30 shadow-lg shadow-pink-500/20">
                  <span className="text-lg font-bold text-white">
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                  {level}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{firstName}</p>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-gray-400">Niveau {level}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Progression XP</span>
                <span className="text-pink-400 font-medium">
                  {xp.toLocaleString()} / {nextLevelXp.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  style={{ width: `${xpProgress}%` }}
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-full relative transition-all duration-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
          Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                active
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <div
                className={clsx(
                  'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full transition-all duration-200',
                  active ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                )}
              />

              <div
                className={clsx(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                  active
                    ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                    : 'bg-white/5 group-hover:bg-white/10'
                )}
              >
                <Icon
                  className={clsx(
                    'w-4 h-4 transition-colors',
                    active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  )}
                />
              </div>

              <span className="font-medium flex-1 text-left text-sm">{item.label}</span>

              {item.badge && item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-[10px] font-bold">
                  {item.badge}
                </span>
              )}

              <ChevronRight
                className={clsx(
                  'w-4 h-4 transition-all',
                  active ? 'text-pink-400' : 'text-gray-600 opacity-0 group-hover:opacity-100'
                )}
              />
            </button>
          );
        })}

        <div className="my-4 border-t border-white/5" />

        {/* Settings */}
        <button
          onClick={() => handleNavClick('/app/settings')}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
            isActive('/app/settings')
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          )}
        >
          <div
            className={clsx(
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              isActive('/app/settings')
                ? 'bg-gradient-to-br from-gray-500 to-gray-600'
                : 'bg-white/5 group-hover:bg-white/10'
            )}
          >
            <Settings className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Paramètres</span>
        </button>
      </nav>

      {/* Discord CTA */}
      <div className="p-4">
        <a
          href="https://discord.gg/Y9RvKDCrWH"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full relative overflow-hidden rounded-xl bg-[#5865F2] p-4 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2] via-[#7289da] to-[#5865F2] opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex items-center gap-3">
            <img 
              src="/discord-icon.webp" 
              alt="Discord" 
              className="w-8 h-8 group-hover:scale-110 transition-transform"
            />
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">Rejoins la communauté</p>
              <p className="text-[11px] text-white/70">+100 traders actifs</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
          </div>
        </a>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-white/5 group-hover:bg-red-500/20 flex items-center justify-center transition-all">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 w-72 bg-slate-950/95 backdrop-blur-xl border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-950/98 backdrop-blur-xl border-r border-white/5"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Spacer for desktop */}
      <div className="hidden lg:block w-72 flex-shrink-0" />

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
}

export default memo(ClientSidebar);
