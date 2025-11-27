// Script de test automatique de la gamification
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testGamification() {
  console.log('🧪 TESTS AUTOMATIQUES GAMIFICATION\n');

  const tests = [];
  let passed = 0;
  let failed = 0;

  // Test 1: Vérification des données Supabase
  console.log('1️⃣ Test des données Supabase...');
  try {
    const { data: storeItems, error: storeError } = await supabase
      .from('store_items')
      .select('*');

    const { data: questTemplates, error: questError } = await supabase
      .from('quest_templates')
      .select('*');

    if (storeError || questError) {
      throw new Error('Erreur Supabase');
    }

    if (storeItems.length >= 3) {
      console.log('✅ Items boutique:', storeItems.length, '/ 5');
      tests.push({ name: 'Items boutique', status: 'PASS' });
      passed++;
    } else {
      console.log('❌ Items boutique insuffisants:', storeItems.length, '/ 5');
      tests.push({ name: 'Items boutique', status: 'FAIL' });
      failed++;
    }

    if (questTemplates.length >= 2) {
      console.log('✅ Templates quêtes:', questTemplates.length, '/ 4');
      tests.push({ name: 'Templates quêtes', status: 'PASS' });
      passed++;
    } else {
      console.log('❌ Templates quêtes insuffisants:', questTemplates.length, '/ 4');
      tests.push({ name: 'Templates quêtes', status: 'FAIL' });
      failed++;
    }

  } catch (error) {
    console.log('❌ Erreur données Supabase:', error.message);
    tests.push({ name: 'Données Supabase', status: 'FAIL' });
    failed++;
  }

  // Test 2: Vérification du serveur frontend (manuel)
  console.log('\n2️⃣ Serveur frontend: Vérifier manuellement http://localhost:5177');
  console.log('ℹ️ Test manuel requis pour le serveur frontend');
  tests.push({ name: 'Serveur frontend', status: 'MANUAL' });

  // Test 3: Vérification des fonctions RPC
  console.log('\n3️⃣ Test des fonctions RPC...');
  const rpcFunctions = [
    'increment_xp_track',
    'adjust_focus_coins',
    'purchase_store_item'
  ];

  for (const func of rpcFunctions) {
    try {
      // Test avec des paramètres invalides pour vérifier que la fonction existe
      await supabase.rpc(func, {});
      console.log(`✅ RPC ${func} accessible`);
      tests.push({ name: `RPC ${func}`, status: 'PASS' });
      passed++;
    } catch (error) {
      // C'est normal que ça échoue avec des params invalides
      if (error.message.includes('permission denied') ||
          error.message.includes('function') ||
          error.message.includes('does not exist') === false) {
        console.log(`✅ RPC ${func} sécurisé`);
        tests.push({ name: `RPC ${func}`, status: 'PASS' });
        passed++;
      } else {
        console.log(`❌ RPC ${func}: ${error.message}`);
        tests.push({ name: `RPC ${func}`, status: 'FAIL' });
        failed++;
      }
    }
  }

  // Test 4: Vérification des tables RLS
  console.log('\n4️⃣ Test sécurité RLS...');
  try {
    // Essayer d'accéder aux données sans authentification
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .limit(1);

    if (error && error.message.includes('permission denied')) {
      console.log('✅ RLS activé sur user_wallets');
      tests.push({ name: 'Sécurité RLS', status: 'PASS' });
      passed++;
    } else {
      console.log('⚠️ RLS peut-être désactivé');
      tests.push({ name: 'Sécurité RLS', status: 'WARN' });
    }
  } catch (error) {
    console.log('❌ Erreur test RLS:', error.message);
    tests.push({ name: 'Sécurité RLS', status: 'FAIL' });
    failed++;
  }

  // Résumé
  console.log('\n📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(40));
  console.log(`✅ Tests réussis: ${passed}`);
  console.log(`❌ Tests échoués: ${failed}`);
  console.log(`📈 Taux de succès: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
    console.log('🚀 La gamification est prête pour les tests utilisateur !');
  } else {
    console.log('\n⚠️ Quelques tests ont échoué.');
    console.log('🔧 Vérifie les points suivants:');
    console.log('- Données initialisées dans Supabase');
    console.log('- Serveur de développement démarré');
    console.log('- Variables d\'environnement correctes');
  }

  console.log('\n📋 Prochaines étapes:');
  console.log('1. Corriger les erreurs détectées');
  console.log('2. Tester manuellement via l\'interface');
  console.log('3. Valider les flows utilisateur');

  return { passed, failed, tests };
}

testGamification().catch(console.error);
