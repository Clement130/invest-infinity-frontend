/**
 * Script pour configurer Stripe dans Supabase
 * - Applique la migration stripe_prices
 * - Vérifie la configuration actuelle
 * - Aide à configurer les variables d'environnement
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkTableExists() {
  console.log('🔍 Vérification de l\'existence de la table stripe_prices...\n');
  
  try {
    const { data, error } = await supabase
      .from('stripe_prices')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Table n'existe pas
      return false;
    }
    
    if (error) {
      console.error('❌ Erreur lors de la vérification:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function applyMigration() {
  console.log('📦 Application de la migration stripe_prices...\n');
  
  try {
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20250129000000_create_stripe_prices_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Exécuter la migration via l'API REST Supabase
    // Note: Supabase ne permet pas d'exécuter du SQL arbitraire via l'API client
    // Il faut utiliser le Dashboard ou l'API REST directement
    
    console.log('⚠️  La migration doit être exécutée via le Dashboard Supabase\n');
    console.log('📋 Instructions:');
    console.log('1. Allez sur: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/sql/new');
    console.log('2. Copiez-collez le contenu de: supabase/migrations/20250129000000_create_stripe_prices_table.sql');
    console.log('3. Cliquez sur "Run"\n');
    
    // Afficher le SQL pour faciliter le copier-coller
    console.log('📝 SQL à exécuter:');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    console.log('');
    
    return false; // Migration non appliquée automatiquement
  } catch (error) {
    console.error('❌ Erreur lors de la lecture de la migration:', error.message);
    return false;
  }
}

async function checkCurrentPrices() {
  console.log('💰 Vérification des Price IDs actuels...\n');
  
  try {
    const { data, error } = await supabase
      .from('stripe_prices')
      .select('*')
      .order('plan_type');
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️  Aucun Price ID configuré dans la table stripe_prices\n');
      return;
    }
    
    console.log('📊 Price IDs configurés:');
    console.log('─'.repeat(80));
    
    data.forEach(price => {
      const status = price.stripe_price_id?.includes('PLACEHOLDER') 
        ? '⚠️  Placeholder - À remplacer'
        : price.stripe_price_id 
        ? '✅ Configuré'
        : '❌ Non configuré';
      
      console.log(`${price.plan_name.padEnd(20)} | ${price.amount_euros}€ | ${status}`);
      if (price.stripe_price_id) {
        console.log(`  Price ID: ${price.stripe_price_id}`);
      }
    });
    
    console.log('─'.repeat(80));
    console.log('');
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

async function checkEnvironmentVariables() {
  console.log('🔐 Vérification des variables d\'environnement...\n');
  
  console.log('⚠️  Les variables d\'environnement Supabase doivent être configurées dans le Dashboard\n');
  console.log('📋 Variables requises:');
  console.log('─'.repeat(80));
  console.log('STRIPE_SECRET_KEY=sk_live_... (ou sk_test_... pour les tests)');
  console.log('STRIPE_WEBHOOK_SECRET=whsec_... (secret du webhook Stripe)');
  console.log('SITE_URL=https://www.investinfinity.fr');
  console.log('─'.repeat(80));
  console.log('');
  console.log('🔗 Configuration:');
  console.log('Dashboard: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions');
  console.log('');
}

async function main() {
  console.log('🔧 Configuration Stripe - Invest Infinity');
  console.log('═'.repeat(80));
  console.log('');
  
  // 1. Vérifier si la table existe
  const tableExists = await checkTableExists();
  
  if (!tableExists) {
    console.log('❌ La table stripe_prices n\'existe pas\n');
    await applyMigration();
    console.log('✅ Après avoir appliqué la migration, relancez ce script pour vérifier la configuration\n');
    return;
  }
  
  console.log('✅ La table stripe_prices existe\n');
  
  // 2. Vérifier les Price IDs
  await checkCurrentPrices();
  
  // 3. Vérifier les variables d'environnement
  await checkEnvironmentVariables();
  
  // 4. Résumé
  console.log('📝 Prochaines étapes:');
  console.log('─'.repeat(80));
  console.log('1. ✅ Migration appliquée (table stripe_prices créée)');
  console.log('2. ⏳ Créer les Price IDs dans Stripe Dashboard pour Entrée (147€) et Immersion Élite (1997€)');
  console.log('3. ⏳ Mettre à jour la table stripe_prices avec les vrais Price IDs');
  console.log('4. ⏳ Configurer les variables d\'environnement dans Supabase Dashboard');
  console.log('5. ⏳ Configurer le webhook Stripe');
  console.log('─'.repeat(80));
  console.log('');
  console.log('📖 Guide complet: docs/CONFIGURATION-STRIPE.md');
  console.log('');
}

main().catch(console.error);

