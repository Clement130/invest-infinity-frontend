/**
 * Script de test manuel pour le service de progression
 * 
 * Ce script teste le service de progression avec de vraies données Supabase.
 * 
 * Usage:
 *   node scripts/test-progress-service.js [userId]
 * 
 * Si userId n'est pas fourni, le script utilisera le premier utilisateur trouvé.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis .env.local ou .env
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const env = readFileSync(envPath, 'utf-8');
    const vars = {};
    env.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        vars[match[1].trim()] = match[2].trim();
      }
    });
    return vars;
  } catch (error) {
    console.warn('⚠️  Fichier .env.local non trouvé, utilisation des variables d\'environnement système');
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Erreur: VITE_SUPABASE_URL doit être défini');
  console.error('   Créez un fichier .env.local avec cette variable');
  process.exit(1);
}

// Utiliser service_role key si disponible (bypass RLS), sinon anon key
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;
if (!supabaseKey) {
  console.error('❌ Erreur: VITE_SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_ANON_KEY doit être défini');
  console.error('   Créez un fichier .env.local avec une de ces variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: supabaseServiceRoleKey
    ? {
        autoRefreshToken: false,
        persistSession: false,
      }
    : undefined,
});

// Fonctions de suivi de progression (extraites de progressTrackingService.ts)
async function markLessonAsViewed(userId, lessonId) {
  try {
    // Vérifier si une entrée existe déjà
    const { data: existing } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    const now = new Date().toISOString();

    if (existing) {
      // Mettre à jour last_viewed pour actualiser la date d'activité (même si déjà vue)
      const { error } = await supabase
        .from('training_progress')
        .update({
          last_viewed: now,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Créer une nouvelle entrée
      const { error } = await supabase.from('training_progress').insert({
        user_id: userId,
        lesson_id: lessonId,
        done: false,
        last_viewed: now,
      });

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[markLessonAsViewed] Erreur:', error);
    return { success: false, error: error.message };
  }
}

async function markLessonAsCompleted(userId, lessonId) {
  try {
    const now = new Date().toISOString();

    // Vérifier si une entrée existe déjà
    const { data: existing } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (existing) {
      // Mettre à jour
      const { error } = await supabase
        .from('training_progress')
        .update({
          done: true,
          last_viewed: now,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Créer une nouvelle entrée
      const { error } = await supabase.from('training_progress').insert({
        user_id: userId,
        lesson_id: lessonId,
        done: true,
        last_viewed: now,
      });

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[markLessonAsCompleted] Erreur:', error);
    return { success: false, error: error.message };
  }
}

async function getModules() {
  const { data, error } = await supabase
    .from('training_modules')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

async function getUserProgressSummary(userId) {
  if (!userId) {
    return {
      modules: [],
      completedLessonIds: [],
    };
  }

  const [modules, lessonsResponse, progressResponse] = await Promise.all([
    getModules(),
    supabase
      .from('training_lessons')
      .select('*')
      .order('module_id', { ascending: true })
      .order('position', { ascending: true }),
    supabase.from('training_progress').select('*').eq('user_id', userId),
  ]);

  if (lessonsResponse.error) {
    throw lessonsResponse.error;
  }

  if (progressResponse.error) {
    throw progressResponse.error;
  }

  const lessons = lessonsResponse.data || [];
  const progressEntries = progressResponse.data || [];

  const moduleById = new Map();
  modules.forEach((module) => moduleById.set(module.id, module));

  const lessonsById = new Map();
  const lessonsByModule = new Map();
  lessons.forEach((lesson) => {
    lessonsById.set(lesson.id, lesson);
    const list = lessonsByModule.get(lesson.module_id) || [];
    list.push(lesson);
    lessonsByModule.set(lesson.module_id, list);
  });

  const progressByLessonId = new Map();
  progressEntries.forEach((entry) => progressByLessonId.set(entry.lesson_id, entry));

  // Créer un Set des IDs de modules actifs pour filtrer les leçons
  const activeModuleIds = new Set(modules.map(m => m.id));
  
  // Filtrer les leçons complétées pour ne garder que celles des modules actifs
  const completedLessonIds = progressEntries
    .filter((entry) => {
      if (!entry.done) return false;
      const lesson = lessonsById.get(entry.lesson_id);
      return lesson && activeModuleIds.has(lesson.module_id);
    })
    .map((entry) => entry.lesson_id);

  const moduleDetails = modules.map((module) => {
    const moduleLessons = lessonsByModule.get(module.id) || [];
    const totalLessons = moduleLessons.length;

    const completedLessons = moduleLessons.filter((lesson) => progressByLessonId.get(lesson.id)?.done).length;
    const completionRate = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    const moduleProgressTimeline = moduleLessons
      .map((lesson) => ({
        lesson,
        progress: progressByLessonId.get(lesson.id),
      }))
      .filter((item) => item.progress?.last_viewed)
      .sort((a, b) => {
        const aDate = new Date(a.progress.last_viewed || '').getTime();
        const bDate = new Date(b.progress.last_viewed || '').getTime();
        return bDate - aDate;
      });

    const lastActivity = moduleProgressTimeline[0];
    const nextLesson = moduleLessons.find((lesson) => !progressByLessonId.get(lesson.id)?.done);

    return {
      moduleId: module.id,
      moduleTitle: module.title,
      totalLessons,
      completedLessons,
      completionRate,
      lastLessonId: lastActivity?.lesson.id,
      lastLessonTitle: lastActivity?.lesson.title,
      lastViewedAt: lastActivity?.progress?.last_viewed || null,
      nextLessonId: nextLesson?.id,
      nextLessonTitle: nextLesson?.title,
      isCompleted: completionRate === 100,
    };
  });

  const sortedProgress = progressEntries
    .filter((entry) => entry.last_viewed)
    .sort((a, b) => {
      const aDate = new Date(a.last_viewed || '').getTime();
      const bDate = new Date(b.last_viewed || '').getTime();
      return bDate - aDate;
    });

  let continueLearning;

  if (sortedProgress.length > 0) {
    const latestEntry = sortedProgress[0];
    const lesson = lessonsById.get(latestEntry.lesson_id);

    if (lesson) {
      const module = moduleById.get(lesson.module_id);
      const moduleDetail = moduleDetails.find((detail) => detail.moduleId === lesson.module_id);

      if (module && moduleDetail) {
        continueLearning = {
          moduleId: module.id,
          moduleTitle: module.title,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          completionRate: moduleDetail.completionRate,
        };
      }
    }
  }

  if (!continueLearning) {
    const firstModuleToStart = moduleDetails.find((detail) => !detail.isCompleted && detail.nextLessonId);
    if (firstModuleToStart) {
      continueLearning = {
        moduleId: firstModuleToStart.moduleId,
        moduleTitle: firstModuleToStart.moduleTitle,
        lessonId: firstModuleToStart.nextLessonId,
        lessonTitle: firstModuleToStart.nextLessonTitle || 'Commencer le module',
        completionRate: firstModuleToStart.completionRate,
      };
    }
  }

  return {
    modules: moduleDetails,
    completedLessonIds,
    continueLearning,
  };
}

async function testProgressTracking(userId) {
  console.log('🧪 Test du suivi de progression en temps réel\n');

  // 1. Récupérer une leçon existante qui n'est pas encore complétée
  const { data: lessons, error: lessonsError } = await supabase
    .from('training_lessons')
    .select('id, title, module_id')
    .limit(5);

  if (lessonsError || !lessons || lessons.length === 0) {
    console.error('❌ Aucune leçon trouvée');
    return;
  }

  const lesson = lessons[0];
  console.log(`🎥 Test avec la leçon: ${lesson.title} (${lesson.id})\n`);

  // 2. Vérifier l'état initial
  console.log('📊 État initial:');
  const initialProgress = await getUserProgressSummary(userId);
  const initialCompleted = initialProgress.completedLessonIds.includes(lesson.id);
  console.log(`   - Leçon complétée: ${initialCompleted ? '✅ OUI' : '❌ NON'}`);

  // 3. Simuler le marquage comme vue
  console.log('\n👁️  Test: Marquage comme vue...');
  const viewedResult = await markLessonAsViewed(userId, lesson.id);
  console.log(`   - Résultat: ${viewedResult.success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
  if (!viewedResult.success) {
    console.log(`   - Erreur: ${viewedResult.error}`);
  }

  // 4. Vérifier que last_viewed a été mis à jour
  const { data: progressAfterViewed } = await supabase
    .from('training_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lesson.id)
    .maybeSingle();

  if (progressAfterViewed) {
    console.log(`   - last_viewed mis à jour: ${progressAfterViewed.last_viewed ? '✅ OUI' : '❌ NON'}`);
    console.log(`   - done: ${progressAfterViewed.done ? '✅ OUI' : '❌ NON'}`);
  }

  // 5. Simuler la complétion de la leçon
  console.log('\n✅ Test: Marquage comme complétée...');
  const completedResult = await markLessonAsCompleted(userId, lesson.id);
  console.log(`   - Résultat: ${completedResult.success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
  if (!completedResult.success) {
    console.log(`   - Erreur: ${completedResult.error}`);
  }

  // 6. Vérifier l'état final
  console.log('\n📊 État final:');
  const finalProgress = await getUserProgressSummary(userId);
  const finalCompleted = finalProgress.completedLessonIds.includes(lesson.id);
  console.log(`   - Leçon complétée: ${finalCompleted ? '✅ OUI' : '❌ NON'}`);

  // 7. Calculer la nouvelle progression globale
  const totalLessons = finalProgress.modules.reduce((sum, m) => sum + m.totalLessons, 0);
  const globalProgress = totalLessons > 0
    ? Math.round((finalProgress.completedLessonIds.length / totalLessons) * 100)
    : 0;

  console.log(`\n📈 Résultats du test:`);
  console.log(`   - Progression globale: ${globalProgress}%`);
  console.log(`   - Leçons complétées: ${finalProgress.completedLessonIds.length}/${totalLessons}`);

  if (finalCompleted && !initialCompleted) {
    console.log(`\n🎉 Test réussi! La progression s'est mise à jour correctement.`);
  } else if (finalCompleted && initialCompleted) {
    console.log(`\n⚠️  La leçon était déjà complétée. Test partiellement réussi.`);
  } else {
    console.log(`\n❌ Test échoué: La leçon n'a pas été marquée comme complétée.`);
  }
}

async function main() {
  const userId = process.argv[2];

  console.log('🧪 Test complet du système de progression\n');

  try {
    if (!userId) {
      // Récupérer le premier utilisateur
      const { data: profiles, error } = await supabase.from('profiles').select('id, email, full_name').limit(1);

      if (error || !profiles || profiles.length === 0) {
        console.error('❌ Aucun utilisateur trouvé. Créez d\'abord un utilisateur.');
        process.exit(1);
      }

      const user = profiles[0];
      console.log(`📧 Utilisation de l'utilisateur: ${user.email} (${user.full_name || 'Sans nom'})\n`);

      // Test du calcul de progression existant
      console.log('🔍 Test 1: Calcul de progression existant');
      const result = await getUserProgressSummary(user.id);

      console.log('✅ Résultats du test:\n');
      console.log(`📊 Modules: ${result.modules.length}`);
      result.modules.forEach((module) => {
        console.log(`\n  📦 ${module.moduleTitle}`);
        console.log(`     Progression: ${module.completedLessons}/${module.totalLessons} leçons (${module.completionRate}%)`);
        if (module.nextLessonTitle) {
          console.log(`     Prochaine leçon: ${module.nextLessonTitle}`);
        }
        if (module.isCompleted) {
          console.log(`     ✅ Module complété!`);
        }
      });

      if (result.continueLearning) {
        console.log(`\n🔥 Continuer l'apprentissage:`);
        console.log(`   Module: ${result.continueLearning.moduleTitle}`);
        console.log(`   Leçon: ${result.continueLearning.lessonTitle}`);
        console.log(`   Progression du module: ${result.continueLearning.completionRate}%`);
      } else {
        console.log(`\n⚠️  Aucune progression trouvée. L'utilisateur peut commencer n'importe quel module.`);
      }

      const totalLessons = result.modules.reduce((sum, m) => sum + m.totalLessons, 0);
      const globalProgress = totalLessons > 0
        ? Math.round((result.completedLessonIds.length / totalLessons) * 100)
        : 0;

      console.log(`\n✅ Leçons complétées: ${result.completedLessonIds.length}/${totalLessons}`);
      console.log(`📈 Progression globale: ${globalProgress}%`);
      console.log(`\n📋 Détails du calcul:`);
      console.log(`   - Leçons complétées (modules actifs uniquement): ${result.completedLessonIds.length}`);
      console.log(`   - Total de leçons (modules actifs uniquement): ${totalLessons}`);
      console.log(`   - Calcul: (${result.completedLessonIds.length} / ${totalLessons}) * 100 = ${globalProgress}%`);

      // Test du suivi de progression en temps réel
      console.log('\n🔄 Test 2: Suivi de progression en temps réel');
      await testProgressTracking(user.id);
    } else {
      const result = await getUserProgressSummary(userId);
      const totalLessons = result.modules.reduce((sum, m) => sum + m.totalLessons, 0);
      const globalProgress = totalLessons > 0
        ? Math.round((result.completedLessonIds.length / totalLessons) * 100)
        : 0;

      console.log(`📈 Progression globale: ${globalProgress}%`);
      console.log(`📊 Leçons complétées: ${result.completedLessonIds.length}/${totalLessons}`);
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

main();

