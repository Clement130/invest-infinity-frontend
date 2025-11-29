import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Check, ChevronDown, Loader2, Shield, Users, Star, Zap, Crown, Phone, MapPin, Calendar } from 'lucide-react';
import { STRIPE_PRICE_IDS, getStripeSuccessUrl, getStripeCancelUrl, PlanType } from '../config/stripe';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import SocialProofBanner from '../components/SocialProofBanner';

// URL de la fonction checkout publique (sans vérification JWT)
const CHECKOUT_PUBLIC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkout-public`;

export default function PricingPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // Scroller vers le haut de la page au chargement (useLayoutEffect pour exécuter avant le rendu)
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Double vérification avec useEffect pour être sûr
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
    };
    
    scrollToTop();
    
    // Essayer aussi après un court délai
    const timeout = setTimeout(scrollToTop, 50);
    
    return () => clearTimeout(timeout);
  }, []);

  // Paiement direct sans inscription - Stripe collecte l'email
  const handlePurchase = async (plan: PlanType) => {
    // Pour Immersion Élite, rediriger vers la page dédiée
    if (plan === 'immersion') {
      navigate('/immersion-elite');
      return;
    }

    setLoading(plan);

    try {
      const response = await fetch(CHECKOUT_PUBLIC_URL, {
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
        const error = await response.text();
        console.error('Erreur checkout:', error);
        toast.error('Erreur lors de la création du paiement.');
        setLoading(null);
        return;
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue.');
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
      answer: 'L\'offre Transformation inclut une garantie 14 jours satisfait ou remboursé.',
    },
    {
      question: 'Acceptez-vous les virements bancaires ?',
      answer: 'Nous acceptons les cartes de crédit via Stripe. Contactez-nous pour les virements.',
    },
    {
      question: 'Comment fonctionne la garantie ?',
      answer: 'Satisfait ou remboursé pendant 14 jours sur l\'offre Transformation. Aucune question posée.',
    },
    {
      question: 'Comment se passe l\'Immersion Élite ?',
      answer: 'L\'Immersion Élite est une formation présentielle d\'une semaine à Marseille, près de Halo. Les sessions ont lieu du lundi au vendredi de 9h à 17h, avec un maximum de 5-8 élèves par session pour un coaching personnalisé. Les déjeuners sont inclus. Vous gérez votre transport et logement.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white">
      {/* Header */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/20 rounded-full filter blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/20 rounded-full filter blur-[100px] animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <SocialProofBanner variant="inline" />
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-500">
                Nos Offres
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
              Choisissez la formule qui correspond à vos objectifs de trading
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Garantie 14 jours</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                <span>+100 membres</span>
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
            
            {/* Carte ENTRÉE */}
            <div className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-2 border-pink-500/30 rounded-2xl p-8">
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-6 h-6 text-pink-400" />
                  <h3 className="text-2xl font-bold">Entrée</h3>
                </div>
                <p className="text-gray-400 mb-6">Les outils essentiels pour commencer</p>
                
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">147€</span>
                  </div>
                  <span className="text-gray-400 text-sm">paiement unique • accès à vie</span>
                </div>

                <ul className="space-y-3.5 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Accès à vie à la formation vidéo complète (50+ heures)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Communauté privée Discord</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Alertes trading en temps réel</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Support par chat 7j/7</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Tutoriels plateformes (TopStep, Apex, MT4/MT5)</span>
                  </li>
                </ul>

                <button
                  onClick={() => handlePurchase('entree')}
                  disabled={loading === 'entree'}
                  className="w-full py-3 px-6 border-2 border-pink-500/50 text-pink-400 rounded-lg font-medium hover:bg-pink-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading === 'entree' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    'Choisir Entrée — 147€'
                  )}
                </button>
              </div>
            </div>

            {/* Carte TRANSFORMATION */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-pink-500/50 rounded-2xl p-8">
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-2xl font-bold">Transformation</h3>
                </div>
                <p className="text-gray-400 mb-6">Formation + accompagnement en live</p>
                
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">497€</span>
                  </div>
                  <span className="text-gray-400 text-sm">paiement unique • accès à vie</span>
                </div>

                <ul className="space-y-3.5 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Tout Entrée inclus</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Sessions de trading en direct (lun-ven, 15h-17h30)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Replays illimités des sessions live</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Zone Premium : analyses marchés quotidiennes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">2 stratégies ICT éprouvées de Mickaël</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">1 coaching individuel 30min (visio)</span>
                  </li>
                </ul>

                <div className="flex items-center gap-2 mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">Garantie 14 jours satisfait ou remboursé</span>
                </div>

                <button
                  onClick={() => handlePurchase('transformation')}
                  disabled={loading === 'transformation'}
                  className="w-full py-3 px-6 bg-gradient-to-r from-pink-500/80 to-violet-500/80 text-white rounded-lg font-medium hover:from-pink-600 hover:to-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading === 'transformation' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    'Choisir Transformation — 497€'
                  )}
                </button>
              </div>
            </div>

            {/* Carte IMMERSION ÉLITE (MEILLEURE OFFRE) */}
            <div className="relative bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-2 border-yellow-500 rounded-2xl p-8 scale-105 shadow-2xl shadow-yellow-500/20">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-sm font-bold rounded-full flex items-center gap-1">
                  <Crown className="w-4 h-4" />
                  IMMERSION TOTALE
                </span>
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-2xl font-bold">Immersion Élite</h3>
                </div>
                <p className="text-gray-400 mb-4">Formation présentielle intensive à Marseille</p>
                
                <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-yellow-400">1 997€</span>
                  </div>
                  <span className="text-gray-400 text-sm block mb-3">paiement unique • 1 semaine intensive</span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-yellow-400/80">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>Près de Halo, Marseille</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-yellow-400/80">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Lundi au vendredi, 5-8 élèves max</span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3.5 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Tout Transformation inclus</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">5 jours de formation en présentiel (9h-17h)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Coaching personnalisé en petit groupe</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Trading en live avec Mickaël</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Analyse de vos trades en temps réel</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Déjeuners offerts (5 repas)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Certificat de complétion</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-relaxed">Accès VIP Discord à vie</span>
                  </li>
                </ul>

                <button
                  onClick={() => handlePurchase('immersion')}
                  className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-amber-500 text-black rounded-lg font-bold hover:from-yellow-400 hover:to-amber-400 transition-all transform hover:scale-[1.02] shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-2"
                >
                  <Crown className="w-5 h-5" />
                  Réserver Immersion Élite — 1 997€
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section FAQ */}
      <section className="relative py-20 overflow-hidden">
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
    </div>
  );
}
