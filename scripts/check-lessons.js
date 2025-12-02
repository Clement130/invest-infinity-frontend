import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkLessons() {
  // Récupérer modules avec leurs leçons en une seule requête
  const { data: modules, error: modError } = await supabase
    .from('training_modules')
    .select(`
      id, 
      title, 
      required_license,
      training_lessons (
        id,
        title,
        position,
        bunny_video_id
      )
    `)
    .order('position');

  if (modError) {
    console.error('Erreur:', modError.message);
    return;
  }

  for (const m of modules) {
    console.log('\n========================================');
    console.log(`MODULE: ${m.title}`);
    console.log(`Licence requise: ${m.required_license || 'entree'}`);
    console.log('========================================');
    
    const lessons = m.training_lessons || [];
    
    if (lessons.length === 0) {
      console.log('  ❌ Aucune leçon');
    } else {
      // Trier par position
      lessons.sort((a, b) => a.position - b.position);
      
      for (const l of lessons) {
        const hasVideo = l.bunny_video_id ? '🎬' : '⚠️';
        console.log(`    ${hasVideo} [${l.position}] ${l.title}`);
      }
      console.log(`\n  Total: ${lessons.length} leçons`);
    }
  }
}

checkLessons();

