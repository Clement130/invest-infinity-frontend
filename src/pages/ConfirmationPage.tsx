import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Users, Clock, ArrowRight, Shield, Loader2, Star, Zap, Crown, Phone } from 'lucide-react';
import { STRIPE_PRICE_IDS, getStripeSuccessUrl, getStripeCancelUrl, PlanType } from '../config/stripe';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../hooks/useToast';
import CountdownTimer from '../components/CountdownTimer';

// URL de la fonction checkout publique (sans vérification JWT)
const CHECKOUT_PUBLIC_URL = 'https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/checkout-public';

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
  const { user, loading: authLoading, signIn } = useAuth();
  const toast = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPrenom, setUserPrenom] = useState<string | null>(null);
  const [loading, setLoading] = useState<PlanType | null>(null);
  const [waitingForAuth, setWaitingForAuth] = useState(true);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const prenom = localStorage.getItem('userPrenom');
    setUserEmail(email);
    setUserPrenom(prenom);
    window.scrollTo(0, 0);
  }, []);

  // Tentative de connexion automatique si l'utilisateur vient de s'inscrire
  const attemptAutoLogin = useCallback(async () => {
    if (autoLoginAttempted || user) return;
    
    const email = localStorage.getItem('userEmail');
    const tempPassword = localStorage.getItem('tempPassword');
    
    if (email && tempPassword) {
      console.log('[ConfirmationPage] Tentative de connexion automatique...');
      setAutoLoginAttempted(true);
      
      try {
        await signIn(email, tempPassword);
        console.log('[ConfirmationPage] Connexion automatique réussie !');
      } catch (error) {
        console.log('[ConfirmationPage] Connexion automatique échouée:', error);
      }
    }
  }, [autoLoginAttempted, user, signIn]);

  useEffect(() => {
    if (!authLoading) {
      setWaitingForAuth(false);
      if (!user) {
        attemptAutoLogin();
      }
      return;
    }
    const timeout = setTimeout(() => {
      setWaitingForAuth(false);
      if (!user) {
        attemptAutoLogin();
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [authLoading, user, attemptAutoLogin]);

  const handlePurchase = async (plan: PlanType) => {
    setLoading(plan);
    
    try {
      let { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const email = localStorage.getItem('userEmail');
        const tempPassword = localStorage.getItem('tempPassword');
        
        if (email && tempPassword) {
          console.log('[ConfirmationPage] Tentative de connexion avant paiement...');
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password: tempPassword,
            });
            
            if (!signInError && signInData.session) {
              session = signInData.session;
              console.log('[ConfirmationPage] Connexion réussie !');
            }
          } catch (e) {
            console.log('[ConfirmationPage] Connexion échouée:', e);
          }
        }
      }
      
      const storedEmail = localStorage.getItem('userEmail');
      const finalEmail = session?.user?.email || storedEmail || userEmail;
      
      if (!finalEmail) {
        toast.error('Connecte-toi pour finaliser ton achat', {
          duration: 5000,
          action: {
            label: 'Se connecter',
            onClick: () => navigate('/login'),
          },
        });
        setLoading(null);
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY;
        headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
      }

      console.log('[ConfirmationPage] Création session checkout pour:', finalEmail, session ? '(avec session)' : '(sans session)');

      const response = await fetch(CHECKOUT_PUBLIC_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          priceId: STRIPE_PRICE_IDS[plan],
          userId: session?.user?.id || 'pending',
          userEmail: finalEmail,
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
      setLoading(null);
    }
  };

  const renderButton = (plan: PlanType, price: string, variant: 'default' | 'gold' = 'default') => {
    const isLoading = loading === plan;
    const isDisabled = loading !== null || waitingForAuth;
    
    const baseClasses = "w-full px-6 py-4 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg";
    const variantClasses = variant === 'gold' 
      ? "bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-600 hover:via-amber-600 hover:to-yellow-700 text-black shadow-lg shadow-yellow-500/25"
      : "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white";
    
    return (
      <button
        onClick={() => handlePurchase(plan)}
        disabled={isDisabled}
        className={`${baseClasses} ${variantClasses}`}
      >
        {isLoading ? (
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
          `Choisir — ${price}`
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black pt-12 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de confirmation */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            Félicitations {userPrenom || (userEmail ? userEmail.split('@')[0] : '')} ! 🎉
          </h1>
          <p className="text-lg text-gray-300 mb-4">
            Ton inscription est confirmée
          </p>
          
          <div className="inline-block">
            <CountdownTimer 
              durationMinutes={15} 
              label="🔥 Prix de lancement - Augmente dans" 
              variant="compact" 
            />
          </div>
        </div>

        {/* Section titre plans */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Choisis ton accès
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Investis dans ta réussite avec l'offre qui te correspond
          </p>
        </div>

        {/* 3 PLANS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          
          {/* STARTER - 97€ */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Starter</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg text-gray-500 line-through">149€</span>
                <span className="text-4xl font-bold text-white">97€</span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">-35%</span>
              </div>
              <span className="text-gray-400 text-sm">paiement unique • accès à vie</span>
            </div>
            
            <ul className="space-y-3 mb-6 flex-grow">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Alertes de trading</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Accès à la communauté</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Support 7/7</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Vidéos TopStepX/Apex/Metatrader</span>
              </li>
            </ul>
            
            {renderButton('starter', '97€')}
          </div>

          {/* PRO - 347€ */}
          <div className="bg-white/5 rounded-2xl p-6 border border-pink-500/30 flex flex-col">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-pink-400" />
                <h3 className="text-xl font-bold text-white">Pro</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg text-gray-500 line-through">497€</span>
                <span className="text-4xl font-bold text-white">347€</span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">-30%</span>
              </div>
              <span className="text-gray-400 text-sm">paiement unique • accès à vie</span>
            </div>
            
            <ul className="space-y-3 mb-6 flex-grow">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-semibold text-sm">✅ Tout ce qui est dans Starter</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Lives trading (15h-17h30, lun-ven)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Accès aux replays</span>
              </li>
            </ul>
            
            {renderButton('pro', '347€')}
          </div>

          {/* ELITE - 497€ ⭐ MEILLEURE OFFRE */}
          <div className="bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-yellow-600/10 rounded-2xl p-6 border-2 border-yellow-500/50 flex flex-col relative lg:scale-105 lg:-my-2 shadow-xl shadow-yellow-500/10">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="px-4 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-sm font-bold rounded-full flex items-center gap-1">
                <Crown className="w-4 h-4" />
                MEILLEURE OFFRE
              </span>
            </div>
            
            <div className="mb-4 mt-2">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Elite</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg text-gray-500 line-through">997€</span>
                <span className="text-4xl font-bold text-yellow-400">497€</span>
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">-50%</span>
              </div>
              <span className="text-gray-300 text-sm">paiement unique • accès à vie</span>
              <p className="text-yellow-400/80 text-xs mt-1">ou 3x 166€/mois sans frais</p>
            </div>
            
            <ul className="space-y-3 mb-4 flex-grow">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="text-white font-semibold text-sm">✅ Tout ce qui est dans Pro</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Zone Premium (analyses avancées)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Formation complète Invest Infinity</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">2 stratégies rentables</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Mises à jour à vie</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span className="text-yellow-300 font-semibold text-sm">BONUS : Appel 1-to-1 de 30min (200€)</span>
              </li>
            </ul>
            
            {/* Garantie Elite */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-green-400 text-sm font-semibold">Garantie 14 jours satisfait ou remboursé</span>
              </div>
            </div>
            
            {renderButton('elite', '497€', 'gold')}
          </div>
        </div>

        {/* Garantie générale */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10 text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-green-400" />
            <span className="text-white font-semibold">Paiement 100% sécurisé par Stripe</span>
          </div>
          <p className="text-gray-400 text-sm">
            Tes données bancaires sont protégées et ne sont jamais stockées sur nos serveurs.
          </p>
        </div>

        {/* Stats */}
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

        {/* Avis Trustpilot */}
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
