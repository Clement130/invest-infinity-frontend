import { QueryClient } from '@tanstack/react-query';

// Détecter si on est sur mobile pour optimiser les queries
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// Configuration optimisée - éviter les requêtes dupliquées
const getQueryConfig = () => ({
  staleTime: 1000 * 60 * 10, // 10 minutes - les données sont considérées fraîches
  gcTime: 1000 * 60 * 60, // 1h de cache
  retry: 1, // 1 retry pour éviter les erreurs temporaires
  refetchOnWindowFocus: false, // Désactivé pour éviter les requêtes inutiles
  refetchOnReconnect: false, // Désactivé pour éviter les requêtes au retour
  refetchOnMount: false, // Ne pas refetch si les données sont en cache
  networkMode: 'online' as const,
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

