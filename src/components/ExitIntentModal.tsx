import React, { useState, useEffect, useCallback } from 'react';
import { X, Mail, Download, AlertCircle, Loader2, Gift, Sparkles, Clock, Users, TrendingUp, Eye, Zap, Shield, Star, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToNewsletter } from '../services/newsletterService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface ExitIntentModalProps {
  /**
   * Stratégies d'affichage du popup
   */
  strategies?: {
    /** Activer la détection exit-intent (mouseleave vers le haut) */
    exitIntent?: boolean;
    /** Afficher après X secondes de présence sur la page */
    delaySeconds?: number;
    /** Afficher après X% de scroll */
    scrollPercentage?: number;
    /** Afficher après X minutes sur la page */
    timeMinutes?: number;
  };
  
  /**
   * Cooldown en heures avant de réafficher (défaut: 24h)
   */
  cooldownHours?: number;
  
  /**
   * Désactiver complètement le modal (pour tests ou admin)
   */
  disabled?: boolean;
}

// Clés localStorage
const STORAGE_KEYS = {
  DONT_SHOW_AGAIN: 'exitIntentNewsletter_dontShowAgain',
  LAST_SHOWN: 'exitIntentNewsletter_lastShown',
  ALREADY_SUBSCRIBED: 'exitIntentNewsletter_subscribed',
  COUNTDOWN_END: 'exitIntentNewsletter_countdownEnd',
  TOTAL_DOWNLOADS: 'exitIntentNewsletter_totalDownloads',
};

// Générer un nombre aléatoire réaliste pour le social proof
function getRealisticDownloadCount(): number {
  const stored = localStorage.getItem(STORAGE_KEYS.TOTAL_DOWNLOADS);
  if (stored) {
    const baseCount = parseInt(stored, 10);
    // Simuler quelques téléchargements supplémentaires
    const today = new Date().toDateString();
    const lastUpdate = localStorage.getItem('exitIntentNewsletter_lastUpdate');
    
    if (lastUpdate !== today) {
      // Nouveau jour, ajouter quelques téléchargements
      const newCount = baseCount + Math.floor(Math.random() * 15) + 10;
      localStorage.setItem(STORAGE_KEYS.TOTAL_DOWNLOADS, newCount.toString());
      localStorage.setItem('exitIntentNewsletter_lastUpdate', today);
      return newCount;
    }
    
    return baseCount + Math.floor(Math.random() * 3);
  }
  
  // Valeur initiale réaliste
  const initialCount = 150 + Math.floor(Math.random() * 50);
  localStorage.setItem(STORAGE_KEYS.TOTAL_DOWNLOADS, initialCount.toString());
  localStorage.setItem('exitIntentNewsletter_lastUpdate', new Date().toDateString());
  return initialCount;
}

function getRealisticViewersCount(): number {
  // Simuler 15-45 personnes qui regardent actuellement
  return 20 + Math.floor(Math.random() * 30);
}

// Variantes de messages accrocheurs
const titleVariants = [
  {
    main: "Attends ! 🚨",
    subtitle: "Ne pars pas sans ton guide gratuit ! 📚",
    urgency: "high"
  },
  {
    main: "Stop ! ⛔",
    subtitle: "Tu vas rater quelque chose d'important... 💎",
    urgency: "high"
  },
  {
    main: "Un instant ! ⏱️",
    subtitle: "Ton guide gratuit t'attend juste ici ⬇️",
    urgency: "medium"
  },
  {
    main: "Tu sors déjà ? 🚪",
    subtitle: "Télécharge ton PDF avant de partir ! 🎁",
    urgency: "high"
  }
];

// Variantes de messages de valeur
const valueMessages = [
  {
    icon: Sparkles,
    text: "Découvre les 7 erreurs les plus courantes qui font perdre 90% des débutants et comment les éviter pour protéger ton capital dès maintenant.",
    iconColor: "text-pink-400",
    bgColor: "from-pink-500/10",
    borderColor: "border-pink-500/20"
  },
  {
    icon: Shield,
    text: "Évite les pièges mortels du trading débutant. Ce guide pourrait sauver des milliers d'euros sur ton capital.",
    iconColor: "text-purple-400",
    bgColor: "from-purple-500/10",
    borderColor: "border-purple-500/20"
  },
  {
    icon: Zap,
    text: "Apprends des erreurs des autres plutôt que de les commettre toi-même. Télécharge ce guide indispensable.",
    iconColor: "text-yellow-400",
    bgColor: "from-yellow-500/10",
    borderColor: "border-yellow-500/20"
  },
  {
    icon: Star,
    text: "Les traders qui réussissent ont tous évité ces 7 erreurs. Découvre comment faire partie de ceux qui réussissent.",
    iconColor: "text-orange-400",
    bgColor: "from-orange-500/10",
    borderColor: "border-orange-500/20"
  },
  {
    icon: Flame,
    text: "Ne sois pas une statistique ! 95% des traders perdent à cause de ces erreurs. Protège-toi maintenant.",
    iconColor: "text-red-400",
    bgColor: "from-red-500/10",
    borderColor: "border-red-500/20"
  }
];

// Mapping des couleurs pour le social proof
const socialProofColorMap: Record<string, string> = {
  green: "text-green-400",
  blue: "text-blue-400",
  yellow: "text-yellow-400",
  purple: "text-purple-400",
};

// Variantes de social proof
const socialProofMessages = [
  {
    type: "viewers",
    text: "personnes regardent actuellement",
    icon: Eye,
    color: "green"
  },
  {
    type: "downloads",
    text: "téléchargements aujourd'hui",
    icon: Download,
    color: "blue"
  },
  {
    type: "success",
    text: "% de traders satisfaits",
    icon: Star,
    color: "yellow",
    value: "94"
  },
  {
    type: "community",
    text: "membres dans la communauté",
    icon: Users,
    color: "purple",
    value: "100+"
  }
];

export default function ExitIntentModal({
  strategies = {
    exitIntent: true,
    delaySeconds: 45, // 45 secondes si pas de exit-intent
    scrollPercentage: 60, // Après 60% de scroll
    timeMinutes: 2, // Après 2 minutes
  },
  cooldownHours = 24,
  disabled = false,
}: ExitIntentModalProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes par défaut
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [viewersCount, setViewersCount] = useState<number>(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
  const [currentTitleIndex, setCurrentTitleIndex] = useState<number>(0);
  const [currentSocialProofIndex, setCurrentSocialProofIndex] = useState<number>(0);

  // Vérifier si on doit afficher le modal
  const shouldShow = useCallback((): boolean => {
    if (disabled) return false;
    
    // Ne pas afficher aux utilisateurs connectés
    if (user) return false;
    
    // Vérifier "Ne plus afficher"
    const dontShowAgain = localStorage.getItem(STORAGE_KEYS.DONT_SHOW_AGAIN);
    if (dontShowAgain === 'true') return false;
    
    // Vérifier si déjà inscrit
    const alreadySubscribed = localStorage.getItem(STORAGE_KEYS.ALREADY_SUBSCRIBED);
    if (alreadySubscribed === 'true') return false;
    
    // Vérifier le cooldown
    const lastShown = localStorage.getItem(STORAGE_KEYS.LAST_SHOWN);
    if (lastShown) {
      const lastShownTime = parseInt(lastShown, 10);
      const cooldownMs = cooldownHours * 60 * 60 * 1000;
      const timeSinceLastShown = Date.now() - lastShownTime;
      if (timeSinceLastShown < cooldownMs) {
        return false;
      }
    }
    
    return true;
  }, [user, disabled, cooldownHours]);

  // Détection exit-intent (mouseleave vers le haut de la fenêtre)
  useEffect(() => {
    if (!strategies.exitIntent || hasTriggered || !shouldShow()) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Détecter si la souris sort par le haut (exit-intent)
      if (e.clientY <= 0) {
        setIsOpen(true);
        setHasTriggered(true);
        localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, Date.now().toString());
        
        // Retirer l'écouteur après déclenchement
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };

    // Attendre un peu avant d'activer la détection (éviter les faux positifs)
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 3000); // 3 secondes minimum sur la page

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strategies.exitIntent, hasTriggered, shouldShow]);

  // Stratégie: Delayed popup
  useEffect(() => {
    if (!strategies.delaySeconds || hasTriggered || !shouldShow()) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      setHasTriggered(true);
      localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, Date.now().toString());
    }, strategies.delaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [strategies.delaySeconds, hasTriggered, shouldShow]);

  // Stratégie: Scroll-based
  useEffect(() => {
    if (!strategies.scrollPercentage || hasTriggered || !shouldShow()) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const scrollPercentage = (scrolled / scrollHeight) * 100;

      if (scrollPercentage >= strategies.scrollPercentage!) {
        setIsOpen(true);
        setHasTriggered(true);
        localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, Date.now().toString());
        window.removeEventListener('scroll', handleScroll);
      }
    };

    // Attendre un peu avant d'activer
    const timer = setTimeout(() => {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }, 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [strategies.scrollPercentage, hasTriggered, shouldShow]);

  // Stratégie: Time-based
  useEffect(() => {
    if (!strategies.timeMinutes || hasTriggered || !shouldShow()) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      setHasTriggered(true);
      localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, Date.now().toString());
    }, strategies.timeMinutes * 60 * 1000);

    return () => clearTimeout(timer);
  }, [strategies.timeMinutes, hasTriggered, shouldShow]);

  // Bloquer le scroll quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Initialiser le countdown timer et le social proof
  useEffect(() => {
    if (!isOpen) return;

    // Initialiser le countdown (5 minutes par défaut)
    const countdownKey = STORAGE_KEYS.COUNTDOWN_END;
    const storedEndTime = localStorage.getItem(countdownKey);
    const now = Date.now();
    
    let endTime: number;
    if (storedEndTime) {
      const stored = parseInt(storedEndTime, 10);
      if (stored > now) {
        endTime = stored;
      } else {
        // Timer expiré, créer un nouveau
        endTime = now + 5 * 60 * 1000; // 5 minutes
        localStorage.setItem(countdownKey, endTime.toString());
      }
    } else {
      endTime = now + 5 * 60 * 1000; // 5 minutes
      localStorage.setItem(countdownKey, endTime.toString());
    }

    // Mettre à jour le temps restant
    const updateTimer = () => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(Math.floor(remaining / 1000));
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    // Initialiser le social proof
    setDownloadCount(getRealisticDownloadCount());
    setViewersCount(getRealisticViewersCount());

    // Animer le nombre de viewers (variation subtile)
    const viewersInterval = setInterval(() => {
      setViewersCount((prev) => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, ou +1
        return Math.max(10, Math.min(50, prev + change));
      });
    }, 5000);

    // Rotation des messages (toutes les 4 secondes)
    const messageRotation = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % valueMessages.length);
    }, 4000);

    // Rotation des titres (toutes les 5 secondes)
    const titleRotation = setInterval(() => {
      setCurrentTitleIndex((prev) => (prev + 1) % titleVariants.length);
    }, 5000);

    // Rotation du social proof (toutes les 3.5 secondes)
    const socialProofRotation = setInterval(() => {
      setCurrentSocialProofIndex((prev) => (prev + 1) % socialProofMessages.length);
    }, 3500);

    return () => {
      clearInterval(timerInterval);
      clearInterval(viewersInterval);
      clearInterval(messageRotation);
      clearInterval(titleRotation);
      clearInterval(socialProofRotation);
    };
  }, [isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(STORAGE_KEYS.DONT_SHOW_AGAIN, 'true');
    handleClose();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim()) {
      setError('L\'email est requis');
      return;
    }

    if (!validateEmail(email)) {
      setError('Format d\'email invalide');
      return;
    }

    setIsLoading(true);

    try {
      const result = await subscribeToNewsletter(email);

      if (result.success) {
        setIsSuccess(true);
        localStorage.setItem(STORAGE_KEYS.ALREADY_SUBSCRIBED, 'true');
        
        // Incrémenter le compteur de téléchargements
        const currentCount = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_DOWNLOADS) || '0', 10);
        localStorage.setItem(STORAGE_KEYS.TOTAL_DOWNLOADS, (currentCount + 1).toString());
        setDownloadCount(currentCount + 1);
        
        toast.success('🎉 Vérifie ta boîte mail ! Ton PDF est en route.', {
          duration: 5000,
        });
        
        // Fermer automatiquement après 3 secondes
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const currentTitle = titleVariants[currentTitleIndex];
  const currentMessage = valueMessages[currentMessageIndex];
  const currentSocialProof = socialProofMessages[currentSocialProofIndex];
  const MessageIcon = currentMessage.icon;
  const SocialProofIcon = currentSocialProof.icon;

  // Variants d'animation pour le modal
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50,
      filter: 'blur(10px)'
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: -20,
      filter: 'blur(5px)',
      transition: {
        duration: 0.2
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        delay: 0.1,
        duration: 0.4
      }
    }
  };

  const titleVariants_anim = {
    hidden: { opacity: 0, scale: 0.9, y: -10 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop avec blur animé */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-intent-title"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-lg pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Effet de brillance animé avec particules */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Particules flottantes */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-pink-400/30 rounded-full blur-sm"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${10 + i * 20}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    x: [0, 10, 0],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeInOut"
                  }}
                />
              ))}

              <motion.div 
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className="relative bg-gradient-to-br from-[#1a1a1f] via-[#0f0f13] to-[#1a1a1f] border border-pink-500/30 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden"
              >
                {/* Bouton fermer avec animation */}
                <motion.button
                  onClick={handleClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white transition-colors duration-200 z-10"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                {/* Badge "Cadeau Gratuit" avec Countdown Timer */}
                <motion.div 
                  variants={contentVariants}
                  className="flex flex-col items-center gap-3 mb-4"
                >
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 rounded-full"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Gift className="w-4 h-4 text-pink-400" />
                    </motion.div>
                    <span className="text-sm font-semibold text-pink-300">Cadeau Gratuit</span>
                  </motion.div>
                  
                  {/* Countdown Timer avec animation */}
                  <AnimatePresence mode="wait">
                    {timeLeft > 0 && (
                      <motion.div
                        key={timeLeft}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/40 rounded-full"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Clock className="w-4 h-4 text-red-400" />
                        </motion.div>
                        <span className="text-xs font-medium text-red-300">Offre expire dans</span>
                        <motion.div 
                          className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded font-mono font-bold"
                          animate={timeLeft < 60 ? { 
                            backgroundColor: ['rgba(0,0,0,0.4)', 'rgba(239,68,68,0.3)', 'rgba(0,0,0,0.4)'] 
                          } : {}}
                          transition={{ duration: 1, repeat: timeLeft < 60 ? Infinity : 0 }}
                        >
                          <span className="text-red-400 text-sm">
                            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}
                          </span>
                          <motion.span 
                            className="text-red-400"
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            :
                          </motion.span>
                          <span className="text-red-400 text-sm">
                            {(timeLeft % 60).toString().padStart(2, '0')}
                          </span>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Titre accrocheur avec animation et variantes */}
                <motion.div 
                  variants={titleVariants_anim}
                  initial="hidden"
                  animate="visible"
                  key={currentTitleIndex}
                  className="text-center mb-6"
                >
                  <motion.div 
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 mb-4 relative"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  >
                    <Download className="w-10 h-10 text-white relative z-10" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full"
                      animate={{ 
                        scale: [1, 1.5, 1.5],
                        opacity: [0.3, 0, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                  </motion.div>
                  
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={currentTitleIndex}
                      id="exit-intent-title"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                      className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight"
                    >
                      {currentTitle.main}
                    </motion.h2>
                  </AnimatePresence>
                  
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">
                    <motion.span 
                      className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent"
                      animate={{
                        backgroundPosition: ['0%', '100%', '0%'],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      style={{
                        backgroundSize: '200% auto'
                      }}
                    >
                      7 Erreurs Mortelles
                    </motion.span>
                  </h3>
                  <p className="text-xl text-gray-300 mb-2">
                    des Débutants en Trading
                  </p>
                  
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentTitleIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-gray-400 text-lg"
                    >
                      {currentTitle.subtitle}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>

                {/* Social Proof avec rotation */}
                <motion.div 
                  variants={contentVariants}
                  className="mb-4 space-y-2"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSocialProofIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center gap-4 text-xs text-gray-400"
                    >
                      {currentSocialProof.type === 'viewers' && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <div className="relative flex h-2 w-2">
                              <motion.span 
                                className="absolute inline-flex h-full w-full rounded-full bg-green-400"
                                animate={{ 
                                  scale: [1, 2, 1],
                                  opacity: [0.75, 0, 0.75]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity 
                                }}
                              />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </div>
                            <SocialProofIcon className={`w-3.5 h-3.5 ${socialProofColorMap[currentSocialProof.color] || 'text-green-400'}`} />
                            <motion.span 
                              className={`${socialProofColorMap[currentSocialProof.color] || 'text-green-400'} font-medium`}
                              key={viewersCount}
                              initial={{ scale: 1.3 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              {viewersCount}
                            </motion.span>
                            <span>{currentSocialProof.text}</span>
                          </div>
                          <span className="text-gray-600">•</span>
                          <div className="flex items-center gap-1.5">
                            <Download className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-blue-400 font-medium">{downloadCount}+</span>
                            <span>téléchargements</span>
                          </div>
                        </>
                      )}
                      {currentSocialProof.type === 'downloads' && (
                        <div className="flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-blue-400 font-medium">{downloadCount}+</span>
                          <span>{currentSocialProof.text}</span>
                        </div>
                      )}
                      {currentSocialProof.type === 'success' && (
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-yellow-400" />
                          <span className="text-yellow-400 font-medium">{currentSocialProof.value}</span>
                          <span>{currentSocialProof.text}</span>
                        </div>
                      )}
                      {currentSocialProof.type === 'community' && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-purple-400 font-medium">{currentSocialProof.value}</span>
                          <span>{currentSocialProof.text}</span>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                {/* Message de valeur avec rotation */}
                <motion.div 
                  variants={contentVariants}
                  className="mb-6"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentMessageIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                      className={`bg-gradient-to-r ${currentMessage.bgColor} to-purple-500/10 border ${currentMessage.borderColor} rounded-xl p-4`}
                    >
                      <p className="text-gray-300 text-center text-sm leading-relaxed">
                        <motion.div
                          className="inline-block mr-1"
                          animate={{ rotate: [0, 360] }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 2,
                            ease: "linear"
                          }}
                        >
                          <MessageIcon className={`w-4 h-4 inline-block ${currentMessage.iconColor}`} />
                        </motion.div>
                        {currentMessage.text}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

            {/* Formulaire */}
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="Ton adresse email"
                    autoFocus
                    className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${
                      error
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-white/10 focus:border-pink-500/50'
                    } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all text-base`}
                    disabled={isLoading}
                  />
                  {error && (
                    <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  animate={!isLoading ? {
                    boxShadow: [
                      '0 10px 40px rgba(236, 72, 153, 0.25)',
                      '0 15px 50px rgba(236, 72, 153, 0.4)',
                      '0 10px 40px rgba(236, 72, 153, 0.25)',
                    ]
                  } : {}}
                  transition={{
                    boxShadow: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                  className="relative w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg overflow-hidden group"
                >
                  {/* Effet de brillance au survol */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <motion.div
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Download className="w-5 h-5" />
                        </motion.div>
                        <span>Oui, je veux mon PDF gratuit !</span>
                      </>
                    )}
                  </span>
                </motion.button>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-gray-400 transition-colors">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleDontShowAgain();
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-pink-500 focus:ring-pink-500 focus:ring-offset-gray-900"
                    />
                    <span>Ne plus afficher</span>
                  </label>
                  <span className="text-gray-600">
                    🔒 Sans spam, désinscription facile
                  </span>
                </div>
              </form>
            ) : (
              /* Message de succès */
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4 relative">
                  <Download className="w-10 h-10 text-green-400 relative z-10" />
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  🎉 Parfait !
                </h3>
                <p className="text-gray-300 text-lg mb-2">
                  Vérifie ta boîte mail
                </p>
                <p className="text-gray-400 text-sm">
                  Ton PDF "7 Erreurs Mortelles" est en route.
                  <br />
                  Si tu ne le vois pas, pense à vérifier tes spams.
                </p>
              </div>
            )}

                {/* Footer avec garantie */}
                <motion.div 
                  variants={contentVariants}
                  className="mt-6 pt-6 border-t border-gray-800/50"
                >
                  <p className="text-center text-xs text-gray-500">
                    ✓ PDF 100% gratuit • ✓ Aucun engagement • ✓ Désinscription en 1 clic
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
