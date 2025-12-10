import React, { useState } from 'react';
import { Mail, Download, Check, AlertCircle, Loader2 } from 'lucide-react';
import { subscribeToNewsletter } from '../services/newsletterService';
import toast from 'react-hot-toast';

interface NewsletterFormProps {
  className?: string;
}

export default function NewsletterForm({ className = '' }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim()) {
      setError('L\'email est requis');
      return;
    }

    if (!validateEmail(email)) {
      setError('Format d\'email invalide');
      return;
    }

    setIsLoading(true);

    try {
      const result = await subscribeToNewsletter(email);

      if (result.success) {
        setIsSuccess(true);
        toast.success('🎉 Vérifie ta boîte mail ! Ton PDF est en route.');
        setEmail('');
        
        // Réinitialiser après 5 secondes pour permettre une nouvelle inscription
        setTimeout(() => {
          setIsSuccess(false);
        }, 5000);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl" />
      
      <div className="relative bg-gradient-to-br from-[#1a1a1f] to-[#0f0f13] border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
        {/* Titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 mb-4">
            <Download className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Évite les{' '}
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              7 Erreurs Mortelles
            </span>
          </h2>
          <p className="text-xl text-gray-300">
            des Débutants en Trading
          </p>
          <p className="mt-4 text-gray-400 text-lg">
            Télécharge ton guide gratuit et protège ton capital dès maintenant
          </p>
        </div>

        {/* Formulaire */}
        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="Ton adresse email"
                className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${
                  error
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-pink-500/50'
                } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all`}
                disabled={isLoading}
              />
              {error && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Télécharger mon PDF gratuit</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              En t'inscrivant, tu acceptes de recevoir notre newsletter.
              <br />
              Pas de spam, uniquement du contenu de valeur. Tu peux te désinscrire à tout moment.
            </p>
          </form>
        ) : (
          /* Message de succès */
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              🎉 Félicitations !
            </h3>
            <p className="text-gray-300 text-lg mb-4">
              Vérifie ta boîte mail, ton PDF est en route.
            </p>
            <p className="text-gray-400 text-sm">
              Si tu ne le vois pas, pense à vérifier tes spams.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
