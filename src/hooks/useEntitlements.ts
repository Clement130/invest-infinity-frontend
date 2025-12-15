/**
 * Hook pour vérifier les entitlements (droits d'accès) d'un utilisateur
 * 
 * Utilise la configuration des offres pour déterminer ce à quoi l'utilisateur a accès
 * selon sa licence actuelle.
 * 
 * IMPORTANT: La DB stocke les licences en format profile pour les utilisateurs:
 * - profiles.license: 'none' | 'entree' | 'transformation' | 'immersion'
 * - training_modules.required_license: 'starter' | 'pro' | 'elite'
 * 
 * Mapping: entree → starter, transformation → pro, immersion → elite
 */

import { useMemo } from 'react';
import { useSession } from './useSession';
import {
  hasLicenseAccess,
  type OfferConfig,
  OFFERS,
} from '../config/offers';
import type { TrainingModule } from '../types/training';
import { isSuperAdmin } from '../lib/auth';

export type SystemLicense = 'starter' | 'pro' | 'elite' | 'none';

export interface UserEntitlements {
  /** Licence de l'utilisateur (format système) */
  systemLicense: SystemLicense;
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
 * Normalise la licence du profil vers le format système
 * Supporte les deux formats:
 * - Ancien: 'entree', 'transformation', 'immersion'
 * - Nouveau: 'starter', 'pro', 'elite'
 */
function normalizeToSystemLicense(license: string | null | undefined): SystemLicense {
  if (!license || license === 'none') return 'none';
  
  const mapping: Record<string, SystemLicense> = {
    // Format ancien (stocké dans profiles.license)
    entree: 'starter',
    transformation: 'pro',
    immersion: 'elite',
    // Format système (déjà normalisé)
    starter: 'starter',
    pro: 'pro',
    elite: 'elite',
  };
  
  return mapping[license] || 'none';
}

/**
 * Mapping licence système → offre
 */
function getOfferFromLicense(license: SystemLicense): OfferConfig | null {
  switch (license) {
    case 'starter':
      return OFFERS.entree;
    case 'pro':
      return OFFERS.transformation;
    case 'elite':
      return OFFERS.immersion_elite;
    default:
      return null;
  }
}

/**
 * Hook pour obtenir les entitlements de l'utilisateur actuel
 */
export function useEntitlements(): UserEntitlements {
  const { profile } = useSession();
  
  const entitlements = useMemo(() => {
    // Check Admin/Developer - accès total à tout
    // Tous les admins (admin ou developer) ont accès à tout, pas seulement les super admins
    if (profile?.role === 'admin' || profile?.role === 'developer') {
      return {
        systemLicense: 'elite' as const,
        offer: OFFERS.immersion_elite,
        hasModuleAccess: (_module: TrainingModule) => true,
        hasFeatureAccess: (_feature: keyof OfferConfig['includedFeatures']) => true,
        accessibleModules: (modules: TrainingModule[]) => modules,
      };
    }

    // Normalise la licence (supporte 'entree'/'starter', 'transformation'/'pro', 'immersion'/'elite')
    const systemLicense = normalizeToSystemLicense(profile?.license);
    
    // Trouver l'offre correspondante
    const offer = getOfferFromLicense(systemLicense);
    
    // Fonction pour vérifier l'accès à un module
    // Les modules ont required_license: 'starter' | 'pro' | 'elite'
    const checkModuleAccess = (module: TrainingModule): boolean => {
      // PROBLÈME CORRIGÉ: Ne pas utiliser de fallback 'starter' par défaut
      // Si required_license est null/undefined, refuser l'accès (sécurité)
      const moduleRequiredLicense = module.required_license;
      if (!moduleRequiredLicense || !['starter', 'pro', 'elite'].includes(moduleRequiredLicense)) {
        // Module sans licence requise définie = accès refusé par sécurité
        return false;
      }
      // hasLicenseAccess vérifie si userLicense >= requiredLicense dans la hiérarchie
      return hasLicenseAccess(systemLicense, moduleRequiredLicense);
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
      offer,
      hasModuleAccess: checkModuleAccess,
      hasFeatureAccess: checkFeatureAccess,
      accessibleModules: getAccessibleModules,
    };
  }, [profile?.license, profile?.email, profile?.role]);
  
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

