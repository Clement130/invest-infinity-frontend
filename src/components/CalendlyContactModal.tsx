import { useState, useEffect } from 'react';
import { InlineWidget } from 'react-calendly';
import { Calendar, X, AlertCircle, ExternalLink } from 'lucide-react';

// ============================================
// CONFIGURATION - Modifiez l'URL ici
// ============================================
// TODO: Remplacez par votre URL Calendly pour les appels de contact
export const CALENDLY_CONTACT_URL = 'https://calendly.com/investinfinityfr/30min';

// ============================================
// Types
// ============================================
interface CalendlyContactModalProps {
  /** URL Calendly personnalisée (optionnel, utilise CALENDLY_CONTACT_URL par défaut) */
  calendlyUrl?: string;
  /** Nom de l'utilisateur pour pré-remplir le formulaire */
  prefillName?: string;
  /** Email de l'utilisateur pour pré-remplir le formulaire */
  prefillEmail?: string;
  /** Texte personnalisé du bouton */
  buttonText?: string;
  /** Classes CSS personnalisées pour le bouton */
  buttonClassName?: string;
}

// ============================================
// Composant Principal
// ============================================
export default function CalendlyContactModal({
  calendlyUrl = CALENDLY_CONTACT_URL,
  prefillName,
  prefillEmail,
  buttonText = 'Planifier un appel avec un coach',
  buttonClassName,
}: CalendlyContactModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Gestion des erreurs de chargement Calendly
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 2000);

      const errorTimeout = setTimeout(() => {
        const calendlyFrame = document.querySelector('.calendly-inline-widget iframe');
        if (!calendlyFrame) {
          setHasError(true);
        }
      }, 15000);

      return () => {
        clearTimeout(timeout);
        clearTimeout(errorTimeout);
      };
    }
  }, [isOpen]);

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Style par défaut du bouton (gradient rose/violet)
  const defaultButtonClass = `
    w-full py-3.5 px-6 
    bg-gradient-to-r from-pink-500 to-violet-500 
    text-white font-semibold
    rounded-xl 
    transition-all duration-300 
    transform hover:scale-[1.02] active:scale-[0.98]
    hover:shadow-lg hover:shadow-pink-500/30
    flex items-center justify-center gap-2
    relative overflow-hidden
    group
  `;

  const handleOpenModal = () => {
    setHasError(false);
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setHasError(false);
  };

  return (
    <>
      {/* Bouton principal */}
      <button
        onClick={handleOpenModal}
        className={buttonClassName || defaultButtonClass}
      >
        {/* Effet de brillance au survol */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        
        <Calendar className="w-5 h-5 relative z-10" />
        <span className="relative z-10">{buttonText}</span>
      </button>

      {/* Modal avec InlineWidget Calendly */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-4xl h-[85vh] max-h-[750px] bg-[#0a0a14] rounded-3xl border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Header du modal */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#0a0a14] to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500/20 to-amber-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Réserver un appel</h3>
                  <p className="text-sm text-slate-400">Bootcamp Élite - Appel Découverte</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors border border-white/10"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Contenu Calendly */}
            <div className="h-full pt-16">
              {hasError ? (
                // Affichage d'erreur
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3">
                    Impossible de charger le calendrier
                  </h3>
                  
                  <p className="text-gray-400 mb-6 text-center max-w-md">
                    Le calendrier de réservation n'est pas disponible pour le moment. 
                    Tu peux accéder directement à Calendly.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={calendlyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold rounded-xl hover:scale-[1.02] transition-transform"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Ouvrir Calendly directement
                    </a>
                    
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-3 bg-slate-700/50 text-gray-300 font-medium rounded-xl hover:bg-slate-700 transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              ) : (
                // Widget Calendly Inline
                <>
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a14] z-20 pt-16">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 text-sm">Chargement du calendrier...</p>
                      </div>
                    </div>
                  )}
                  <InlineWidget
                    url={calendlyUrl}
                    styles={{
                      height: '100%',
                      width: '100%',
                    }}
                    pageSettings={{
                      backgroundColor: '0a0a14',
                      hideEventTypeDetails: false,
                      hideLandingPageDetails: false,
                      primaryColor: 'ec4899', // Pink-500
                      textColor: 'ffffff',
                      hideGdprBanner: false,
                    }}
                    prefill={{
                      name: prefillName || '',
                      email: prefillEmail || '',
                    }}
                    utm={{
                      utmSource: 'website',
                      utmMedium: 'contact_page',
                      utmCampaign: 'contact_call',
                      utmContent: 'inline_modal',
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// Export de la constante pour modification facile
// ============================================
export { CALENDLY_CONTACT_URL as CALENDLY_URL };

