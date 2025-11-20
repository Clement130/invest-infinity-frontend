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

async function checkLessons() {
  console.log('🔍 Vérification des leçons et leurs vidéos...\n');

  // Récupérer tous les modules avec leurs leçons
  const { data: modules, error: modulesError } = await supabase
    .from('training_modules')
    .select('id, title')
    .order('position');

  if (modulesError) {
    console.error('❌ Erreur:', modulesError);
    return;
  }

  const lessonsWithoutVideo = [];
  const lessonsWithVideo = [];

  for (const module of modules || []) {
    const { data: lessons, error: lessonsError } = await supabase
      .from('training_lessons')
      .select('id, title, bunny_video_id, description')
      .eq('module_id', module.id)
      .order('position');

    if (lessonsError) {
      console.error(`❌ Erreur pour le module ${module.title}:`, lessonsError);
      continue;
    }

    console.log(`\n📦 Module: ${module.title}`);
    console.log(`   Leçons: ${lessons?.length || 0}\n`);

    lessons?.forEach((lesson, index) => {
      if (!lesson.bunny_video_id || lesson.bunny_video_id.trim() === '') {
        lessonsWithoutVideo.push({
          module: module.title,
          lesson: lesson.title,
          lessonId: lesson.id,
        });
        console.log(`   ❌ ${index + 1}. ${lesson.title}`);
        console.log(`      → Pas d'ID vidéo configuré`);
      } else {
        lessonsWithVideo.push({
          module: module.title,
          lesson: lesson.title,
          videoId: lesson.bunny_video_id,
        });
        console.log(`   ✅ ${index + 1}. ${lesson.title}`);
        console.log(`      → Video ID: ${lesson.bunny_video_id}`);
      }
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Résumé:\n');
  console.log(`✅ Leçons avec vidéo: ${lessonsWithVideo.length}`);
  console.log(`❌ Leçons sans vidéo: ${lessonsWithoutVideo.length}\n`);

  if (lessonsWithoutVideo.length > 0) {
    console.log('⚠️  Leçons nécessitant une configuration vidéo:\n');
    lessonsWithoutVideo.forEach((item, i) => {
      console.log(`${i + 1}. ${item.lesson} (Module: ${item.module})`);
      console.log(`   Lesson ID: ${item.lessonId}\n`);
    });
  }
}

checkLessons();

