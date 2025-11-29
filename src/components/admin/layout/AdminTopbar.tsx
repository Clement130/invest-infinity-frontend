/**
 * AdminTopbar – Barre supérieure responsive pour l'admin panel
 * 
 * - Bouton hamburger mobile pour ouvrir la sidebar
 * - Barre de recherche (Command Palette)
 * - Bouton "Créer" contextuel
 * - Notifications
 * - Menu utilisateur
 * - Bouton aide rapide
 */

import { memo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Plus,
  ChevronDown,
  LogOut,
  User,
  HelpCircle,
  BookOpen,
  Video,
  Users,
  Calendar,
} from 'lucide-react';
import { useSession } from '../../../hooks/useSession';
import { useCommandPalette } from '../../../hooks/useCommandPalette';
import NotificationBadge from '../NotificationBadge';
import NotificationCenter from '../NotificationCenter';

interface AdminTopbarProps {
  onMenuClick: () => void;
}

// Options du menu "Créer"
const CREATE_OPTIONS = [
  { label: 'Nouvelle formation', icon: BookOpen, path: '/admin/formations?action=create' },
  { label: 'Nouvelle vidéo', icon: Video, path: '/admin/videos?action=upload' },
  { label: 'Nouvel événement', icon: Calendar, path: '/admin/events?action=create' },
  { label: 'Inviter un utilisateur', icon: Users, path: '/admin/users?action=invite' },
];

function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const navigate = useNavigate();
  const { user, profile, signOut } = useSession();
  const { open: openCommandPalette } = useCommandPalette();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Fermer les menus au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setShowCreateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCreateOption = (path: string) => {
    setShowCreateMenu(false);
    navigate(path);
  };

  // Détection plateforme pour raccourci clavier
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-white/10">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Partie gauche : Menu hamburger (mobile) + Recherche */}
        <div className="flex items-center gap-3 flex-1">
          {/* Bouton hamburger - visible uniquement sur mobile/tablette */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-6 h-6 text-gray-400" />
          </button>

          {/* Barre de recherche / Command Palette */}
          <button
            onClick={openCommandPalette}
            className="
              flex items-center gap-2 px-3 py-2 rounded-lg
              bg-white/5 hover:bg-white/10 border border-white/10
              transition-colors text-sm text-gray-400 hover:text-white
              min-w-0 max-w-xs
            "
            title="Recherche rapide"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline truncate">Rechercher...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 rounded text-xs ml-auto">
              {isMac ? '⌘' : 'Ctrl'}+K
            </kbd>
          </button>
        </div>

        {/* Partie droite : Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bouton Créer avec dropdown */}
          <div ref={createMenuRef} className="relative">
            <button
              onClick={() => {
                setShowCreateMenu(!showCreateMenu);
                setShowUserMenu(false);
                setShowNotifications(false);
              }}
              className="
                flex items-center gap-1.5 px-3 py-2 rounded-lg
                bg-purple-600 hover:bg-purple-500 text-white
                transition-colors text-sm font-medium
                min-h-[40px]
              "
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Créer</span>
            </button>

            {/* Dropdown Créer */}
            {showCreateMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                {CREATE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.path}
                      onClick={() => handleCreateOption(option.path)}
                      className="
                        w-full flex items-center gap-3 px-4 py-3
                        text-sm text-gray-300 hover:bg-white/5 hover:text-white
                        transition-colors text-left
                      "
                    >
                      <Icon className="w-4 h-4 text-gray-400" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bouton Aide rapide */}
          <button
            onClick={() => navigate('/admin/help')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Aide"
            title="Aide & Tutoriels"
          >
            <HelpCircle className="w-5 h-5 text-gray-400" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
                setShowCreateMenu(false);
              }}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Notifications"
            >
              <NotificationBadge />
            </button>
            {showNotifications && (
              <NotificationCenter
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>

          {/* Menu utilisateur */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
                setShowCreateMenu(false);
              }}
              className="
                flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg
                hover:bg-white/5 transition-colors
                min-h-[40px]
              "
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {(profile?.full_name || user?.email || 'A')[0].toUpperCase()}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-300 max-w-[120px] truncate">
                {profile?.full_name || 'Admin'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>

            {/* Dropdown utilisateur */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                {/* Infos utilisateur */}
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-medium text-white truncate">
                    {profile?.full_name || 'Administrateur'}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {user?.email}
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded">
                    {profile?.role === 'developer' ? 'Développeur' : 'Admin'}
                  </span>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/admin/settings');
                    }}
                    className="
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg
                      text-sm text-gray-300 hover:bg-white/5 hover:text-white
                      transition-colors text-left
                    "
                  >
                    <User className="w-4 h-4" />
                    Mon profil
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg
                      text-sm text-red-400 hover:bg-red-500/10
                      transition-colors text-left
                    "
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default memo(AdminTopbar);

