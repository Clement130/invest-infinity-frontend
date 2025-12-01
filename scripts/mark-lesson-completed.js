/**
 * Script pour marquer une leçon comme complétée pour tester la progression globale
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const env = readFileSync(envPath, 'utf-8');
    const vars = {};
    env.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        vars[match[1].trim()] = match[2].trim();
      }
    });
    return vars;
  } catch (error) {
    console.warn('⚠️  Fichier .env.local non trouvé, utilisation des variables d\'environnement système');
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Erreur: VITE_SUPABASE_URL doit être défini');
  process.exit(1);
}

const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;
if (!supabaseKey) {
  console.error('❌ Erreur: VITE_SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_ANON_KEY doit être défini');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: supabaseServiceRoleKey
    ? {
        autoRefreshToken: false,
        persistSession: false,
      }
    : undefined,
});

async function main() {
  const userId = process.argv[2] || '5e163717-1f09-4911-90ed-2cf71e2cc223';
  const lessonId = process.argv[3] || 'ba1a1311-d77a-46b2-a81d-f2c6b1165eb3';
  
  console.log('🔧 Marquage de la leçon comme complétée...\n');
  console.log(`👤 User ID: ${userId}`);
  console.log(`📚 Lesson ID: ${lessonId}\n`);

  try {
    // Vérifier si une entrée existe déjà
    const { data: existing, error: checkError } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (checkError) throw checkError;

    const now = new Date().toISOString();

    if (existing) {
      // Mettre à jour
      const { error } = await supabase
        .from('training_progress')
        .update({
          done: true,
          last_viewed: now,
        })
        .eq('id', existing.id);

      if (error) throw error;
      console.log('✅ Entrée de progression mise à jour (done=true)');
    } else {
      // Créer une nouvelle entrée
      const { error } = await supabase.from('training_progress').insert({
        user_id: userId,
        lesson_id: lessonId,
        done: true,
        last_viewed: now,
      });

      if (error) throw error;
      console.log('✅ Nouvelle entrée de progression créée (done=true)');
    }

    // Vérifier le résultat
    const { data: progress, error: verifyError } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (verifyError) throw verifyError;

    console.log('\n📊 Vérification:');
    console.log(`   Leçon ID: ${progress?.lesson_id}`);
    console.log(`   Complétée (done): ${progress?.done ? '✅ OUI' : '❌ NON'}`);
    console.log(`   Dernière vue: ${progress?.last_viewed || 'Jamais'}`);

    // Calculer la progression attendue
    const { data: allLessons } = await supabase
      .from('training_lessons')
      .select('id, module_id')
      .in('module_id', (await supabase.from('training_modules').select('id').eq('is_active', true)).data?.map(m => m.id) || []);

    const { data: completedLessons } = await supabase
      .from('training_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('done', true);

    const totalLessons = allLessons?.length || 0;
    const completedCount = completedLessons?.length || 0;
    const expectedProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    console.log('\n📈 Progression globale attendue:');
    console.log(`   Leçons complétées: ${completedCount}/${totalLessons}`);
    console.log(`   Progression: ${expectedProgress}%`);

    console.log('\n✅ Leçon marquée comme complétée avec succès !');
    console.log('\n🧪 Vous pouvez maintenant vérifier sur:');
    console.log('   https://invest-infinity-frontend.vercel.app/app/progress');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();










