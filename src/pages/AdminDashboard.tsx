import { ShieldCheck, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white py-20 px-4">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="flex flex-col gap-3">
          <ShieldCheck className="w-12 h-12 text-emerald-400" />
          <h1 className="text-4xl font-bold">Administration</h1>
          <p className="text-gray-400">Connecté en tant que {user?.email}</p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400" />
              Gestion des profils
            </h2>
            <p className="text-gray-300">
              Ici tu pourras lister les clients, vérifier leur statut, promouvoir des membres en
              admin, etc. Logique métier à brancher plus tard.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-4">Modules de formation</h2>
            <p className="text-gray-300">
              Ajoute/modifie les vidéos, ressources PDF ou alertes de trading. À implémenter dans
              une prochaine itération.
            </p>
          </div>
        </section>

        <button
          onClick={() => signOut()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 transition font-medium"
        >
          <LogOut className="w-5 h-5" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

