import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Users, Clock, ArrowRight, Shield, Loader2, Star, Zap, Crown, Phone, Check } from 'lucide-react';
import { STRIPE_PRICE_IDS, getStripeSuccessUrl, getStripeCancelUrl, PlanType } from '../config/stripe';
import { getStripePriceId } from '../services/stripePriceService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../hooks/useToast';
import CountdownTimer from '../components/CountdownTimer';
import CalendlyEliteModal from '../components/CalendlyEliteModal';

// URL de la fonction checkout publique (sans vérification JWT)
const CHECKOUT_PUBLIC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkout-public`;

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

// ============================================================================
// CONFIGURATION DES OFFRES (source unique de vérité pour cette page)
// ============================================================================
const OFFERS_CONFIG = {
  starter: {
    id: 'entree' as PlanType,
    name: 'Starter',
    subtitle: 'Les outils essentiels pour commencer',
    price: 147,
    priceText: '147€',
    paymentDescription: 'paiement unique • accès à vie',
    features: [
      'Sessions de trading en direct',
      'Communauté privée Discord',
      'Alertes trading en temps réel',
      'Échanges avec les membres',
      'Tutoriels plateformes (TopStep, Apex, MT4/MT5)',
    ],
    icon: Zap,
    iconColor: 'text-blue-400',
    borderClass: 'border-white/10',
    bgClass: 'bg-white/5',
  },
  premium: {
    id: 'transformation' as PlanType,
    name: 'Premium',
    subtitle: 'Formation + accompagnement',
    price: 497,
    priceText: '497€',
    paymentDescription: 'paiement 3 fois • accès à vie',
    installmentsText: 'ou 3x 166€/mois sans frais',
    badge: { text: 'Garantie 14 jours', color: 'green' },
    features: [
      'Offre Starter incluse',
      'Accès à l\'intégralité de la formation',
      'Groupe exclusif',
      'Accompagnement 7j/7',
      'Ma stratégie de trading rentable',
    ],
    icon: Star,
    iconColor: 'text-pink-400',
    borderClass: 'border-pink-500/30',
    bgClass: 'bg-white/5',
  },
  bootcamp: {
    id: 'immersion' as PlanType,
    name: 'Bootcamp Élite',
    subtitle: 'Formation présentielle intensive',
    price: 1997,
    priceText: '1997€',
    paymentDescription: 'paiement unique • 1 semaine intensive',
    installmentsText: 'ou 3x 666€/mois sans frais',
    badge: { text: 'Bootcamp Élite', color: 'yellow' },
    features: [
      'Tout Premium inclus',
      'Horaires de la formation : 9h–18h',
      '5–8 élèves max',
      'Ateliers guidés pour comprendre et appliquer',
      'Trading en live avec Mickaël',
      'Analyse en direct des marchés',
      'Ma stratégie rentable expliquée de A à Z',
    ],
    icon: Crown,
    iconColor: 'text-yellow-400',
    borderClass: 'border-2 border-yellow-500/50',
    bgClass: 'bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-yellow-600/10',
    isBootcamp: true,
  },
};

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, profile } = useAuth();
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
    const tempPassword = sessionStorage.getItem('tempPassword');
    
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
      // Récupérer le Price ID depuis la DB
      const priceId = await getStripePriceId(plan);
      
      if (!priceId || !priceId.startsWith('price_')) {
        console.error('❌ Price ID invalide:', priceId);
        toast.error('Erreur: configuration Stripe manquante. Contactez le support.');
        setLoading(null);
        return;
      }

      let { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const email = localStorage.getItem('userEmail');
        const tempPassword = sessionStorage.getItem('tempPassword');
        
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
          priceId: priceId,
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

  // Composant de carte d'offre
  const OfferCard = ({ offer, variant }: { offer: typeof OFFERS_CONFIG.starter; variant: 'starter' | 'premium' | 'bootcamp' }) => {
    const isLoading = loading === offer.id;
    const isDisabled = loading !== null || waitingForAuth;
    const Icon = offer.icon;
    const isBootcamp = variant === 'bootcamp';
    
    return (
      <div className={`relative rounded-2xl p-6 ${offer.bgClass} ${offer.borderClass} border flex flex-col h-full transition-all duration-300 hover:scale-[1.02] ${isBootcamp ? 'lg:scale-105 lg:-my-2 shadow-xl shadow-yellow-500/10' : ''}`}>
        {/* Badge en haut de la carte */}
        {isBootcamp && offer.badge && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="px-4 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-sm font-bold rounded-full flex items-center gap-1">
              <Crown className="w-4 h-4" />
              {offer.badge.text}
            </span>
          </div>
        )}
        
        <div className={`mb-4 ${isBootcamp ? 'mt-2' : ''}`}>
          {/* Titre avec icône */}
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-5 h-5 ${offer.iconColor}`} />
            <h3 className="text-xl font-bold text-white">{offer.name}</h3>
          </div>
          
          {/* Sous-titre */}
          <p className="text-gray-400 text-sm mb-3">{offer.subtitle}</p>
          
          {/* Prix */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-4xl font-bold ${isBootcamp ? 'text-yellow-400' : 'text-white'}`}>
              {offer.priceText}
            </span>
          </div>
          
          {/* Description du paiement */}
          <span className="text-gray-400 text-sm">{offer.paymentDescription}</span>
          
          {/* Option paiement en plusieurs fois */}
          {offer.installmentsText && (
            <p className={`text-sm mt-1 ${isBootcamp ? 'text-yellow-400/80' : 'text-amber-400/80'}`}>
              {offer.installmentsText}
            </p>
          )}
        </div>
        
        {/* Badge Garantie pour Premium */}
        {variant === 'premium' && offer.badge && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-semibold">{offer.badge.text}</span>
            </div>
          </div>
        )}
        
        {/* Liste des avantages */}
        <ul className="space-y-3 mb-6 flex-grow">
          {offer.features.map((feature, idx) => {
            const isIncluded = feature.includes('inclus') || feature.includes('incluse');
            return (
              <li key={idx} className="flex items-start gap-2">
                <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isBootcamp ? 'text-yellow-400' : isIncluded ? 'text-pink-400' : 'text-green-400'}`} />
                <span className={`text-sm ${isIncluded ? 'text-white font-semibold' : 'text-gray-300'}`}>
                  {feature}
                </span>
              </li>
            );
          })}
        </ul>
        
        {/* Bouton CTA */}
        {isBootcamp ? (
          <CalendlyEliteModal
            prefillName={profile?.full_name || userPrenom || undefined}
            prefillEmail={user?.email || userEmail || undefined}
            buttonText="Planifier un rendez-vous"
            price="1 997€"
            buttonClassName="
              w-full py-4 px-6 rounded-xl font-bold transition-all duration-300
              bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 
              hover:from-yellow-600 hover:via-amber-600 hover:to-yellow-700
              text-black shadow-lg shadow-yellow-500/25
              flex items-center justify-center gap-2
              relative overflow-hidden group
            "
          />
        ) : (
          <button
            onClick={() => handlePurchase(offer.id)}
            disabled={isDisabled}
            className={`
              w-full px-6 py-4 font-bold rounded-xl transition-all 
              disabled:opacity-50 disabled:cursor-not-allowed 
              flex items-center justify-center gap-2 text-lg
              ${variant === 'premium' 
                ? 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white' 
                : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white'
              }
            `}
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
              `Choisir — ${offer.priceText}`
            )}
          </button>
        )}
      </div>
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
          <OfferCard offer={OFFERS_CONFIG.starter} variant="starter" />
          <OfferCard offer={OFFERS_CONFIG.premium} variant="premium" />
          <OfferCard offer={OFFERS_CONFIG.bootcamp} variant="bootcamp" />
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
