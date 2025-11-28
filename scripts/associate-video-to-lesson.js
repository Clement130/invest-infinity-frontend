/**
 * Script pour associer une vidéo à une leçon spécifique
 * Usage: node scripts/associate-video-to-lesson.js <lesson-id> <video-id>
 *   ou: node scripts/associate-video-to-lesson.js (mode interactif)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vveswlmcgmizmjsriezw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY n\'est pas configurée');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function associateVideo(lessonId, videoId) {
  console.log(`\n🔄 Association de la vidéo "${videoId}" à la leçon "${lessonId}"...`);

  const { data, error } = await supabase
    .from('training_lessons')
    .update({ bunny_video_id: videoId })
    .eq('id', lessonId)
    .select()
    .single();

  if (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    return false;
  }

  console.log('✅ Vidéo associée avec succès!');
  console.log(`   Leçon: ${data.title}`);
  console.log(`   Vidéo ID: ${data.bunny_video_id}`);
  return true;
}

async function findLessonByIdOrTitle(identifier) {
  // Essayer de trouver par ID d'abord
  let { data: lesson, error } = await supabase
    .from('training_lessons')
    .select(`
      id,
      title,
      bunny_video_id,
      position,
      training_modules!inner (
        id,
        title
      )
    `)
    .eq('id', identifier)
    .maybeSingle();

  if (lesson) {
    return lesson;
  }

  // Si pas trouvé par ID, chercher par titre
  const { data: lessons, error: searchError } = await supabase
    .from('training_lessons')
    .select(`
      id,
      title,
      bunny_video_id,
      position,
      training_modules!inner (
        id,
        title
      )
    `)
    .ilike('title', `%${identifier}%`)
    .limit(10);

  if (searchError) {
    console.error('❌ Erreur lors de la recherche:', searchError);
    return null;
  }

  if (lessons.length === 0) {
    return null;
  }

  if (lessons.length === 1) {
    return lessons[0];
  }

  // Plusieurs résultats trouvés
  return lessons;
}

async function main() {
  const lessonIdArg = process.argv[2];
  const videoIdArg = process.argv[3];

  // Mode avec arguments
  if (lessonIdArg && videoIdArg) {
    const success = await associateVideo(lessonIdArg, videoIdArg);
    rl.close();
    process.exit(success ? 0 : 1);
    return;
  }

  // Mode interactif
  console.log('🎬 Association de vidéo à une leçon\n');

  // Si seulement lessonId fourni, afficher les infos
  if (lessonIdArg) {
    const lesson = await findLessonByIdOrTitle(lessonIdArg);
    
    if (!lesson) {
      console.error(`❌ Aucune leçon trouvée pour "${lessonIdArg}"`);
      rl.close();
      process.exit(1);
      return;
    }

    if (Array.isArray(lesson)) {
      console.log(`\n⚠️  Plusieurs leçons trouvées pour "${lessonIdArg}":\n`);
      lesson.forEach((l, i) => {
        console.log(`${i + 1}. [${l.training_modules.title}] ${l.title}`);
        console.log(`   ID: ${l.id}`);
        console.log(`   Vidéo actuelle: ${l.bunny_video_id || 'Aucune'}\n`);
      });
      rl.close();
      return;
    }

    console.log(`\n📋 Leçon trouvée:`);
    console.log(`   Titre: ${lesson.title}`);
    console.log(`   Module: ${lesson.training_modules.title}`);
    console.log(`   ID: ${lesson.id}`);
    console.log(`   Vidéo actuelle: ${lesson.bunny_video_id || 'Aucune'}\n`);

    const videoId = await question('Entrez l\'ID de la vidéo Bunny Stream: ');
    
    if (!videoId || !videoId.trim()) {
      console.log('❌ ID vidéo requis');
      rl.close();
      return;
    }

    const confirm = await question(`\nAssocier la vidéo "${videoId.trim()}" à cette leçon? (o/n): `);
    
    if (confirm.toLowerCase() === 'o' || confirm.toLowerCase() === 'oui') {
      await associateVideo(lesson.id, videoId.trim());
    } else {
      console.log('❌ Opération annulée');
    }

    rl.close();
    return;
  }

  // Mode recherche interactive
  console.log('Mode interactif - Recherche de leçon\n');
  
  const searchTerm = await question('Entrez l\'ID ou le titre de la leçon: ');
  
  if (!searchTerm || !searchTerm.trim()) {
    console.log('❌ Terme de recherche requis');
    rl.close();
    return;
  }

  const lesson = await findLessonByIdOrTitle(searchTerm.trim());

  if (!lesson) {
    console.log(`\n❌ Aucune leçon trouvée pour "${searchTerm}"`);
    rl.close();
    return;
  }

  if (Array.isArray(lesson)) {
    console.log(`\n⚠️  Plusieurs leçons trouvées:\n`);
    lesson.forEach((l, i) => {
      console.log(`${i + 1}. [${l.training_modules.title}] ${l.title}`);
      console.log(`   ID: ${l.id}`);
      console.log(`   Vidéo actuelle: ${l.bunny_video_id || 'Aucune'}\n`);
    });
    
    const choice = await question('Sélectionnez le numéro de la leçon (ou Entrée pour annuler): ');
    const index = parseInt(choice) - 1;
    
    if (isNaN(index) || index < 0 || index >= lesson.length) {
      console.log('❌ Sélection invalide');
      rl.close();
      return;
    }

    const selectedLesson = lesson[index];
    const videoId = await question(`\nEntrez l'ID de la vidéo Bunny Stream pour "${selectedLesson.title}": `);
    
    if (!videoId || !videoId.trim()) {
      console.log('❌ ID vidéo requis');
      rl.close();
      return;
    }

    const confirm = await question(`\nAssocier la vidéo "${videoId.trim()}" à cette leçon? (o/n): `);
    
    if (confirm.toLowerCase() === 'o' || confirm.toLowerCase() === 'oui') {
      await associateVideo(selectedLesson.id, videoId.trim());
    } else {
      console.log('❌ Opération annulée');
    }

    rl.close();
    return;
  }

  // Une seule leçon trouvée
  console.log(`\n📋 Leçon trouvée:`);
  console.log(`   Titre: ${lesson.title}`);
  console.log(`   Module: ${lesson.training_modules.title}`);
  console.log(`   ID: ${lesson.id}`);
  console.log(`   Vidéo actuelle: ${lesson.bunny_video_id || 'Aucune'}\n`);

  const videoId = await question('Entrez l\'ID de la vidéo Bunny Stream: ');
  
  if (!videoId || !videoId.trim()) {
    console.log('❌ ID vidéo requis');
    rl.close();
    return;
  }

  const confirm = await question(`\nAssocier la vidéo "${videoId.trim()}" à cette leçon? (o/n): `);
  
  if (confirm.toLowerCase() === 'o' || confirm.toLowerCase() === 'oui') {
    await associateVideo(lesson.id, videoId.trim());
  } else {
    console.log('❌ Opération annulée');
  }

  rl.close();
}

main().catch((error) => {
  console.error('❌ Erreur:', error);
  rl.close();
  process.exit(1);
});

