import React, { useState, useLayoutEffect } from 'react';
import { Check, Loader2, Shield, MapPin, Calendar, Users, Clock, UtensilsCrossed, Award, ArrowLeft } from 'lucide-react';
import { STRIPE_PRICE_IDS, getStripeSuccessUrl, getStripeCancelUrl } from '../config/stripe';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';

// URL de la fonction checkout publique
const CHECKOUT_PUBLIC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkout-public`;

// Sessions disponibles (à remplacer par une vraie API plus tard)
const AVAILABLE_SESSIONS = [
  { id: '2024-03-04', date: '4-8 mars 2024', places: 3, maxPlaces: 8 },
  { id: '2024-03-18', date: '18-22 mars 2024', places: 6, maxPlaces: 8 },
  { id: '2024-04-01', date: '1-5 avril 2024', places: 2, maxPlaces: 8 },
  { id: '2024-04-15', date: '15-19 avril 2024', places: 8, maxPlaces: 8 },
];

export default function ImmersionElitePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleReservation = async () => {
    if (!selectedSession) {
      toast.error('Veuillez sélectionner une session');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(CHECKOUT_PUBLIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: STRIPE_PRICE_IDS.immersion,
          successUrl: getStripeSuccessUrl(),
          cancelUrl: getStripeCancelUrl(),
          metadata: {
            sessionId: selectedSession,
            sessionDate: AVAILABLE_SESSIONS.find(s => s.id === selectedSession)?.date,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Erreur checkout:', error);
        toast.error('Erreur lors de la création du paiement.');
        setLoading(false);
        return;
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white">
      {/* Header avec bouton retour */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/20 rounded-full filter blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/20 rounded-full filter blur-[100px] animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour aux offres</span>
          </button>

          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                Immersion Élite
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
              Formation présentielle intensive d'une semaine à Marseille
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-yellow-400" />
                <span>Près de Halo, Marseille</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-400" />
                <span>5-8 élèves maximum par session</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-400" />
                <span>Lundi au vendredi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="relative pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Colonne gauche - Détails */}
            <div className="lg:col-span-2 space-y-8">
              {/* Ce qui est inclus */}
              <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-2 border-yellow-500/30 rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-8 text-yellow-400">Ce qui est inclus</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1.5">Tout Transformation inclus</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">Accès complet à la formation en ligne</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1.5">5 jours de formation</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">Lundi au vendredi, 9h-17h</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1.5">Coaching personnalisé</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">Petit groupe pour un suivi optimal</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1.5">Trading en live</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">Avec Mickaël en temps réel</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1.5">Analyse de vos trades</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">Feedback immédiat sur vos positions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1.5">Déjeuners offerts</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">5 repas inclus</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1.5">Certificat de complétion</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">Reconnaissance de votre formation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1.5">Accès VIP Discord</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">Communauté à vie</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Programme type */}
              <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-2 border-yellow-500/30 rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-8 text-yellow-400">Programme type</h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1.5">9h00 - 12h00</h3>
                      <p className="text-gray-400 leading-relaxed">Formation théorique et analyse de marché</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <UtensilsCrossed className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1.5">12h00 - 13h30</h3>
                      <p className="text-gray-400 leading-relaxed">Déjeuner (offert)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1.5">13h30 - 17h00</h3>
                      <p className="text-gray-400 leading-relaxed">Trading en live, analyse de trades, coaching personnalisé</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important */}
              <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-6">
                <h3 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  Important
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  Vous devez gérer votre transport et logement. La formation se déroule près de Halo, Marseille. 
                  Nous vous fournirons des recommandations d'hébergement à proximité après votre réservation.
                </p>
              </div>
            </div>

            {/* Colonne droite - Réservation */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-2 border-yellow-500 rounded-2xl p-8">
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-5xl font-bold text-yellow-400">1 997€</span>
                  </div>
                  <span className="text-gray-400 text-sm block">paiement unique</span>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    Sélectionnez une session
                  </label>
                  <div className="space-y-3">
                    {AVAILABLE_SESSIONS.map((session) => {
                      const isFull = session.places >= session.maxPlaces;
                      const isSelected = selectedSession === session.id;
                      return (
                        <button
                          key={session.id}
                          onClick={() => !isFull && setSelectedSession(session.id)}
                          disabled={isFull}
                          className={`
                            w-full p-4 rounded-lg border-2 transition-all text-left
                            ${isFull 
                              ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-50' 
                              : isSelected
                              ? 'border-yellow-500 bg-yellow-500/10'
                              : 'border-gray-700 bg-gray-800/50 hover:border-yellow-500/50'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-white text-base">{session.date}</span>
                            {isFull ? (
                              <span className="text-xs text-red-400 font-medium">Complet</span>
                            ) : (
                              <span className="text-xs text-green-400 font-medium">
                                {session.maxPlaces - session.places} places restantes
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>{session.places}/{session.maxPlaces} élèves</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleReservation}
                  disabled={!selectedSession || loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-amber-500 text-black rounded-lg font-bold hover:from-yellow-400 hover:to-amber-400 transition-all transform hover:scale-[1.02] shadow-lg shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    <>
                      <Award className="w-5 h-5" />
                      Réserver maintenant
                    </>
                  )}
                </button>

                <div className="mt-6 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">Paiement sécurisé via Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

