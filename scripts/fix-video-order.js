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

// Corrections basées sur une analyse plus logique
// Les vidéos Trading View doivent rester dans le module Trading View
// Les autres vidéos doivent correspondre au contenu des leçons
const CORRECTIONS = [
  {
    lessonId: 'dd716d80-f347-482d-8501-dd0282ff6ba2',
    lessonTitle: 'Analyse Technique de Base',
    moduleTitle: 'Etape 1 - La Fondation',
    // Cette leçon devrait avoir une vidéo sur l'analyse technique
    // Mais il n'y a pas de vidéo spécifique disponible
    // On garde topstepx pour l'instant, mais c'est un doublon avec "Introduction au Trading"
    // Solution: Laisser vide ou utiliser une vidéo différente si disponible
    newVideoId: null, // À déterminer - pas de vidéo spécifique disponible
    reason: 'Pas de vidéo spécifique disponible - nécessite une vidéo sur l\'analyse technique',
  },
  {
    lessonId: '13313387-d35a-4ab7-966d-817f3668115d',
    lessonTitle: 'Scalping et Trading Intraday',
    moduleTitle: 'Etape 2 - Les Bases en ICT',
    // Cette leçon ne devrait pas utiliser une vidéo Trading View
    // Il n'y a pas de vidéo spécifique disponible
    newVideoId: null, // À déterminer
    reason: 'Pas de vidéo spécifique disponible - nécessite une vidéo sur le scalping',
  },
  {
    lessonId: 'c575b839-7fd7-4e17-9e89-777cbb517b13',
    lessonTitle: 'Swing Trading et Analyse Fondamentale',
    moduleTitle: 'Etape 2 - Les Bases en ICT',
    // Cette leçon ne devrait pas utiliser une vidéo Trading View
    newVideoId: null, // À déterminer
    reason: 'Pas de vidéo spécifique disponible - nécessite une vidéo sur le swing trading',
  },
  {
    lessonId: 'be19c6d6-31af-46ac-a959-bc137648f2dd',
    lessonTitle: 'Introduction au Trading Algorithmique',
    moduleTitle: 'Etape 3 - La Stratégie ICT Mickael',
    // Cette leçon ne devrait pas utiliser une vidéo Trading View sur les indicateurs
    newVideoId: null, // À déterminer
    reason: 'Pas de vidéo spécifique disponible - nécessite une vidéo sur le trading algorithmique',
  },
  // "Création et Backtesting de Stratégies" avec "faitBacktest" est correct
];

async function updateVideoId(lessonId, newVideoId) {
  if (!newVideoId) {
    console.log(`   ⚠️  Pas de correction - vidéo à déterminer manuellement`);
    return;
  }

  const { error } = await supabase
    .from('training_lessons')
    .update({ bunny_video_id: newVideoId })
    .eq('id', lessonId);

  if (error) throw error;
}

async function getCurrentVideoId(lessonId) {
  const { data, error } = await supabase
    .from('training_lessons')
    .select('bunny_video_id')
    .eq('id', lessonId)
    .single();

  if (error) throw error;
  return data.bunny_video_id;
}

async function main() {
  console.log('🔍 Analyse des problèmes de correspondance vidéos/leçons\n');
  console.log('='.repeat(80));
  
  console.log('\n⚠️  PROBLÈMES DÉTECTÉS :\n');
  console.log('1. "Introduction au Trading" et "Analyse Technique de Base" utilisent la même vidéo (topstepx.mp4)');
  console.log('2. Des vidéos Trading View sont utilisées pour des leçons non Trading View');
  console.log('3. Certaines leçons n\'ont pas de vidéos spécifiques disponibles\n');
  
  console.log('='.repeat(80));
  console.log('\n💡 RECOMMANDATIONS :\n');
  console.log('Les vidéos Trading View doivent être utilisées UNIQUEMENT dans le module "Trading View - Outils et Techniques"');
  console.log('Les autres modules nécessitent des vidéos spécifiques qui ne sont peut-être pas encore sur Bunny Stream\n');
  
  console.log('='.repeat(80));
  console.log('\n📋 ÉTAT ACTUEL DES CORRECTIONS :\n');
  
  for (const correction of CORRECTIONS) {
    try {
      const currentVideoId = await getCurrentVideoId(correction.lessonId);
      console.log(`📚 ${correction.lessonTitle}`);
      console.log(`   Module: ${correction.moduleTitle}`);
      console.log(`   ID actuel: ${currentVideoId}`);
      if (correction.newVideoId) {
        console.log(`   Nouvel ID proposé: ${correction.newVideoId}`);
      } else {
        console.log(`   ⚠️  Pas de vidéo spécifique disponible`);
      }
      console.log(`   Raison: ${correction.reason}\n`);
    } catch (error) {
      console.error(`❌ Erreur pour ${correction.lessonTitle}: ${error.message}\n`);
    }
  }
  
  console.log('='.repeat(80));
  console.log('\n⚠️  ACTION REQUISE :\n');
  console.log('Pour corriger ces problèmes, vous devez :');
  console.log('1. Vérifier quelles vidéos correspondent vraiment à chaque leçon');
  console.log('2. Uploader les vidéos manquantes sur Bunny Stream si nécessaire');
  console.log('3. Utiliser /admin/contenu pour corriger manuellement les correspondances');
  console.log('\n💡 Les vidéos Trading View doivent être déplacées vers le module "Trading View" si elles sont utilisées ailleurs\n');
}

main().catch(console.error);

