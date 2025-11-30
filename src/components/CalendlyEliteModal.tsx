"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { InlineWidget } from 'react-calendly';
import { 
  Crown, 
  X, 
  Clock, 
  AlertTriangle,
  Shield,
  Target,
  Sparkles,
  Users,
  ExternalLink,
  Loader2
} from 'lucide-react';

// ============================================
// CONFIGURATION - Modifiez l'URL Calendly ici
// ============================================
export const CALENDLY_ELITE_URL = 'https://calendly.com/investinfinityfr/30min';

// ============================================
// Types
// ============================================
interface CalendlyEliteModalProps {
  /** URL Calendly personnalisée */
  calendlyUrl?: string;
  /** Nom de l'utilisateur pour pré-remplir */
  prefillName?: string;
  /** Email de l'utilisateur pour pré-remplir */
  prefillEmail?: string;
  /** Texte du bouton */
  buttonText?: string;
  /** Prix affiché */
  price?: string;
  /** Afficher l'icône couronne */
  showCrownIcon?: boolean;
  /** Classes CSS personnalisées pour le bouton */
  buttonClassName?: string;
}

// ============================================
// Composant Principal
// ============================================
export default function CalendlyEliteModal({
  calendlyUrl = CALENDLY_ELITE_URL,
  prefillName = '',
  prefillEmail = '',
  buttonText = 'Réserver Bootcamp Élite',
  price = '1 997€',
  showCrownIcon = true,
  buttonClassName,
}: CalendlyEliteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsLoading(true);
      // Simuler un temps de chargement minimum pour le skeleton
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => {
        document.body.style.overflow = 'unset';
        clearTimeout(timer);
      };
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Check-list des critères d'éligibilité
  const eligibilityCriteria = [
    {
      icon: Target,
      text: "Tu veux passer un cap sérieux en trading",
    },
    {
      icon: Sparkles,
      text: "Tu es prêt à t'investir",
    },
    {
      icon: Users,
      text: "Tu es ouvert à être coaché",
    },
  ];

  // Style par défaut du bouton
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
  `;

  // Contenu du modal
  const modalContent = (
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center p-4 sm:p-6"
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        width: '100vw',
        height: '100vh',
      }}
    >
      {/* Backdrop sombre avec blur */}
      <div 
        className="absolute top-0 left-0 right-0 bottom-0 bg-black/95 backdrop-blur-lg"
        onClick={() => setIsOpen(false)}
        style={{ position: 'absolute' }}
      />
      
      {/* Contenu du Modal */}
      <div 
        className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a0a14] via-[#0f0f1a] to-[#0a0a14] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.95)]"
        style={{ 
          maxHeight: 'calc(100vh - 48px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        
        {/* Bouton fermer */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-red-500/80 hover:bg-red-500 border border-white/20 transition-all duration-200 hover:scale-110 shadow-lg"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Layout 2 colonnes avec scroll */}
        <div className="grid lg:grid-cols-[1fr_1.3fr] overflow-hidden" style={{ maxHeight: 'calc(100vh - 48px)' }}>
          
          {/* ============================================ */}
          {/* COLONNE GAUCHE - Texte descriptif */}
          {/* ============================================ */}
          <div className="p-6 sm:p-8 lg:p-10 overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/5" style={{ maxHeight: 'calc(100vh - 48px)' }}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 rounded-full mb-4">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">Bootcamp Élite</span>
            </div>

            {/* Titre */}
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
              <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                Appel Découverte
              </span>
            </h2>

            {/* Durée */}
            <div className="flex items-center gap-2 text-slate-300 mb-6">
              <Clock className="w-5 h-5 text-slate-400" />
              <span className="font-medium">30 min</span>
            </div>

            {/* Description */}
            <div className="space-y-4 mb-6">
              <p className="text-slate-300 leading-relaxed">
                Réserve dès maintenant ton appel avec un membre de l'équipe <strong className="text-white">Invest Infinity</strong>. 
                On fera le point avec toi sur ta situation, tes attentes et tes capacités à rejoindre le Bootcamp Élite !
              </p>
            </div>

            {/* Check-list d'éligibilité */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-pink-400 mb-3 uppercase tracking-wider">
                Cet appel est pour toi si...
              </h4>
              <div className="space-y-2">
                {eligibilityCriteria.map((criteria, index) => (
                  <div key={index} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <criteria.icon className="w-4 h-4 text-pink-400" />
                    </div>
                    <span className="text-slate-200 text-sm">{criteria.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Avertissement */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-200/90 text-sm leading-relaxed">
                  Nous nous réservons le droit d'annuler notre rendez-vous si nous jugeons que ton profil n'est pas adapté à notre programme et/ou au métier de trader prop firm.
                </p>
              </div>
            </div>

            {/* Badge de réassurance */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30">
              <Shield className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <div>
                <p className="text-teal-300 text-sm font-medium">Pas de spam, pas d'engagement</p>
                <p className="text-slate-500 text-xs">Tu décides librement après l'appel</p>
              </div>
            </div>

            {/* Lien direct Calendly (fallback) */}
            <div className="mt-6 pt-4 border-t border-slate-800/50">
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-pink-400 text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          </div>

          {/* ============================================ */}
          {/* COLONNE DROITE - Widget Calendly */}
          {/* ============================================ */}
          <div className="relative bg-[#0a0a12] overflow-hidden" style={{ minHeight: '550px', maxHeight: 'calc(100vh - 48px)' }}>
            {/* Skeleton loader */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a12] z-10">
                <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
                <p className="text-slate-400 text-sm">Chargement du calendrier...</p>
              </div>
            )}

            {/* Widget Calendly */}
            <div className={`h-full transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
              <InlineWidget
                url={calendlyUrl}
                styles={{
                  height: '100%',
                  minHeight: '550px',
                  width: '100%',
                }}
                pageSettings={{
                  backgroundColor: '0a0a12',
                  hideEventTypeDetails: true,
                  hideLandingPageDetails: true,
                  primaryColor: 'ec4899',
                  textColor: 'ffffff',
                  hideGdprBanner: true,
                }}
                prefill={{
                  name: prefillName,
                  email: prefillEmail,
                }}
                utm={{
                  utmSource: 'website',
                  utmMedium: 'elite_modal',
                  utmCampaign: 'bootcamp_elite',
                  utmContent: 'pricing_page',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Bouton déclencheur */}
      <button
        onClick={() => setIsOpen(true)}
        className={buttonClassName || defaultButtonClass}
      >
        {/* Effet de brillance au survol */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        
        {showCrownIcon && <Crown className="w-6 h-6 relative z-10" />}
        <span className="relative z-10">{buttonText} — {price}</span>
      </button>

      {/* Modal via Portal pour éviter les conflits de z-index */}
      {mounted && isOpen && createPortal(modalContent, document.body)}
    </>
  );
}

