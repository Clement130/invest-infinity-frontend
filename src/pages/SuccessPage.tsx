import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Session invalide');
      setLoading(false);
      return;
    }

    const fetchSessionInfo = async () => {
      try {
        console.log('[SuccessPage] Fetching session info for:', sessionId);
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/get-session-info`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();
        console.log('[SuccessPage] Session info:', data);

        if (data.error) {
          // Message plus explicite selon l'erreur
          if (data.error === 'Payment not completed') {
            setError('Le paiement n\'a pas encore été finalisé. Si tu as payé, attends quelques secondes et rafraîchis la page.');
          } else if (data.error === 'No email in session') {
            setError('Problème de récupération de ton email. Contacte le support Discord.');
          } else {
            setError(data.message || data.error);
          }
          setLoading(false);
          return;
        }

        // Si c'est un nouvel utilisateur avec une URL de vérification, rediriger vers Supabase Auth
        if (data.isNewUser && data.verificationUrl) {
          console.log('[SuccessPage] New user, redirecting to Supabase verification');
          // Redirection vers l'endpoint Supabase qui vérifie le token et établit une session
          // Supabase redirigera ensuite vers /create-password avec une session valide
          window.location.href = data.verificationUrl;
          return;
        }

        // Si utilisateur existant, rediriger vers login
        if (!data.isNewUser) {
          console.log('[SuccessPage] Existing user, redirecting to login');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        // Fallback: rester sur la page de succès
        setLoading(false);
        
      } catch (err) {
        console.error('[SuccessPage] Error:', err);
        setError('Erreur lors de la récupération des informations');
        setLoading(false);
      }
    };

    // Attendre un peu que le webhook soit traité
    const timer = setTimeout(fetchSessionInfo, 2000);
    return () => clearTimeout(timer);
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f13] text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-green-500 to-emerald-500 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">Paiement validé ! 🎉</h1>
          <p className="text-gray-300 mb-2">Préparation de ton espace membre...</p>
          <p className="text-gray-500 text-sm">Cela ne prend que quelques secondes</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f13] text-white flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-500/10 border border-red-500/30 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Un petit souci...</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg font-medium hover:from-pink-600 hover:to-violet-600 transition-all"
            >
              Aller à la connexion
            </button>
            <a
              href="https://discord.gg/Y9RvKDCrWH"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-lg font-medium transition-all"
            >
              Besoin d'aide ? Discord
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Points de lumière néon */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/20 rounded-full filter blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/20 rounded-full filter blur-[100px] animate-pulse delay-1000" />
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
            Ton compte est déjà actif. Connecte-toi pour accéder à ton espace.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-violet-600 transition-all transform hover:scale-[1.02] shadow-lg shadow-pink-500/30"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}
