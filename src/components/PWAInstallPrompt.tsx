import React, { useState, useEffect } from 'react';
import { Smartphone, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Afficher le prompt seulement sur mobile et après un délai
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setTimeout(() => {
          const dismissed = localStorage.getItem('pwa-install-dismissed');
          if (!dismissed) {
            setShowPrompt(true);
          }
        }, 30000); // 30 secondes après le chargement
      }
    };

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Erreur lors de l\'installation PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Ne rien afficher si déjà installé ou pas de prompt disponible
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:hidden"
      >
        <div className="bg-gradient-to-r from-pink-500/20 to-violet-500/20 backdrop-blur-lg border border-pink-500/30 rounded-2xl p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm mb-1">
                Installer Invest Infinity
              </h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                Accédez plus rapidement et utilisez l'app hors ligne pour une meilleure expérience !
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xs font-medium rounded-lg hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                <Download className="w-3 h-3 inline mr-1" />
                Installer
              </button>

              <button
                onClick={handleDismiss}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
