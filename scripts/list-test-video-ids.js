import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listTestVideoIds() {
  console.log('🔍 Recherche des leçons avec des IDs de test...\n');

  const { data: modules, error: modulesError } = await supabase
    .from('training_modules')
    .select('id, title')
    .order('position');

  if (modulesError) {
    console.error('❌ Erreur:', modulesError);
    return;
  }

  const testVideoLessons = [];

  for (const module of modules || []) {
    const { data: lessons, error: lessonsError } = await supabase
      .from('training_lessons')
      .select('id, title, bunny_video_id, position')
      .eq('module_id', module.id)
      .order('position');

    if (lessonsError) {
      console.error(`❌ Erreur pour le module ${module.title}:`, lessonsError);
      continue;
    }

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

  if (testVideoLessons.length === 0) {
    console.log('✅ Aucune leçon avec ID de test trouvée !\n');
    return;
  }

  console.log(`⚠️  ${testVideoLessons.length} leçon(s) avec ID de test trouvée(s):\n`);
  console.log('='.repeat(70));
  
  testVideoLessons.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.lesson}`);
    console.log(`   Module: ${item.module}`);
    console.log(`   ID Vidéo actuel: ${item.videoId}`);
    console.log(`   Lesson ID: ${item.lessonId}`);
    console.log(`   Position: ${item.position}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 Pour corriger ces leçons:');
  console.log('   1. Allez sur /admin/contenu');
  console.log('   2. Trouvez chaque module et développez-le');
  console.log('   3. Cliquez sur "Modifier" pour chaque leçon avec un ID de test');
  console.log('   4. Remplacez l\'ID de test par le vrai ID de la vidéo Bunny Stream');
  console.log('\n📝 Ou utilisez le script: scripts/update-video-ids.js (à créer si nécessaire)');
}

listTestVideoIds();

