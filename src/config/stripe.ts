/**
 * Configuration Stripe
 * 
 * Price IDs Stripe pour les différents plans
 * À mettre à jour avec vos vrais Price IDs depuis Stripe Dashboard
 */

export const STRIPE_PRICE_IDS = {
  essentiel: 'price_1SVKI9KaUb6KDbNFbj44oi6m', // Formation Essentiel - 47€
  premium: 'price_1SVKd4KaUb6KDbNFdjwiTGIl', // Formation Premium - 197€
} as const;

/**
 * URL de l'Edge Function Supabase pour créer une session Checkout
 */
export const SUPABASE_CHECKOUT_FUNCTION_URL = 
  'https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/create-checkout-session';

/**
 * URL de redirection après succès du paiement
 * {CHECKOUT_SESSION_ID} sera remplacé par Stripe avec l'ID réel de la session
 */
export const getStripeSuccessUrl = () => `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`;

/**
 * URL de redirection en cas d'annulation
 */
export const getStripeCancelUrl = () => `${window.location.origin}/pricing`;

