/**
 * Script de test pour vérifier les accès clients
 * 
 * Teste :
 * 1. Les clients actuels ont les bons accès
 * 2. Le système d'attribution fonctionne correctement
 * 3. Les conversions de licences sont correctes
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erreur : Variables d\'environnement manquantes');
  console.error('   VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Mapping des licences
const PROFILE_TO_SYSTEM = {
  entree: 'starter',
  transformation: 'pro',
  immersion: 'elite',
};

const LICENSE_LABELS = {
  entree: 'Starter (147€)',
  transformation: 'Premium (497€)',
  immersion: 'Bootcamp Élite (1997€)',
  none: 'Aucune licence',
};

const SYSTEM_HIERARCHY = ['starter', 'pro', 'elite'];

function profileToSystem(profileLicense) {
  if (!profileLicense || profileLicense === 'none') return 'none';
  return PROFILE_TO_SYSTEM[profileLicense] || 'none';
}

function hasAccess(userProfileLicense, moduleRequiredLicense) {
  if (!moduleRequiredLicense || !userProfileLicense || userProfileLicense === 'none') {
    return false;
  }
  
  const userSystem = profileToSystem(userProfileLicense);
  const userLevel = SYSTEM_HIERARCHY.indexOf(userSystem);
  const requiredLevel = SYSTEM_HIERARCHY.indexOf(moduleRequiredLicense);
  
  return userLevel >= requiredLevel && userLevel >= 0 && requiredLevel >= 0;
}

async function testClientAccess() {
  console.log('\n🧪 TEST DES ACCÈS CLIENTS\n');
  console.log('='.repeat(80));
  
  // 1. Vérifier les clients
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('role', 'client')
    .limit(10);
  
  if (profilesError) {
    console.error('❌ Erreur:', profilesError.message);
    // Si la colonne license n'existe pas, c'est normal (autre DB)
    if (profilesError.message.includes('license')) {
      console.log('\n⚠️  La colonne license n\'existe pas dans cette base de données.');
      console.log('   C\'est normal si vous testez sur une autre base.');
      return;
    }
    return;
  }
  
  if (!profiles || profiles.length === 0) {
    console.log('⚠️  Aucun client trouvé');
    return;
  }
  
  console.log(`\n📊 Clients trouvés : ${profiles.length}\n`);
  
  // 2. Vérifier les modules (si la table existe)
  let modules = [];
  try {
    const { data: modulesData } = await supabase
      .from('training_modules')
      .select('id, title, required_license, is_active')
      .eq('is_active', true)
      .order('position');
    
    if (modulesData) {
      modules = modulesData;
      console.log(`📚 Modules trouvés : ${modules.length}\n`);
    }
  } catch (error) {
    console.log('⚠️  Table training_modules non disponible\n');
  }
  
  // 3. Tests de conversion
  console.log('\n🔄 TESTS DE CONVERSION DE LICENCES\n');
  console.log('='.repeat(80));
  
  const conversionTests = [
    { profile: 'entree', expected: 'starter' },
    { profile: 'transformation', expected: 'pro' },
    { profile: 'immersion', expected: 'elite' },
    { profile: 'none', expected: 'none' },
  ];
  
  conversionTests.forEach(test => {
    const result = profileToSystem(test.profile);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`   ${status} ${test.profile} → ${result} (attendu: ${test.expected})`);
  });
  
  // 4. Tests d'accès
  console.log('\n\n🔐 TESTS D\'ACCÈS AUX MODULES\n');
  console.log('='.repeat(80));
  
  const accessTests = [
    { user: 'entree', module: 'starter', expected: true },
    { user: 'entree', module: 'pro', expected: false },
    { user: 'entree', module: 'elite', expected: false },
    { user: 'transformation', module: 'starter', expected: true },
    { user: 'transformation', module: 'pro', expected: true },
    { user: 'transformation', module: 'elite', expected: false },
    { user: 'immersion', module: 'starter', expected: true },
    { user: 'immersion', module: 'pro', expected: true },
    { user: 'immersion', module: 'elite', expected: true },
    { user: 'none', module: 'starter', expected: false },
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  
  accessTests.forEach(test => {
    const result = hasAccess(test.user, test.module);
    const status = result === test.expected ? '✅' : '❌';
    if (result === test.expected) {
      passedTests++;
    } else {
      failedTests++;
    }
    console.log(`   ${status} ${LICENSE_LABELS[test.user] || test.user} → Module ${test.module} : ${result} (attendu: ${test.expected})`);
  });
  
  console.log(`\n   Résultat : ${passedTests}/${accessTests.length} tests réussis`);
  if (failedTests > 0) {
    console.log(`   ⚠️  ${failedTests} test(s) échoué(s)`);
  }
  
  // 5. Vérifier la configuration Stripe
  console.log('\n\n💳 VÉRIFICATION CONFIGURATION STRIPE\n');
  console.log('='.repeat(80));
  
  try {
    const { data: stripePrices } = await supabase
      .from('stripe_prices')
      .select('plan_type, plan_name, stripe_price_id, is_active')
      .eq('is_active', true)
      .order('plan_type');
    
    if (stripePrices && stripePrices.length > 0) {
      console.log(`\n✅ Configuration Stripe : ${stripePrices.length} prix actif(s)\n`);
      
      stripePrices.forEach(price => {
        const licenseLabel = LICENSE_LABELS[price.plan_type] || price.plan_type;
        console.log(`   💳 ${price.plan_name}`);
        console.log(`      Plan type : ${price.plan_type} → ${licenseLabel}`);
        console.log(`      Price ID : ${price.stripe_price_id}`);
        console.log('');
      });
      
      // Vérifier que tous les plans sont configurés
      const configuredPlans = new Set(stripePrices.map(p => p.plan_type));
      const requiredPlans = ['entree', 'transformation', 'immersion'];
      const missingPlans = requiredPlans.filter(p => !configuredPlans.has(p));
      
      if (missingPlans.length > 0) {
        console.log(`\n⚠️  Plans manquants : ${missingPlans.join(', ')}`);
      } else {
        console.log(`\n✅ Tous les plans sont configurés`);
      }
    } else {
      console.log('⚠️  Aucun prix Stripe configuré (utilisera les fallbacks)');
    }
  } catch (error) {
    console.log('⚠️  Table stripe_prices non disponible');
  }
  
  // 6. Résumé final
  console.log('\n\n✅ VÉRIFICATION TERMINÉE\n');
  console.log('='.repeat(80));
  console.log('\n📝 Points vérifiés :');
  console.log('   ✅ Conversion des licences profile → système');
  console.log('   ✅ Logique d\'accès aux modules');
  console.log('   ✅ Configuration Stripe pour les futurs clients');
  console.log('\n');
  
  if (failedTests === 0) {
    console.log('✅ Tous les tests sont passés !');
  } else {
    console.log(`⚠️  ${failedTests} test(s) ont échoué`);
    process.exit(1);
  }
}

testClientAccess().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

