import React, { useState, useEffect } from 'react';
import { X, Cookie, Settings, Shield, BarChart3, Megaphone } from 'lucide-react';

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
      // Délai pour l'animation d'entrée
      setTimeout(() => setIsVisible(true), 100);
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
    <>
      {/* Backdrop avec blur */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in"
        onClick={() => setIsVisible(false)}
        aria-hidden="true"
      />
      
      {/* Bannière principale */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 slide-in-from-bottom">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-[#1a1a1f] via-[#1f1f25] to-[#1a1a1f] border border-pink-500/30 rounded-2xl shadow-2xl overflow-hidden">
            {/* Effet de brillance subtil */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/5 to-transparent opacity-50" />
            
            <div className="relative p-6 md:p-8">
              {!showSettings ? (
                <>
                  {/* En-tête */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-pink-500/30">
                      <Cookie className="w-6 h-6 text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                        Gestion des cookies
                      </h3>
                      <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                        Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu.{' '}
                        <button
                          onClick={onOpenRGPD}
                          className="text-pink-400 hover:text-pink-300 underline underline-offset-2 transition-colors font-medium"
                        >
                          En savoir plus
                        </button>
                      </p>
                    </div>
                    <button
                      onClick={() => setIsVisible(false)}
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
                      aria-label="Fermer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleAcceptAll}
                      className="group relative px-6 py-3 bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/25 active:scale-[0.98] overflow-hidden"
                    >
                      <span className="relative z-10">Tout accepter</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </button>
                    <button
                      onClick={handleRejectAll}
                      className="px-6 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 text-white rounded-xl font-semibold hover:bg-gray-700/80 hover:border-gray-600 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Tout refuser
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="px-6 py-3 border-2 border-pink-500/40 bg-pink-500/5 text-pink-400 rounded-xl font-semibold hover:bg-pink-500/10 hover:border-pink-500/60 transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Settings className="w-4 h-4" />
                      Personnaliser
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* En-tête des paramètres */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-pink-500/30">
                        <Settings className="w-5 h-5 text-pink-400" />
                      </div>
                      <span>Paramètres des cookies</span>
                    </h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
                      aria-label="Retour"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Liste des cookies */}
                  <div className="space-y-3 mb-6">
                    {/* Cookies nécessaires */}
                    <div className="group flex items-start justify-between p-4 bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-xl hover:border-gray-700/50 hover:bg-gray-800/60 transition-all duration-200">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30 mt-0.5">
                          <Shield className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold mb-1.5 flex items-center gap-2">
                            Cookies nécessaires
                            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md border border-blue-500/30">
                              Obligatoire
                            </span>
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés.
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <label className="relative inline-flex items-center cursor-not-allowed opacity-60">
                          <input
                            type="checkbox"
                            checked={preferences.necessary}
                            disabled
                            className="sr-only peer"
                          />
                          <div className="w-12 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-inner">
                            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-200 translate-x-6" />
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Cookies analytiques */}
                    <div className="group flex items-start justify-between p-4 bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-xl hover:border-gray-700/50 hover:bg-gray-800/60 transition-all duration-200">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30 mt-0.5">
                          <BarChart3 className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold mb-1.5">Cookies analytiques</h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site.
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.analytics}
                            onChange={(e) =>
                              setPreferences({ ...preferences, analytics: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className={`w-12 h-6 rounded-full shadow-inner transition-all duration-300 ${
                            preferences.analytics 
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
                              : 'bg-gray-700'
                          }`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                              preferences.analytics ? 'left-7' : 'left-1'
                            }`} />
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Cookies marketing */}
                    <div className="group flex items-start justify-between p-4 bg-gray-800/40 backdrop-blur-sm border border-gray-700/30 rounded-xl hover:border-gray-700/50 hover:bg-gray-800/60 transition-all duration-200">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30 mt-0.5">
                          <Megaphone className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold mb-1.5">Cookies marketing</h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            Ces cookies sont utilisés pour vous proposer des publicités personnalisées.
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.marketing}
                            onChange={(e) =>
                              setPreferences({ ...preferences, marketing: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className={`w-12 h-6 rounded-full shadow-inner transition-all duration-300 ${
                            preferences.marketing 
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
                              : 'bg-gray-700'
                          }`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                              preferences.marketing ? 'left-7' : 'left-1'
                            }`} />
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Boutons de sauvegarde */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-800/50">
                    <button
                      onClick={handleSavePreferences}
                      className="group relative px-6 py-3 bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/25 active:scale-[0.98] flex-1 overflow-hidden"
                    >
                      <span className="relative z-10">Enregistrer les préférences</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </button>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="px-6 py-3 border-2 border-gray-700/50 bg-gray-800/40 backdrop-blur-sm text-gray-300 rounded-xl font-semibold hover:bg-gray-800/60 hover:border-gray-600/50 hover:text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

