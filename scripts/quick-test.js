// Test rapide de la gamification
import { createClient } from '@supabase/supabase-js';

// ⚠️ REMPLACE CES VALEURS PAR TES CRÉDENTIALS SUPABASE
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

console.log('🔧 Pour exécuter ce test:');
console.log('1. Édite ce fichier avec tes vraies credentials Supabase');
console.log('2. Lance: node scripts/quick-test.js\n');

if (SUPABASE_URL.includes('YOUR_') || SUPABASE_ANON_KEY.includes('YOUR_')) {
  console.log('❌ Credentials non configurés');
  console.log('💡 Récupère-les dans Supabase Dashboard > Settings > API');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function quickTest() {
  console.log('🧪 TEST RAPIDE GAMIFICATION\n');

  try {
    // Test items boutique
    console.log('📦 Vérification items boutique...');
    const { data: items, error: itemsError } = await supabase
      .from('store_items')
      .select('name, cost')
      .limit(10);

    if (itemsError) {
      console.log('❌ Erreur items:', itemsError.message);
    } else {
      console.log(`✅ ${items.length} items trouvés:`);
      items.forEach(item => console.log(`   - ${item.name} (${item.cost} coins)`));
    }

    // Test quêtes
    console.log('\n🎯 Vérification quêtes...');
    const { data: quests, error: questsError } = await supabase
      .from('quest_templates')
      .select('title, reward')
      .limit(10);

    if (questsError) {
      console.log('❌ Erreur quêtes:', questsError.message);
    } else {
      console.log(`✅ ${quests.length} templates de quêtes:`);
      quests.forEach(quest => console.log(`   - ${quest.title}`));
    }

    // Test fonctions RPC (basique)
    console.log('\n🔧 Test fonctions RPC...');
    try {
      await supabase.rpc('increment_xp_track', {
        p_user_id: 'test-user',
        p_track_name: 'test',
        p_xp_amount: 1
      });
      console.log('✅ increment_xp_track: accessible');
    } catch (error) {
      if (error.message.includes('permission denied')) {
        console.log('✅ increment_xp_track: sécurisé');
      } else {
        console.log('⚠️ increment_xp_track: peut nécessiter auth');
      }
    }

    console.log('\n🎉 Tests terminés !');
    console.log('📋 Si tout est ✅, la gamification est prête !');

  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

quickTest();
