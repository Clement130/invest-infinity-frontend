import { useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function DashboardHeader() {
  const { user, profile, signOut } = useSession();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-sm border-b border-pink-500/20 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Logo ou titre peut être ajouté ici */}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5 transition"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white">
                {profile?.full_name || 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-pink-500/20 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <div className="px-3 py-2 text-sm text-gray-400 border-b border-pink-500/20">
                    {user?.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition"
                  >
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}


