/**
 * Script de diagnostic pour vérifier pourquoi la progression globale ne fonctionne pas
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Erreur: VITE_SUPABASE_URL doit être défini');
  process.exit(1);
}

const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;
if (!supabaseKey) {
  console.error('❌ Erreur: VITE_SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_ANON_KEY doit être défini');
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

async function main() {
  const userId = process.argv[2] || '5e163717-1f09-4911-90ed-2cf71e2cc223';
  
  console.log('🔍 Diagnostic de la progression globale\n');
  console.log(`👤 User ID: ${userId}\n`);

  try {
    // 1. Récupérer les modules actifs
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select('id, title, is_active')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (modulesError) throw modulesError;
    console.log(`📦 Modules actifs: ${modules?.length || 0}`);
    modules?.forEach(m => console.log(`   - ${m.title} (${m.id})`));
    console.log('');

    // 2. Récupérer toutes les leçons
    const { data: allLessons, error: lessonsError } = await supabase
      .from('training_lessons')
      .select('id, title, module_id')
      .order('module_id', { ascending: true })
      .order('position', { ascending: true });

    if (lessonsError) throw lessonsError;
    console.log(`📚 Total de leçons: ${allLessons?.length || 0}`);

    // Grouper par module actif
    const activeModuleIds = new Set(modules?.map(m => m.id) || []);
    const lessonsByModule = new Map();
    allLessons?.forEach(lesson => {
      if (activeModuleIds.has(lesson.module_id)) {
        const list = lessonsByModule.get(lesson.module_id) || [];
        list.push(lesson);
        lessonsByModule.set(lesson.module_id, list);
      }
    });

    console.log(`📚 Leçons dans modules actifs: ${Array.from(lessonsByModule.values()).flat().length}`);
    lessonsByModule.forEach((lessons, moduleId) => {
      const module = modules?.find(m => m.id === moduleId);
      console.log(`   - ${module?.title || moduleId}: ${lessons.length} leçons`);
    });
    console.log('');

    // 3. Récupérer toutes les progressions de l'utilisateur
    const { data: progressEntries, error: progressError } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId);

    if (progressError) throw progressError;
    console.log(`📊 Entrées de progression: ${progressEntries?.length || 0}`);
    
    if (progressEntries && progressEntries.length > 0) {
      console.log('\n📋 Détails des progressions:');
      progressEntries.forEach((entry, i) => {
        const lesson = allLessons?.find(l => l.id === entry.lesson_id);
        const module = modules?.find(m => m.id === lesson?.module_id);
        const isActive = activeModuleIds.has(lesson?.module_id || '');
        console.log(`\n   ${i + 1}. Leçon: ${lesson?.title || entry.lesson_id}`);
        console.log(`      Module: ${module?.title || 'N/A'} (${isActive ? 'ACTIF' : 'INACTIF'})`);
        console.log(`      Complétée (done): ${entry.done ? '✅ OUI' : '❌ NON'}`);
        console.log(`      Dernière vue: ${entry.last_viewed || 'Jamais'}`);
      });
    }
    console.log('');

    // 4. Filtrer les leçons complétées (modules actifs uniquement)
    const completedLessons = progressEntries?.filter(entry => {
      if (!entry.done) return false;
      const lesson = allLessons?.find(l => l.id === entry.lesson_id);
      return lesson && activeModuleIds.has(lesson.module_id);
    }) || [];

    console.log(`✅ Leçons complétées (modules actifs): ${completedLessons.length}`);
    completedLessons.forEach(entry => {
      const lesson = allLessons?.find(l => l.id === entry.lesson_id);
      console.log(`   - ${lesson?.title || entry.lesson_id}`);
    });
    console.log('');

    // 5. Calculer la progression globale
    const totalLessonsInActiveModules = Array.from(lessonsByModule.values()).flat().length;
    const globalProgress = totalLessonsInActiveModules > 0
      ? Math.round((completedLessons.length / totalLessonsInActiveModules) * 100)
      : 0;

    console.log('📈 Calcul de la progression globale:');
    console.log(`   Leçons complétées: ${completedLessons.length}`);
    console.log(`   Total de leçons (modules actifs): ${totalLessonsInActiveModules}`);
    console.log(`   Progression: (${completedLessons.length} / ${totalLessonsInActiveModules}) * 100 = ${globalProgress}%`);
    console.log('');

    // 6. Vérifier les problèmes potentiels
    console.log('🔍 Vérifications:');
    
    const entriesNotDone = progressEntries?.filter(e => !e.done) || [];
    if (entriesNotDone.length > 0) {
      console.log(`   ⚠️  ${entriesNotDone.length} entrée(s) de progression avec done=false`);
      entriesNotDone.forEach(entry => {
        const lesson = allLessons?.find(l => l.id === entry.lesson_id);
        console.log(`      - ${lesson?.title || entry.lesson_id}`);
      });
    }

    const entriesInactiveModules = progressEntries?.filter(entry => {
      const lesson = allLessons?.find(l => l.id === entry.lesson_id);
      return lesson && !activeModuleIds.has(lesson.module_id);
    }) || [];
    if (entriesInactiveModules.length > 0) {
      console.log(`   ⚠️  ${entriesInactiveModules.length} entrée(s) dans des modules inactifs (ignorées)`);
    }

    if (completedLessons.length === 0 && progressEntries && progressEntries.length > 0) {
      console.log(`   ❌ PROBLÈME: ${progressEntries.length} entrée(s) de progression mais aucune complétée !`);
      console.log(`      Vérifiez que les entrées ont bien done=true`);
    }

    console.log('\n✅ Diagnostic terminé');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    process.exit(1);
  }
}

main();

