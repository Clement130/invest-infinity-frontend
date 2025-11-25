import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Users, Clock, ArrowRight, Shield, Loader2, Star } from 'lucide-react';
import { STRIPE_PRICE_IDS, SUPABASE_CHECKOUT_FUNCTION_URL, getStripeSuccessUrl, getStripeCancelUrl } from '../config/stripe';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../hooks/useToast';
import CountdownTimer from '../components/CountdownTimer';

// Avis Trustpilot
const reviews = [
  {
    text: "Une team en or ! InvestInfinity, c'est vraiment une équipe exceptionnelle. Toujours présente pour aider, expliquer et pousser chacun à donner le meilleur de soi-même.",
    author: 'M. SERY Damien',
    date: '12 novembre 2025',
  },
  {
    text: "Comment ne pas mettre 5 étoiles avec de telle prof une super pédagogie ils t'apprenne à prendre confiance pour te lancer merci la team",
    author: 'Kévin Ferreira',
    date: '10 novembre 2025',
  },
  {
    text: "Après plus d'une semaine a leurs côtés j'ai énormément appris et les résultats sont extraordinaires. Franchement j'ai rien trouver de mieux.",
    author: 'Gianni',
    date: '5 novembre 2025',
  },
];

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPrenom, setUserPrenom] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const prenom = localStorage.getItem('userPrenom');
    setUserEmail(email);
    setUserPrenom(prenom);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      setWaitingForAuth(false);
      return;
    }
    const timeout = setTimeout(() => {
      setWaitingForAuth(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [authLoading]);

  const handlePurchase = async (plan: 'essentiel' | 'premium') => {
    setLoading(true);
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Connecte-toi pour finaliser ton achat', {
          duration: 4000,
          action: {
            label: 'Se connecter',
            onClick: () => navigate('/login'),
          },
        });
        setLoading(false);
        return;
      }

      const response = await fetch(SUPABASE_CHECKOUT_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: STRIPE_PRICE_IDS[plan],
          userId: session.user.id,
          userEmail: session.user.email || userEmail || '',
          successUrl: getStripeSuccessUrl(),
          cancelUrl: getStripeCancelUrl(),
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la session de paiement');
      }

      const { url } = await response.json();
      if (url) {
        toast.success('Redirection vers le paiement sécurisé...', { duration: 2000 });
        window.location.href = url;
      } else {
        toast.error('Erreur : URL de checkout non reçue.');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error?.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-900/10 via-black to-black pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de confirmation */}
        <div className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            Félicitations {userPrenom || (userEmail ? userEmail.split('@')[0] : '')} ! 🎉
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Ton inscription est confirmée
          </p>
          
          {/* Timer compact inline */}
          <div className="inline-block">
            <CountdownTimer 
              durationMinutes={15} 
              label="🔥 Offre expire dans" 
              variant="compact" 
            />
          </div>
        </div>

        {/* 1. PLANS / PRIX EN PREMIER */}
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl p-6 sm:p-8 border-2 border-pink-500/30 mb-6">
          <div className="text-center mb-6">
            <div className="inline-block px-4 py-2 bg-pink-500/20 rounded-full mb-3">
              <span className="text-pink-400 font-semibold">✨ Accès Complet</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Prêt à passer au niveau supérieur ?
            </h2>
            <p className="text-gray-300 max-w-xl mx-auto">
              Accède à toutes nos formations vidéo, alertes en temps réel, et coaching personnalisé.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plan Essentiel */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2">Formation Essentiel</h3>
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg text-gray-500 line-through">79€</span>
                  <span className="text-4xl font-bold text-white">50€</span>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">-37%</span>
                </div>
                <span className="text-gray-400 text-sm">paiement unique • accès à vie</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">Formation complète vidéo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">Alertes trading en temps réel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">Accès communauté privée</span>
                </li>
              </ul>
              <button
                onClick={() => handlePurchase('essentiel')}
                disabled={loading || waitingForAuth}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redirection...
                  </>
                ) : waitingForAuth ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  'Choisir Essentiel — 50€'
                )}
              </button>
            </div>

            {/* Plan Premium */}
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl p-6 border-2 border-pink-500/50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-3 py-1 bg-pink-500 text-white text-xs font-bold rounded-full">
                  Le plus populaire
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 mt-2">Formation Premium</h3>
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg text-gray-500 line-through">399€</span>
                  <span className="text-4xl font-bold text-white">249.95€</span>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">-37%</span>
                </div>
                <span className="text-gray-300 text-sm">paiement unique • accès à vie</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white font-semibold text-sm">Tout du plan Essentiel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">Coaching personnalisé 1-to-1</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">Stratégies avancées exclusives</span>
                </li>
              </ul>
              <button
                onClick={() => handlePurchase('premium')}
                disabled={loading || waitingForAuth}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redirection...
                  </>
                ) : waitingForAuth ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  'Choisir Premium — 249.95€'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 2. GARANTIE 14 JOURS */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10 text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-green-400" />
            <span className="text-white font-semibold">Garantie 14 jours satisfait ou remboursé</span>
          </div>
          <p className="text-gray-400 text-sm">
            Si tu n'es pas satisfait, on te rembourse intégralement. Pas de questions posées.
          </p>
        </div>

        {/* 3. STATS : 100+ membres et 7/7 */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-6">
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <div className="flex items-center gap-2 justify-center mb-1">
                <Users className="w-5 h-5 text-pink-400" />
                <span className="text-2xl font-bold text-white">100+</span>
              </div>
              <p className="text-gray-400 text-sm">Membres actifs</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <div className="flex items-center gap-2 justify-center mb-1">
                <Clock className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-bold text-white">7/7</span>
              </div>
              <p className="text-gray-400 text-sm">Support disponible</p>
            </div>
          </div>
        </div>

        {/* 4. AVIS TRUSTPILOT */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-lg">★</span>
            <span className="text-white font-semibold">Avis vérifiés Trustpilot</span>
            <span className="text-emerald-400 font-bold">4.5/5</span>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map((review, index) => (
              <div key={index} className="bg-black/30 p-4 rounded-lg border border-white/5">
                <div className="flex mb-2 text-yellow-400 text-sm">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm italic mb-3 line-clamp-3">"{review.text}"</p>
                <div className="text-xs">
                  <p className="text-white font-medium">{review.author}</p>
                  <p className="text-gray-500">{review.date}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-4">
            <a
              href="https://fr.trustpilot.com/review/investinfinity.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
            >
              Voir tous les avis sur Trustpilot
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* CTA final */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Des questions ? Contacte-nous sur Discord
          </p>
        </div>
      </div>
    </div>
  );
}
