import { lazy, ComponentType } from 'react';

/**
 * Wrapper autour de React.lazy qui gère les erreurs de chunk manquant
 * après un déploiement (cache stale).
 * 
 * Stratégie:
 * 1. Tenter de charger le module normalement
 * 2. Si erreur de type "Failed to fetch dynamically imported module" -> reload forcé
 * 3. Stocker un flag pour éviter les boucles infinies de reload
 */

const RELOAD_FLAG_KEY = 'chunk_reload_attempted';
const RELOAD_FLAG_EXPIRY = 10000; // 10 secondes

function isChunkLoadError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('failed to fetch dynamically imported module') ||
      message.includes('loading chunk') ||
      message.includes('loading css chunk') ||
      message.includes('failed to load module script') ||
      message.includes("is not a valid javascript mime type")
    );
  }
  return false;
}

function shouldAttemptReload(): boolean {
  const reloadData = sessionStorage.getItem(RELOAD_FLAG_KEY);
  if (!reloadData) return true;
  
  try {
    const { timestamp } = JSON.parse(reloadData);
    // Si le flag a expiré, on peut réessayer
    if (Date.now() - timestamp > RELOAD_FLAG_EXPIRY) {
      sessionStorage.removeItem(RELOAD_FLAG_KEY);
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

function markReloadAttempted(): void {
  sessionStorage.setItem(RELOAD_FLAG_KEY, JSON.stringify({
    timestamp: Date.now()
  }));
}

export function forceHardReload(): void {
  // Forcer un rechargement sans cache
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  
  // Reload avec cache bypass
  window.location.href = window.location.href.split('?')[0] + '?_reload=' + Date.now();
}

export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      if (isChunkLoadError(error) && shouldAttemptReload()) {
        console.warn('[LazyWithRetry] Chunk load error detected, attempting hard reload...');
        markReloadAttempted();
        forceHardReload();
        // Cette ligne ne sera jamais atteinte car on reload
        return new Promise(() => {});
      }
      
      // Si on a déjà tenté un reload ou si c'est une autre erreur, on propage
      throw error;
    }
  });
}

// Export pour utilisation dans ErrorBoundary
export { isChunkLoadError, shouldAttemptReload, markReloadAttempted };

