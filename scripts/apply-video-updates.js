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

// Mapping manuel basé sur les titres des leçons et des vidéos
// Vous pouvez modifier ce mapping selon vos besoins
const VIDEO_MAPPING = {
  // Etape 1 - La Fondation
  'dd716d80-f347-482d-8501-dd0282ff6ba2': null, // "Analyse Technique de Base" - À déterminer
  
  // Etape 2 - Les Bases en ICT
  '13313387-d35a-4ab7-966d-817f3668115d': null, // "Scalping et Trading Intraday" - À déterminer
  'c575b839-7fd7-4e17-9e89-777cbb517b13': null, // "Swing Trading et Analyse Fondamentale" - À déterminer
  
  // Etape 3 - La Stratégie ICT Mickael
  'be19c6d6-31af-46ac-a959-bc137648f2dd': null, // "Introduction au Trading Algorithmique" - À déterminer
  '6242fd3c-c816-4589-9eb6-50a2469f067f': null, // "Création et Backtesting de Stratégies" - À déterminer
};

async function updateVideoId(lessonId, newVideoId) {
  const { error } = await supabase
    .from('training_lessons')
    .update({ bunny_video_id: newVideoId })
    .eq('id', lessonId);

  if (error) {
    throw error;
  }
}

async function getLessonInfo(lessonId) {
  const { data, error } = await supabase
    .from('training_lessons')
    .select('id, title, bunny_video_id, module_id, training_modules(title)')
    .eq('id', lessonId)
    .single();

  if (error) throw error;
  return data;
}

async function main() {
  console.log('🚀 Script de mise à jour des IDs de vidéos\n');
  console.log('='.repeat(70));
  
  // Vérifier le mapping
  const updates = [];
  for (const [lessonId, videoId] of Object.entries(VIDEO_MAPPING)) {
    if (videoId) {
      try {
        const lesson = await getLessonInfo(lessonId);
        updates.push({
          lessonId,
          lessonTitle: lesson.title,
          moduleTitle: lesson.training_modules?.title || 'N/A',
          currentVideoId: lesson.bunny_video_id,
          newVideoId: videoId,
        });
      } catch (error) {
        console.error(`❌ Erreur pour la leçon ${lessonId}:`, error.message);
      }
    }
  }
  
  if (updates.length === 0) {
    console.log('\n⚠️  Aucune mise à jour configurée dans VIDEO_MAPPING');
    console.log('\n💡 Pour utiliser ce script:');
    console.log('   1. Modifiez le fichier scripts/apply-video-updates.js');
    console.log('   2. Ajoutez les correspondances dans VIDEO_MAPPING');
    console.log('   3. Relancez le script\n');
    return;
  }
  
  console.log(`\n📋 ${updates.length} mise(s) à jour à effectuer:\n`);
  updates.forEach((update, i) => {
    console.log(`${i + 1}. ${update.lessonTitle}`);
    console.log(`   Module: ${update.moduleTitle}`);
    console.log(`   ID actuel: ${update.currentVideoId}`);
    console.log(`   Nouvel ID: ${update.newVideoId}\n`);
  });
  
  console.log('⚠️  ATTENTION: Cette opération va modifier la base de données !');
  console.log('   Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes pour continuer...\n');
  
  // Attendre 5 secondes pour permettre l'annulation
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('🔄 Application des mises à jour...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const update of updates) {
    try {
      await updateVideoId(update.lessonId, update.newVideoId);
      console.log(`✅ ${update.lessonTitle} → ${update.newVideoId}`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${update.lessonTitle}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ ${successCount} mise(s) à jour réussie(s)`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} erreur(s)`);
  }
  console.log('\n✨ Terminé !\n');
}

main().catch(console.error);

