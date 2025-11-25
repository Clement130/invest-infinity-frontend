import React, { useState } from 'react';
import { Check, ChevronDown, Loader2, Shield, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { supabase } from '../lib/supabaseClient';
import { STRIPE_PRICE_IDS, SUPABASE_CHECKOUT_FUNCTION_URL, getStripeSuccessUrl, getStripeCancelUrl } from '../config/stripe';
import { useToast } from '../hooks/useToast';
import SocialProofBanner from '../components/SocialProofBanner';

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (plan: 'essentiel' | 'premium') => {
    if (!user) {
      // Si non connecté, ouvrir AuthModal
      setAuthMode('register');
      setShowAuthModal(true);
      return;
    }

    setLoading(plan);

    try {
      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Vous devez être connecté pour effectuer un achat.', {
          action: {
            label: 'Se connecter',
            onClick: () => navigate('/login'),
          },
        });
        setLoading(null);
        return;
      }

      // Déterminer le Price ID selon le plan
      const priceId = plan === 'essentiel' 
        ? STRIPE_PRICE_IDS.essentiel 
        : STRIPE_PRICE_IDS.premium;

      // Appeler l'Edge Function Supabase pour créer la session Checkout
      const response = await fetch(SUPABASE_CHECKOUT_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: priceId,
          userId: user.id,
          userEmail: user.email || session.user.email || '',
          successUrl: getStripeSuccessUrl(),
          cancelUrl: getStripeCancelUrl(),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Erreur lors de la création de la session Checkout:', error);
        toast.error('Erreur lors de la création de la session de paiement. Veuillez réessayer.', {
          action: {
            label: 'Réessayer',
            onClick: () => handlePurchase(plan),
          },
        });
        setLoading(null);
        return;
      }

      const { url } = await response.json();

      if (!url) {
        toast.error('Erreur : URL de checkout non reçue. Veuillez réessayer.');
        setLoading(null);
        return;
      }

      // Rediriger vers la page de checkout Stripe
      toast.success('Redirection vers le paiement...', { duration: 2000 });
      window.location.href = url;
    } catch (error) {
      console.error('Erreur lors de l\'achat:', error);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
      setLoading(null);
    }
  };

  const faqs = [
    {
      question: 'Puis-je changer de plan ?',
      answer: 'Oui, vous pouvez passer à un plan supérieur à tout moment. Contactez-nous pour les détails.',
    },
    {
      question: 'Y a-t-il une période d\'essai ?',
      answer: 'Le plan Essentiel et Premium incluent une garantie 30 jours satisfait ou remboursé.',
    },
    {
      question: 'Acceptez-vous les virements bancaires ?',
      answer: 'Nous acceptons les cartes de crédit via Stripe. Contactez-nous pour les virements.',
    },
    {
      question: 'Comment fonctionne la garantie ?',
      answer: 'Satisfait ou remboursé pendant 30 jours. Aucune question posée.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white">
      {/* Header */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Points de lumière néon */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/20 rounded-full filter blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/20 rounded-full filter blur-[100px] animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            {/* Social proof */}
            <div className="flex justify-center mb-6">
              <SocialProofBanner variant="inline" />
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-500">
                Nos Offres
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
              Choisissez le plan qui correspond à vos objectifs de trading
            </p>
            
            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Garantie 30 jours</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                <span>+1000 membres</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span>4.8/5 de satisfaction</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cartes de Pricing */}
      <section className="relative pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Carte GRATUIT */}
            <div className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-2 border-pink-500/30 rounded-2xl p-8">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-slate-700 text-sm rounded-full text-gray-300">
                  Votre plan actuel
                </span>
              </div>

              <div className="mt-8">
                <h3 className="text-2xl font-bold mb-2">Gratuit</h3>
                <p className="text-gray-400 mb-6">Pour découvrir la plateforme</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold">Gratuit</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Accès à la communauté Discord</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Alertes trading en temps réel</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Webinaires en direct</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Support par email</span>
                  </li>
                </ul>

                <button
                  disabled
                  className="w-full py-3 px-6 border-2 border-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
                >
                  Plan actuel
                </button>
              </div>
            </div>

            {/* Carte ESSENTIEL (Recommandé) */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-pink-500 rounded-2xl p-8 scale-105 shadow-2xl shadow-pink-500/20">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm font-bold rounded-full">
                  Recommandé
                </span>
              </div>

              <div className="mt-8">
                <h3 className="text-2xl font-bold mb-2">Essentiel</h3>
                <p className="text-gray-400 mb-6">Pour apprendre les bases</p>
                
                <div className="mb-8">
                  <div className="flex items-baseline gap-2 justify-center">
                    <span className="text-lg text-gray-500 line-through">79€</span>
                    <span className="text-4xl font-bold">50€</span>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">-37%</span>
                  </div>
                  <span className="text-gray-400 text-sm">paiement unique • accès à vie</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Accès à tous les plans Gratuit</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Formation complète (modules 1-3)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Cours spécialisés</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Ressources téléchargeables</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Support prioritaire</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Accès à vie</span>
                  </li>
                </ul>

                <button
                  onClick={() => handlePurchase('essentiel')}
                  disabled={loading === 'essentiel'}
                  className="w-full py-3 px-6 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-violet-600 transition-all transform hover:scale-[1.02] shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading === 'essentiel' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    'Acheter maintenant'
                  )}
                </button>
              </div>
            </div>

            {/* Carte PREMIUM */}
            <div className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-2 border-white/10 rounded-2xl p-8">
              <div className="mt-8">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <p className="text-gray-400 mb-6">Pour la maîtrise complète</p>
                
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg text-gray-500 line-through">399€</span>
                    <span className="text-4xl font-bold">249.95€</span>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">-37%</span>
                  </div>
                  <span className="text-gray-400 text-sm">paiement unique • accès à vie</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Accès à tous les plans Essentiel</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Formation premium (tous les modules)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Coaching personnalisé (1-2-1)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Groupe privé exclusif</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Outils de trading avancés</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Mises à jour à vie</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Garantie 30 jours satisfait ou remboursé</span>
                  </li>
                </ul>

                <button
                  onClick={() => handlePurchase('premium')}
                  disabled={loading === 'premium'}
                  className="w-full py-3 px-6 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-violet-600 transition-all transform hover:scale-[1.02] shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading === 'premium' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    'Acheter maintenant'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section FAQ */}
      <section className="relative py-20 overflow-hidden">
        {/* Points de lumière néon */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/10 rounded-full filter blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full filter blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Questions
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-500">
                Fréquentes
              </span>
            </h2>
          </div>

          <div className="grid gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="relative group">
                {/* Neon glow effect */}
                <div className="absolute -inset-0.5 bg-pink-500 opacity-0 group-hover:opacity-20 blur-lg rounded-2xl transition duration-500" />
                
                <div className="relative bg-[#1f1f23] rounded-2xl overflow-hidden border border-pink-500/10 transition-all duration-500">
                  <button
                    className="w-full px-8 py-6 text-left flex justify-between items-center group/button"
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  >
                    <span className="text-lg font-medium text-white group-hover:text-pink-400 transition-colors">
                      {faq.question}
                    </span>
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      bg-pink-500/10 group-hover:bg-pink-500/20
                      transition-all duration-300
                      ${openFaqIndex === index ? 'rotate-180' : ''}
                    `}>
                      <ChevronDown className="w-5 h-5 text-pink-400" />
                    </div>
                  </button>
                  
                  <div
                    className={`
                      overflow-hidden transition-all duration-500
                      ${openFaqIndex === index ? 'max-h-96' : 'max-h-0'}
                    `}
                  >
                    <div className="px-8 pb-6 text-gray-400">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AuthModal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          type={authMode}
          redirectTo="client"
        />
      )}
    </div>
  );
}

