import { QueryClient } from '@tanstack/react-query';

// Détecter si on est sur mobile pour optimiser les queries
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// Configuration optimisée pour mobile
const getQueryConfig = () => ({
  staleTime: isMobile ? 1000 * 60 * 10 : 1000 * 60 * 5, // 10min sur mobile, 5min sur desktop
  gcTime: isMobile ? 1000 * 60 * 60 : 1000 * 60 * 30, // 1h sur mobile, 30min sur desktop
  retry: 1, // Toujours 1 retry pour éviter les erreurs temporaires
  refetchOnWindowFocus: !isMobile, // Désactivé sur mobile
  refetchOnReconnect: true, // Toujours refetch à la reconnexion
  networkMode: 'online' as const, // Toujours en mode online pour éviter les blocages
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: getQueryConfig(),
    mutations: {
      retry: 1, // 1 retry pour les mutations
    },
  },
});

// Hook pour adapter dynamiquement la configuration selon le device
export function useAdaptiveQueryConfig() {
  return getQueryConfig();
}

