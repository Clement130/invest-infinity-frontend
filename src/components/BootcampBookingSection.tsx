import { useEffect, useState } from 'react';
import { InlineWidget } from 'react-calendly';
import { 
  Clock, 
  Check, 
  AlertTriangle, 
  Shield, 
  Target,
  Users,
  Sparkles,
  Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ============================================
// CONFIGURATION - Modifiez l'URL Calendly ici
// ============================================
// Événement: Bootcamp Élite - Appel Découverte (30 min)
export const CALENDLY_BOOTCAMP_ELITE_URL = 'https://calendly.com/investinfinityfr/30min';

// ============================================
// Types
// ============================================
interface BootcampBookingSectionProps {
  /** URL Calendly personnalisée (optionnel) */
  calendlyUrl?: string;
  /** Nom de l'utilisateur pour pré-remplir */
  prefillName?: string;
  /** Email de l'utilisateur pour pré-remplir */
  prefillEmail?: string;
  /** Durée de l'appel affichée */
  duration?: string;
  /** UTM Source pour le tracking */
  utmSource?: string;
  /** UTM Campaign pour le tracking */
  utmCampaign?: string;
}

// ============================================
// Composant Principal
// ============================================
export default function BootcampBookingSection({
  calendlyUrl = CALENDLY_BOOTCAMP_ELITE_URL,
  prefillName,
  prefillEmail,
  duration = '30 min',
  utmSource = 'site',
  utmCampaign = 'bootcamp_elite_appel_decouverte',
}: BootcampBookingSectionProps) {
  const { user, profile } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // Récupérer les infos utilisateur connecté si disponibles
  const userName = prefillName || profile?.full_name || '';
  const userEmail = prefillEmail || user?.email || '';

  // S'assurer que le widget est rendu côté client uniquement
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Utiliser l'URL de base sans UTM dans l'URL (les UTM sont passés via les props)

  // Check-list des critères d'éligibilité
  const eligibilityCriteria = [
    {
      icon: Target,
      text: "Tu veux passer un cap sérieux en trading",
    },
    {
      icon: Sparkles,
      text: "Tu es prêt à investir temps + argent dans ta progression",
    },
    {
      icon: Users,
      text: "Tu es ouvert à être coaché et à suivre une méthode",
    },
  ];

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background avec effets - désactivés sur mobile */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050816] via-[#0a0a1a] to-[#050816]" />
      <div className="absolute inset-0 overflow-hidden">
        {/* Effets de glow animés uniquement sur desktop */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-pink-500/10 rounded-full filter blur-[120px] hidden md:block md:animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full filter blur-[120px] hidden md:block md:animate-pulse md:delay-1000" />
        {/* Version mobile simplifiée - statique */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-pink-500/5 rounded-full filter blur-[60px] md:hidden" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de section */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-amber-500/20 rounded-full border border-pink-500/30 mb-6">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-400">
              Réservation Bootcamp Élite
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Réserve ton{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400">
              Appel Découverte
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Un appel personnalisé pour découvrir si le Bootcamp Élite est fait pour toi
          </p>
        </div>

        {/* Carte principale 2 colonnes - Stack sur mobile */}
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] rounded-2xl sm:rounded-3xl bg-[#0c0c18]/95 border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-sm">
          
          {/* ============================================ */}
          {/* COLONNE GAUCHE - Informations */}
          {/* Padding réduit sur mobile */}
          {/* ============================================ */}
          <div className="p-5 sm:p-8 lg:p-10 xl:p-12 flex flex-col">
            {/* Titre de l'événement */}
            <div className="mb-8">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 bg-clip-text text-transparent mb-4">
                Bootcamp Élite – Appel Découverte
              </h3>
              
              {/* Durée */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <Clock className="w-5 h-5 text-pink-400" />
                <span className="text-slate-200 font-medium">{duration}</span>
              </div>
            </div>

            {/* Description de l'appel */}
            <div className="space-y-4 mb-8">
              <p className="text-slate-300 leading-relaxed">
                Pendant cet appel de <strong className="text-white">{duration}</strong>, nous allons ensemble :
              </p>
              <ul className="space-y-3">
                {[
                  "Faire un diagnostic complet de ta situation actuelle en trading",
                  "Définir tes objectifs concrets et réalistes",
                  "Évaluer ton budget et ta disponibilité pour le programme",
                  "Te présenter le contenu et la méthode du Bootcamp Élite",
                  "Répondre à toutes tes questions",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500/30 to-amber-500/30 flex items-center justify-center">
                        <Check className="w-3 h-3 text-pink-400" />
                      </div>
                    </div>
                    <span className="text-slate-300 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-slate-300 leading-relaxed pt-2">
                À la fin de l'appel, tu auras une <strong className="text-white">vision claire</strong> de ton 
                parcours et tu pourras prendre une décision éclairée.
              </p>
            </div>

            {/* Check-list d'éligibilité */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Cet appel est pour toi si...
              </h4>
              <div className="space-y-3">
                {eligibilityCriteria.map((criteria, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <criteria.icon className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                    <span className="text-slate-200 text-sm font-medium">{criteria.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Avertissement de qualification */}
            <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-200 text-sm leading-relaxed">
                    <strong>Important :</strong> Cet appel est réservé aux personnes motivées à investir 
                    sérieusement dans leur progression en trading. Nous nous réservons le droit d'annuler 
                    le rendez-vous si ton profil ne correspond pas au Bootcamp Élite (ex : pas de budget, 
                    pas de temps disponible, pas d'intérêt réel pour le programme).
                  </p>
                </div>
              </div>
            </div>

            {/* Badge de réassurance */}
            <div className="mt-auto pt-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <Shield className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-slate-200 text-sm font-medium">
                    Pas de spam, pas d'engagement automatique
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Tu décides librement après l'appel
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* COLONNE DROITE - Widget Calendly */}
          {/* Responsive : hauteur adaptée mobile/desktop */}
          {/* ============================================ */}
          <div className="bg-black/40 lg:border-l border-t lg:border-t-0 border-white/5">
            {/* Conteneur avec hauteur responsive - plus grand sur mobile pour le scroll */}
            <div 
              className="w-full overflow-hidden"
              style={{ 
                height: 'clamp(550px, 80vh, 750px)',
                minHeight: '550px',
              }}
            >
              {isClient ? (
                <InlineWidget
                  url={calendlyUrl}
                  styles={{
                    height: '100%',
                    width: '100%',
                    minHeight: '100%',
                  }}
                  pageSettings={{
                    backgroundColor: '0a0a14',
                    hideEventTypeDetails: false,
                    hideLandingPageDetails: false,
                    primaryColor: 'ec4899', // Pink-500
                    textColor: 'ffffff',
                    hideGdprBanner: true,
                  }}
                  prefill={{
                    name: userName,
                    email: userEmail,
                  }}
                  utm={{
                    utmSource: utmSource,
                    utmMedium: 'bootcamp',
                    utmCampaign: utmCampaign,
                    utmContent: 'inline_widget',
                  }}
                />
              ) : (
                // Skeleton loader pendant le chargement
                <div className="flex items-center justify-center h-full bg-slate-900/50">
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Chargement du calendrier...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Note supplémentaire en bas */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Des questions avant de réserver ?{' '}
            <a 
              href="/contact" 
              className="text-pink-400 hover:text-pink-300 underline underline-offset-2 transition-colors"
            >
              Contacte-nous
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

// La constante CALENDLY_BOOTCAMP_ELITE_URL est déjà exportée en haut du fichier

