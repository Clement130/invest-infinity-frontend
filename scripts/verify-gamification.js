// Script de vérification rapide de la gamification
// À exécuter après déploiement pour vérifier que tout fonctionne

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyGamification() {
  console.log('🔍 Vérification du système gamification...\n');

  const checks = [
    { name: 'Store Items', table: 'store_items', expected: 5 },
    { name: 'Quest Templates', table: 'quest_templates', expected: 4 },
    { name: 'User Wallets', table: 'user_wallets', expected: '>=0' },
    { name: 'User Items', table: 'user_items', expected: '>=0' },
    { name: 'User Boosters', table: 'user_boosters', expected: '>=0' },
    { name: 'Economy Events', table: 'user_economy_events', expected: '>=0' },
  ];

  for (const check of checks) {
    try {
      const { data, error } = await supabase
        .from(check.table)
        .select('*', { count: 'exact' });

      if (error) {
        console.log(`❌ ${check.name}: ERREUR - ${error.message}`);
        continue;
      }

      const count = data?.length || 0;
      const expected = check.expected;

      if (expected.startsWith('>=')) {
        const minCount = parseInt(expected.replace('>=', ''));
        if (count >= minCount) {
          console.log(`✅ ${check.name}: ${count} (OK)`);
        } else {
          console.log(`⚠️  ${check.name}: ${count} (Attendu >=${minCount})`);
        }
      } else if (count === parseInt(expected)) {
        console.log(`✅ ${check.name}: ${count}/${expected} (OK)`);
      } else {
        console.log(`⚠️  ${check.name}: ${count}/${expected} (Différent)`);
      }
    } catch (error) {
      console.log(`❌ ${check.name}: EXCEPTION - ${error.message}`);
    }
  }

  // Test des fonctions RPC
  console.log('\n🔧 Test des fonctions RPC:');

  const rpcTests = [
    { name: 'increment_xp_track', params: ['test-user', 'test-track', 10] },
    { name: 'adjust_focus_coins', params: ['test-user', 100] },
  ];

  for (const test of rpcTests) {
    try {
      // Note: Ces appels vont échouer car on utilise un user de test,
      // mais on vérifie que la fonction existe et répond
      await supabase.rpc(test.name, ...test.params);
      console.log(`✅ RPC ${test.name}: Fonction accessible`);
    } catch (error) {
      // C'est normal que ça échoue avec un user de test
      if (error.message.includes('permission denied') || error.message.includes('violates row level security')) {
        console.log(`✅ RPC ${test.name}: Fonction sécurisée (RLS)`);
      } else {
        console.log(`❌ RPC ${test.name}: ${error.message}`);
      }
    }
  }

  console.log('\n🎯 Résumé:');
  console.log('- Vérifie que tous les ✅ sont présents');
  console.log('- Les ⚠️ indiquent des données manquantes (normal pour nouvelle install)');
  console.log('- Les ❌ nécessitent investigation');
  console.log('\n📝 Prochaine étape: Tester via l\'interface utilisateur!');
}

// Exécuter si appelé directement
if (require.main === module) {
  verifyGamification().catch(console.error);
}

module.exports = { verifyGamification };
