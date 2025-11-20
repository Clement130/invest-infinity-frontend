import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          envVars[key.trim()] = value;
        }
      }
    });
    
    return envVars;
  } catch (error) {
    return process.env;
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Mapping basé sur les titres des leçons
// Modifiez ce mapping selon vos besoins
const LESSON_TO_VIDEO_MAPPING = {
  // Etape 1 - La Fondation
  'Analyse Technique de Base': null, // À déterminer - aucune vidéo correspondante évidente
  
  // Etape 2 - Les Bases en ICT
  'Scalping et Trading Intraday': null, // À déterminer
  'Swing Trading et Analyse Fondamentale': null, // À déterminer
  
  // Etape 3 - La Stratégie ICT Mickael
  'Introduction au Trading Algorithmique': null, // À déterminer
  'Création et Backtesting de Stratégies': null, // À déterminer
};

async function updateVideoId(lessonId, newVideoId) {
  const { error } = await supabase
    .from('training_lessons')
    .update({ bunny_video_id: newVideoId })
    .eq('id', lessonId);

  if (error) throw error;
}

async function getLessonsWithTestIds() {
  const { data: modules } = await supabase
    .from('training_modules')
    .select('id, title')
    .order('position');

  const testVideoLessons = [];

  for (const module of modules || []) {
    const { data: lessons } = await supabase
      .from('training_lessons')
      .select('id, title, bunny_video_id, position')
      .eq('module_id', module.id)
      .order('position');

    lessons?.forEach((lesson) => {
      if (lesson.bunny_video_id && lesson.bunny_video_id.startsWith('test-')) {
        testVideoLessons.push({
          module: module.title,
          moduleId: module.id,
          lesson: lesson.title,
          lessonId: lesson.id,
          videoId: lesson.bunny_video_id,
          position: lesson.position,
        });
      }
    });
  }

  return testVideoLessons;
}

async function main() {
  console.log('🚀 Script de correction des IDs de vidéos de test\n');
  console.log('='.repeat(70));
  
  // Récupérer les leçons avec IDs de test
  console.log('\n📋 Récupération des leçons avec IDs de test...');
  const lessons = await getLessonsWithTestIds();
  
  if (lessons.length === 0) {
    console.log('✅ Aucune leçon avec ID de test trouvée !\n');
    return;
  }
  
  console.log(`   Trouvé ${lessons.length} leçon(s)\n`);
  
  // Afficher les leçons et demander les IDs
  console.log('📝 Leçons nécessitant une mise à jour:\n');
  lessons.forEach((lesson, i) => {
    console.log(`${i + 1}. ${lesson.lesson}`);
    console.log(`   Module: ${lesson.module}`);
    console.log(`   ID actuel: ${lesson.videoId}`);
    console.log(`   Lesson ID: ${lesson.lessonId}`);
    
    const mappedVideoId = LESSON_TO_VIDEO_MAPPING[lesson.lesson];
    if (mappedVideoId) {
      console.log(`   ✅ ID configuré: ${mappedVideoId}\n`);
    } else {
      console.log(`   ⚠️  Aucun ID configuré dans LESSON_TO_VIDEO_MAPPING\n`);
    }
  });
  
  // Filtrer les leçons avec un mapping configuré
  const updates = lessons
    .filter(lesson => LESSON_TO_VIDEO_MAPPING[lesson.lesson] !== null)
    .map(lesson => ({
      lesson,
      newVideoId: LESSON_TO_VIDEO_MAPPING[lesson.lesson],
    }));
  
  if (updates.length === 0) {
    console.log('\n⚠️  Aucune mise à jour configurée dans LESSON_TO_VIDEO_MAPPING');
    console.log('\n💡 Pour utiliser ce script:');
    console.log('   1. Modifiez scripts/fix-test-video-ids.js');
    console.log('   2. Ajoutez les correspondances dans LESSON_TO_VIDEO_MAPPING');
    console.log('   3. Relancez le script\n');
    return;
  }
  
  // Afficher le résumé
  console.log('\n📋 Mises à jour à effectuer:\n');
  updates.forEach((update, i) => {
    console.log(`${i + 1}. ${update.lesson.lesson}`);
    console.log(`   ${update.lesson.videoId} → ${update.newVideoId}\n`);
  });
  
  // Appliquer les mises à jour
  console.log('🔄 Application des mises à jour...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const update of updates) {
    try {
      await updateVideoId(update.lesson.lessonId, update.newVideoId);
      console.log(`✅ ${update.lesson.lesson} → ${update.newVideoId}`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${update.lesson.lesson}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ ${successCount} mise(s) à jour réussie(s)`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} erreur(s)`);
  }
  console.log('\n✨ Terminé !\n');
}

main().catch(console.error);

