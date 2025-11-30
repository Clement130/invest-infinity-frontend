/**
 * Configuration des offres et entitlements (droits d'accès)
 * 
 * SOURCE UNIQUE DE VÉRITÉ pour définir :
 * - Les offres disponibles (Entrée, Transformation, Immersion Élite)
 * - Les droits d'accès associés à chaque offre
 * - Le mapping entre les offres et les licences système
 */

export type OfferId = 'entree' | 'transformation' | 'immersion_elite';

/**
 * Mapping entre les offres et les licences système
 * Note: Les modules utilisent 'starter', 'pro', 'elite' dans required_license
 * tandis que les profiles utilisent 'entree', 'transformation', 'immersion'
 */
export const OFFER_TO_LICENSE_MAP: Record<OfferId, 'starter' | 'pro' | 'elite'> = {
  entree: 'starter',
  transformation: 'pro',
  immersion_elite: 'elite',
};

/**
 * Hiérarchie des licences (pour vérifier les accès)
 * Une licence supérieure inclut automatiquement les accès des licences inférieures
 */
export const LICENSE_HIERARCHY: ('starter' | 'pro' | 'elite')[] = ['starter', 'pro', 'elite'];

/**
 * Structure complète d'une offre avec ses entitlements
 */
export interface OfferConfig {
  /** ID interne de l'offre */
  offerId: OfferId;
  /** Nom affiché de l'offre */
  name: string;
  /** Description courte */
  description: string;
  /** Prix en euros */
  price: number;
  /** Type de paiement */
  paymentType: 'one-time' | 'weekly';
  /** Description du paiement */
  paymentDescription: string;
  /** Texte pour paiement en plusieurs fois (optionnel) */
  installmentsText?: string;
  /** ID Stripe Price (optionnel, récupéré depuis la DB) */
  stripePriceId?: string;
  /** Licence système correspondante */
  license: 'starter' | 'pro' | 'elite';
  /** 
   * Modules inclus - Utilise le système required_license des modules
   * Les modules avec required_license <= license sont automatiquement inclus
   * Exemple: license 'pro' inclut tous les modules 'starter' et 'pro'
   * 
   * Note: Si vous avez besoin de modules spécifiques par ID, ajoutez-les ici
   * mais le système de required_license est la méthode principale
   */
  includedModules: string[]; // Réservé pour modules spécifiques si nécessaire
  /** Features incluses */
  includedFeatures: {
    /** Accès à la communauté Discord */
    discord: boolean;
    /** Sessions de trading en direct */
    liveSessions: boolean;
    /** Alertes trading en temps réel */
    alerts: boolean;
    /** Semaine d'immersion présentielle */
    immersionWeek: boolean;
    /** Support par chat */
    support: boolean;
    /** Tutoriels plateformes */
    platformTutorials: boolean;
    /** Zone Premium */
    premiumZone: boolean;
    /** Coaching individuel */
    individualCoaching: boolean;
    /** Replays illimités */
    unlimitedReplays: boolean;
    /** Certificat de complétion */
    certificate: boolean;
    /** Accès VIP Discord */
    vipDiscord: boolean;
  };
  /** Badge à afficher (optionnel) */
  badge?: {
    text: string;
    color: string;
  };
}

/**
 * Configuration complète de toutes les offres
 */
export const OFFERS: Record<OfferId, OfferConfig> = {
  entree: {
    offerId: 'entree',
    name: 'Starter',
    description: 'Les outils essentiels pour commencer',
    price: 147,
    paymentType: 'one-time',
    paymentDescription: 'paiement unique • accès à vie',
    license: 'starter',
    includedModules: [], // À remplir avec les IDs réels des modules
    includedFeatures: {
      discord: true,
      liveSessions: false,
      alerts: true,
      immersionWeek: false,
      support: true,
      platformTutorials: true,
      premiumZone: false,
      individualCoaching: false,
      unlimitedReplays: false,
      certificate: false,
      vipDiscord: false,
    },
  },
  transformation: {
    offerId: 'transformation',
    name: 'Premium',
    description: 'Formation + accompagnement en live',
    price: 497,
    paymentType: 'one-time',
    paymentDescription: 'paiement 3 fois • accès à vie',
    installmentsText: 'ou 3x 166€/mois sans frais',
    license: 'pro',
    includedModules: [], // À remplir avec les IDs réels des modules
    includedFeatures: {
      discord: true,
      liveSessions: true,
      alerts: true,
      immersionWeek: false,
      support: true,
      platformTutorials: true,
      premiumZone: true,
      individualCoaching: true,
      unlimitedReplays: true,
      certificate: false,
      vipDiscord: false,
    },
    badge: {
      text: 'Garantie 14 jours',
      color: 'green',
    },
  },
  immersion_elite: {
    offerId: 'immersion_elite',
    name: 'Bootcamp Élite',
    description: 'Formation présentielle intensive',
    price: 1997,
    paymentType: 'weekly',
    paymentDescription: 'paiement unique • 1 semaine intensive (Lundi au vendredi)',
    installmentsText: 'ou 3x 666€/mois sans frais',
    license: 'elite',
    includedModules: [], // À remplir avec les IDs réels des modules
    includedFeatures: {
      discord: true,
      liveSessions: true,
      alerts: true,
      immersionWeek: true,
      support: true,
      platformTutorials: true,
      premiumZone: true,
      individualCoaching: true,
      unlimitedReplays: true,
      certificate: true,
      vipDiscord: true,
    },
    badge: {
      text: 'Bootcamp Élite',
      color: 'yellow',
    },
  },
};

/**
 * Récupère la configuration d'une offre par son ID
 */
export function getOffer(offerId: OfferId): OfferConfig {
  return OFFERS[offerId];
}

/**
 * Récupère toutes les offres dans l'ordre d'affichage
 */
export function getAllOffers(): OfferConfig[] {
  return [OFFERS.entree, OFFERS.transformation, OFFERS.immersion_elite];
}

/**
 * Vérifie si une licence a accès à une autre licence (hiérarchie)
 * Ex: 'elite' a accès à 'pro' et 'starter'
 */
export function hasLicenseAccess(
  userLicense: 'starter' | 'pro' | 'elite' | 'none',
  requiredLicense: 'starter' | 'pro' | 'elite'
): boolean {
  if (userLicense === 'none') return false;
  
  const userLevel = LICENSE_HIERARCHY.indexOf(userLicense);
  const requiredLevel = LICENSE_HIERARCHY.indexOf(requiredLicense);
  
  return userLevel >= requiredLevel;
}

/**
 * Convertit une licence profile ('entree', 'transformation', 'immersion') 
 * en licence système ('starter', 'pro', 'elite')
 */
export function profileLicenseToSystemLicense(
  profileLicense: 'entree' | 'transformation' | 'immersion' | 'none'
): 'starter' | 'pro' | 'elite' | 'none' {
  const mapping: Record<string, 'starter' | 'pro' | 'elite' | 'none'> = {
    entree: 'starter',
    transformation: 'pro',
    immersion: 'elite',
    none: 'none',
  };
  
  return mapping[profileLicense] || 'none';
}

/**
 * Vérifie si un utilisateur avec une licence profile a accès à un module
 */
export function hasModuleAccess(
  userProfileLicense: 'entree' | 'transformation' | 'immersion' | 'none',
  moduleRequiredLicense: 'starter' | 'pro' | 'elite'
): boolean {
  const systemLicense = profileLicenseToSystemLicense(userProfileLicense);
  return hasLicenseAccess(systemLicense, moduleRequiredLicense);
}

