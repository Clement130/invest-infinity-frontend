/**
 * Utilitaires pour la gestion des abonnements/licences
 * 
 * SOURCE UNIQUE DE VÉRITÉ pour :
 * - La pondération des abonnements (pour le tri)
 * - Les labels d'affichage
 * - Les couleurs associées
 * - Les fonctions de comparaison et tri
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Types de licence stockés en base de données (profils)
 */
export type ProfileLicenseType = 'none' | 'entree' | 'transformation' | 'immersion';

/**
 * Types de licence système (modules)
 */
export type SystemLicenseType = 'none' | 'starter' | 'pro' | 'elite';

/**
 * Union de tous les types de licence possibles (pour la rétrocompatibilité)
 */
export type AnyLicenseType = ProfileLicenseType | SystemLicenseType;

// =============================================================================
// MAPPING ET PONDÉRATION
// =============================================================================

/**
 * Pondération des abonnements pour le tri métier
 * 
 * Hiérarchie :
 * - Elite (3) : Bootcamp Élite, immersion
 * - Pro (2) : Premium, transformation, pro
 * - Starter (1) : Entrée, starter, entree
 * - Aucun (0) : none, null, undefined, vide
 * 
 * Le tri ascendant donne : Aucun → Starter → Pro → Elite
 * Le tri descendant donne : Elite → Pro → Starter → Aucun
 */
export const SUBSCRIPTION_WEIGHT: Record<string, number> = {
  // Elite / Immersion (niveau 3)
  elite: 3,
  immersion: 3,
  'Elite': 3,
  'Bootcamp Élite': 3,
  
  // Pro / Transformation (niveau 2)
  pro: 2,
  transformation: 2,
  'Pro': 2,
  'Premium': 2,
  
  // Starter / Entrée (niveau 1)
  starter: 1,
  entree: 1,
  'Starter': 1,
  'Entrée': 1,
  
  // Aucun (niveau 0)
  none: 0,
  'Aucun': 0,
  '': 0,
};

/**
 * Labels d'affichage pour chaque type de licence
 */
export const SUBSCRIPTION_LABELS: Record<string, string> = {
  // Licences système
  elite: 'Elite',
  pro: 'Pro',
  starter: 'Starter',
  none: 'Aucun',
  
  // Licences profile
  immersion: 'Elite',
  transformation: 'Pro',
  entree: 'Starter',
};

/**
 * Couleurs CSS pour l'affichage des badges
 */
export const SUBSCRIPTION_COLORS: Record<string, string> = {
  elite: 'bg-amber-500/20 text-amber-400',
  immersion: 'bg-amber-500/20 text-amber-400',
  pro: 'bg-purple-500/20 text-purple-400',
  transformation: 'bg-purple-500/20 text-purple-400',
  starter: 'bg-blue-500/20 text-blue-400',
  entree: 'bg-blue-500/20 text-blue-400',
  none: 'bg-gray-500/20 text-gray-400',
};

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Obtient la pondération d'un abonnement pour le tri métier
 * 
 * @param value - Valeur de la licence (peut être null, undefined ou string)
 * @returns La pondération (0 à 3)
 * 
 * @example
 * getSubscriptionWeight('elite') // 3
 * getSubscriptionWeight('transformation') // 2
 * getSubscriptionWeight(null) // 0
 */
export function getSubscriptionWeight(value: string | null | undefined): number {
  if (!value) return 0;
  return SUBSCRIPTION_WEIGHT[value] ?? 0;
}

/**
 * Obtient le label d'affichage d'un abonnement
 * 
 * @param value - Valeur de la licence
 * @returns Le label formaté pour l'affichage
 */
export function getSubscriptionLabel(value: string | null | undefined): string {
  if (!value) return 'Aucun';
  return SUBSCRIPTION_LABELS[value] ?? 'Aucun';
}

/**
 * Obtient les classes CSS de couleur pour un abonnement
 * 
 * @param value - Valeur de la licence
 * @returns Les classes CSS pour le badge
 */
export function getSubscriptionColor(value: string | null | undefined): string {
  if (!value) return SUBSCRIPTION_COLORS.none;
  return SUBSCRIPTION_COLORS[value] ?? SUBSCRIPTION_COLORS.none;
}

/**
 * Vérifie si un abonnement est de niveau Elite
 * 
 * @param value - Valeur de la licence
 * @returns true si Elite ou Immersion
 */
export function isEliteLicense(value: string | null | undefined): boolean {
  return getSubscriptionWeight(value) === 3;
}

/**
 * Compare deux abonnements pour le tri
 * 
 * @param a - Premier abonnement
 * @param b - Deuxième abonnement
 * @param direction - Direction du tri ('asc' ou 'desc')
 * @returns Valeur de comparaison pour Array.sort()
 * 
 * @example
 * // Tri ascendant (Aucun → Elite)
 * array.sort((a, b) => compareSubscriptions(a.license, b.license, 'asc'))
 * 
 * // Tri descendant (Elite → Aucun)
 * array.sort((a, b) => compareSubscriptions(a.license, b.license, 'desc'))
 */
export function compareSubscriptions(
  a: string | null | undefined,
  b: string | null | undefined,
  direction: 'asc' | 'desc' = 'asc'
): number {
  const weightA = getSubscriptionWeight(a);
  const weightB = getSubscriptionWeight(b);
  
  if (direction === 'asc') {
    return weightA - weightB;
  }
  return weightB - weightA;
}

/**
 * Convertit une licence profile en licence système
 * 
 * Mapping :
 * - entree → starter
 * - transformation → pro
 * - immersion → elite
 * - none → none
 */
export function profileToSystemLicense(
  profileLicense: ProfileLicenseType | string | null | undefined
): SystemLicenseType {
  const mapping: Record<string, SystemLicenseType> = {
    entree: 'starter',
    transformation: 'pro',
    immersion: 'elite',
    none: 'none',
    // Cas où la licence est déjà au format système
    starter: 'starter',
    pro: 'pro',
    elite: 'elite',
  };
  
  if (!profileLicense) return 'none';
  return mapping[profileLicense] || 'none';
}

/**
 * Vérifie si une licence utilisateur a accès à un niveau requis
 * 
 * Hiérarchie : elite > pro > starter
 * Elite a accès à tout, Pro a accès à Pro et Starter, Starter n'a accès qu'à Starter
 * 
 * @param userLicense - Licence de l'utilisateur
 * @param requiredLicense - Licence requise
 * @returns true si l'utilisateur a accès
 */
export function hasLicenseAccess(
  userLicense: string | null | undefined,
  requiredLicense: string | null | undefined
): boolean {
  const userWeight = getSubscriptionWeight(userLicense);
  const requiredWeight = getSubscriptionWeight(requiredLicense);
  
  // Si aucune licence requise, accès autorisé
  if (requiredWeight === 0) return true;
  
  // Si l'utilisateur n'a pas de licence, pas d'accès
  if (userWeight === 0) return false;
  
  // L'utilisateur a accès si son niveau >= niveau requis
  return userWeight >= requiredWeight;
}

/**
 * Compte le nombre de modules accessibles pour une licence donnée
 * 
 * @param modules - Liste des modules avec leur required_license
 * @param userLicense - Licence de l'utilisateur
 * @returns Nombre de modules accessibles
 */
export function countAccessibleModules<T extends { required_license?: string | null }>(
  modules: T[],
  userLicense: string | null | undefined
): number {
  if (!userLicense || getSubscriptionWeight(userLicense) === 0) {
    return 0;
  }
  
  return modules.filter(module => 
    hasLicenseAccess(userLicense, module.required_license)
  ).length;
}
