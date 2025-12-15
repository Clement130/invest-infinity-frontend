import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function CreatePasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Supabase peut envoyer token_hash ou token, et parfois aucun des deux
  // car la vérification se fait via le lien /auth/v1/verify qui établit une session
  const tokenHash = searchParams.get('token_hash');
  const token = searchParams.get('token');
  const type = searchParams.get('type'); // 'recovery' pour reset password
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true); // Commence en loading pour vérifier la session
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a une session active (après redirect de Supabase)
    const checkSession = async () => {
      try {
        // D'abord, gérer le hash fragment si présent (Supabase met parfois les tokens dans le hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // Établir la session à partir des tokens du hash
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionError) {
            console.error('[CreatePassword] Session error:', sessionError);
            setError('Lien invalide ou expiré. Demande un nouveau lien.');
            setLoading(false);
            return;
          }
          
          if (data.user) {
            setUserEmail(data.user.email || null);
            setIsSessionValid(true);
            setLoading(false);
            // Nettoyer le hash de l'URL
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        }
        
        // Si pas de tokens dans le hash, vérifier si on a déjà une session
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
        
        if (getSessionError) {
          console.error('[CreatePassword] Get session error:', getSessionError);
        }
        
        if (session?.user) {
          setUserEmail(session.user.email || null);
          setIsSessionValid(true);
          setLoading(false);
          return;
        }
        
        // Si on a un token_hash dans l'URL, essayer de le vérifier
        if (tokenHash && type === 'recovery') {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          
          if (verifyError) {
            console.error('[CreatePassword] Verify OTP error:', verifyError);
            setError('Lien invalide ou expiré. Demande un nouveau lien via "Mot de passe oublié".');
            setLoading(false);
            return;
          }
          
          if (data.user) {
            setUserEmail(data.user.email || null);
            setIsSessionValid(true);
            setLoading(false);
            return;
          }
        }
        
        // Aucune session valide
        setError('Lien invalide ou expiré. Demande un nouveau lien via "Mot de passe oublié".');
        setLoading(false);
        
      } catch (err) {
        console.error('[CreatePassword] Check session error:', err);
        setError('Erreur lors de la vérification. Réessaie.');
        setLoading(false);
      }
    };
    
    checkSession();
  }, [tokenHash, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      // On a déjà une session valide (établie dans useEffect)
      // On peut directement mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error('[CreatePassword] Update error:', updateError);
        throw updateError;
      }

      console.log('[CreatePassword] Password updated successfully');
      setSuccess(true);
      toast.success('Mot de passe créé avec succès !');

      // Rediriger vers l'app après 3 secondes (temps de voir le bouton Discord)
      setTimeout(() => {
        navigate('/app');
      }, 3000);

    } catch (err: any) {
      console.error('[CreatePassword] Error:', err);
      setError(err.message || 'Erreur lors de la création du mot de passe');
      toast.error('Erreur: ' + (err.message || 'Lien expiré'));
    } finally {
      setLoading(false);
    }
  };

  // Afficher un loader pendant la vérification de session
  if (loading && !isSessionValid) {
    return (
      <div className="min-h-screen bg-[#0f0f13] text-white flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <h1 className="text-xl font-medium">Vérification en cours...</h1>
        </div>
      </div>
    );
  }

  if (error && !isSessionValid) {
    return (
      <div className="min-h-screen bg-[#0f0f13] text-white flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Lien invalide</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg font-medium"
          >
            Aller à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0f0f13] text-white flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-500 rounded-full p-6">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Compte activé ! 🎉</h1>
          <p className="text-gray-400 mb-6">Bienvenue dans la communauté Invest Infinity !</p>
          
          {/* Bouton Discord */}
          <a
            href="https://discord.gg/Y9RvKDCrWH"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl font-semibold transition-all mb-6"
          >
            <img src="/discord-icon.webp" alt="Discord" className="w-6 h-6" />
            Rejoindre le Discord
          </a>
          
          <p className="text-gray-500 text-sm mb-2">Redirection vers ton espace dans 3s...</p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-pink-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex items-center justify-center px-4">

      <div className="relative w-full max-w-md">
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-pink-500/30 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/logo.png" 
              alt="Invest Infinity" 
              className="h-12 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold">Crée ton mot de passe</h1>
            <p className="text-gray-400 mt-2">
              Dernière étape pour accéder à ton espace
            </p>
          </div>

          {/* Email (readonly) */}
          {userEmail && (
            <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white font-medium">{userEmail}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-violet-600 transition-all transform hover:scale-[1.02] shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Activer mon compte
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

