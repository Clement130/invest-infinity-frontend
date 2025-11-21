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

  const completedLessonIds = progressEntries.filter((entry) => entry.done).map((entry) => entry.lesson_id);

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

async function main() {
  const userId = process.argv[2];

  console.log('🧪 Test du service de progression\n');

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

      console.log(`\n✅ Leçons complétées: ${result.completedLessonIds.length}`);
    } else {
      const result = await getUserProgressSummary(userId);
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

main();

