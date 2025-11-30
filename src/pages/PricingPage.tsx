import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Check, ChevronDown, Loader2, Shield, Users, Star, Zap, Crown, Phone, MapPin, Calendar, ChevronRight, Sparkles, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { STRIPE_PRICE_IDS, getStripeSuccessUrl, getStripeCancelUrl, PlanType } from '../config/stripe';
import { getStripePriceId } from '../services/stripePriceService';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import SocialProofBanner from '../components/SocialProofBanner';
import { getAllOffers, type OfferId, type OfferConfig } from '../config/offers';

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

  // Fonction helper pour générer la liste des features depuis la config
  const getFeaturesList = (offer: OfferConfig): { text: string; highlight?: boolean; isBonus?: boolean }[] => {
    const features: { text: string; highlight?: boolean; isBonus?: boolean }[] = [];
    
    if (offer.offerId === 'entree') {
      // Starter
      features.push({ text: 'Alertes de trading' });
      features.push({ text: 'Accès à la communauté' });
      features.push({ text: 'Support 7/7' });
      features.push({ text: 'Vidéos TopStepX/Apex/Metatrader' });
    } else if (offer.offerId === 'transformation') {
      // Pro
      features.push({ text: 'Tout ce qui est dans Starter', highlight: true });
      features.push({ text: 'Lives trading (15h-17h30, lun-ven)' });
      features.push({ text: 'Accès aux replays' });
    } else if (offer.offerId === 'immersion_elite') {
      // Elite
      features.push({ text: 'Tout ce qui est dans Pro', highlight: true });
      features.push({ text: 'Zone Premium (analyses avancées)' });
      features.push({ text: 'Formation complète Invest Infinity' });
      features.push({ text: '2 stratégies rentables' });
      features.push({ text: 'Mises à jour à vie' });
      features.push({ text: 'BONUS : Appel 1-to-1 de 30min (200€)', isBonus: true });
    }
    
    return features;
  };

  // Mapping entre OfferId et PlanType pour Stripe
  const offerIdToPlanType = (offerId: OfferId): PlanType => {
    if (offerId === 'immersion_elite') return 'immersion';
    return offerId as PlanType;
  };

  // Paiement direct sans inscription - Stripe collecte l'email
  const handlePurchase = async (plan: PlanType) => {
    // Pour Immersion Élite, rediriger vers la page dédiée
    if (plan === 'immersion') {
      navigate('/immersion-elite');
      return;
    }

    setLoading(plan);

    try {
      // Récupération forcée du Price ID depuis la DB
      const priceId = await getStripePriceId(plan);

      console.log('🎯 Checkout démarré pour plan:', plan);
      console.log('💰 Price ID récupéré:', priceId);

      // Vérifications strictes
      if (!priceId) {
        console.error('❌ Price ID null pour plan:', plan);
        toast.error('Erreur: configuration Stripe manquante. Contactez le support.');
        setLoading(null);
        return;
      }

      if (typeof priceId !== 'string' || priceId.trim() === '') {
        console.error('❌ Price ID invalide (pas une string ou vide):', priceId, typeof priceId);
        toast.error('Erreur: configuration Stripe invalide. Contactez le support.');
        setLoading(null);
        return;
      }

      if (priceId.includes('PLACEHOLDER') || !priceId.startsWith('price_')) {
        console.error('❌ Price ID invalide (placeholder ou mauvais format):', priceId);
        toast.error('Erreur: configuration Stripe incomplète. Contactez le support.');
        setLoading(null);
        return;
      }

      console.log('✅ Price ID validé:', priceId);

      const response = await fetch(CHECKOUT_PUBLIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          priceId: priceId,
          successUrl: getStripeSuccessUrl(),
          cancelUrl: getStripeCancelUrl(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Erreur lors de la création du paiement.';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          console.error('Erreur checkout:', {
            status: response.status,
            error: errorData,
            priceId: priceId,
            plan: plan
          });
        } catch {
          console.error('Erreur checkout (texte brut):', {
            status: response.status,
            error: errorText,
            priceId: priceId,
            plan: plan
          });
        }
        
        toast.error(errorMessage);
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
      answer: 'L\'offre Premium inclut une garantie 14 jours satisfait ou remboursé.',
    },
    {
      question: 'Acceptez-vous les virements bancaires ?',
      answer: 'Nous acceptons les cartes de crédit via Stripe. Contactez-nous pour les virements.',
    },
    {
      question: 'Comment fonctionne la garantie ?',
      answer: 'Satisfait ou remboursé pendant 14 jours sur l\'offre Premium. Aucune question posée.',
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
            
            <h1 className="text-4xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-500">
                Nos Offres
              </span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
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

      {/* Cartes de Pricing - Design Premium */}
      <section className="relative pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-4 items-start">
            {getAllOffers().map((offer) => {
              const features = getFeaturesList(offer);
              const isElite = offer.offerId === 'immersion_elite';
              const isPro = offer.offerId === 'transformation';
              const planType = offerIdToPlanType(offer.offerId);
              const isLoading = loading === planType;
              
              // Icônes selon l'offre
              const Icon = offer.offerId === 'entree' ? Zap : offer.offerId === 'transformation' ? Star : Crown;
              const iconColor = offer.offerId === 'entree' ? 'text-cyan-400' : isPro ? 'text-purple-400' : 'text-yellow-400';
              
              // Styles de bordure selon l'offre - Elite avec bordure jaune/or
              const cardClass = isElite 
                ? 'border-2 border-yellow-500/60 bg-gradient-to-b from-[#1a1a1f] to-[#0d0d10] shadow-[0_0_30px_rgba(234,179,8,0.15)]'
                : 'border border-cyan-500/20 bg-gradient-to-b from-[#0f1419] to-[#0a0d12]';
              
              return (
                <div
                  key={offer.offerId}
                  className={`relative rounded-2xl ${cardClass} overflow-hidden max-w-[380px] mx-auto lg:max-w-none transition-all duration-300 hover:scale-[1.02]`}
                >
                  {/* Badge "MEILLEURE OFFRE" pour Elite */}
                  {isElite && offer.badge && (
                    <div className="absolute -top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg">
                        <Crown className="w-3.5 h-3.5" />
                        {offer.badge.text}
                      </span>
                    </div>
                  )}
                  
                  <div className="p-6 pt-8">
                    {/* Header avec icône */}
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                      <h3 className="text-xl font-bold text-white">{offer.name}</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-5">{offer.description}</p>
                    
                    {/* Section Prix avec ancien prix barré et réduction */}
                    <div className="mb-1">
                      {/* Ancien prix barré + badge réduction */}
                      <div className="flex items-center gap-3 mb-1">
                        {offer.oldPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {offer.oldPrice.toLocaleString('fr-FR')}€
                          </span>
                        )}
                        {offer.discountPercent && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isElite 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : isPro 
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-cyan-500/20 text-cyan-400'
                          }`}>
                            -{offer.discountPercent}%
                          </span>
                        )}
                      </div>
                      
                      {/* Prix actuel */}
                      <div className="text-4xl font-bold text-white mb-1">
                        {offer.price.toLocaleString('fr-FR')}€
                      </div>
                      
                      {/* Description paiement */}
                      <span className="text-sm text-gray-400">{offer.paymentDescription}</span>
                      
                      {/* Paiement en 3x sans frais */}
                      {offer.installmentsText && (
                        <div className={`text-sm mt-1 ${isElite ? 'text-amber-400' : 'text-purple-400'}`}>
                          {offer.installmentsText}
                        </div>
                      )}
                    </div>

                    {/* Liste des avantages */}
                    <ul className="space-y-3 my-6">
                      {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          {feature.isBonus ? (
                            <Phone className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isElite ? 'text-amber-400' : 'text-cyan-400'}`} />
                          ) : feature.highlight ? (
                            <div className={`w-4 h-4 flex-shrink-0 mt-0.5 rounded ${isElite ? 'bg-yellow-500' : isPro ? 'bg-purple-500' : 'bg-cyan-500'} flex items-center justify-center`}>
                              <Check className="w-3 h-3 text-black" />
                            </div>
                          ) : (
                            <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isElite ? 'text-yellow-500' : isPro ? 'text-purple-400' : 'text-cyan-400'}`} />
                          )}
                          <span className={`text-sm leading-relaxed ${
                            feature.isBonus 
                              ? (isElite ? 'text-amber-400 font-semibold' : 'text-cyan-400 font-semibold')
                              : 'text-gray-300'
                          }`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Garantie pour Elite */}
                    {isElite && (
                      <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                          <Shield className="w-4 h-4" />
                          <span>Garantie 14 jours satisfait ou remboursé</span>
                        </div>
                      </div>
                    )}

                    {/* Bouton CTA */}
                    <button
                      onClick={() => handlePurchase(planType)}
                      disabled={isLoading}
                      className={`
                        w-full py-3.5 px-6 rounded-lg font-semibold transition-all duration-300
                        disabled:opacity-50 disabled:cursor-not-allowed 
                        flex items-center justify-center gap-2
                        ${isElite
                          ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black hover:shadow-lg hover:shadow-yellow-500/30 hover:scale-[1.02]'
                          : isPro
                          ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:shadow-lg hover:shadow-purple-500/30'
                          : 'border-2 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400/60'
                        }
                      `}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Redirection...</span>
                        </>
                      ) : (
                        <>
                          {isElite && <Crown className="w-4 h-4" />}
                          <span>
                            Choisir {offer.name} — {offer.price.toLocaleString('fr-FR')}€
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section FAQ - Design premium identique à la page d'accueil */}
      <section className="relative bg-[#0f0f13] py-16 sm:py-24 lg:py-32 overflow-hidden">
        {/* Dégradés d'arrière-plan */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/20 rounded-full filter blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full filter blur-[150px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            {/* Badge "Questions Fréquentes" - style pill violet foncé */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 mb-8">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <span className="text-pink-200 font-medium text-sm sm:text-base">Questions Fréquentes</span>
            </div>

            {/* Titre avec gradient rose/violet amélioré */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              <span className="block">Tout ce que tu dois</span>
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-500 to-purple-500">
                savoir avant de commencer
              </span>
            </h2>

            {/* Sous-texte */}
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Tu as des questions ? On a les réponses. Si tu ne trouves pas ce que tu cherches, pose ta question au chatbot !
            </p>
          </motion.div>

          {/* FAQ Items - Accordéons améliorés */}
          <div className="grid gap-4 mb-12">
            <AnimatePresence mode="wait">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="relative group"
                  >
                    {/* Glow effect au hover */}
                    <div className="absolute -inset-0.5 bg-pink-500 opacity-0 group-hover:opacity-20 blur-lg rounded-2xl transition duration-500" />
                    
                    {/* Conteneur de l'accordéon */}
                    <div className="relative bg-[#1f1f23] rounded-2xl overflow-hidden border border-pink-500/10 transition-all duration-500 hover:border-pink-500/20">
                      <button
                        className="w-full px-6 sm:px-8 py-5 text-left flex justify-between items-start gap-4 group/button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        aria-expanded={isOpen}
                      >
                        <div className="flex-1">
                          <span className={clsx(
                            "text-base sm:text-lg font-medium block transition-colors",
                            isOpen ? "text-pink-400" : "text-white group-hover/button:text-pink-400"
                          )}>
                            {faq.question}
                          </span>
                        </div>
                        
                        {/* Chevron icon */}
                        <div className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
                          isOpen 
                            ? "bg-pink-500/30 rotate-180" 
                            : "bg-pink-500/10 group-hover/button:bg-pink-500/20"
                        )}>
                          <ChevronDown className="w-5 h-5 text-pink-400 transition-transform duration-300" />
                        </div>
                      </button>
                      
                      {/* Contenu de la réponse avec animation */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 sm:px-8 pb-6 text-gray-300 leading-relaxed whitespace-pre-line">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Call to Action Chatbot - Bouton avec gradient */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center"
          >
            <p className="text-gray-400 mb-4 text-base sm:text-lg">
              Tu n'as pas trouvé ta réponse ?
            </p>
            <button
              onClick={() => {
                // Déclencher un événement personnalisé pour ouvrir le chatbot
                window.dispatchEvent(new CustomEvent('openChatbot'));
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/25 hover:scale-105 active:scale-95"
              aria-label="Ouvrir le chatbot pour poser une question"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Pose ta question au chatbot</span>
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
