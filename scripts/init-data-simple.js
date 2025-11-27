// Script simple pour initialiser les données gamification
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - À REMPLACER PAR TES VALEURS RÉELLES
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

console.log('🔧 Configuration requise:');
console.log('1. Remplace SUPABASE_URL par ton URL Supabase');
console.log('2. Remplace SUPABASE_ANON_KEY par ta clé anon');
console.log('3. Lance le script: node scripts/init-data-simple.js\n');

if (SUPABASE_URL.includes('your-project-id') || SUPABASE_ANON_KEY.includes('your-anon-key')) {
  console.log('❌ Configuration manquante - édite le fichier avec tes vraies credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function initData() {
  console.log('🚀 Initialisation des données...\n');

  try {
    // Items boutique
    console.log('📦 Items boutique...');
    const storeItems = [
      {
        name: 'Freeze Pass',
        description: 'Protège ton streak pendant 7 jours',
        type: 'consumable',
        cost: 150,
        metadata: { itemId: 'freeze_pass', duration: 7 },
        is_active: true
      },
      {
        name: 'XP Booster 2x',
        description: 'Double tes gains d\'XP pendant 24h',
        type: 'consumable',
        cost: 200,
        metadata: { itemId: 'xp_booster', multiplier: 2, durationMinutes: 1440 },
        is_active: true
      },
      {
        name: 'Thème Aurora',
        description: 'Illumine ton interface avec des tons nordiques',
        type: 'cosmetic',
        cost: 250,
        metadata: { itemId: 'theme_aurora', themeKey: 'aurora' },
        is_active: true
      }
    ];

    for (const item of storeItems) {
      const { error } = await supabase.from('store_items').insert(item);
      if (error) {
        console.log(`❌ ${item.name}: ${error.message}`);
      } else {
        console.log(`✅ ${item.name}`);
      }
    }

    // Quêtes
    console.log('\n🎯 Templates de quêtes...');
    const quests = [
      {
        title: 'Première leçon',
        description: 'Complète ta première leçon',
        type: 'daily',
        target: { metric: 'lessons_completed', value: 1 },
        reward: { xp: 50, coins: 10 },
        is_active: true
      },
      {
        title: 'Leçon du jour',
        description: 'Regarde une leçon aujourd\'hui',
        type: 'daily',
        target: { metric: 'lessons_completed', value: 1 },
        reward: { xp: 25, coins: 5 },
        is_active: true
      }
    ];

    for (const quest of quests) {
      const { error } = await supabase.from('quest_templates').insert(quest);
      if (error) {
        console.log(`❌ ${quest.title}: ${error.message}`);
      } else {
        console.log(`✅ ${quest.title}`);
      }
    }

    console.log('\n🎉 Terminé ! Vérifie dans Supabase Dashboard.');

  } catch (error) {
    console.error('💥 Erreur:', error);
  }
}

initData();
