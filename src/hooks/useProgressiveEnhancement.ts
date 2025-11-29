import { useState, useEffect, useMemo } from 'react';

// Types pour les fonctionnalités détectées
export interface BrowserCapabilities {
  // APIs Web modernes
  webGL: boolean;
  webRTC: boolean;
  webWorkers: boolean;
  serviceWorkers: boolean;
  indexedDB: boolean;
  localStorage: boolean;
  sessionStorage: boolean;

  // APIs multimédia
  webAudio: boolean;
  mediaDevices: boolean;
  mediaRecorder: boolean;

  // APIs de performance
  performanceObserver: boolean;
  intersectionObserver: boolean;
  resizeObserver: boolean;

  // APIs de réseau
  fetch: boolean;
  beacon: boolean;

  // APIs d'accessibilité
  speechSynthesis: boolean;
  speechRecognition: boolean;

  // APIs de géolocalisation
  geolocation: boolean;

  // APIs de notifications
  notifications: boolean;
  pushManager: boolean;

  // APIs de vibration
  vibration: boolean;

  // APIs de partage
  webShare: boolean;
  webShareTarget: boolean;

  // Niveau de support global
  supportLevel: 'basic' | 'standard' | 'advanced' | 'cutting-edge';
}

// Hook pour détecter les capacités du navigateur
export function useBrowserCapabilities(): BrowserCapabilities {
  const [capabilities, setCapabilities] = useState<BrowserCapabilities>({
    webGL: false,
    webRTC: false,
    webWorkers: false,
    serviceWorkers: false,
    indexedDB: false,
    localStorage: false,
    sessionStorage: false,
    webAudio: false,
    mediaDevices: false,
    mediaRecorder: false,
    performanceObserver: false,
    intersectionObserver: false,
    resizeObserver: false,
    fetch: false,
    beacon: false,
    speechSynthesis: false,
    speechRecognition: false,
    geolocation: false,
    notifications: false,
    pushManager: false,
    vibration: false,
    webShare: false,
    webShareTarget: false,
    supportLevel: 'basic'
  });

  useEffect(() => {
    const detectCapabilities = (): BrowserCapabilities => {
      const caps: BrowserCapabilities = {
        // APIs Web modernes
        webGL: (() => {
          try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext &&
              canvas.getContext('webgl'));
          } catch {
            return false;
          }
        })(),

        webRTC: !!window.RTCPeerConnection,

        webWorkers: !!window.Worker,

        serviceWorkers: 'serviceWorker' in navigator,

        indexedDB: !!window.indexedDB,

        localStorage: (() => {
          try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
          } catch {
            return false;
          }
        })(),

        sessionStorage: (() => {
          try {
            const test = 'test';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
          } catch {
            return false;
          }
        })(),

        // APIs multimédia
        webAudio: !!window.AudioContext || !!(window as any).webkitAudioContext,

        mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),

        mediaRecorder: !!window.MediaRecorder,

        // APIs de performance
        performanceObserver: !!window.PerformanceObserver,

        intersectionObserver: !!window.IntersectionObserver,

        resizeObserver: !!window.ResizeObserver,

        // APIs de réseau
        fetch: !!window.fetch,

        beacon: !!navigator.sendBeacon,

        // APIs d'accessibilité
        speechSynthesis: !!window.speechSynthesis,

        speechRecognition: !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition,

        // APIs de géolocalisation
        geolocation: !!navigator.geolocation,

        // APIs de notifications
        notifications: !!window.Notification,

        pushManager: !!('serviceWorker' in navigator && 'PushManager' in window),

        // APIs de vibration
        vibration: !!navigator.vibrate,

        // APIs de partage
        webShare: !!(navigator.share),

        webShareTarget: !!('serviceWorker' in navigator && 'launchQueue' in window),

        supportLevel: 'basic'
      };

      // Calculer le niveau de support
      const advancedFeatures = [
        caps.webGL,
        caps.webRTC,
        caps.serviceWorkers,
        caps.indexedDB,
        caps.mediaDevices,
        caps.performanceObserver,
        caps.intersectionObserver,
        caps.notifications,
        caps.geolocation
      ];

      const cuttingEdgeFeatures = [
        caps.webWorkers,
        caps.mediaRecorder,
        caps.resizeObserver,
        caps.speechSynthesis,
        caps.speechRecognition,
        caps.pushManager,
        caps.webShare
      ];

      const advancedCount = advancedFeatures.filter(Boolean).length;
      const cuttingEdgeCount = cuttingEdgeFeatures.filter(Boolean).length;

      if (cuttingEdgeCount >= 5) {
        caps.supportLevel = 'cutting-edge';
      } else if (advancedCount >= 6) {
        caps.supportLevel = 'advanced';
      } else if (advancedCount >= 3) {
        caps.supportLevel = 'standard';
      } else {
        caps.supportLevel = 'basic';
      }

      return caps;
    };

    setCapabilities(detectCapabilities());
  }, []);

  return capabilities;
}

// Hook pour les fonctionnalités conditionnelles selon le support
export function useConditionalFeatures() {
  const capabilities = useBrowserCapabilities();

  return useMemo(() => ({
    // Fonctionnalités de base (toujours activées)
    basic: true,

    // Fonctionnalités standard
    standard: capabilities.supportLevel !== 'basic',

    // Fonctionnalités avancées
    advanced: ['advanced', 'cutting-edge'].includes(capabilities.supportLevel),

    // Fonctionnalités de pointe
    cuttingEdge: capabilities.supportLevel === 'cutting-edge',

    // Fonctionnalités spécifiques
    features: {
      animations: capabilities.intersectionObserver,
      offline: capabilities.serviceWorkers && capabilities.indexedDB,
      media: capabilities.mediaDevices && capabilities.webAudio,
      notifications: capabilities.notifications,
      geolocation: capabilities.geolocation,
      sharing: capabilities.webShare,
      speech: capabilities.speechSynthesis || capabilities.speechRecognition,
      performance: capabilities.performanceObserver,
      storage: capabilities.localStorage && capabilities.indexedDB,
    }
  }), [capabilities]);
}

// Hook pour charger des composants seulement si supportés
export function useProgressiveComponent<T>(
  component: T,
  fallback: any = null,
  condition: boolean = true
): T | null {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Tester la condition de manière asynchrone si nécessaire
    if (typeof condition === 'function') {
      Promise.resolve(condition()).then(setIsSupported);
    } else {
      setIsSupported(condition);
    }
  }, [condition]);

  if (isSupported === null) return fallback; // Loading state
  return isSupported ? component : fallback;
}

// Composant wrapper pour progressive enhancement
export function ProgressiveFeature({
  children,
  fallback = null,
  condition = true,
  loadingComponent = null
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  condition?: boolean | (() => boolean | Promise<boolean>);
  loadingComponent?: React.ReactNode;
}) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const checkCondition = async () => {
      if (typeof condition === 'function') {
        const result = await condition();
        setIsSupported(result);
      } else {
        setIsSupported(condition);
      }
    };

    checkCondition();
  }, [condition]);

  if (isSupported === null) return <>{loadingComponent}</>;
  return <>{isSupported ? children : fallback}</>;
}

// Hook pour détecter la connectivité réseau
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connection, setConnection] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Détecter les changements de qualité de connexion
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      setConnection(conn);

      const handleConnectionChange = () => {
        setConnection({ ...conn });
      };

      conn.addEventListener('change', handleConnectionChange);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        conn.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    connection,
    isSlowConnection: connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g',
    isFastConnection: connection?.effectiveType === '4g' || connection?.downlink >= 10
  };
}

// Hook pour les préférences utilisateur
export function useUserPreferences() {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    prefersDark: false,
    prefersReducedData: false
  });

  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      prefersDark: window.matchMedia('(prefers-color-scheme: dark)'),
      prefersReducedData: window.matchMedia('(prefers-reduced-data: reduce)')
    };

    const updatePreferences = () => {
      setPreferences({
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: mediaQueries.highContrast.matches,
        prefersDark: mediaQueries.prefersDark.matches,
        prefersReducedData: mediaQueries.prefersReducedData.matches
      });
    };

    // Écouter les changements
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    updatePreferences();

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  return preferences;
}
