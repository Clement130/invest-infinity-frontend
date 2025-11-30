import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface FooterProps {
  onOpenRGPD?: () => void;
}

export default function Footer({ onOpenRGPD }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0f0f13] border-t border-pink-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Logo et Disclaimer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          {/* Logo section */}
          <div>
            <button 
              onClick={scrollToTop}
              className="flex items-center space-x-3 group mb-6"
            >
              <img 
                src="/logo.png" 
                alt="Logo"
                className="w-[35%] object-contain transform group-hover:scale-110 transition-transform duration-300"
              />
            </button>
          </div>

          {/* Disclaimer section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white/90 tracking-wide">DISCLAIMER</span>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="text-white/70 font-medium">Invest Infinity</span> est une plateforme d'éducation financière et de formation au trading.
              Nous ne sommes pas un conseiller en investissement, pas un courtier et pas une institution financière.
              Tous les contenus fournis ont un but <span className="text-pink-400/80">strictement pédagogique</span>.
            </p>

            <p className="text-xs text-gray-500 leading-relaxed">
              Le trading comporte un <span className="text-amber-400/80">risque élevé de perte en capital</span>.
              Les performances passées ne garantissent en rien les résultats futurs.
              Aucune garantie de gains, de résultats, d'obtention d'un financement ou de réussite de challenge n'est fournie.
            </p>

            <p className="text-xs text-gray-500 leading-relaxed">
              Les décisions de trading et de gestion de capital relèvent <span className="text-white/60">exclusivement</span> de votre responsabilité.
              Invest Infinity, ses formateurs et intervenants ne peuvent être tenus responsables des pertes financières ou décisions prises sur les marchés.
            </p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-pink-500/10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} Tous droits réservés.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <button 
                  onClick={onOpenRGPD}
                  className="text-gray-400 hover:text-pink-500 transition-colors"
                >
                  Mentions légales & RGPD
                </button>
                <span className="text-gray-600">•</span>
                <button 
                  onClick={() => {
                    localStorage.removeItem('cookieConsent');
                    window.location.reload();
                  }}
                  className="text-gray-400 hover:text-pink-500 transition-colors"
                >
                  Gérer les cookies
                </button>
              </div>
            </div>
            <button onClick={scrollToTop} className="text-gray-400 hover:text-pink-500 transition-colors text-sm">
              Retour en haut ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}