/**
 * BottomNav - Barre de navigation fixe en bas de l'écran (mobile uniquement)
 * 
 * Version: 2.0.0 - 2026-01-06
 * - Suppression de la gestion d'orientation complexe
 * - Masquage simple en mode paysage sur page vidéo
 * 
 * Caractéristiques :
 * - Visible uniquement sur mobile (< lg)
 * - 5 icônes + labels pour accès rapide aux sections principales
 * - Bouton "Plus" pour ouvrir le sidebar complet (Événements, Partenariats, etc.)
 * - Zone de clic min 48px de hauteur
 * - Safe area padding pour iPhone avec notch
 * - Ne chevauche pas le chatbot (chatbot décalé au-dessus)
 * - Masqué en mode paysage sur les pages de vidéo
 */

import { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Menu,
} from 'lucide-react';
import clsx from 'clsx';
import { openMobileSidebar } from './ClientSidebar';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Hook pour détecter si on est en mode paysage sur mobile
 * Utilisé pour masquer la bottom nav pendant la lecture vidéo
 */
function useIsLandscape() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Vérifier si on est sur mobile ET en paysage
      const isMobile = window.innerWidth <= 1024;
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      setIsLandscape(isMobile && isLandscapeMode);
    };

    // Vérifier au montage
    checkOrientation();

    // Écouter les changements
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return isLandscape;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  action?: 'openSidebar';
  badge?: number;
}

// 5 items max pour une bottom nav efficace
// Le dernier item "Plus" ouvre le sidebar avec tous les onglets
const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/app/dashboard',
  },
  {
    label: 'Formation',
    icon: BookOpen,
    path: '/app',
  },
  {
    label: 'Progression',
    icon: TrendingUp,
    path: '/app/progress',
  },
  {
    label: 'Plus',
    icon: Menu,
    action: 'openSidebar',
  },
];

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { shouldReduceMotion } = useReducedMotion();
  const isLandscape = useIsLandscape();

  // IMPORTANT: Tous les hooks doivent être appelés AVANT tout return conditionnel
  // pour respecter les règles des hooks React (même nombre d'appels à chaque rendu)
  const isActive = useCallback((path: string) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const handleNavClick = useCallback((item: NavItem) => {
    if (item.action === 'openSidebar') {
      openMobileSidebar();
    } else if (item.path) {
      navigate(item.path);
    }
  }, [navigate]);

  // Détecter si on est sur une page de lecture vidéo
  const isVideoPage = location.pathname.includes('/lessons/');

  // Masquer la bottom nav en mode paysage sur une page vidéo
  // Cela évite les bugs d'affichage lors de la rotation
  // NOTE: Ce return conditionnel est APRÈS tous les hooks
  if (isLandscape && isVideoPage) {
    return null;
  }

  return (
    <>
      {/* Spacer pour éviter que le contenu soit caché derrière la bottom nav */}
      <div className="lg:hidden h-20" />
      
      {/* Bottom Navigation Bar - Mobile only */}
      {/* Utilise position: fixed avec des valeurs explicites pour éviter les bugs iOS lors de la rotation */}
      <nav 
        className={`lg:hidden fixed z-40 bg-slate-950/95 border-t border-white/10 ${
          shouldReduceMotion ? '' : 'backdrop-blur-xl'
        }`}
        style={{ 
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          // Fix iOS rotation bug
          WebkitTransform: 'translate3d(0, 0, 0)',
          transform: 'translate3d(0, 0, 0)',
          // Empêcher le repositionnement lors du resize
          position: 'fixed',
          width: '100%',
        }}
      >
        <div className="flex items-center justify-around px-2">
          {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.path ? isActive(item.path) : false;

              return (
                <button
                  key={item.path || item.action}
                  onClick={() => handleNavClick(item)}
                className={clsx(
                  'flex flex-col items-center justify-center py-2 px-3 min-w-[64px] min-h-[56px] rounded-xl transition-all duration-200 relative',
                  !shouldReduceMotion && 'active:scale-95', // Feedback tactile seulement si animations activées
                  active
                    ? 'text-pink-400'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {/* Indicateur actif - glow effect */}
                {active && (
                  <div className="absolute inset-0 bg-pink-500/10 rounded-xl" />
                )}
                
                {/* Icône avec badge optionnel */}
                <div className="relative">
                  <Icon 
                    className={clsx(
                      'w-5 h-5 transition-all duration-200',
                      active && !shouldReduceMotion && 'scale-110'
                    )} 
                  />
                  {/* Badge de notification */}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full bg-pink-500 text-[9px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                
                {/* Label - toujours visible */}
                <span 
                  className={clsx(
                    'text-[10px] mt-1 font-medium transition-all duration-200',
                    active ? 'text-pink-400' : 'text-gray-500'
                  )}
                >
                  {item.label}
                </span>

                {/* Indicateur point actif */}
                {active && (
                  <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-pink-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default memo(BottomNav);

