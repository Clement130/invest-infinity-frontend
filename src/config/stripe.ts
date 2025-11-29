/**
 * Configuration Stripe
 * 
 * Price IDs Stripe pour les différents plans
 * Les Price IDs sont maintenant récupérés depuis la base de données Supabase
 * via la table stripe_prices pour une gestion dynamique
 */

// Valeurs par défaut (fallback si la DB n'est pas accessible)
export const STRIPE_PRICE_IDS_DEFAULT = {
  entree: 'price_ENTREE_PLACEHOLDER', // Entrée - 147€ - À REMPLACER par le vrai Price ID Stripe
  transformation: 'price_1SXfxaKaUb6KDbNFRgl7y7I5', // Transformation - 497€
  immersion: 'price_IMMERSION_PLACEHOLDER', // Immersion Élite - 1997€ - À REMPLACER par le vrai Price ID Stripe
} as const;

// Cache pour les Price IDs (mis à jour au chargement de l'app)
let STRIPE_PRICE_IDS_CACHE: Record<string, string> | null = null;

/**
 * Initialise le cache des Price IDs depuis la base de données
 */
export async function initStripePriceIds(): Promise<void> {
  try {
    const { getStripePrices } = await import('../services/stripePriceService');
    STRIPE_PRICE_IDS_CACHE = await getStripePrices();
  } catch (error) {
    console.error('Error initializing Stripe price IDs:', error);
    STRIPE_PRICE_IDS_CACHE = { ...STRIPE_PRICE_IDS_DEFAULT };
  }
}

/**
 * Récupère les Price IDs (depuis le cache ou les valeurs par défaut)
 */
export function getStripePriceIds(): typeof STRIPE_PRICE_IDS_DEFAULT {
  return (STRIPE_PRICE_IDS_CACHE as typeof STRIPE_PRICE_IDS_DEFAULT) || STRIPE_PRICE_IDS_DEFAULT;
}

// Export pour compatibilité avec le code existant
export const STRIPE_PRICE_IDS = new Proxy(STRIPE_PRICE_IDS_DEFAULT, {
  get(target, prop) {
    if (STRIPE_PRICE_IDS_CACHE && prop in STRIPE_PRICE_IDS_CACHE) {
      return STRIPE_PRICE_IDS_CACHE[prop as keyof typeof STRIPE_PRICE_IDS_CACHE];
    }
    return target[prop as keyof typeof target];
  }
});

export type PlanType = keyof typeof STRIPE_PRICE_IDS_DEFAULT;

/**
 * URL de l'Edge Function Supabase pour créer une session Checkout
 * Utilise la variable d'environnement VITE_SUPABASE_URL pour éviter les URLs hardcodées
 */
export const getCheckoutFunctionUrl = () => 
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkout-public`;

/**
 * URL de redirection après succès du paiement
 * {CHECKOUT_SESSION_ID} sera remplacé par Stripe avec l'ID réel de la session
 */
export const getStripeSuccessUrl = () => `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`;

/**
 * URL de redirection en cas d'annulation
 */
export const getStripeCancelUrl = () => `${window.location.origin}/pricing`;
