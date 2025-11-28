import { QueryClient } from '@tanstack/react-query';

// Détecter si on est sur mobile pour optimiser les queries
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// Configuration optimisée pour mobile
const getQueryConfig = () => ({
  staleTime: isMobile ? 1000 * 60 * 10 : 1000 * 60 * 5, // 10min sur mobile, 5min sur desktop
  gcTime: isMobile ? 1000 * 60 * 60 : 1000 * 60 * 30, // 1h sur mobile, 30min sur desktop
  retry: isMobile ? 0 : 1, // Pas de retry automatique sur mobile pour économiser la data
  refetchOnWindowFocus: !isMobile, // Désactivé sur mobile
  refetchOnReconnect: !isMobile, // Désactivé sur mobile
  networkMode: isMobile ? 'offlineFirst' : 'online', // Mode offline-first sur mobile
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: getQueryConfig(),
    mutations: {
      retry: isMobile ? 0 : 1, // Pas de retry pour les mutations sur mobile
    },
  },
});

// Hook pour adapter dynamiquement la configuration selon le device
export function useAdaptiveQueryConfig() {
  return getQueryConfig();
}

