import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement depuis .env.local
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

if (!supabaseUrl) {
  console.error('❌ Erreur : VITE_SUPABASE_URL n\'est pas défini');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('❌ Erreur : VITE_SUPABASE_SERVICE_ROLE_KEY n\'est pas défini');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyData() {
  console.log('🔍 Vérification des données dans Supabase...\n');

  try {
    // Vérifier les modules
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select('id, title, description, position, is_active')
      .order('position');

    if (modulesError) {
      console.error('❌ Erreur lors de la récupération des modules:', modulesError.message);
      process.exit(1);
    }

    console.log(`📦 Modules trouvés : ${modules?.length || 0}\n`);
    
    if (!modules || modules.length === 0) {
      console.log('⚠️  Aucun module trouvé. Le seed n\'a peut-être pas été exécuté.');
      process.exit(1);
    }

    // Afficher les modules
    modules.forEach((module, index) => {
      console.log(`${index + 1}. ${module.title}`);
      console.log(`   Position: ${module.position} | Actif: ${module.is_active ? '✅' : '❌'}`);
      if (module.description) {
        const shortDesc = module.description.length > 80 
          ? module.description.substring(0, 80) + '...' 
          : module.description;
        console.log(`   Description: ${shortDesc}`);
      }
      console.log('');
    });

    // Vérifier les leçons
    const { data: lessons, error: lessonsError } = await supabase
      .from('training_lessons')
      .select('id, title, module_id, bunny_video_id, position, is_preview')
      .order('position');

    if (lessonsError) {
      console.error('❌ Erreur lors de la récupération des leçons:', lessonsError.message);
      process.exit(1);
    }

    console.log(`📚 Leçons trouvées : ${lessons?.length || 0}\n`);

    if (!lessons || lessons.length === 0) {
      console.log('⚠️  Aucune leçon trouvée. Le seed n\'a peut-être pas été exécuté.');
      process.exit(1);
    }

    // Grouper les leçons par module
    const lessonsByModule = {};
    lessons.forEach(lesson => {
      if (!lessonsByModule[lesson.module_id]) {
        lessonsByModule[lesson.module_id] = [];
      }
      lessonsByModule[lesson.module_id].push(lesson);
    });

    // Afficher les leçons par module
    modules.forEach((module, moduleIndex) => {
      const moduleLessons = lessonsByModule[module.id] || [];
      console.log(`Module "${module.title}" (${moduleLessons.length} leçon(s)):`);
      
      moduleLessons
        .sort((a, b) => a.position - b.position)
        .forEach((lesson, lessonIndex) => {
          console.log(`   ${lessonIndex + 1}. ${lesson.title}`);
          console.log(`      Position: ${lesson.position} | Preview: ${lesson.is_preview ? '✅' : '❌'} | Video ID: ${lesson.bunny_video_id || 'N/A'}`);
        });
      console.log('');
    });

    // Vérification des données attendues
    const expectedModules = [
      'Les Bases du Trading',
      'Stratégies Avancées',
      'Trading Algorithmique'
    ];

    const expectedLessonsCount = 6;
    const foundModules = modules.map(m => m.title);
    const missingModules = expectedModules.filter(m => !foundModules.includes(m));

    console.log('📊 Résumé de la vérification:');
    console.log(`   ✅ Modules attendus: ${expectedModules.length}`);
    console.log(`   ✅ Modules trouvés: ${modules.length}`);
    console.log(`   ✅ Leçons attendues: ${expectedLessonsCount}`);
    console.log(`   ✅ Leçons trouvées: ${lessons.length}`);

    if (missingModules.length > 0) {
      console.log(`   ⚠️  Modules manquants: ${missingModules.join(', ')}`);
    }

    if (lessons.length !== expectedLessonsCount) {
      console.log(`   ⚠️  Nombre de leçons incorrect (attendu: ${expectedLessonsCount}, trouvé: ${lessons.length})`);
    }

    // Vérifier les IDs Bunny Stream
    const expectedVideoIds = [
      '9295490a-0072-4752-996d-6f573306318b',
      'test-video-2',
      'test-video-3',
      'test-video-4',
      'test-video-5',
      'test-video-6',
    ];
    const foundVideoIds = lessons.map(l => l.bunny_video_id).filter(Boolean);
    const missingVideoIds = expectedVideoIds.filter(id => !foundVideoIds.includes(id));

    if (missingVideoIds.length > 0) {
      console.log(`   ⚠️  IDs Bunny Stream manquants: ${missingVideoIds.join(', ')}`);
    } else {
      console.log(`   ✅ Tous les IDs Bunny Stream sont présents`);
    }

    console.log('\n✅ Vérification terminée !');

    if (modules.length === expectedModules.length && lessons.length === expectedLessonsCount && missingModules.length === 0) {
      console.log('🎉 Toutes les données sont présentes et correctes !');
      process.exit(0);
    } else {
      console.log('⚠️  Certaines données sont manquantes ou incorrectes.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  }
}

verifyData();

