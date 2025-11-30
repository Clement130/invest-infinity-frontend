import React, { useState, useLayoutEffect, useEffect } from 'react';
import { Check, Loader2, Shield, MapPin, Calendar, Users, Clock, UtensilsCrossed, Award, ArrowLeft, Crown } from 'lucide-react';
import { getStripeSuccessUrl, getStripeCancelUrl } from '../config/stripe';
import { getStripePriceId } from '../services/stripePriceService';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { 
  getActiveSessions, 
  formatSessionDates, 
  getAvailablePlaces,
  ImmersionSession 
} from '../services/immersionSessionsService';
import CalendlyEliteModal from '../components/CalendlyEliteModal';
import { useAuth } from '../context/AuthContext';

// URL de la fonction checkout publique
const CHECKOUT_PUBLIC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkout-public`;

export default function ImmersionElitePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ImmersionSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Charger les sessions depuis la base de données
  useEffect(() => {
    async function loadSessions() {
      setLoadingSessions(true);
      try {
        const activeSessions = await getActiveSessions();
        setSessions(activeSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
        toast.error('Erreur lors du chargement des sessions');
      } finally {
        setLoadingSessions(false);
      }
    }

    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Ne charger qu'une seule fois au montage

  const handleReservation = async () => {
    if (!selectedSession) {
      toast.error('Veuillez sélectionner une session');
      return;
    }

    const session = sessions.find(s => s.id === selectedSession);
    if (!session) {
      toast.error('Session introuvable');
      return;
    }

    // Vérifier les places disponibles
    if (session.status === 'full' || session.reserved_places >= session.max_places) {
      toast.error('Cette session est complète');
      return;
    }

    setLoading(true);

    try {
      // Récupérer le Price ID depuis la DB
      const priceId = await getStripePriceId('immersion');
      
      if (!priceId || priceId.includes('PLACEHOLDER')) {
        console.error('Price ID invalide ou placeholder:', priceId);
        toast.error('Erreur de configuration. Veuillez réessayer dans quelques instants.');
        setLoading(false);
        return;
      }

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
          metadata: {
            type: 'immersion',
            sessionId: selectedSession,
            sessionDateStart: session.session_date_start,
            sessionDateEnd: session.session_date_end,
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
          {/* Effets de glow animés uniquement sur desktop */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/20 rounded-full filter blur-[100px] hidden md:block md:animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/20 rounded-full filter blur-[100px] hidden md:block md:animate-pulse md:delay-1000" />
          {/* Version mobile simplifiée - statique */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full filter blur-[60px] md:hidden" />
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
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 drop-shadow-lg">
                Immersion Élite
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 font-medium">
              Formation présentielle intensive
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8 text-sm lg:text-base">
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <MapPin className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-gray-300 font-medium">Près de Halo, Marseille</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <Users className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-gray-300 font-medium">5-8 élèves maximum par session</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <Calendar className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-gray-300 font-medium">Lundi au vendredi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="relative pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            
            {/* Colonne gauche - Détails */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              {/* Ce qui est inclus */}
              <div className="bg-gradient-to-br from-slate-900/60 via-slate-800/60 to-slate-900/60 backdrop-blur-sm border-2 border-yellow-500/30 rounded-3xl p-8 lg:p-10 shadow-xl">
                <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">
                  Ce qui est inclus
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1.5 text-base">Tout Premium inclus</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">Accès complet à la formation en ligne</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1.5 text-base">Horaire de la formation : 9h–18h</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">Lundi au vendredi</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1.5 text-base">Ateliers guidés</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">Pour comprendre et appliquer</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1.5 text-base">Trading en live avec Mickaël</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">Sessions de trading en temps réel</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1.5 text-base">Analyse en direct des marchés</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">Feedback immédiat sur les opportunités</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1.5 text-base">Ma stratégie rentable de A à Z</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">Expliquée en détail par Mickaël</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Programme type */}
              <div className="bg-gradient-to-br from-slate-900/60 via-slate-800/60 to-slate-900/60 backdrop-blur-sm border-2 border-yellow-500/30 rounded-3xl p-8 lg:p-10 shadow-xl">
                <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400">
                  Programme type
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-5 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1.5 text-lg">9h00 - 12h00</h3>
                      <p className="text-gray-400 leading-relaxed">Formation théorique et analyse de marché</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-5 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5 text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1.5 text-lg">12h00 - 13h30</h3>
                      <p className="text-gray-400 leading-relaxed">Déjeuner (offert)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-5 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1.5 text-lg">13h30 - 17h00</h3>
                      <p className="text-gray-400 leading-relaxed">Trading en live, analyse de trades, coaching personnalisé</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important */}
              <div className="bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-blue-500/10 backdrop-blur-sm border-2 border-blue-500/40 rounded-3xl p-6 lg:p-8 shadow-lg">
                <h3 className="font-bold text-lg text-blue-400 mb-4 flex items-center gap-3">
                  <Shield className="w-6 h-6 flex-shrink-0" />
                  <span>Important</span>
                </h3>
                <p className="text-gray-300 leading-relaxed text-base">
                  Vous devez gérer votre transport et logement. La formation se déroule près de Halo, Marseille. 
                  Nous vous fournirons des recommandations d'hébergement à proximité après votre réservation.
                </p>
              </div>
            </div>

            {/* Colonne droite - Réservation */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-sm border-2 border-yellow-500/40 rounded-3xl p-8 shadow-2xl shadow-yellow-500/20">
                {/* Prix avec design premium */}
                <div className="text-center mb-8 pb-8 border-b border-yellow-500/20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-6xl font-extrabold bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent leading-none">
                        1 997€
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">paiement unique</span>
                  </div>
                </div>

                {/* Sélection de session */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-200 mb-4 uppercase tracking-wide">
                    Sélectionnez une session
                  </label>
                  <div className="space-y-3">
                    {loadingSessions ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
                        <span className="ml-3 text-gray-400">Chargement des sessions...</span>
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Aucune session disponible pour le moment</p>
                      </div>
                    ) : (
                      sessions.map((session) => {
                        const isFull = session.status === 'full' || session.reserved_places >= session.max_places;
                        const isSelected = selectedSession === session.id;
                        const availablePlaces = getAvailablePlaces(session);
                        
                        return (
                          <button
                            key={session.id}
                            onClick={() => !isFull && setSelectedSession(session.id)}
                            disabled={isFull}
                            className={`
                              w-full p-5 rounded-xl border-2 transition-all duration-300 text-left
                              ${isFull 
                                ? 'border-gray-700/50 bg-gray-800/30 cursor-not-allowed opacity-50' 
                                : isSelected
                                ? 'border-yellow-500 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 shadow-lg shadow-yellow-500/20 scale-[1.02]'
                                : 'border-gray-700/50 bg-gray-800/30 hover:border-yellow-500/50 hover:bg-gray-800/50 hover:scale-[1.01]'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-white text-base">
                                {formatSessionDates(session.session_date_start, session.session_date_end)}
                              </span>
                              {isFull ? (
                                <span className="text-xs text-red-400 font-semibold px-2 py-1 bg-red-500/10 rounded-md">Complet</span>
                              ) : (
                                <span className="text-xs text-green-400 font-semibold px-2 py-1 bg-green-500/10 rounded-md">
                                  {availablePlaces} {availablePlaces === 1 ? 'place' : 'places'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                              <Users className="w-4 h-4 flex-shrink-0" />
                              <span>{session.reserved_places}/{session.max_places} élèves</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Bouton de réservation Calendly */}
                <CalendlyEliteModal
                  prefillName={profile?.full_name || undefined}
                  prefillEmail={user?.email || undefined}
                  buttonText="Planifier un rendez-vous"
                />

                {/* Badge de sécurité */}
                <div className="mt-6 flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
                  <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-green-400 text-sm font-semibold">Paiement sécurisé via Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

