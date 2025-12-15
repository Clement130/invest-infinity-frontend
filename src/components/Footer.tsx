import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FooterProps {
  onOpenRGPD?: () => void;
}

export default function Footer({ onOpenRGPD }: FooterProps) {
  const navigate = useNavigate();
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0f0f13]">
      {/* CTA Section intégrée */}
      <div className="relative py-16 overflow-hidden">

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-8">
            Prêt à commencer votre voyage vers la réussite ?
          </h3>
          <button 
            onClick={() => navigate('/pricing')}
            className="group relative inline-flex items-center"
          >
            
            <div className="relative px-8 py-4 bg-[#1f1f23] rounded-full flex items-center space-x-2 transform hover:scale-105 transition-all duration-500 border border-pink-500/20">
              <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500">
                Commencer Maintenant
              </span>
              <ArrowRight className="w-5 h-5 text-pink-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Disclaimer complet */}
      <div className="border-t border-white/5 relative">
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
          {/* Container avec même background que le bouton CTA */}
          <div className="bg-[#1f1f23] rounded-2xl p-8 border border-pink-500/20">
            {/* Header Disclaimer */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white/80 tracking-wide uppercase">Disclaimer — Invest Infinity</span>
            </div>

            {/* Contenu Disclaimer */}
            <div className="space-y-4 text-center">
            <p className="text-sm text-gray-400 leading-relaxed max-w-4xl mx-auto">
              <span className="text-white/70 font-medium">Invest Infinity</span> est une plateforme d'éducation financière et de formation au trading.
              Nous ne sommes pas un conseiller en investissement, pas un courtier et pas une institution financière.
              Tous les contenus fournis ont un but <span className="text-pink-400">strictement pédagogique</span>.
            </p>

            <p className="text-sm text-gray-400 leading-relaxed max-w-4xl mx-auto">
              Le trading comporte un <span className="text-amber-400 font-medium">risque élevé de perte en capital</span>.
              Les performances passées ne garantissent en rien les résultats futurs.
              Aucune garantie de gains, de résultats, d'obtention d'un financement ou de réussite de challenge n'est fournie.
            </p>

            <p className="text-sm text-gray-400 leading-relaxed max-w-4xl mx-auto">
              Les décisions de trading et de gestion de capital relèvent <span className="text-white/70 font-medium">exclusivement</span> de votre responsabilité.
              Invest Infinity, ses formateurs et intervenants ne peuvent être tenus responsables des pertes financières ou décisions prises sur les marchés.
            </p>

            <p className="text-sm text-gray-400 leading-relaxed max-w-4xl mx-auto">
              Les stratégies, analyses, vidéos, lives et contenus éducatifs sont fournis à titre <span className="text-pink-400">informatif</span>, non contractuel, et peuvent être modifiés à tout moment.
            </p>

            <p className="text-sm text-gray-500 leading-relaxed max-w-4xl mx-auto pt-2">
              En utilisant ce site, vous acceptez nos{' '}
              <button onClick={onOpenRGPD} className="text-pink-400 hover:text-pink-300 transition-colors underline underline-offset-2">
                Conditions Générales de Vente
              </button>
              , notre{' '}
              <button onClick={onOpenRGPD} className="text-pink-400 hover:text-pink-300 transition-colors underline underline-offset-2">
                Politique de Confidentialité
              </button>
              {' '}et ce disclaimer.
            </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo */}
            <button 
              onClick={scrollToTop}
              className="group"
            >
              <img 
                src="/logo.png" 
                alt="Logo"
                className="h-10 object-contain transform group-hover:scale-105 transition-transform duration-300"
              />
            </button>

            {/* Links */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Tous droits réservés.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <button 
                  onClick={onOpenRGPD}
                  className="text-gray-500 hover:text-pink-400 transition-colors"
                >
                  Mentions légales & RGPD
                </button>
                <span className="text-gray-700">•</span>
                <button 
                  onClick={() => {
                    localStorage.removeItem('cookieConsent');
                    window.location.reload();
                  }}
                  className="text-gray-500 hover:text-pink-400 transition-colors"
                >
                  Gérer les cookies
                </button>
              </div>
            </div>

            {/* Retour en haut */}
            <button onClick={scrollToTop} className="text-gray-500 hover:text-pink-400 transition-colors text-sm">
              Retour en haut ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}