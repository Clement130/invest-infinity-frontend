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

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Mapping des leçons vers les IDs de vidéos
// Basé sur les correspondances logiques entre les titres
const VIDEO_UPDATES = [
  {
    lessonId: '6242fd3c-c816-4589-9eb6-50a2469f067f',
    lessonTitle: 'Création et Backtesting de Stratégies',
    newVideoId: '1c1129c4-df13-4973-8c4e-c7aa4c9d01b4', // faitBacktest - Trading View.mp4
    reason: 'Correspondance parfaite : Backtesting',
  },
  {
    lessonId: 'be19c6d6-31af-46ac-a959-bc137648f2dd',
    lessonTitle: 'Introduction au Trading Algorithmique',
    newVideoId: '99bd5c2c-8c7c-4d9d-98ee-d3f40cf0e4cd', // faitindic - Trading View.mp4 (indicateurs techniques)
    reason: 'Indicateurs techniques pour trading algorithmique',
  },
  {
    lessonId: 'dd716d80-f347-482d-8501-dd0282ff6ba2',
    lessonTitle: 'Analyse Technique de Base',
    newVideoId: '9295490a-0072-4752-996d-6f573306318b', // topstepx.mp4 (introduction générale)
    reason: 'Vidéo d\'introduction générale (6 min)',
  },
  {
    lessonId: '13313387-d35a-4ab7-966d-817f3668115d',
    lessonTitle: 'Scalping et Trading Intraday',
    newVideoId: 'b1a00800-5650-4557-a3c6-31adcfc98a1e', // planfuture - Trading View.mp4
    reason: 'Planification future pour trading intraday',
  },
  {
    lessonId: 'c575b839-7fd7-4e17-9e89-777cbb517b13',
    lessonTitle: 'Swing Trading et Analyse Fondamentale',
    newVideoId: '0f4ec3c0-2437-4996-be13-81c72f528fc7', // ttracer ligne - Trading View.mp4
    reason: 'Tracer des lignes pour analyse technique',
  },
];

async function updateVideoId(lessonId, newVideoId) {
  const { error } = await supabase
    .from('training_lessons')
    .update({ bunny_video_id: newVideoId })
    .eq('id', lessonId);

  if (error) throw error;
}

async function verifyLesson(lessonId) {
  const { data, error } = await supabase
    .from('training_lessons')
    .select('id, title, bunny_video_id')
    .eq('id', lessonId)
    .single();

  if (error) throw error;
  return data;
}

async function main() {
  console.log('🚀 Application des corrections des IDs de vidéos\n');
  console.log('='.repeat(70));
  
  console.log(`\n📋 ${VIDEO_UPDATES.length} mise(s) à jour à effectuer:\n`);
  
  for (const update of VIDEO_UPDATES) {
    try {
      const lesson = await verifyLesson(update.lessonId);
      console.log(`📚 ${update.lessonTitle}`);
      console.log(`   ID actuel: ${lesson.bunny_video_id}`);
      console.log(`   Nouvel ID: ${update.newVideoId}`);
      console.log(`   Raison: ${update.reason}\n`);
    } catch (error) {
      console.error(`❌ Erreur pour ${update.lessonTitle}: ${error.message}\n`);
    }
  }
  
  console.log('⚠️  ATTENTION: Cette opération va modifier la base de données !');
  console.log('   Application dans 3 secondes...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('🔄 Application des mises à jour...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const update of VIDEO_UPDATES) {
    try {
      await updateVideoId(update.lessonId, update.newVideoId);
      console.log(`✅ ${update.lessonTitle}`);
      console.log(`   ${update.lessonId} → ${update.newVideoId}\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${update.lessonTitle}: ${error.message}\n`);
      errorCount++;
    }
  }
  
  console.log('='.repeat(70));
  console.log(`\n✅ ${successCount} mise(s) à jour réussie(s)`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} erreur(s)`);
  }
  console.log('\n✨ Terminé !\n');
  
  // Vérification finale
  console.log('🔍 Vérification finale...\n');
  const remainingTestIds = [];
  
  for (const update of VIDEO_UPDATES) {
    try {
      const lesson = await verifyLesson(update.lessonId);
      if (lesson.bunny_video_id && lesson.bunny_video_id.startsWith('test-')) {
        remainingTestIds.push(lesson);
      } else {
        console.log(`✅ ${lesson.title} → ${lesson.bunny_video_id}`);
      }
    } catch (error) {
      console.error(`❌ Erreur de vérification: ${error.message}`);
    }
  }
  
  if (remainingTestIds.length > 0) {
    console.log(`\n⚠️  ${remainingTestIds.length} leçon(s) avec toujours un ID de test`);
  } else {
    console.log('\n🎉 Toutes les leçons ont été mises à jour avec succès !');
  }
}

main().catch(console.error);

