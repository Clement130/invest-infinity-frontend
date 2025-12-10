/**
 * AdminSidebar – Sidebar responsive pour l'admin panel
 * 
 * - Desktop (lg+): Sidebar permanente à gauche
 * - Mobile/Tablette: Drawer overlay avec gestion tactile
 * - Navigation groupée par sections logiques
 * - Highlight actif explicite (pas de dépendance au hover)
 */

import { memo } from 'react';
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
  Video,
  CalendarCheck,
  Settings,
  GraduationCap,
  X,
  HelpCircle,
  Bot,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

// Types pour les items de navigation
interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// Configuration des groupes de navigation
const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Général',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    ],
  },
  {
    title: 'Utilisateurs',
    items: [
      { id: 'users', label: 'Utilisateurs', icon: Users, path: '/admin/users' },
      { id: 'leads', label: 'Leads', icon: UserPlus, path: '/admin/leads' },
    ],
  },
  {
    title: 'Contenu',
    items: [
      { id: 'formations', label: 'Formations', icon: BookOpen, path: '/admin/formations' },
      { id: 'videos', label: 'Vidéos', icon: Video, path: '/admin/videos' },
      { id: 'contenu', label: 'Pages', icon: FileText, path: '/admin/contenu' },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { id: 'immersion', label: 'Immersion Élite', icon: GraduationCap, path: '/admin/immersion' },
      { id: 'appointments', label: 'Demandes RDV', icon: CalendarCheck, path: '/admin/appointments' },
      { id: 'support', label: 'Messages & Support', icon: MessageSquare, path: '/admin/support' },
    ],
  },
  {
    title: 'Business',
    items: [
      { id: 'paiements', label: 'Paiements', icon: CreditCard, path: '/admin/paiements' },
      { id: 'analytiques', label: 'Analytiques', icon: BarChart3, path: '/admin/analytiques' },
      { id: 'chatbot', label: 'Chatbot', icon: Bot, path: '/admin/chatbot' },
    ],
  },
  {
    title: 'Système',
    items: [
      { id: 'preview', label: 'Vue Client', icon: Eye, path: '/admin/preview' },
      { id: 'settings', label: 'Paramètres', icon: Settings, path: '/admin/settings' },
      { id: 'help', label: 'Aide & Tutoriels', icon: HelpCircle, path: '/admin/help' },
    ],
  },
];

interface AdminSidebarProps {
  activeSection: string;
  isOpen: boolean;
  onClose: () => void;
}

function AdminSidebar({ activeSection, isOpen, onClose }: AdminSidebarProps) {
  const navigate = useNavigate();

  const handleNavClick = (path: string) => {
    navigate(path);
    // Fermer le drawer sur mobile après navigation
    onClose();
  };

  return (
    <>
      {/* Overlay pour mobile/tablette - ferme le drawer au tap */}
      <div
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300
          lg:hidden
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-white/10
          flex flex-col z-50 transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header sidebar */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Admin Panel
          </h2>
          {/* Bouton fermer visible uniquement sur mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Navigation groupée */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              {/* Titre de section */}
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {group.title}
              </h3>
              {/* Items de navigation */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.path)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200 text-left
                        min-h-[44px]
                        ${
                          isActive
                            ? 'bg-purple-500/20 text-purple-400 shadow-sm shadow-purple-500/10'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white active:bg-white/10'
                        }
                      `}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm">{item.label}</span>
                      {/* Indicateur actif visible sans hover */}
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer sidebar - version / mode */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-400">
              Mode {import.meta.env.MODE === 'production' ? 'Production' : 'Développement'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default memo(AdminSidebar);

