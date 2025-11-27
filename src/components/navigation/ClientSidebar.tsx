import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Target,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useSession } from '../../hooks/useSession';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  divider?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
  { label: 'Mes Formations', icon: BookOpen, path: '/app' },
  { label: 'Ma Progression', icon: TrendingUp, path: '/app/progress' },
  { label: 'Défis', icon: Target, path: '/app/challenges' },
  { label: 'Événements', icon: Calendar, path: '/app/events' },
  { divider: true },
  { label: 'Paramètres', icon: Settings, path: '/app/settings' },
];

export default function ClientSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app' && !location.pathname.startsWith('/app/');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30"
      >
        <Menu className="w-6 h-6 text-purple-400" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-pink-500/20 transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-pink-500/20">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                Invest Infinity
              </h2>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-1 rounded hover:bg-white/10"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item, index) => {
              if (item.divider) {
                return (
                  <div
                    key={`divider-${index}`}
                    className="my-4 border-t border-pink-500/20"
                  />
                );
              }

              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    active
                      ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30'
                      : 'text-gray-400 hover:bg-pink-500/10 hover:text-pink-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Discord Link */}
          <div className="px-4 pb-2">
            <a
              href="https://discord.gg/Y9RvKDCrWH"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#5865F2]/20 text-[#5865F2] hover:bg-[#5865F2]/30 border border-[#5865F2]/30 transition group"
            >
              <img 
                src="/discord-icon.webp" 
                alt="Discord" 
                className="w-5 h-5 group-hover:scale-110 transition-transform"
              />
              <span className="font-medium">Rejoindre Discord</span>
            </a>
          </div>

          {/* Footer - Logout */}
          <div className="p-4 border-t border-pink-500/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}


