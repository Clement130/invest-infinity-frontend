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

// IDs des vidéos Trading View (elles doivent être uniquement dans le module Trading View)
const TRADING_VIEW_VIDEO_IDS = [
  '1b4b4891-d60c-4644-bfa3-7de80c950e8a', // Actif - Trading View
  '3b574bdc-4c55-414a-8028-a4733e13ebc9', // faire zoomm - Trading View
  '03f94cf1-205a-41d5-81a6-cca3d6d76da2', // fait2 ecran - Trading View
  '1c1129c4-df13-4973-8c4e-c7aa4c9d01b4', // faitBacktest - Trading View
  '86b787f6-7012-40cd-b98d-9bd2940b4165', // faitcapture - Trading View
  '03d84e9e-f51a-45df-b2e0-96fe4107fd1c', // faitFond - Trading View
  '99bd5c2c-8c7c-4d9d-98ee-d3f40cf0e4cd', // faitindic - Trading View
  '23fbc623-7626-4c1f-8c85-8b5c568cb7fa', // outil en fav - Trading View
  'b1a00800-5650-4557-a3c6-31adcfc98a1e', // planfuture - Trading View
  'a65a03c6-eb43-43a4-9050-789a482ffb06', // supprimer - Trading View
  '0f4ec3c0-2437-4996-be13-81c72f528fc7', // ttracer ligne - Trading View
  'f24ac09e-5055-4d4a-ac8f-85e47a2f3b8b', // Ut - Trading View
];

// Leçons qui utilisent des vidéos Trading View mais ne sont pas dans le module Trading View
// On va les vider pour que vous puissiez les remplacer manuellement
const LESSONS_TO_CLEAR = [
  {
    lessonId: '13313387-d35a-4ab7-966d-817f3668115d',
    lessonTitle: 'Scalping et Trading Intraday',
    currentVideoId: 'b1a00800-5650-4557-a3c6-31adcfc98a1e', // planfuture - Trading View
  },
  {
    lessonId: 'c575b839-7fd7-4e17-9e89-777cbb517b13',
    lessonTitle: 'Swing Trading et Analyse Fondamentale',
    currentVideoId: '0f4ec3c0-2437-4996-be13-81c72f528fc7', // ttracer ligne - Trading View
  },
  {
    lessonId: 'be19c6d6-31af-46ac-a959-bc137648f2dd',
    lessonTitle: 'Introduction au Trading Algorithmique',
    currentVideoId: '99bd5c2c-8c7c-4d9d-98ee-d3f40cf0e4cd', // faitindic - Trading View
  },
  {
    lessonId: 'dd716d80-f347-482d-8501-dd0282ff6ba2',
    lessonTitle: 'Analyse Technique de Base',
    currentVideoId: '9295490a-0072-4752-996d-6f573306318b', // topstepx (doublon avec "Introduction au Trading")
  },
];

async function clearVideoId(lessonId) {
  // Mettre à null pour indiquer qu'il n'y a pas de vidéo
  const { error } = await supabase
    .from('training_lessons')
    .update({ bunny_video_id: null })
    .eq('id', lessonId);

  if (error) throw error;
}

async function main() {
  console.log('🔧 Correction des correspondances vidéos incorrectes\n');
  console.log('='.repeat(80));
  
  console.log('\n📋 Leçons à corriger (vidéos Trading View utilisées dans de mauvais modules) :\n');
  
  LESSONS_TO_CLEAR.forEach((lesson, i) => {
    console.log(`${i + 1}. ${lesson.lessonTitle}`);
    console.log(`   ID vidéo actuel: ${lesson.currentVideoId}`);
    console.log(`   → Sera vidé (à remplacer manuellement)\n`);
  });
  
  console.log('⚠️  ATTENTION: Cette opération va vider les IDs de vidéos pour ces leçons');
  console.log('   Vous devrez les remplacer manuellement via /admin/contenu avec les bonnes vidéos\n');
  
  console.log('🔄 Application des corrections...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const lesson of LESSONS_TO_CLEAR) {
    try {
      await clearVideoId(lesson.lessonId);
      console.log(`✅ ${lesson.lessonTitle} - ID vidéo vidé`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${lesson.lessonTitle}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ ${successCount} correction(s) appliquée(s)`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} erreur(s)`);
  }
  console.log('\n💡 Prochaines étapes:');
  console.log('   1. Allez sur /admin/contenu');
  console.log('   2. Pour chaque leçon corrigée, ajoutez la bonne vidéo');
  console.log('   3. Assurez-vous que les vidéos Trading View sont uniquement dans le module Trading View\n');
}

main().catch(console.error);

