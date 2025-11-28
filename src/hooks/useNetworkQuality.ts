import { useState, useEffect } from 'react';

export type NetworkQuality = 'slow' | 'fast' | 'unknown';

export function useNetworkQuality(): NetworkQuality {
  const [quality, setQuality] = useState<NetworkQuality>('unknown');

  useEffect(() => {
    // Vérifier la connexion réseau
    const checkConnection = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;

        // Vérifier la vitesse de connexion
        if (connection) {
          const effectiveType = connection.effectiveType; // 'slow-2g', '2g', '3g', '4g'
          const downlink = connection.downlink; // Mbps

          if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) {
            setQuality('slow');
          } else {
            setQuality('fast');
          }

          // Écouter les changements de connexion
          connection.addEventListener('change', checkConnection);
        }
      }
    };

    checkConnection();

    // Fallback: considérer comme fast après un délai si on ne peut pas détecter
    const timeout = setTimeout(() => {
      if (quality === 'unknown') {
        setQuality('fast');
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connection.removeEventListener('change', checkConnection);
        }
      }
    };
  }, [quality]);

  return quality;
}

// Hook pour adapter la qualité d'image selon la connexion
export function useAdaptiveImageQuality() {
  const networkQuality = useNetworkQuality();

  return {
    quality: networkQuality === 'slow' ? 60 : 80,
    shouldLoadHighRes: networkQuality !== 'slow',
  };
}
