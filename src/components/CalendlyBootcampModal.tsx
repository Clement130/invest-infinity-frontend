import { useState, useEffect } from 'react';
import { PopupModal } from 'react-calendly';
import { Crown, X, AlertCircle, ExternalLink } from 'lucide-react';

// ============================================
// CONFIGURATION - Modifiez l'URL ici
// ============================================
export const CALENDLY_BOOTCAMP_URL = 'https://calendly.com/clement-ia-consulting/bootcamp-elite-appel-decouverte';

// ============================================
// Types
// ============================================
interface CalendlyBootcampModalProps {
  /** URL Calendly personnalisée (optionnel, utilise CALENDLY_BOOTCAMP_URL par défaut) */
  calendlyUrl?: string;
  /** Nom de l'utilisateur pour pré-remplir le formulaire */
  prefillName?: string;
  /** Email de l'utilisateur pour pré-remplir le formulaire */
  prefillEmail?: string;
  /** Texte personnalisé du bouton */
  buttonText?: string;
  /** Prix affiché dans le bouton */
  price?: string;
  /** Afficher l'icône couronne */
  showCrownIcon?: boolean;
  /** Classes CSS personnalisées pour le bouton */
  buttonClassName?: string;
  /** ID de session sélectionnée (pour tracking) */
  sessionId?: string | null;
}

// ============================================
// Composant Principal
// ============================================
export default function CalendlyBootcampModal({
  calendlyUrl = CALENDLY_BOOTCAMP_URL,
  prefillName,
  prefillEmail,
  buttonText = 'Réserver Bootcamp Élite',
  price = '1 997€',
  showCrownIcon = true,
  buttonClassName,
  sessionId,
}: CalendlyBootcampModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null);

  // Récupérer l'élément root pour le modal (côté client uniquement)
  useEffect(() => {
    // Essayer plusieurs éléments root possibles
    const root = document.getElementById('root') || document.body;
    setRootElement(root);
  }, []);

  // Gestion des erreurs de chargement Calendly
  useEffect(() => {
    if (isOpen) {
      // Timeout pour détecter si Calendly ne charge pas
      const timeout = setTimeout(() => {
        // Vérifier si l'iframe Calendly est présente
        const calendlyFrame = document.querySelector('.calendly-popup-content iframe');
        if (!calendlyFrame) {
          setHasError(true);
        }
      }, 10000); // 10 secondes de timeout

      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Configuration du prefill Calendly
  const prefill = {
    name: prefillName || '',
    email: prefillEmail || '',
    customAnswers: sessionId ? {
      a1: `Session ID: ${sessionId}`,
    } : undefined,
  };

  // UTM pour le tracking
  const utm = {
    utmSource: 'website',
    utmMedium: 'bootcamp_elite_button',
    utmCampaign: 'immersion_elite',
    utmContent: sessionId || 'no_session',
  };

  // Style par défaut du bouton (gradient orange/jaune avec effet brillance)
  const defaultButtonClass = `
    w-full py-5 px-6 
    bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 
    text-[#1a0f0a] font-extrabold text-lg
    rounded-xl 
    transition-all duration-300 
    transform hover:scale-[1.02] active:scale-[0.98]
    shadow-2xl shadow-orange-500/40 
    hover:shadow-orange-500/60
    flex items-center justify-center gap-3
    relative overflow-hidden
    group
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const handleOpenModal = () => {
    setHasError(false);
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setHasError(false);
  };

  // Modal d'erreur personnalisé
  if (hasError && isOpen) {
    return (
      <>
        <button
          onClick={handleOpenModal}
          className={buttonClassName || defaultButtonClass}
        >
          {/* Effet de brillance au survol */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          {showCrownIcon && <Crown className="w-6 h-6 relative z-10" />}
          <span className="relative z-10">{buttonText} — {price}</span>
        </button>

        {/* Modal d'erreur */}
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay sombre */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          
          {/* Contenu du modal d'erreur */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full border border-red-500/30 shadow-2xl">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">
                Impossible de charger le calendrier
              </h3>
              
              <p className="text-gray-400 mb-6">
                Le calendrier de réservation n'est pas disponible pour le moment. 
                Tu peux nous contacter directement via le support.
              </p>

              <div className="flex flex-col gap-3">
                <a
                  href={calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-[#1a0f0a] font-bold rounded-xl hover:scale-[1.02] transition-transform"
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
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Bouton principal */}
      <button
        onClick={handleOpenModal}
        className={buttonClassName || defaultButtonClass}
      >
        {/* Effet de brillance au survol */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        
        {showCrownIcon && <Crown className="w-6 h-6 relative z-10" />}
        <span className="relative z-10">{buttonText} — {price}</span>
      </button>

      {/* Modal Calendly */}
      {rootElement && (
        <PopupModal
          url={calendlyUrl}
          prefill={prefill}
          utm={utm}
          onModalClose={handleCloseModal}
          open={isOpen}
          rootElement={rootElement}
          pageSettings={{
            backgroundColor: '0f0f13',
            hideEventTypeDetails: false,
            hideLandingPageDetails: false,
            primaryColor: 'f97316', // Orange-500
            textColor: 'ffffff',
            hideGdprBanner: false,
          }}
        />
      )}
    </>
  );
}

// ============================================
// Export de la constante pour modification facile
// ============================================
export { CALENDLY_BOOTCAMP_URL as CALENDLY_URL };

