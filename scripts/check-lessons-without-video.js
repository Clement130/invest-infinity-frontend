/**
 * Script pour vérifier les leçons sans vidéo et permettre de les corriger
 * Usage: node scripts/check-lessons-without-video.js [lesson-title]
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

async function main() {
  console.log('🔍 Recherche des leçons sans vidéo...\n');

  // Récupérer toutes les leçons avec leurs modules
  const { data: lessons, error } = await supabase
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
    .order('training_modules.title', { ascending: true })
    .order('position', { ascending: true });

  if (error) {
    console.error('❌ Erreur lors de la récupération des leçons:', error);
    process.exit(1);
  }

  // Filtrer les leçons sans vidéo
  const lessonsWithoutVideo = lessons.filter((lesson) => !lesson.bunny_video_id);

  console.log(`📊 Statistiques:`);
  console.log(`   Total de leçons: ${lessons.length}`);
  console.log(`   Leçons avec vidéo: ${lessons.length - lessonsWithoutVideo.length}`);
  console.log(`   Leçons sans vidéo: ${lessonsWithoutVideo.length}\n`);

  if (lessonsWithoutVideo.length === 0) {
    console.log('✅ Toutes les leçons ont une vidéo associée!');
    rl.close();
    return;
  }

  // Afficher les leçons sans vidéo
  console.log('📋 Leçons sans vidéo:\n');
  lessonsWithoutVideo.forEach((lesson, index) => {
    console.log(`${index + 1}. [${lesson.training_modules.title}] ${lesson.title}`);
    console.log(`   ID: ${lesson.id}`);
    console.log('');
  });

  // Si un titre de leçon est fourni en argument, chercher cette leçon spécifiquement
  const lessonTitleArg = process.argv[2];
  if (lessonTitleArg) {
    const matchingLesson = lessonsWithoutVideo.find(
      (l) => l.title.toLowerCase().includes(lessonTitleArg.toLowerCase())
    );

    if (matchingLesson) {
      console.log(`\n🎯 Leçon trouvée: "${matchingLesson.title}"`);
      console.log(`   Module: ${matchingLesson.training_modules.title}`);
      console.log(`   ID: ${matchingLesson.id}\n`);

      const videoId = await question('Entrez l\'ID de la vidéo Bunny Stream (ou appuyez sur Entrée pour ignorer): ');
      
      if (videoId && videoId.trim()) {
        const confirm = await question(`Associer la vidéo "${videoId.trim()}" à la leçon "${matchingLesson.title}"? (o/n): `);
        
        if (confirm.toLowerCase() === 'o' || confirm.toLowerCase() === 'oui') {
          const { error: updateError } = await supabase
            .from('training_lessons')
            .update({ bunny_video_id: videoId.trim() })
            .eq('id', matchingLesson.id);

          if (updateError) {
            console.error('❌ Erreur lors de la mise à jour:', updateError);
          } else {
            console.log('✅ Vidéo associée avec succès!');
          }
        }
      }
    } else {
      console.log(`\n⚠️  Aucune leçon trouvée correspondant à "${lessonTitleArg}"`);
    }
  } else {
    console.log('\n💡 Pour associer une vidéo à une leçon spécifique, utilisez:');
    console.log('   node scripts/check-lessons-without-video.js "titre-de-la-leçon"');
  }

  rl.close();
}

main().catch((error) => {
  console.error('❌ Erreur:', error);
  rl.close();
  process.exit(1);
});

