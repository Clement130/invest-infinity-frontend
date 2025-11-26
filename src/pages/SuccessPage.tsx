import React from 'react';
import { CheckCircle, Mail, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Points de lumière néon */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/20 rounded-full filter blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/20 rounded-full filter blur-[100px] animate-pulse delay-1000" />
        </div>

        <div className="relative">
          {/* Icône de succès */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-500 rounded-full p-6">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              Paiement réussi !
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-8">
            Merci pour ton achat ! 🎉
          </p>

          {/* Étape suivante - Vérifier les emails */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-pink-500/30 rounded-2xl p-8 mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-pink-500/20 rounded-full p-4">
                <Mail className="w-10 h-10 text-pink-400" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-4 text-white">
              Vérifie tes emails 📧
            </h2>
            
            <p className="text-gray-400 mb-6">
              Tu vas recevoir un email pour <span className="text-pink-400 font-semibold">créer ton mot de passe</span> et accéder à ton espace membre.
            </p>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-left">
              <p className="text-yellow-400 text-sm">
                💡 <strong>Pense à vérifier tes spams</strong> si tu ne vois pas l'email dans les prochaines minutes.
              </p>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-violet-600 transition-all transform hover:scale-[1.02] shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2"
            >
              Se connecter
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => window.open('https://mail.google.com', '_blank')}
              className="px-8 py-3 border-2 border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Ouvrir Gmail
            </button>
          </div>

          {/* Session ID (discret) */}
          {sessionId && (
            <p className="text-xs text-gray-600 mt-8">
              Référence: {sessionId.slice(0, 20)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
