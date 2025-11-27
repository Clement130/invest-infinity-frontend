import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../../hooks/useSession';
import { getUserStats } from '../../services/memberStatsService';
import {
  Search,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  X,
  BookOpen,
  Target,
  Calendar,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Nouvelle leçon disponible',
    message: 'La leçon "Stratégie ICT avancée" est maintenant accessible.',
    time: 'Il y a 2h',
    read: false,
    type: 'info',
  },
  {
    id: '2',
    title: 'Défi complété !',
    message: 'Félicitations ! Tu as terminé le défi de la semaine.',
    time: 'Hier',
    read: false,
    type: 'success',
  },
  {
    id: '3',
    title: 'Live session demain',
    message: 'N\'oublie pas la session live de trading demain à 14h.',
    time: 'Il y a 2j',
    read: true,
    type: 'warning',
  },
];

const searchSuggestions = [
  { type: 'module', icon: BookOpen, label: 'Étape 1 - La Fondation', path: '/app/modules/etape-1' },
  { type: 'module', icon: BookOpen, label: 'Stratégie ICT', path: '/app/modules/strategie-ict' },
  { type: 'page', icon: Target, label: 'Mes Défis', path: '/app/challenges' },
  { type: 'page', icon: Calendar, label: 'Événements', path: '/app/events' },
  { type: 'page', icon: Settings, label: 'Paramètres', path: '/app/settings' },
];

export default function DashboardHeader() {
  const { user, profile, signOut } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(mockNotifications);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { data: stats } = useQuery({
    queryKey: ['member-stats', user?.id],
    queryFn: () => getUserStats(user?.id || ''),
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Keyboard shortcut pour la recherche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filteredSuggestions = searchSuggestions.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Trader';

  return (
    <>
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/60 border-b border-white/5">
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Greeting (hidden on mobile) - No animation on navigation */}
            <div className="hidden md:flex flex-col">
              <p className="text-sm text-gray-400">
                {getGreeting()},
              </p>
              <h2 className="text-lg font-semibold text-white">
                {firstName} 👋
              </h2>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-xl mx-4">
              <button
                onClick={() => setShowSearch(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all group"
              >
                <Search className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
                <span className="text-gray-500 text-sm flex-1 text-left">
                  Rechercher...
                </span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-[10px] font-medium text-gray-400">
                  <span>⌘</span>K
                </kbd>
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <Bell className="w-5 h-5 text-gray-400" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white"
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowNotifications(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                          <h3 className="font-semibold text-white">Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllRead}
                              className="text-xs text-pink-400 hover:text-pink-300 transition"
                            >
                              Tout marquer comme lu
                            </button>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Aucune notification</p>
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={clsx(
                                  'p-4 border-b border-white/5 hover:bg-white/5 transition cursor-pointer',
                                  !notif.read && 'bg-pink-500/5'
                                )}
                              >
                                <div className="flex gap-3">
                                  <div
                                    className={clsx(
                                      'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                                      notif.type === 'success' && 'bg-green-400',
                                      notif.type === 'warning' && 'bg-yellow-400',
                                      notif.type === 'info' && 'bg-blue-400'
                                    )}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white">
                                      {notif.title}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                      {notif.message}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">{notif.time}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                    <span className="text-sm font-bold text-white">
                      {firstName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown
                    className={clsx(
                      'w-4 h-4 text-gray-400 transition-transform',
                      showUserMenu && 'rotate-180'
                    )}
                  />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                              <span className="text-xl font-bold text-white">
                                {firstName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">
                                {profile?.full_name || 'Utilisateur'}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                          </div>
                          {stats && (
                            <div className="mt-3 flex items-center gap-2">
                              <div className="flex-1 bg-white/10 rounded-full h-1.5">
                                <div
                                  className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full"
                                  style={{
                                    width: `${(stats.xp / stats.nextLevelXp) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">
                                Niv. {stats.level}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-2">
                          <button
                            onClick={() => {
                              navigate('/app/settings');
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition"
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">Paramètres</span>
                          </button>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Déconnexion</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowSearch(false)}
            />
            <motion.div
              ref={searchContainerRef}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-4 p-4 border-b border-white/10">
                <Search className="w-5 h-5 text-gray-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher des modules, leçons, paramètres..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                />
                <button
                  onClick={() => setShowSearch(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-2 max-h-96 overflow-y-auto">
                {searchQuery.length === 0 ? (
                  <div className="p-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                      Suggestions
                    </p>
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          navigate(suggestion.path);
                          setShowSearch(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition"
                      >
                        <suggestion.icon className="w-4 h-4 text-pink-400" />
                        <span className="text-sm">{suggestion.label}</span>
                      </button>
                    ))}
                  </div>
                ) : filteredSuggestions.length > 0 ? (
                  <div className="p-2">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          navigate(suggestion.path);
                          setShowSearch(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition"
                      >
                        <suggestion.icon className="w-4 h-4 text-pink-400" />
                        <span className="text-sm">{suggestion.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun résultat pour "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
