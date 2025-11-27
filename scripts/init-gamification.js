// Script pour initialiser les données de gamification
// À exécuter après le déploiement des migrations

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (à remplacer par tes vraies credentials)
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function initGamificationData() {
  console.log('🚀 Initialisation des données gamification...');

  try {
    // 1. Ajouter des items à la boutique
    console.log('📦 Ajout des items boutique...');
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
      const { error } = await supabase
        .from('store_items')
        .insert(item);

      if (error) {
        console.error(`❌ Erreur ajout item ${item.name}:`, error);
      } else {
        console.log(`✅ Item ajouté: ${item.name}`);
      }
    }

    // 2. Ajouter des templates de quêtes
    console.log('🎯 Ajout des templates de quêtes...');
    const questTemplates = [
      {
        title: 'Première leçon',
        description: 'Complète ta première leçon de formation',
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
      },
      {
        title: 'Streak actif',
        description: 'Maintiens ton streak actif',
        type: 'daily',
        target: { metric: 'streak_maintained', value: 1 },
        reward: { xp: 30, coins: 8 },
        is_active: true
      }
    ];

    for (const template of questTemplates) {
      const { error } = await supabase
        .from('quest_templates')
        .insert(template);

      if (error) {
        console.error(`❌ Erreur ajout quête ${template.title}:`, error);
      } else {
        console.log(`✅ Quête ajoutée: ${template.title}`);
      }
    }

    console.log('🎉 Initialisation terminée avec succès !');

  } catch (error) {
    console.error('💥 Erreur lors de l\'initialisation:', error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initGamificationData();
}

module.exports = { initGamificationData };
