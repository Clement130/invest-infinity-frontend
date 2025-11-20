import React, { useEffect } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Rediriger vers /app après 5 secondes
    const timer = setTimeout(() => {
      navigate('/app');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

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
              <div className="absolute inset-0 bg-pink-500/30 rounded-full blur-2xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-pink-500 to-violet-500 rounded-full p-6">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-500">
              Paiement réussi !
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-8">
            Merci pour votre achat. Votre accès a été activé.
          </p>

          {/* Session ID si présent */}
          {sessionId && (
            <p className="text-sm text-gray-500 mb-8">
              Session ID: {sessionId}
            </p>
          )}

          {/* Message de redirection */}
          <div className="flex items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Redirection vers votre espace en cours...</span>
          </div>

          {/* Bouton pour rediriger manuellement */}
          <button
            onClick={() => navigate('/app')}
            className="mt-8 px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-violet-600 transition-all transform hover:scale-[1.02] shadow-lg shadow-pink-500/30"
          >
            Accéder à mon espace maintenant
          </button>
        </div>
      </div>
    </div>
  );
}

