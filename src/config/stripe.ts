/**
 * Configuration Stripe
 * 
 * Price IDs Stripe pour les différents plans
 */

export const STRIPE_PRICE_IDS = {
  starter: 'price_1SXfwzKaUb6KDbNF81uubunw', // Starter - 97€
  pro: 'price_1SXfxaKaUb6KDbNFRgl7y7I5', // Pro - 347€
  elite: 'price_1SXfyUKaUb6KDbNFYjpa57JP', // Elite - 497€
} as const;

export type PlanType = keyof typeof STRIPE_PRICE_IDS;

/**
 * URL de l'Edge Function Supabase pour créer une session Checkout
 */
export const SUPABASE_CHECKOUT_FUNCTION_URL = 
  'https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/checkout-public';

/**
 * URL de redirection après succès du paiement
 * {CHECKOUT_SESSION_ID} sera remplacé par Stripe avec l'ID réel de la session
 */
export const getStripeSuccessUrl = () => `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`;

/**
 * URL de redirection en cas d'annulation
 */
export const getStripeCancelUrl = () => `${window.location.origin}/pricing`;
