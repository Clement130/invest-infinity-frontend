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
const libraryId = env.BUNNY_STREAM_LIBRARY_ID || process.env.BUNNY_STREAM_LIBRARY_ID;
const apiKey = env.BUNNY_STREAM_API_KEY || process.env.BUNNY_STREAM_API_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

if (!libraryId || !apiKey) {
  console.error('❌ BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fetchBunnyVideos() {
  try {
    const url = `https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=100&orderBy=date`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des vidéos:', error);
    return [];
  }
}

async function getLessonsByModule() {
  const { data: modules } = await supabase
    .from('training_modules')
    .select('id, title, position')
    .order('position');

  const modulesWithLessons = [];

  for (const module of modules || []) {
    const { data: lessons } = await supabase
      .from('training_lessons')
      .select('id, title, bunny_video_id, position, description')
      .eq('module_id', module.id)
      .order('position');

    modulesWithLessons.push({
      ...module,
      lessons: lessons || [],
    });
  }

  return modulesWithLessons;
}

async function main() {
  console.log('🔍 Vérification des correspondances vidéos/leçons\n');
  console.log('='.repeat(80));
  
  // Récupérer les leçons
  console.log('\n📚 Récupération des leçons...');
  const modules = await getLessonsByModule();
  
  // Récupérer les vidéos
  console.log('📹 Récupération des vidéos depuis Bunny Stream...');
  const videos = await fetchBunnyVideos();
  const videoMap = new Map();
  videos.forEach(v => {
    const videoId = v.guid || v.videoId;
    videoMap.set(videoId, v);
  });
  
  console.log(`\n✅ ${modules.length} module(s) trouvé(s)`);
  console.log(`✅ ${videos.length} vidéo(s) trouvée(s)\n`);
  
  // Afficher toutes les correspondances
  console.log('='.repeat(80));
  console.log('\n📋 CORRESPONDANCES ACTUELLES :\n');
  
  let totalLessons = 0;
  let lessonsWithVideo = 0;
  let lessonsWithoutVideo = 0;
  
  for (const module of modules) {
    console.log(`\n📦 ${module.title} (Position: ${module.position})`);
    console.log('─'.repeat(80));
    
    if (module.lessons.length === 0) {
      console.log('   Aucune leçon');
      continue;
    }
    
    module.lessons.forEach((lesson, index) => {
      totalLessons++;
      const videoId = lesson.bunny_video_id;
      const video = videoId ? videoMap.get(videoId) : null;
      
      console.log(`\n   ${index + 1}. ${lesson.title}`);
      console.log(`      Position: ${lesson.position}`);
      if (lesson.description) {
        console.log(`      Description: ${lesson.description.substring(0, 60)}...`);
      }
      
      if (!videoId || videoId.trim() === '') {
        console.log(`      ❌ Aucune vidéo configurée`);
        lessonsWithoutVideo++;
      } else if (videoId.startsWith('test-')) {
        console.log(`      ⚠️  ID de test: ${videoId}`);
        lessonsWithoutVideo++;
      } else if (video) {
        console.log(`      ✅ Vidéo: ${video.title || 'Sans titre'}`);
        console.log(`         ID: ${videoId}`);
        console.log(`         Durée: ${video.length ? Math.floor(video.length / 60) + ' min' : 'N/A'}`);
        lessonsWithVideo++;
      } else {
        console.log(`      ⚠️  Vidéo non trouvée sur Bunny Stream`);
        console.log(`         ID: ${videoId}`);
        lessonsWithoutVideo++;
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 RÉSUMÉ :\n');
  console.log(`   Total de leçons: ${totalLessons}`);
  console.log(`   ✅ Avec vidéo valide: ${lessonsWithVideo}`);
  console.log(`   ❌ Sans vidéo ou invalide: ${lessonsWithoutVideo}\n`);
  
  // Afficher les vidéos non utilisées
  const usedVideoIds = new Set();
  modules.forEach(m => {
    m.lessons.forEach(l => {
      if (l.bunny_video_id && !l.bunny_video_id.startsWith('test-')) {
        usedVideoIds.add(l.bunny_video_id);
      }
    });
  });
  
  const unusedVideos = videos.filter(v => {
    const videoId = v.guid || v.videoId;
    return !usedVideoIds.has(videoId);
  });
  
  if (unusedVideos.length > 0) {
    console.log('📹 VIDÉOS NON UTILISÉES :\n');
    unusedVideos.forEach((video, i) => {
      const videoId = video.guid || video.videoId;
      console.log(`   ${i + 1}. ${video.title || 'Sans titre'}`);
      console.log(`      ID: ${videoId}`);
      console.log(`      Durée: ${video.length ? Math.floor(video.length / 60) + ' min' : 'N/A'}\n`);
    });
  }
  
  console.log('='.repeat(80));
  console.log('\n💡 Si les correspondances ne sont pas correctes, vous pouvez :');
  console.log('   1. Modifier via /admin/contenu');
  console.log('   2. Utiliser le script scripts/fix-test-video-ids.js avec un mapping personnalisé\n');
}

main().catch(console.error);

