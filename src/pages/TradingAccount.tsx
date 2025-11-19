import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';

export default function TradingAccount() {
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const steps = [
    'Inscris-toi sur RaiseFX en cliquant sur "Ouvrir un compte de trading en 5 min".',
    'Complète tes informations, sélectionne MT5-EUR et clique sur « Proceed ».',
    'Envoie tes documents pour valider ton compte avant de déposer.',
    'Rejoins notre Discord pour confirmer ton inscription et activer l’accès.',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-900/10 via-black/50 to-black/50 pt-32 pb-20 overflow-y-auto snap-y snap-mandatory">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* ========================= HEADER ========================= */}
        <header className="text-center snap-start animate-fade-up">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            DERNIÈRE ÉTAPE
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto">
            Choisis l’option qui te convient le mieux : la formation publique sur Discord
            ou l’accès complet aux alertes et à la formation privée.
          </p>
        </header>

        {/* ========================= OPTION CARDS ========================= */}
        <section className="snap-start animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-8">
            {/* ---------------------- OPTION 1 À GAUCHE (col-span-3) ---------------------- */}
            <div className="md:col-span-3 relative self-start">
              {/* Lueur discrète */}
              <div className="absolute -inset-1 bg-gradient-to-br from-[#6E44FF] to-[#FF6ECB] rounded-2xl blur opacity-30 pointer-events-none" />
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-7 border border-[#6E44FF]/20 shadow-lg flex flex-col">
                {/* En-tête Option 1 */}
                <div className="flex flex-col items-center text-center gap-2 mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    Option 1
                    <span className="block text-xl sm:text-2xl">Formation publique</span>
                  </h2>
                  <p className="text-gray-100 text-base max-w-md">
                    Obtiens un accès immédiat à une formation d’initiation au trading via Discord,
                    parfait pour découvrir le trading.
                  </p>
                </div>

                {/* CE QUE TU DÉBLOQUES (Option 1) */}
                <div className="mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">
                    Ce que tu débloques
                  </h3>
                  <ul className="space-y-3 ml-8">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <span className="text-gray-100 text-base">Accès à la formation gratuite</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                      <span className="text-gray-100 text-base">Accès aux alertes de trading</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                      <span className="text-gray-100 text-base">Accès aux modules vidéo privés</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                      <span className="text-gray-100 text-base">Accès à notre communauté</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                      <span className="text-gray-100 text-base">Suivi par nos experts</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                      <span className="text-gray-100 text-base">Coaching personnalisé</span>
                    </li>
                  </ul>
                </div>

                {/* CTA Discord */}
                <div className="mt-auto flex justify-center">
                  <a
                    href="https://discord.gg/Y9RvKDCrWH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      inline-flex items-center gap-2
                      px-6 py-3
                      bg-[#5865F2] hover:bg-[#4752C4]
                      transition-colors duration-300
                      rounded-xl shadow-md
                      text-white font-bold text-base
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                    "
                  >
                    <img src="/discord-icon.png" alt="Icone Discord" className="w-5 h-5" />
                    Rejoindre la partie gratuite du Discord
                  </a>
                </div>
              </div>
            </div>

            {/* ---------------------- OPTION 2 À DROITE (col-span-4) ---------------------- */}
            <div className="md:col-span-4 relative">
              {/* Lueur discrète */}
              <div className="absolute -inset-1 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl blur opacity-20 pointer-events-none" />
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/20 shadow-xl flex flex-col">
                {/* Badge “Recommandé” */}
                <div className="absolute top-0 right-0 mt-2 mr-2 bg-emerald-400 text-black px-3 py-1 rounded-bl-lg text-xs font-bold z-10">
                  Recommandé
                </div>

                {/* En-tête Option 2 */}
                <div className="flex flex-col items-center text-center gap-2 mb-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Option 2
                    <span className="block text-xl sm:text-2xl">Alertes & Formation privée</span>
                  </h2>
                  <p className="text-gray-100 text-base mt-1 max-w-3xl">
                    Profite de l’accès complet : formation vidéo avancée + alertes en temps réel,
                    le tout gratuitement. Idéal aussi bien pour les débutants que pour les traders expérimentés.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-yellow-300 text-sm font-semibold">
                      Requis : compte de trading actif chez notre partenaire
                    </p>
                    <button
                      className="flex items-center justify-center w-4 h-4 text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      onClick={() => setShowWhy(prev => !prev)}
                    >
                      <Info className="w-4 h-4 cursor-pointer" />
                    </button>
                  </div>
                  {showWhy && (
                    <p className="mt-2 text-gray-100 text-sm bg-white/10 p-2 rounded-md max-w-xs backdrop-blur-sm">
                      Pour garantir que tu reçoives tes alertes et modules privés sans délai,
                      nous vérifions que ton compte de trading est bien actif chez notre partenaire.
                    </p>
                  )}
                </div>

                {/* CE QUE TU DÉBLOQUES (Option 2) */}
                <div className="mb-8 flex-shrink-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">
                    Ce que tu débloques
                  </h3>
                  <ul className="space-y-3 ml-8">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <span className="text-gray-100 text-base">Accès à la formation gratuite</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <span className="text-gray-100 text-base">Accès aux alertes de trading</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <span className="text-gray-100 text-base">Accès aux modules de formation vidéo privés</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <span className="text-gray-100 text-base">Accès à notre communauté</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <span className="text-gray-100 text-base">Suivi par nos experts</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <span className="text-gray-100 text-base">Coaching personnalisé</span>
                    </li>
                  </ul>
                </div>

                {/* CTA “Ouvrir un compte de trading en 5 min” */}
                <div className="mt-auto flex flex-col items-center gap-2">
                  <a
                    href="https://partners.raisefx.com/visit/?bta=167838&brand=raisefx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      inline-flex items-center gap-2
                      px-10 py-3
                      bg-emerald-500 hover:bg-emerald-600
                      transition-colors duration-300
                      rounded-xl shadow-lg font-bold text-lg
                      min-w-[260px]
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
                    "
                  >
                    Ouvrir un compte de trading en 5 min
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  <p className="text-gray-300 text-xs">
                    Accède immédiatement au salon privé Discord dès validation.
                  </p>
                </div>

                {/* Séparateur avant les instructions */}
                <div className="mt-8 mb-2 border-t border-emerald-500/30"></div>

                {/* Titre "Instructions d’inscription" */}
                <div className="mb-4 text-center">
                  <h3 className="text-xl font-bold text-white">Instructions d’inscription</h3>
                </div>

                {/* Étapes détaillées */}
                <div className="space-y-2 text-sm text-gray-200">
                  <ol className="list-decimal list-inside space-y-2">
                    {steps.map((step, index) => (
                      <li key={index} className="px-2">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================= FOOTER / PROGRESSION ========================= */}
        <footer className="flex flex-col items-center gap-4 snap-end pb-10 animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <div className="w-12 h-0.5 bg-emerald-500"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          </div>
          <p className="text-emerald-200/60 text-sm">Étape 2 sur 2</p>
        </footer>
      </div>
    </div>
  );
}
