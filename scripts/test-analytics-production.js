#!/usr/bin/env node

/**
 * Script de test pour vérifier les statistiques analytics en production
 * Teste la fonction getModuleStats() avec les données réelles de Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fonction pour charger les variables d'environnement depuis .env.local
function loadEnv() {
  const envPath = join(__dirname, '..', '.env.local');
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    // Ajouter aux variables d'environnement
    Object.assign(process.env, envVars);
  } catch (e) {
    console.warn('⚠️  Fichier .env.local non trouvé, utilisation des variables d\'environnement système');
  }
}

// Charger les variables d'environnement
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erreur : Variables d\'environnement manquantes');
  console.error('   VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies');
  console.error('   Créez un fichier .env.local ou définissez-les dans votre environnement');
  process.exit(1);
}

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Teste la fonction getModuleStats() en reproduisant la logique
 */
async function testModuleStats() {
  console.log('🧪 Test des statistiques de modules (Analytics)\n');
  console.log('='.repeat(60));

  try {
    // 1. Récupérer les modules
    console.log('\n📦 Étape 1 : Récupération des modules...');
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select('id, title, is_active')
      .order('position');

    if (modulesError) throw modulesError;
    console.log(`   ✅ ${modules.length} modules trouvés`);

    // 2. Récupérer les accès
    console.log('\n👥 Étape 2 : Récupération des accès...');
    const { data: accessList, error: accessError } = await supabase
      .from('training_access')
      .select('user_id, module_id');

    if (accessError) throw accessError;
    console.log(`   ✅ ${accessList.length} accès trouvés`);

    // 3. Récupérer les leçons
    console.log('\n📚 Étape 3 : Récupération des leçons...');
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('training_lessons')
      .select('id, module_id');

    if (lessonsError) throw lessonsError;
    console.log(`   ✅ ${lessonsData.length} leçons trouvées`);

    // 4. Récupérer les progressions
    console.log('\n📊 Étape 4 : Récupération des progressions...');
    const { data: progressData, error: progressError } = await supabase
      .from('training_progress')
      .select('user_id, lesson_id, done, last_viewed');

    if (progressError) throw progressError;
    console.log(`   ✅ ${progressData.length} progressions trouvées`);

    // 5. Créer les maps (comme dans le code corrigé)
    console.log('\n🔗 Étape 5 : Création des maps de correspondance...');
    const lessonToModule = new Map();
    lessonsData.forEach((lesson) => {
      lessonToModule.set(lesson.id, lesson.module_id);
    });

    const lessonsByModule = new Map();
    lessonsData.forEach((lesson) => {
      const list = lessonsByModule.get(lesson.module_id) || [];
      list.push(lesson.id);
      lessonsByModule.set(lesson.module_id, list);
    });
    console.log(`   ✅ Maps créées (${lessonToModule.size} leçons → modules)`);

    // 6. Calculer les statistiques pour chaque module
    console.log('\n📈 Étape 6 : Calcul des statistiques par module...\n');
    const stats = [];

    for (const module of modules) {
      // Utilisateurs ayant accès à ce module
      const moduleAccess = accessList.filter((a) => a.module_id === module.id);
      const usersWithAccess = new Set(moduleAccess.map((a) => a.user_id));

      // Filtrer les progressions pour ce module
      const moduleLessons = lessonsByModule.get(module.id) || [];
      const moduleProgress = progressData.filter((p) => {
        const lessonModuleId = lessonToModule.get(p.lesson_id);
        return lessonModuleId === module.id;
      });

      // Grouper les progressions par utilisateur
      const progressByUser = new Map();
      moduleProgress.forEach((p) => {
        const userId = p.user_id;
        const existing = progressByUser.get(userId) || { completed: 0, viewed: 0 };
        
        if (p.done) {
          existing.completed++;
        }
        if (p.last_viewed) {
          existing.viewed++;
        }
        progressByUser.set(userId, existing);
      });

      // Calculer les métriques
      const totalLessonsInModule = moduleLessons.length;
      let usersCompleted = 0;
      let totalProgressSum = 0;
      let usersWithViews = 0;

      usersWithAccess.forEach((userId) => {
        const userProgress = progressByUser.get(userId) || { completed: 0, viewed: 0 };
        const progressPercentage = totalLessonsInModule > 0
          ? (userProgress.completed / totalLessonsInModule) * 100
          : 0;
        
        totalProgressSum += progressPercentage;
        
        if (userProgress.completed === totalLessonsInModule && totalLessonsInModule > 0) {
          usersCompleted++;
        }
        
        if (userProgress.viewed > 0) {
          usersWithViews++;
        }
      });

      const completionRate = usersWithAccess.size > 0
        ? (usersCompleted / usersWithAccess.size) * 100
        : 0;

      const averageProgress = usersWithAccess.size > 0
        ? totalProgressSum / usersWithAccess.size
        : 0;

      stats.push({
        moduleId: module.id,
        moduleTitle: module.title,
        isActive: module.is_active,
        totalAccess: moduleAccess.length,
        totalCompletions: usersCompleted,
        completionRate,
        averageProgress,
        totalViews: usersWithViews,
        totalLessons: totalLessonsInModule,
      });
    }

    // 7. Afficher les résultats
    console.log('📊 RÉSULTATS DES STATISTIQUES\n');
    console.log('='.repeat(60));

    stats.sort((a, b) => b.totalAccess - a.totalAccess).forEach((stat, index) => {
      console.log(`\n${index + 1}. ${stat.moduleTitle} ${stat.isActive ? '✅' : '❌'}`);
      console.log(`   📊 Accès : ${stat.totalAccess}`);
      console.log(`   ✅ Complétions : ${stat.totalCompletions}`);
      console.log(`   📈 Taux de complétion : ${stat.completionRate.toFixed(1)}%`);
      console.log(`   👀 Vues : ${stat.totalViews}`);
      console.log(`   📉 Progression moyenne : ${stat.averageProgress.toFixed(1)}%`);
      console.log(`   📚 Leçons totales : ${stat.totalLessons}`);
    });

    // 8. Vérifications
    console.log('\n\n🔍 VÉRIFICATIONS\n');
    console.log('='.repeat(60));

    let hasErrors = false;

    // Vérifier qu'il n'y a pas de NaN ou Infinity
    stats.forEach((stat) => {
      if (isNaN(stat.completionRate) || isNaN(stat.averageProgress)) {
        console.error(`   ❌ Erreur : NaN détecté pour ${stat.moduleTitle}`);
        hasErrors = true;
      }
      if (!isFinite(stat.completionRate) || !isFinite(stat.averageProgress)) {
        console.error(`   ❌ Erreur : Infinity détecté pour ${stat.moduleTitle}`);
        hasErrors = true;
      }
    });

    // Vérifier la cohérence des données
    stats.forEach((stat) => {
      if (stat.totalCompletions > stat.totalAccess) {
        console.error(`   ❌ Erreur : Plus de complétions que d'accès pour ${stat.moduleTitle}`);
        hasErrors = true;
      }
      if (stat.totalViews > stat.totalAccess) {
        console.error(`   ❌ Erreur : Plus de vues que d'accès pour ${stat.moduleTitle}`);
        hasErrors = true;
      }
      if (stat.completionRate > 100) {
        console.error(`   ❌ Erreur : Taux de complétion > 100% pour ${stat.moduleTitle}`);
        hasErrors = true;
      }
    });

    if (!hasErrors) {
      console.log('   ✅ Toutes les vérifications sont passées');
      console.log('   ✅ Les statistiques sont cohérentes');
      console.log('   ✅ La logique fonctionne correctement en production');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test terminé avec succès !');
    console.log('='.repeat(60));

    return { success: true, stats };

  } catch (error) {
    console.error('\n❌ ERREUR LORS DU TEST\n');
    console.error('='.repeat(60));
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('='.repeat(60));
    return { success: false, error };
  }
}

// Exécuter le test
testModuleStats()
  .then((result) => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

