import { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Star, Zap, Trophy, Users, Clock, Video } from 'lucide-react';
import BootcampBookingSection from '../components/BootcampBookingSection';

// ============================================
// Page de réservation Bootcamp Élite
// ============================================
export default function BootcampElitePage() {
  const navigate = useNavigate();

  // Scroll to top on mount
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="relative pt-28 pb-12 lg:pt-36 lg:pb-16 overflow-hidden">
        {/* Background effects - désactivés/simplifiés sur mobile */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient statique sur mobile, complet sur desktop */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[800px] h-[300px] md:h-[600px] bg-gradient-to-b from-pink-500/20 via-purple-500/10 to-transparent rounded-full filter blur-[80px] md:blur-[100px]" />
          {/* Effets animés uniquement sur desktop */}
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-amber-500/15 rounded-full filter blur-[80px] hidden md:block md:animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-pink-500/15 rounded-full filter blur-[80px] hidden md:block md:animate-pulse md:delay-1000" />
        </div>

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Bouton retour */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Retour</span>
          </button>

          {/* Hero content */}
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 rounded-full border border-pink-500/30 mb-8 backdrop-blur-sm">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-amber-400 uppercase tracking-wider">
                Programme Premium
              </span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>

            {/* Titre principal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 leading-tight">
              <span className="text-white">Bootcamp</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 drop-shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                Élite
              </span>
            </h1>

            {/* Sous-titre */}
            <p className="text-xl lg:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Le programme d'accompagnement intensif pour les traders qui veulent{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-400 font-semibold">
                passer au niveau supérieur
              </span>
            </p>

            {/* Stats rapides */}
            <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6 text-sm">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <Users className="w-5 h-5 text-pink-400" />
                <span className="text-slate-200 font-medium">Groupe limité à 8 personnes</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-slate-200 font-medium">12 semaines intensives</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <Video className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-200 font-medium">Coaching 1-to-1 hebdo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION AVANTAGES RAPIDES */}
      {/* ============================================ */}
      <section className="relative py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Avantage 1 */}
            <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-slate-700/50 hover:border-pink-500/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Méthode éprouvée</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Une stratégie de trading testée et validée, enseignée étape par étape
                </p>
              </div>
            </div>

            {/* Avantage 2 */}
            <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Accompagnement personnalisé</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Coaching individuel chaque semaine pour adapter le programme à ton profil
                </p>
              </div>
            </div>

            {/* Avantage 3 */}
            <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Résultats concrets</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Un plan d'action clair pour atteindre tes objectifs de trading
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION RÉSERVATION CALENDLY */}
      {/* ============================================ */}
      <BootcampBookingSection />

      {/* ============================================ */}
      {/* SECTION FAQ RAPIDE */}
      {/* ============================================ */}
      <section className="relative py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Questions fréquentes sur l'appel
            </h2>
            <p className="text-slate-400">
              Tout ce que tu dois savoir avant de réserver
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "L'appel est-il vraiment gratuit ?",
                answer: "Oui, l'appel découverte est 100% gratuit et sans engagement. C'est l'occasion pour nous de faire connaissance et de voir si le Bootcamp Élite correspond à tes besoins.",
              },
              {
                question: "Que se passe-t-il après l'appel ?",
                answer: "Tu auras toutes les informations pour prendre ta décision. Si le programme te convient, tu pourras t'inscrire. Sinon, aucune obligation - tu repars avec des conseils personnalisés gratuits.",
              },
              {
                question: "Je suis débutant, est-ce pour moi ?",
                answer: "Le Bootcamp Élite s'adresse aux traders de tous niveaux qui sont motivés et prêts à s'investir. Lors de l'appel, nous évaluerons ensemble si c'est le bon moment pour toi.",
              },
              {
                question: "Puis-je reporter mon rendez-vous ?",
                answer: "Oui, tu recevras un email de confirmation avec un lien pour reporter ou annuler si nécessaire. Nous te demandons simplement de prévenir 24h à l'avance.",
              },
            ].map((faq, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-3 flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-pink-500/20 to-amber-500/20 flex items-center justify-center text-sm text-pink-400 font-bold">
                    ?
                  </span>
                  {faq.question}
                </h3>
                <p className="text-slate-400 leading-relaxed pl-9">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA FINAL */}
      {/* ============================================ */}
      <section className="relative py-16 lg:py-20">
        <div className="absolute inset-0 bg-gradient-to-t from-pink-500/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            Prêt à transformer ton trading ?
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Réserve ton appel découverte maintenant et fais le premier pas vers tes objectifs
          </p>
          <button
            onClick={() => {
              // Scroll vers la section de réservation
              const bookingSection = document.querySelector('section:has(.calendly-inline-widget)');
              if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth' });
              } else {
                // Fallback: scroll vers le haut de la page puis vers le bas
                window.scrollTo({ top: 800, behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-bold text-lg rounded-xl md:hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 md:duration-300 shadow-lg md:shadow-xl md:shadow-pink-500/30 md:hover:shadow-pink-500/50"
          >
            <Crown className="w-6 h-6" />
            Réserver mon appel gratuit
          </button>
        </div>
      </section>
    </div>
  );
}

