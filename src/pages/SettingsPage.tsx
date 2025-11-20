import { useState } from 'react';
import { useSession } from '../hooks/useSession';
import { User, Bell, Lock, Globe, Trash2, Save } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile } = useSession();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showProgress: true,
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-400">Gérez vos préférences et votre compte</p>
      </header>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Profil</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                defaultValue={profile?.full_name || ''}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                disabled
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed"
              />
            </div>
            <button className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition font-medium flex items-center gap-2">
              <Save className="w-4 h-4" />
              Enregistrer les modifications
            </button>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-pink-400" />
            <h2 className="text-xl font-semibold text-white">Notifications</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Notifications par email</p>
                <p className="text-sm text-gray-400">Recevez des emails pour les nouveaux contenus</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) =>
                  setNotifications({ ...notifications, email: e.target.checked })
                }
                className="w-5 h-5 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Notifications push</p>
                <p className="text-sm text-gray-400">Recevez des notifications dans le navigateur</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={(e) =>
                  setNotifications({ ...notifications, push: e.target.checked })
                }
                className="w-5 h-5 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Résumé hebdomadaire</p>
                <p className="text-sm text-gray-400">Recevez un résumé de votre progression chaque semaine</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.weekly}
                onChange={(e) =>
                  setNotifications({ ...notifications, weekly: e.target.checked })
                }
                className="w-5 h-5 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500"
              />
            </label>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Confidentialité</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Profil visible</p>
                <p className="text-sm text-gray-400">
                  Permettre aux autres membres de voir votre profil
                </p>
              </div>
              <input
                type="checkbox"
                checked={privacy.profileVisible}
                onChange={(e) =>
                  setPrivacy({ ...privacy, profileVisible: e.target.checked })
                }
                className="w-5 h-5 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Afficher la progression</p>
                <p className="text-sm text-gray-400">
                  Afficher votre progression dans les classements
                </p>
              </div>
              <input
                type="checkbox"
                checked={privacy.showProgress}
                onChange={(e) =>
                  setPrivacy({ ...privacy, showProgress: e.target.checked })
                }
                className="w-5 h-5 rounded bg-white/5 border-white/10 text-purple-500 focus:ring-purple-500"
              />
            </label>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-semibold text-red-400">Zone de danger</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              La suppression de votre compte est irréversible. Toutes vos données seront
              définitivement supprimées.
            </p>
            <button className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 transition">
              Supprimer mon compte
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}


