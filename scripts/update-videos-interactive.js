import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import readline from 'readline';

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

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

async function updateVideoId(lessonId, newVideoId) {
  const { error } = await supabase
    .from('training_lessons')
    .update({ bunny_video_id: newVideoId })
    .eq('id', lessonId);

  if (error) throw error;
}

async function main() {
  console.log('🚀 Script interactif de mise à jour des IDs de vidéos\n');
  console.log('='.repeat(70));
  
  // Charger le mapping depuis le fichier JSON s'il existe
  const mappingPath = join(process.cwd(), 'scripts', 'video-mapping.json');
  let savedMapping = {};
  if (existsSync(mappingPath)) {
    try {
      const mappingContent = readFileSync(mappingPath, 'utf-8');
      savedMapping = JSON.parse(mappingContent);
      console.log('✅ Fichier de mapping trouvé\n');
    } catch (error) {
      console.log('⚠️  Impossible de charger le mapping sauvegardé\n');
    }
  }
  
  // Récupérer les leçons avec IDs de test
  console.log('📋 Récupération des leçons avec IDs de test...');
  const lessons = await getLessonsWithTestIds();
  
  if (lessons.length === 0) {
    console.log('✅ Aucune leçon avec ID de test trouvée !\n');
    rl.close();
    return;
  }
  
  console.log(`   Trouvé ${lessons.length} leçon(s)\n`);
  
  // Récupérer les vidéos disponibles
  console.log('📹 Récupération des vidéos depuis Bunny Stream...');
  const videos = await fetchBunnyVideos();
  
  if (videos.length === 0) {
    console.log('❌ Aucune vidéo trouvée\n');
    rl.close();
    return;
  }
  
  console.log(`   Trouvé ${videos.length} vidéo(s)\n`);
  
  // Afficher les vidéos disponibles
  console.log('📹 Vidéos disponibles:\n');
  videos.forEach((video, i) => {
    const videoId = video.guid || video.videoId;
    console.log(`   ${i + 1}. ${video.title || 'Sans titre'}`);
    console.log(`      ID: ${videoId}\n`);
  });
  
  const updates = [];
  
  // Pour chaque leçon, demander quelle vidéo lui correspond
  for (const lesson of lessons) {
    console.log('\n' + '='.repeat(70));
    console.log(`\n📚 Leçon: ${lesson.lesson}`);
    console.log(`   Module: ${lesson.module}`);
    console.log(`   ID actuel: ${lesson.videoId}`);
    
    const answer = await question(`\n   Numéro de la vidéo correspondante (1-${videos.length}) ou 's' pour sauter: `);
    
    if (answer.toLowerCase() === 's' || answer.trim() === '') {
      console.log('   ⏭️  Sautée\n');
      continue;
    }
    
    const videoIndex = parseInt(answer) - 1;
    
    if (videoIndex < 0 || videoIndex >= videos.length) {
      console.log('   ❌ Numéro invalide, sautée\n');
      continue;
    }
    
    const selectedVideo = videos[videoIndex];
    const newVideoId = selectedVideo.guid || selectedVideo.videoId;
    
    updates.push({
      lesson,
      video: selectedVideo,
      newVideoId,
    });
    
    console.log(`   ✅ Sélectionnée: ${selectedVideo.title}`);
    console.log(`   → Nouvel ID: ${newVideoId}\n`);
  }
  
  if (updates.length === 0) {
    console.log('\n⚠️  Aucune mise à jour à effectuer\n');
    rl.close();
    return;
  }
  
  // Afficher le résumé
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 Résumé des mises à jour:\n');
  updates.forEach((update, i) => {
    console.log(`${i + 1}. ${update.lesson.lesson}`);
    console.log(`   ${update.lesson.videoId} → ${update.newVideoId}`);
    console.log(`   (${update.video.title})\n`);
  });
  
  // Demander confirmation
  const confirm = await question('⚠️  Appliquer ces mises à jour ? (o/n): ');
  
  if (confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'oui') {
    console.log('\n❌ Annulé\n');
    rl.close();
    return;
  }
  
  // Appliquer les mises à jour
  console.log('\n🔄 Application des mises à jour...\n');
  
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
  
  rl.close();
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  rl.close();
  process.exit(1);
});

