/**
 * Script pour ajouter de la progression à l'utilisateur de test existant
 * Utilise les variables d'environnement du système
 */

import { createClient } from '@supabase/supabase-js';

// Utiliser les variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEST_USER_EMAIL = 'test@investinfinity.fr';

async function main() {
  console.log('🔧 Ajout de progression à l\'utilisateur de test...\n');

  try {
    // 1. Récupérer l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: 'TestGamification123!',
    });

    if (authError || !user) {
      console.error('❌ Erreur de connexion:', authError);
      process.exit(1);
    }

    console.log(`✅ Connecté en tant que ${user.email} (${user.id})`);

    // 2. Récupérer tous les modules et leurs leçons
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select('id, title')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (modulesError) {
      throw modulesError;
    }

    if (!modules || modules.length === 0) {
      console.error('❌ Aucun module trouvé');
      process.exit(1);
    }

    console.log(`📦 ${modules.length} module(s) trouvé(s)`);

    // 3. Récupérer toutes les leçons
    const { data: allLessons, error: lessonsError } = await supabase
      .from('training_lessons')
      .select('id, title, module_id, position')
      .order('module_id', { ascending: true })
      .order('position', { ascending: true });

    if (lessonsError) {
      throw lessonsError;
    }

    if (!allLessons || allLessons.length === 0) {
      console.error('❌ Aucune leçon trouvée');
      process.exit(1);
    }

    console.log(`📚 ${allLessons.length} leçon(s) trouvée(s)`);

    // 4. Compléter quelques leçons pour tester
    // Compléter 5 leçons du premier module
    const firstModuleLessons = allLessons
      .filter(l => l.module_id === modules[0].id)
      .slice(0, 5);

    const now = new Date().toISOString();
    const progressEntries = firstModuleLessons.map((lesson, index) => ({
      user_id: user.id,
      lesson_id: lesson.id,
      done: true,
      last_viewed: new Date(Date.now() - (5 - index) * 60000).toISOString(), // Espacées de 1 minute
    }));

    // Supprimer les anciennes entrées pour ce module
    const lessonIds = firstModuleLessons.map(l => l.id);
    await supabase
      .from('training_progress')
      .delete()
      .eq('user_id', user.id)
      .in('lesson_id', lessonIds);

    // Insérer les nouvelles entrées
    const { error: insertError } = await supabase
      .from('training_progress')
      .insert(progressEntries);

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ ${progressEntries.length} leçon(s) marquée(s) comme complétée(s)`);
    console.log(`   Module: ${modules[0].title}`);
    progressEntries.forEach((entry, i) => {
      const lesson = firstModuleLessons[i];
      console.log(`   - ${lesson.title} (complétée)`);
    });

    // 5. Calculer la progression attendue
    const totalLessons = allLessons.length;
    const completedLessons = progressEntries.length;
    const expectedProgress = Math.round((completedLessons / totalLessons) * 100);

    console.log(`\n📊 Progression attendue:`);
    console.log(`   Leçons complétées: ${completedLessons}/${totalLessons}`);
    console.log(`   Progression globale: ${expectedProgress}%`);

    console.log(`\n✅ Progression ajoutée avec succès !`);
    console.log(`\n🧪 Vous pouvez maintenant tester sur :`);
    console.log(`   https://invest-infinity-frontend.vercel.app/app/progress`);
    console.log(`   Email: ${TEST_USER_EMAIL}`);
    console.log(`   Password: TestGamification123!`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

main();















