import { supabase } from '../lib/supabaseClient';

export interface StripePrice {
  plan_name: string;
  plan_type: 'entree' | 'transformation' | 'immersion';
  stripe_price_id: string;
  amount_cents: number;
  currency: string;
  is_active: boolean;
  description: string | null;
}

/**
 * Récupère tous les Price IDs Stripe depuis la base de données
 */
export async function getStripePrices(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('stripe_prices')
      .select('plan_type, stripe_price_id, is_active')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching Stripe prices:', error);
      // Fallback vers les valeurs hardcodées en cas d'erreur
      return {
        entree: 'price_1SYkswKaUb6KDbNFvH1x4v0V',
        transformation: 'price_1SYloMKaUb6KDbNFAF6XfNvI',
        immersion: 'price_1SYkswKaUb6KDbNFvwoV35RW',
      };
    }

    const prices: Record<string, string> = {};
    data?.forEach((price) => {
      prices[price.plan_type] = price.stripe_price_id;
    });

    return prices;
  } catch (error) {
    console.error('Error in getStripePrices:', error);
    // Fallback vers les valeurs hardcodées
    return {
      entree: 'price_1SYkswKaUb6KDbNFvH1x4v0V',
      transformation: 'price_1SYloMKaUb6KDbNFAF6XfNvI',
      immersion: 'price_1SYkswKaUb6KDbNFvwoV35RW',
    };
  }
}

/**
 * Récupère un Price ID spécifique par type de plan
 */
export async function getStripePriceId(planType: 'entree' | 'transformation' | 'immersion'): Promise<string | null> {
  try {
    // Utiliser limit(1) au lieu de maybeSingle() pour éviter l'erreur 406
    const { data, error } = await supabase
      .from('stripe_prices')
      .select('stripe_price_id')
      .eq('plan_type', planType)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.error('Error fetching Stripe price:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn('No Stripe price found for plan type:', planType, 'data:', data);
      return null;
    }

    const priceId = data[0]?.stripe_price_id;
    if (!priceId || priceId === null || priceId === 'null') {
      console.warn('Stripe price_id is null or invalid for plan type:', planType, 'data:', data);
      return null;
    }

    console.log('✅ Price ID récupéré avec succès:', priceId, 'pour plan:', planType);
    return priceId;
  } catch (error) {
    console.error('Error in getStripePriceId:', error);
    return null;
  }
}

/**
 * Récupère tous les détails des prix (pour l'admin)
 */
export async function getAllStripePrices(): Promise<StripePrice[]> {
  try {
    const { data, error } = await supabase
      .from('stripe_prices')
      .select('*')
      .order('plan_type');

    if (error) {
      console.error('Error fetching all Stripe prices:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllStripePrices:', error);
    return [];
  }
}

