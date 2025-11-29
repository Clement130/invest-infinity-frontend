/**
 * Script automatique pour configurer Stripe complètement
 * - Crée les produits et prix dans Stripe
 * - Met à jour la table stripe_prices
 * - Vérifie la configuration
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY doit être défini dans .env.local');
  console.error('   Obtenez-la depuis: https://dashboard.stripe.com/apikeys');
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const PRICING_CONFIG = [
  {
    planType: 'entree',
    planName: 'Entrée - Invest Infinity',
    amount: 147.00,
    description: 'Formule Entrée - 147€',
  },
  {
    planType: 'immersion',
    planName: 'Immersion Élite - Invest Infinity',
    amount: 1997.00,
    description: 'Formule Immersion Élite - 1997€',
  },
];

async function createStripeProductAndPrice(config) {
  console.log(`\n📦 Création du produit "${config.planName}" (${config.amount}€)...`);
  
  try {
    // Créer le produit
    const product = await stripe.products.create({
      name: config.planName,
      description: config.description,
    });
    
    console.log(`   ✅ Produit créé: ${product.id}`);
    
    // Créer le prix
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(config.amount * 100), // Stripe utilise les centimes
      currency: 'eur',
      metadata: {
        plan_type: config.planType,
      },
    });
    
    console.log(`   ✅ Prix créé: ${price.id}`);
    
    return {
      productId: product.id,
      priceId: price.id,
    };
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`);
    return null;
  }
}

async function updateStripePricesTable(planType, priceId) {
  console.log(`\n💾 Mise à jour de la table stripe_prices pour ${planType}...`);
  
  try {
    const { data, error } = await supabase
      .from('stripe_prices')
      .update({
        stripe_price_id: priceId,
        updated_at: new Date().toISOString(),
      })
      .eq('plan_type', planType)
      .select();
    
    if (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log(`   ✅ Table mise à jour avec succès`);
      return true;
    } else {
      console.log(`   ⚠️  Aucune ligne trouvée pour plan_type = ${planType}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`);
    return false;
  }
}

async function verifyStripePrices() {
  console.log('\n🔍 Vérification des Price IDs dans la table...\n');
  
  try {
    const { data, error } = await supabase
      .from('stripe_prices')
      .select('*')
      .order('plan_type');
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      return;
    }
    
    console.log('📊 État actuel:');
    console.log('─'.repeat(80));
    
    data.forEach(price => {
      const status = price.stripe_price_id?.includes('PLACEHOLDER')
        ? '⚠️  Placeholder'
        : price.stripe_price_id
        ? '✅ Configuré'
        : '❌ Non configuré';
      
      console.log(`${price.plan_name.padEnd(20)} | ${price.amount_euros || 'N/A'}€ | ${status}`);
      if (price.stripe_price_id) {
        console.log(`  Price ID: ${price.stripe_price_id}`);
      }
    });
    
    console.log('─'.repeat(80));
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

async function main() {
  console.log('🚀 Configuration Automatique Stripe - Invest Infinity');
  console.log('═'.repeat(80));
  console.log('');
  
  // Vérifier l'état actuel
  await verifyStripePrices();
  
  // Créer les produits et prix manquants
  console.log('\n🔧 Création des produits et prix Stripe...');
  console.log('─'.repeat(80));
  
  const results = [];
  
  for (const config of PRICING_CONFIG) {
    // Vérifier si le prix existe déjà dans la table
    const { data: existing } = await supabase
      .from('stripe_prices')
      .select('stripe_price_id')
      .eq('plan_type', config.planType)
      .single();
    
    if (existing?.stripe_price_id && !existing.stripe_price_id.includes('PLACEHOLDER')) {
      console.log(`\n⏭️  ${config.planName} a déjà un Price ID configuré: ${existing.stripe_price_id}`);
      results.push({
        planType: config.planType,
        priceId: existing.stripe_price_id,
        created: false,
      });
      continue;
    }
    
    const result = await createStripeProductAndPrice(config);
    if (result) {
      const updated = await updateStripePricesTable(config.planType, result.priceId);
      results.push({
        planType: config.planType,
        priceId: result.priceId,
        created: updated,
      });
    }
  }
  
  // Résumé final
  console.log('\n\n📊 Résumé de la configuration:');
  console.log('═'.repeat(80));
  
  await verifyStripePrices();
  
  console.log('\n✅ Configuration terminée !');
  console.log('\n⚠️  IMPORTANT: Configurez les variables d\'environnement dans Supabase:');
  console.log('   1. Allez sur: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions');
  console.log('   2. Ajoutez ces secrets:');
  console.log('      - STRIPE_SECRET_KEY=' + stripeSecretKey.substring(0, 20) + '...');
  console.log('      - STRIPE_WEBHOOK_SECRET=whsec_... (à créer dans Stripe Dashboard)');
  console.log('      - SITE_URL=https://www.investinfinity.fr');
  console.log('\n📖 Guide complet: docs/CONFIGURATION-STRIPE.md');
}

main().catch(console.error);

