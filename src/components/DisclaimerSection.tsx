import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DisclaimerSection() {
  return (
    <section className="relative bg-[#050810] border-t border-white/5">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent pointer-events-none" />
      
      <div className="relative max-w-5xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-white/90 tracking-wide">
            DISCLAIMER — INVEST INFINITY
          </h2>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm sm:text-[13px] text-gray-400 leading-relaxed">
          {/* Bloc 1 - Introduction */}
          <p className="text-center max-w-3xl mx-auto">
            <span className="text-white/80 font-medium">Invest Infinity</span> est une plateforme d'éducation financière et de formation au trading.
            Nous ne sommes pas un conseiller en investissement, pas un courtier et pas une institution financière.
            Tous les contenus fournis ont un but{' '}
            <span className="text-pink-400/90 font-medium">strictement pédagogique</span>.
          </p>

          {/* Séparateur subtil */}
          <div className="flex justify-center">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
          </div>

          {/* Bloc 2 - Risques */}
          <p className="text-center max-w-3xl mx-auto">
            Le trading comporte un{' '}
            <span className="text-amber-400/90 font-medium">risque élevé de perte en capital</span>.
            Les performances passées ne garantissent en rien les résultats futurs.
            Aucune garantie de gains, de résultats, d'obtention d'un financement ou de réussite de challenge n'est fournie.
          </p>

          {/* Bloc 3 - Responsabilité */}
          <p className="text-center max-w-3xl mx-auto">
            Les décisions de trading et de gestion de capital relèvent{' '}
            <span className="text-white/70 font-medium">exclusivement</span> de votre responsabilité.
            Invest Infinity, ses formateurs et intervenants ne peuvent être tenus responsables des pertes financières ou décisions prises sur les marchés.
          </p>

          {/* Bloc 4 - Contenus */}
          <p className="text-center max-w-3xl mx-auto">
            Les stratégies, analyses, vidéos, lives et contenus éducatifs sont fournis à titre{' '}
            <span className="text-pink-400/90 font-medium">informatif</span>, non contractuel, et peuvent être modifiés à tout moment.
          </p>

          {/* Séparateur subtil */}
          <div className="flex justify-center">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
          </div>

          {/* Bloc 5 - Acceptation */}
          <p className="text-center max-w-3xl mx-auto text-gray-500">
            En utilisant ce site, vous acceptez nos{' '}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('openLegalModal', { detail: 'cgv' }))}
              className="text-pink-400/80 hover:text-pink-400 underline underline-offset-2 transition-colors"
            >
              Conditions Générales de Vente
            </button>
            , notre{' '}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('openLegalModal', { detail: 'privacy' }))}
              className="text-pink-400/80 hover:text-pink-400 underline underline-offset-2 transition-colors"
            >
              Politique de Confidentialité
            </button>
            {' '}et ce disclaimer.
          </p>
        </div>
      </div>
    </section>
  );
}

