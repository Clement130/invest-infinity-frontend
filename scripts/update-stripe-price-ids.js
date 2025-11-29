/**
 * Script pour mettre à jour les Price IDs Stripe dans la table stripe_prices
 * Usage: node scripts/update-stripe-price-ids.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updatePriceId(planType, planName, currentPriceId) {
  console.log(`\n📝 Mise à jour du Price ID pour ${planName}...`);
  console.log(`   Price ID actuel: ${currentPriceId || 'Non configuré'}`);
  
  const newPriceId = await question(`   Nouveau Price ID (ou Entrée pour ignorer): `);
  
  if (!newPriceId || newPriceId.trim() === '') {
    console.log('   ⏭️  Ignoré\n');
    return;
  }
  
  const priceId = newPriceId.trim();
  
  // Valider le format
  if (!priceId.startsWith('price_')) {
    console.log('   ❌ Le Price ID doit commencer par "price_"\n');
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('stripe_prices')
      .update({ 
        stripe_price_id: priceId,
        updated_at: new Date().toISOString()
      })
      .eq('plan_type', planType)
      .select();
    
    if (error) {
      console.error(`   ❌ Erreur: ${error.message}\n`);
      return;
    }
    
    console.log(`   ✅ Price ID mis à jour: ${priceId}\n`);
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}\n`);
  }
}

async function main() {
  console.log('🔧 Mise à jour des Price IDs Stripe');
  console.log('═'.repeat(80));
  console.log('');
  
  // Récupérer les prix actuels
  const { data: prices, error } = await supabase
    .from('stripe_prices')
    .select('*')
    .order('plan_type');
  
  if (error) {
    console.error('❌ Erreur lors de la récupération des prix:', error.message);
    process.exit(1);
  }
  
  if (!prices || prices.length === 0) {
    console.log('⚠️  Aucun prix trouvé dans la table stripe_prices');
    console.log('   Exécutez d\'abord la migration: supabase/migrations/20250129000000_create_stripe_prices_table.sql\n');
    process.exit(1);
  }
  
  console.log('📊 Prix actuels:');
  console.log('─'.repeat(80));
  prices.forEach(price => {
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
  console.log('');
  
  // Mettre à jour chaque prix
  for (const price of prices) {
    if (price.stripe_price_id?.includes('PLACEHOLDER') || !price.stripe_price_id) {
      await updatePriceId(price.plan_type, price.plan_name, price.stripe_price_id);
    } else {
      console.log(`✅ ${price.plan_name} a déjà un Price ID configuré: ${price.stripe_price_id}`);
      const update = await question(`   Voulez-vous le mettre à jour ? (o/N): `);
      if (update.toLowerCase() === 'o' || update.toLowerCase() === 'oui') {
        await updatePriceId(price.plan_type, price.plan_name, price.stripe_price_id);
      }
    }
  }
  
  // Afficher le résumé final
  console.log('\n📊 Résumé final:');
  console.log('─'.repeat(80));
  
  const { data: finalPrices } = await supabase
    .from('stripe_prices')
    .select('*')
    .order('plan_type');
  
  finalPrices?.forEach(price => {
    const status = price.stripe_price_id?.includes('PLACEHOLDER') 
      ? '⚠️  Placeholder - À remplacer'
      : price.stripe_price_id 
      ? '✅ Configuré'
      : '❌ Non configuré';
    console.log(`${price.plan_name.padEnd(20)} | ${price.stripe_price_id || 'Non configuré'} | ${status}`);
  });
  
  console.log('─'.repeat(80));
  console.log('');
  
  rl.close();
}

main().catch(console.error);

