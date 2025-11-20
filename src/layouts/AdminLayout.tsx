import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  BookOpen,
  CreditCard,
  BarChart3,
  FileText,
  Eye,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useSession } from '../hooks/useSession';

interface AdminLayoutProps {
  children: ReactNode;
  activeSection?: string;
}

export default function AdminLayout({ children, activeSection = 'dashboard' }: AdminLayoutProps) {
  const { user, profile, signOut } = useSession();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'users', label: 'Utilisateurs', icon: Users, path: '/admin/users' },
    { id: 'leads', label: 'Leads', icon: UserPlus, path: '/admin/leads' },
    { id: 'formations', label: 'Formations', icon: BookOpen, path: '/admin/formations' },
    { id: 'paiements', label: 'Paiements', icon: CreditCard, path: '/admin/paiements' },
    { id: 'analytiques', label: 'Analytiques', icon: BarChart3, path: '/admin/analytiques' },
    { id: 'contenu', label: 'Contenu', icon: FileText, path: '/admin/contenu' },
    { id: 'preview', label: 'Vue Client', icon: Eye, path: '/admin/preview' },
  ];

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition"
            >
              <span className="text-sm font-medium">
                {profile?.full_name || 'Admin'} Administrateur
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <div className="px-3 py-2 text-sm text-gray-400 border-b border-white/10">
                    {user?.email}
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-black p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}


