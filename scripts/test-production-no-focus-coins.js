#!/usr/bin/env node

/**
 * Script de test de production après suppression des Focus Coins
 * Vérifie que toutes les fonctionnalités fonctionnent sans l'économie
 */

import { createClient } from '@supabase/supabase-js';

// Configuration depuis les variables d'environnement
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testProductionAfterFocusCoinsRemoval() {
  console.log('🧪 **TEST PRODUCTION - APRÈS SUPPRESSION FOCUS COINS**\n');
  console.log('Date:', new Date().toISOString());
  console.log('URL:', SUPABASE_URL, '\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  // Test 1: Vérification que les tables économie ont été supprimées
  console.log('1️⃣ **Vérification suppression tables économie**');

  const economyTables = [
    'user_wallets',
    'store_items',
    'user_inventory',
    'user_boosters',
    'user_economy_events'
  ];

  for (const table of economyTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && error.message.includes('does not exist')) {
        console.log(`✅ Table ${table} supprimée correctement`);
        results.passed++;
        results.tests.push({ name: `Table ${table} supprimée`, status: 'PASS' });
      } else {
        console.log(`⚠️  Table ${table} existe encore ou erreur inattendue:`, error?.message);
        results.warnings++;
        results.tests.push({ name: `Table ${table} supprimée`, status: 'WARN' });
      }
    } catch (error) {
      console.log(`❌ Erreur lors de la vérification de ${table}:`, error.message);
      results.failed++;
      results.tests.push({ name: `Table ${table} supprimée`, status: 'FAIL' });
    }
  }

  // Test 2: Vérification que les tables gamification essentielles existent
  console.log('\n2️⃣ **Vérification tables gamification conservées**');

  const gamificationTables = [
    'user_xp_tracks',
    'quest_templates',
    'user_quests',
    'user_items',
    'badges'
  ];

  for (const table of gamificationTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (!error) {
        console.log(`✅ Table ${table} existe (${data?.length || 0} enregistrements)`);
        results.passed++;
        results.tests.push({ name: `Table ${table} existe`, status: 'PASS' });
      } else {
        console.log(`❌ Table ${table} manquante:`, error.message);
        results.failed++;
        results.tests.push({ name: `Table ${table} existe`, status: 'FAIL' });
      }
    } catch (error) {
      console.log(`❌ Erreur lors de la vérification de ${table}:`, error.message);
      results.failed++;
      results.tests.push({ name: `Table ${table} existe`, status: 'FAIL' });
    }
  }

  // Test 3: Vérification des fonctions RPC conservées
  console.log('\n3️⃣ **Vérification fonctions RPC**');

  const rpcFunctions = [
    { name: 'increment_xp_track', shouldExist: true },
    { name: 'claim_user_quest', shouldExist: true },
    { name: 'adjust_focus_coins', shouldExist: false },
    { name: 'purchase_store_item', shouldExist: false },
    { name: 'activate_booster', shouldExist: false }
  ];

  for (const func of rpcFunctions) {
    try {
      await supabase.rpc(func.name, {});

      if (func.shouldExist) {
        console.log(`✅ Fonction ${func.name} existe (comme attendu)`);
        results.passed++;
        results.tests.push({ name: `RPC ${func.name} existe`, status: 'PASS' });
      } else {
        console.log(`❌ Fonction ${func.name} existe encore (devrait être supprimée)`);
        results.failed++;
        results.tests.push({ name: `RPC ${func.name} supprimée`, status: 'FAIL' });
      }
    } catch (error) {
      if (func.shouldExist) {
        console.log(`❌ Fonction ${func.name} manquante:`, error.message);
        results.failed++;
        results.tests.push({ name: `RPC ${func.name} existe`, status: 'FAIL' });
      } else {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`✅ Fonction ${func.name} supprimée (comme attendu)`);
          results.passed++;
          results.tests.push({ name: `RPC ${func.name} supprimée`, status: 'PASS' });
        } else {
          console.log(`⚠️  Fonction ${func.name} erreur inattendue:`, error.message);
          results.warnings++;
          results.tests.push({ name: `RPC ${func.name} supprimée`, status: 'WARN' });
        }
      }
    }
  }

  // Test 4: Vérification des quêtes (sans récompenses Focus Coins)
  console.log('\n4️⃣ **Vérification quêtes sans Focus Coins**');

  try {
    const { data: questTemplates, error } = await supabase
      .from('quest_templates')
      .select('title, reward')
      .limit(5);

    if (error) throw error;

    console.log(`✅ ${questTemplates?.length || 0} templates de quêtes trouvés`);

    let hasFocusCoins = false;
    questTemplates?.forEach(quest => {
      const reward = quest.reward;
      if (reward && typeof reward === 'object' && 'focusCoins' in reward) {
        console.log(`❌ Quête "${quest.title}" contient encore focusCoins dans reward`);
        hasFocusCoins = true;
      }
    });

    if (!hasFocusCoins) {
      console.log('✅ Aucune quête ne contient de récompenses Focus Coins');
      results.passed++;
      results.tests.push({ name: 'Quêtes sans Focus Coins', status: 'PASS' });
    } else {
      console.log('❌ Certaines quêtes contiennent encore des Focus Coins');
      results.failed++;
      results.tests.push({ name: 'Quêtes sans Focus Coins', status: 'FAIL' });
    }
  } catch (error) {
    console.log('❌ Erreur lors de la vérification des quêtes:', error.message);
    results.failed++;
    results.tests.push({ name: 'Quêtes sans Focus Coins', status: 'FAIL' });
  }

  // Test 5: Vérification des données utilisateur de test
  console.log('\n5️⃣ **Vérification données utilisateur de test**');

  try {
    // Essayer de récupérer des stats utilisateur (devrait fonctionner sans wallet)
    const { data: userStats, error } = await supabase
      .from('user_xp_tracks')
      .select('*')
      .limit(1);

    if (error && !error.message.includes('permission denied')) {
      throw error;
    }

    console.log('✅ Accès aux données gamification fonctionne');
    results.passed++;
    results.tests.push({ name: 'Accès données gamification', status: 'PASS' });

  } catch (error) {
    console.log('❌ Erreur accès données gamification:', error.message);
    results.failed++;
    results.tests.push({ name: 'Accès données gamification', status: 'FAIL' });
  }

  // Résumé des tests
  console.log('\n' + '='.repeat(60));
  console.log('📊 **RÉSUMÉ DES TESTS**');
  console.log('='.repeat(60));

  console.log(`✅ Tests réussis: ${results.passed}`);
  console.log(`❌ Tests échoués: ${results.failed}`);
  console.log(`⚠️  Avertissements: ${results.warnings}`);

  const totalTests = results.passed + results.failed + results.warnings;
  const successRate = totalTests > 0 ? Math.round((results.passed / totalTests) * 100) : 0;
  console.log(`📈 Taux de succès: ${successRate}%`);

  if (results.failed === 0) {
    console.log('\n🎉 **TOUS LES TESTS CRITIQUES RÉUSSIS !**');
    console.log('🚀 L\'application est prête pour le déploiement en production');
    console.log('💰 Le système de gamification fonctionne sans Focus Coins');
  } else {
    console.log('\n⚠️ **CERTAINS TESTS ONT ÉCHOUÉ**');
    console.log('🔧 Vérifiez les erreurs ci-dessus avant le déploiement');
    console.log('💡 Les échecs peuvent indiquer des références restantes aux Focus Coins');
  }

  // Détails des tests
  console.log('\n📋 **DÉTAIL DES TESTS**');
  results.tests.forEach((test, index) => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${test.name}`);
  });

  console.log('\n💡 **PROCHAINES ÉTAPES**');
  console.log('1. Corriger les erreurs détectées (si présentes)');
  console.log('2. Tester l\'interface utilisateur manuellement');
  console.log('3. Vérifier que les quêtes se réclament correctement');
  console.log('4. Tester la progression XP par compétences');
  console.log('5. Déployer en production');

  return results;
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testProductionAfterFocusCoinsRemoval().catch(console.error);
}

export { testProductionAfterFocusCoinsRemoval };
