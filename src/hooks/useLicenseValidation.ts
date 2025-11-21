import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getLicenseStatusWithCalculations,
  validatePayment,
  type LicenseStatusWithCalculations,
} from '../services/licenseService';

export function useLicenseValidation() {
  const queryClient = useQueryClient();

  // Récupérer le statut de la licence
  const {
    data: licenseStatus,
    isLoading,
    error,
    refetch,
  } = useQuery<LicenseStatusWithCalculations | null>({
    queryKey: ['developer-license'],
    queryFn: getLicenseStatusWithCalculations,
    refetchInterval: (data) => {
      // Polling intelligent : vérifier toutes les heures si proche de l'expiration
      if (!data) return false;
      
      const daysRemaining = data.daysRemaining;
      // Si moins de 7 jours restants, vérifier toutes les heures
      if (daysRemaining <= 7) {
        return 60 * 60 * 1000; // 1 heure
      }
      // Sinon, vérifier toutes les 6 heures
      return 6 * 60 * 60 * 1000; // 6 heures
    },
  });

  // Mutation pour valider le paiement
  const validatePaymentMutation = useMutation({
    mutationFn: validatePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer-license'] });
      toast.success('✅ Paiement validé avec succès ! La licence est active pour 30 jours.');
      // Rafraîchir après un court délai pour s'assurer que les données sont à jour
      setTimeout(() => {
        refetch();
      }, 500);
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la validation du paiement:', error);
      toast.error('❌ Erreur lors de la validation du paiement. Veuillez réessayer.');
    },
  });

  const handleValidatePayment = () => {
    validatePaymentMutation.mutate();
  };

  return {
    licenseStatus,
    isLoading,
    error,
    validatePayment: handleValidatePayment,
    isValidating: validatePaymentMutation.isPending,
    refetch,
  };
}

