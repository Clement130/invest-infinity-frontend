import React from 'react';
import { Youtube, Mail, Instagram, Video } from 'lucide-react';

interface FooterProps {
  onOpenRGPD?: () => void;
}

export default function Footer({ onOpenRGPD }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0f0f13] border-t border-pink-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top section with logo and newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
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
            <p className="text-gray-400 mb-6 max-w-md">
            Le mentor qu'il te faut pour réussir en trading. Accède au discord dès maintenant et copie mes alertes pour commencer à générer tes premiers gains en trading.
            </p>
          </div>

        </div>

        {/* Bottom section */}
        <div className="border-t border-pink-500/10 pt-8">
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