/**
 * Hook pour vérifier les entitlements (droits d'accès) d'un utilisateur
 * 
 * Utilise la configuration des offres pour déterminer ce à quoi l'utilisateur a accès
 * selon sa licence actuelle.
 */

import { useMemo } from 'react';
import { useSession } from './useSession';
import {
  hasModuleAccess,
  profileLicenseToSystemLicense,
  type OfferId,
  type OfferConfig,
  getAllOffers,
  OFFERS,
} from '../config/offers';
import type { TrainingModule } from '../types/training';
import { isSuperAdmin } from '../lib/auth';

export interface UserEntitlements {
  /** Licence système de l'utilisateur */
  systemLicense: 'starter' | 'pro' | 'elite' | 'none';
  /** Licence profile de l'utilisateur */
  profileLicense: 'entree' | 'transformation' | 'immersion' | 'none';
  /** Offre correspondante */
  offer: OfferConfig | null;
  /** Vérifie si l'utilisateur a accès à un module */
  hasModuleAccess: (module: TrainingModule) => boolean;
  /** Vérifie si l'utilisateur a accès à une feature */
  hasFeatureAccess: (feature: keyof OfferConfig['includedFeatures']) => boolean;
  /** Liste des modules auxquels l'utilisateur a accès */
  accessibleModules: (modules: TrainingModule[]) => TrainingModule[];
}

/**
 * Hook pour obtenir les entitlements de l'utilisateur actuel
 */
export function useEntitlements(): UserEntitlements {
  const { profile } = useSession();
  
  const entitlements = useMemo(() => {
    // Check Super Admin
    if (isSuperAdmin(profile)) {
      return {
        systemLicense: 'elite' as const,
        profileLicense: 'immersion' as const,
        offer: OFFERS.immersion_elite,
        hasModuleAccess: (_module: TrainingModule) => true,
        hasFeatureAccess: (_feature: keyof OfferConfig['includedFeatures']) => true,
        accessibleModules: (modules: TrainingModule[]) => modules,
      };
    }

    const profileLicense = (profile?.license as 'entree' | 'transformation' | 'immersion' | 'none') || 'none';
    const systemLicense = profileLicenseToSystemLicense(profileLicense);
    
    // Trouver l'offre correspondante
    const offer = getAllOffers().find(o => {
      if (profileLicense === 'entree') return o.offerId === 'entree';
      if (profileLicense === 'transformation') return o.offerId === 'transformation';
      if (profileLicense === 'immersion') return o.offerId === 'immersion_elite';
      return false;
    }) || null;
    
    // Fonction pour vérifier l'accès à un module
    const checkModuleAccess = (module: TrainingModule): boolean => {
      const moduleLicense = module.required_license || 'starter';
      return hasModuleAccess(profileLicense, moduleLicense);
    };
    
    // Fonction pour vérifier l'accès à une feature
    const checkFeatureAccess = (feature: keyof OfferConfig['includedFeatures']): boolean => {
      if (!offer) return false;
      return offer.includedFeatures[feature] || false;
    };
    
    // Fonction pour filtrer les modules accessibles
    const getAccessibleModules = (modules: TrainingModule[]): TrainingModule[] => {
      return modules.filter(checkModuleAccess);
    };
    
    return {
      systemLicense,
      profileLicense,
      offer,
      hasModuleAccess: checkModuleAccess,
      hasFeatureAccess: checkFeatureAccess,
      accessibleModules: getAccessibleModules,
    };
  }, [profile?.license]);
  
  return entitlements;
}

/**
 * Hook simplifié pour vérifier rapidement si l'utilisateur a une licence
 */
export function useHasLicense(): boolean {
  const { profile } = useSession();
  return profile?.license !== 'none' && profile?.license !== null;
}

/**
 * Hook pour obtenir l'offre actuelle de l'utilisateur
 */
export function useCurrentOffer(): OfferConfig | null {
  const entitlements = useEntitlements();
  return entitlements.offer;
}

