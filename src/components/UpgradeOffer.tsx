import React, { useEffect } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function UpgradeOffer() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const steps = [
    'Inscris-toi sur RaiseFX en cliquant sur "Ouvrir un compte de trading en 5 min".',
    'Complète tes informations, sélectionne MT5-EUR puis clique sur « Proceed ».',
    'Envoie tes documents pour valider ton compte avant de déposer.',
    'Rejoins notre Discord pour confirmer ton inscription et activer ton accès VIP.',
  ];

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-b from-pink-900/20 via-black/70 to-black/70
        pt-32 pb-20
        overflow-y-auto
        snap-y snap-mandatory
      "
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* TITRE PRINCIPAL */}
        <header className="text-center snap-start animate-fade-up">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Passe au niveau supérieur
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
            Tu as déjà fait le bon choix en rejoignant la formation publique.  
            Rejoins maintenant la communauté VIP : alertes en temps réel,  
            vidéos avancées et suivi expert — le tout 100 % gratuit et sans engagement.  
            Ton capital reste toujours à toi et tu peux retirer tes fonds à tout moment.  
          </p>
        </header>

        {/* CARD UNIQUE */}
        <section className="snap-start animate-fade-up">
          <div className="relative mx-auto max-w-4xl transform hover:scale-[1.01] transition-all duration-300">
            {/* Lueur discrète */}
            <div className="absolute inset-0.5 bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl blur opacity-10 pointer-events-none" />
            <div className="relative bg-white/15 backdrop-blur-sm rounded-2xl p-10 border border-green-400 shadow-2xl flex flex-col">
              {/* HEADER CARD */}
              <div className="flex flex-col items-center text-center gap-4 mb-8">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                  Alertes & Formation Privée
                </h2>
                <p className="text-gray-100 text-base max-w-3xl leading-relaxed">
                  Accède gratuitement à des vidéos avancées,  
                  des alertes en temps réel et des ressources privées,  
                  pour booster tes performances et garder une longueur d’avance.
                </p>
                <p className="text-green-300 text-base font-semibold">
                    C’est gratuit et sans engagement. 
                </p>
                <p className="text-gray-300 text-base font-semibold">
                    Tu restes propriétaire de tes fonds, que tu peux utiliser librement pour trader ou copier mes trades. L’objectif est de les faire fructifier, pour que tu puisses retirer tes profits quand tu le souhaites.
                </p>
              </div>

              {/* “Pourquoi passer VIP ?” */}
              <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">
                Pourquoi passer VIP ?
              </h3>

              {/* CE QUE TU T’APPRETTES À DÉBLOQUER (liste centrée dans la card) */}
              <div className="mb-12">
                <ul className="w-fit mx-auto space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-100 text-base">Accès à la formation gratuite</span>
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
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-100 text-base">Alertes de trading en temps réel</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-100 text-base">Accès exclusif aux modules vidéo privés</span>
                  </li>
                </ul>
              </div>

              {/* CTA */}
              <div className="mt-auto flex flex-col items-center gap-2">
                <a
                  href="https://partners.raisefx.com/visit/?bta=167838&brand=raisefx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-2
                    px-10 py-3
                    bg-green-500 hover:bg-green-600
                    transition-colors duration-300
                    rounded-xl shadow-lg font-bold text-lg
                    min-w-[280px]
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                  "
                >
                  Ouvrir un compte de trading en 5 min
                  <ArrowRight className="w-5 h-5" />
                </a>
                <p className="text-gray-300 text-xs">
                  Accède immédiatement à la section privée du Discord dès validation.
                </p>
                <p className="mt-1 text-gray-400 text-xs italic">
                  Rejoins les traders qui ont déjà choisi le VIP !
                </p>
              </div>

              {/* INSTRUCTIONS */}
              <div className="mt-10 mb-2 border-t border-green-400/30"></div>
              <div className="mb-4 text-center">
                <h3 className="text-xl font-bold text-white">Étapes d’inscription</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-200">
                <ol className="list-decimal list-inside space-y-2">
                  {steps.map((step, index) => (
                    <li key={index} className="pl-2">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
