import React, { useState, useEffect } from 'react';
import { X, Cookie, Settings } from 'lucide-react';

interface CookieBannerProps {
  onOpenRGPD?: () => void;
}

export default function CookieBanner({ onOpenRGPD }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Toujours activé
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Vérifier si le consentement a déjà été donné
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookieConsent', JSON.stringify(onlyNecessary));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setIsVisible(false);
    setShowSettings(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#1a1a1f] border border-pink-500/20 rounded-lg shadow-2xl p-6 md:p-8">
          {!showSettings ? (
            <>
              <div className="flex items-start gap-4 mb-4">
                <Cookie className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Gestion des cookies
                  </h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                    Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                    En continuant, vous acceptez notre utilisation des cookies.{' '}
                    <button
                      onClick={onOpenRGPD}
                      className="text-pink-500 hover:text-pink-400 underline"
                    >
                      En savoir plus
                    </button>
                  </p>
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-all transform hover:scale-105"
                >
                  Tout accepter
                </button>
                <button
                  onClick={handleRejectAll}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Tout refuser
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-6 py-3 border border-pink-500/30 text-pink-500 rounded-lg font-medium hover:bg-pink-500/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Personnaliser
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-pink-500" />
                  Paramètres des cookies
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Retour"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                {/* Cookies nécessaires */}
                <div className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">Cookies nécessaires</h4>
                    <p className="text-gray-400 text-sm">
                      Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés.
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.necessary}
                        disabled
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-pink-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>

                {/* Cookies analytiques */}
                <div className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">Cookies analytiques</h4>
                    <p className="text-gray-400 text-sm">
                      Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site.
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences({ ...preferences, analytics: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                        preferences.analytics ? 'bg-pink-500' : 'bg-gray-600'
                      }`}></div>
                    </label>
                  </div>
                </div>

                {/* Cookies marketing */}
                <div className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">Cookies marketing</h4>
                    <p className="text-gray-400 text-sm">
                      Ces cookies sont utilisés pour vous proposer des publicités personnalisées.
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          setPreferences({ ...preferences, marketing: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                        preferences.marketing ? 'bg-pink-500' : 'bg-gray-600'
                      }`}></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-all flex-1"
                >
                  Enregistrer les préférences
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-3 border border-gray-600 text-gray-400 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

