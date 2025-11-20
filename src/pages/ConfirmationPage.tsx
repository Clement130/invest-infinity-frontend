import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Sparkles, Users, TrendingUp, ArrowRight, Gift, Shield } from 'lucide-react';
import { STRIPE_PRICE_IDS, SUPABASE_CHECKOUT_FUNCTION_URL, getStripeSuccessUrl, getStripeCancelUrl } from '../config/stripe';
import { useAuth } from '../context/AuthContext';

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Récupérer l'email depuis localStorage
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);
    
    // Scroll en haut de la page
    window.scrollTo(0, 0);
  }, []);

  const handlePurchase = async (plan: 'essentiel' | 'premium') => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(SUPABASE_CHECKOUT_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          priceId: STRIPE_PRICE_IDS[plan],
          successUrl: getStripeSuccessUrl(),
          cancelUrl: getStripeCancelUrl(),
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-900/10 via-black to-black pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de confirmation */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Félicitations {userEmail ? userEmail.split('@')[0] : ''} ! 🎉
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Ton inscription est confirmée
          </p>
          <p className="text-lg text-gray-400">
            Accède immédiatement à ta formation gratuite
          </p>
        </div>

        {/* Accès immédiat Discord */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-8 mb-12 border border-purple-500/30 animate-fade-up">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-purple-500/20 rounded-lg p-3">
              <Gift className="w-8 h-8 text-purple-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                Accès immédiat activé
              </h2>
              <p className="text-gray-300 mb-4">
                Rejoins notre communauté Discord et accède à ta formation gratuite dès maintenant.
              </p>
              <a
                href="https://discord.gg/Y9RvKDCrWH"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-lg transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Rejoindre Discord maintenant
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-white/5 rounded-xl p-6 mb-12 border border-white/10">
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <div className="flex items-center gap-2 justify-center mb-2">
                <Users className="w-6 h-6 text-pink-400" />
                <span className="text-3xl font-bold text-white">1000+</span>
              </div>
              <p className="text-gray-400 text-sm">Membres actifs</p>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div>
              <div className="flex items-center gap-2 justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <span className="text-3xl font-bold text-white">24/7</span>
              </div>
              <p className="text-gray-400 text-sm">Support disponible</p>
            </div>
          </div>
        </div>

        {/* Offre Premium - Présentation transparente */}
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl p-8 border-2 border-pink-500/30 mb-8">
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-2 bg-pink-500/20 rounded-full mb-4">
              <span className="text-pink-400 font-semibold">✨ Accès Complet</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Prêt à passer au niveau supérieur ?
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Accède à toutes nos formations vidéo, alertes en temps réel, et coaching personnalisé.
              <br />
              <span className="text-pink-400 font-semibold">Tout est inclus, pas de frais cachés.</span>
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Plan Essentiel */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2">Formation Essentiel</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">47€</span>
                <span className="text-gray-400 ml-2">une fois</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Formation complète vidéo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Alertes trading en temps réel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Accès communauté privée</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Support prioritaire</span>
                </li>
              </ul>
              <button
                onClick={() => handlePurchase('essentiel')}
                disabled={loading || !user}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Chargement...' : 'Choisir Essentiel'}
              </button>
            </div>

            {/* Plan Premium */}
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl p-6 border-2 border-pink-500/50 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-1 bg-pink-500 text-white text-sm font-bold rounded-full">
                  Le plus populaire
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Formation Premium</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">197€</span>
                <span className="text-gray-300 ml-2">une fois</span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white font-semibold">Tout du plan Essentiel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Coaching personnalisé 1-to-1</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Stratégies avancées exclusives</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">Accès à vie + mises à jour</span>
                </li>
              </ul>
              <button
                onClick={() => handlePurchase('premium')}
                disabled={loading || !user}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Chargement...' : 'Choisir Premium'}
              </button>
            </div>
          </div>

          {/* Option gratuite */}
          <div className="text-center pt-6 border-t border-white/10">
            <p className="text-gray-400 mb-4">
              Tu préfères commencer gratuitement ? C'est parfait aussi !
            </p>
            <a
              href="https://discord.gg/Y9RvKDCrWH"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors"
            >
              Accéder à la formation gratuite sur Discord
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Garantie et confiance */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-green-400" />
            <span className="text-white font-semibold">Garantie satisfait ou remboursé</span>
          </div>
          <p className="text-gray-400 text-sm">
            Si tu n'es pas satisfait dans les 30 premiers jours, on te rembourse intégralement.
            <br />
            Pas de questions posées.
          </p>
        </div>

        {/* CTA final doux */}
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">
            Des questions ? On est là pour t'aider.
          </p>
          <a
            href="https://discord.gg/Y9RvKDCrWH"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors"
          >
            Rejoindre la communauté Discord
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

