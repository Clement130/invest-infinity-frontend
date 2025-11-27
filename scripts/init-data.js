// Script pour initialiser les données gamification via l'API Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement depuis le projet
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes. Vérifie .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initGamificationData() {
  console.log('🚀 Initialisation des données gamification...\n');

  try {
    // 1. Items boutique
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
        name: 'XP Booster 3x',
        description: 'Triple tes gains d\'XP pendant 12h',
        type: 'consumable',
        cost: 300,
        metadata: { itemId: 'xp_booster', multiplier: 3, durationMinutes: 720 },
        is_active: true
      },
      {
        name: 'Thème Aurora',
        description: 'Illumine ton interface avec des tons nordiques',
        type: 'cosmetic',
        cost: 250,
        metadata: { itemId: 'theme_aurora', themeKey: 'aurora' },
        is_active: true
      },
      {
        name: 'Thème Eclipse',
        description: 'Interface sombre élégante',
        type: 'cosmetic',
        cost: 250,
        metadata: { itemId: 'theme_eclipse', themeKey: 'eclipse' },
        is_active: true
      }
    ];

    for (const item of storeItems) {
      const { error } = await supabase
        .from('store_items')
        .insert(item);

      if (error) {
        console.error(`❌ Erreur item ${item.name}:`, error.message);
      } else {
        console.log(`✅ Item ajouté: ${item.name}`);
      }
    }

    // 2. Templates de quêtes
    console.log('\n🎯 Ajout des templates de quêtes...');
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
        title: 'Module complet',
        description: 'Termine un module entier',
        type: 'daily',
        target: { metric: 'modules_completed', value: 1 },
        reward: { xp: 200, coins: 50 },
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
        console.error(`❌ Erreur quête ${template.title}:`, error.message);
      } else {
        console.log(`✅ Quête ajoutée: ${template.title}`);
      }
    }

    // 3. Vérification finale
    console.log('\n🔍 Vérification des données insérées...');

    const { data: storeData, error: storeError } = await supabase
      .from('store_items')
      .select('name', { count: 'exact' });

    const { data: questData, error: questError } = await supabase
      .from('quest_templates')
      .select('title', { count: 'exact' });

    if (!storeError && !questError) {
      console.log(`✅ ${storeData.length}/5 items boutique`);
      console.log(`✅ ${questData.length}/4 templates de quêtes`);
    }

    console.log('\n🎉 Initialisation terminée avec succès !');
    console.log('🚀 Prêt pour les tests utilisateur !');

  } catch (error) {
    console.error('💥 Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  initGamificationData();
}
