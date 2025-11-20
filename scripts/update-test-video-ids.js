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
  console.log('📹 Récupération des vidéos depuis Bunny Stream...\n');
  
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
      const errorText = await response.text();
      console.error(`❌ Erreur API Bunny Stream: ${response.status}`);
      console.error(`   ${errorText}`);
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des vidéos:', error);
    return [];
  }
}

async function getLessonsWithTestIds() {
  const { data: modules, error: modulesError } = await supabase
    .from('training_modules')
    .select('id, title')
    .order('position');

  if (modulesError) {
    console.error('❌ Erreur:', modulesError);
    return [];
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

  return testVideoLessons;
}

async function updateVideoId(lessonId, newVideoId) {
  const { error } = await supabase
    .from('training_lessons')
    .update({ bunny_video_id: newVideoId })
    .eq('id', lessonId);

  if (error) {
    throw error;
  }
}

async function autoMatchVideos(lessons, videos) {
  console.log('\n🔍 Tentative de correspondance automatique...\n');
  
  const updates = [];
  
  for (const lesson of lessons) {
    // Essayer de trouver une correspondance par titre
    const lessonTitleLower = lesson.lesson.toLowerCase();
    
    // Rechercher une vidéo avec un titre similaire
    const matchingVideo = videos.find(video => {
      const videoTitle = (video.title || '').toLowerCase();
      
      // Correspondance exacte ou partielle
      if (videoTitle.includes(lessonTitleLower) || lessonTitleLower.includes(videoTitle)) {
        return true;
      }
      
      // Correspondance par mots-clés
      const lessonKeywords = lessonTitleLower.split(' ');
      const videoKeywords = videoTitle.split(' ');
      const commonKeywords = lessonKeywords.filter(kw => videoKeywords.includes(kw));
      
      return commonKeywords.length >= 2; // Au moins 2 mots en commun
    });
    
    if (matchingVideo) {
      const videoId = matchingVideo.guid || matchingVideo.videoId;
      updates.push({
        lesson,
        video: matchingVideo,
        videoId,
        confidence: 'auto',
      });
    }
  }
  
  return updates;
}

async function main() {
  console.log('🚀 Script de mise à jour des IDs de vidéos de test\n');
  console.log('='.repeat(70));
  
  // 1. Récupérer les leçons avec des IDs de test
  console.log('\n1️⃣  Recherche des leçons avec IDs de test...');
  const lessonsWithTestIds = await getLessonsWithTestIds();
  
  if (lessonsWithTestIds.length === 0) {
    console.log('✅ Aucune leçon avec ID de test trouvée !\n');
    return;
  }
  
  console.log(`   Trouvé ${lessonsWithTestIds.length} leçon(s) avec ID de test\n`);
  
  // 2. Récupérer les vidéos disponibles sur Bunny Stream
  console.log('2️⃣  Récupération des vidéos depuis Bunny Stream...');
  const videos = await fetchBunnyVideos();
  
  if (videos.length === 0) {
    console.log('❌ Aucune vidéo trouvée sur Bunny Stream\n');
    return;
  }
  
  console.log(`   Trouvé ${videos.length} vidéo(s) disponible(s)\n`);
  
  // 3. Afficher les leçons à corriger
  console.log('3️⃣  Leçons nécessitant une mise à jour:\n');
  lessonsWithTestIds.forEach((lesson, i) => {
    console.log(`   ${i + 1}. ${lesson.lesson}`);
    console.log(`      Module: ${lesson.module}`);
    console.log(`      ID actuel: ${lesson.videoId}`);
    console.log(`      Lesson ID: ${lesson.lessonId}\n`);
  });
  
  // 4. Afficher les vidéos disponibles
  console.log('4️⃣  Vidéos disponibles sur Bunny Stream:\n');
  videos.forEach((video, i) => {
    const videoId = video.guid || video.videoId;
    console.log(`   ${i + 1}. ${video.title || 'Sans titre'}`);
    console.log(`      ID: ${videoId}`);
    console.log(`      Durée: ${video.length ? Math.floor(video.length / 60) + ' min' : 'N/A'}`);
    console.log(`      Date: ${video.dateUploaded ? new Date(video.dateUploaded).toLocaleDateString('fr-FR') : 'N/A'}\n`);
  });
  
  // 5. Tentative de correspondance automatique
  const autoMatches = await autoMatchVideos(lessonsWithTestIds, videos);
  
  if (autoMatches.length > 0) {
    console.log('5️⃣  Correspondances automatiques trouvées:\n');
    autoMatches.forEach((match, i) => {
      console.log(`   ${i + 1}. ${match.lesson.lesson}`);
      console.log(`      → ${match.video.title}`);
      console.log(`      → ID: ${match.videoId}\n`);
    });
    
    // Demander confirmation pour les mises à jour automatiques
    console.log('⚠️  Voulez-vous appliquer ces mises à jour automatiques ?');
    console.log('   (Cette fonctionnalité nécessiterait une interface interactive)');
    console.log('   Pour l\'instant, utilisez le mapping manuel ci-dessous.\n');
  }
  
  // 6. Générer un mapping manuel
  console.log('6️⃣  Mapping manuel recommandé:\n');
  console.log('   Pour chaque leçon, trouvez la vidéo correspondante dans la liste ci-dessus');
  console.log('   et utilisez la fonction updateVideoId() avec les bons paramètres.\n');
  
  console.log('📝 Exemple de code pour mettre à jour manuellement:\n');
  console.log('   await updateVideoId(');
  console.log('     "lesson-id-here",');
  console.log('     "bunny-video-guid-here"');
  console.log('   );\n');
  
  // 7. Créer un fichier de mapping pour référence
  const mappingFile = {
    lessons: lessonsWithTestIds.map(l => ({
      lessonId: l.lessonId,
      lessonTitle: l.lesson,
      moduleTitle: l.module,
      currentVideoId: l.videoId,
    })),
    videos: videos.map(v => ({
      videoId: v.guid || v.videoId,
      title: v.title,
      duration: v.length,
      dateUploaded: v.dateUploaded,
    })),
  };
  
  const fs = await import('fs');
  const path = join(process.cwd(), 'scripts', 'video-mapping.json');
  fs.writeFileSync(path, JSON.stringify(mappingFile, null, 2));
  console.log(`✅ Fichier de mapping créé: ${path}\n`);
  console.log('   Vous pouvez utiliser ce fichier pour créer un script de mise à jour personnalisé.\n');
  
  console.log('='.repeat(70));
  console.log('\n💡 Prochaines étapes:');
  console.log('   1. Examinez le fichier video-mapping.json');
  console.log('   2. Créez un script personnalisé avec les correspondances correctes');
  console.log('   3. Ou mettez à jour manuellement via /admin/contenu\n');
}

main().catch(console.error);

