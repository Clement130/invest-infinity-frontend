import { useEffect, useRef, useCallback } from 'react';

interface UseOptimizedScrollOptions {
  /** Délai minimum entre deux exécutions (en ms) - par défaut 16ms (60fps) */
  throttleMs?: number;
  /** Désactiver complètement sur mobile */
  disableOnMobile?: boolean;
  /** Callback à exécuter au scroll */
  onScroll?: () => void;
  /** Dépendances pour recréer le callback */
  deps?: React.DependencyList;
}

/**
 * Hook optimisé pour écouter les événements de scroll
 * Utilise requestAnimationFrame + throttle pour de meilleures performances
 */
export function useOptimizedScroll({
  throttleMs = 16,
  disableOnMobile = false,
  onScroll,
  deps = [],
}: UseOptimizedScrollOptions) {
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isMobileRef = useRef<boolean>(false);

  // Détecter mobile une seule fois
  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;
  }, []);

  const handleScroll = useCallback(() => {
    if (disableOnMobile && isMobileRef.current) {
      return;
    }

    const now = Date.now();
    const timeSinceLastCall = now - lastTimeRef.current;

    if (timeSinceLastCall >= throttleMs) {
      lastTimeRef.current = now;
      
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        onScroll?.();
        rafIdRef.current = null;
      });
    }
  }, [throttleMs, disableOnMobile, onScroll]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleScroll, ...deps]);
}

