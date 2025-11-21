/**
 * Script pour créer un utilisateur de test avec progression
 * 
 * Ce script crée :
 * - Un utilisateur dans auth.users
 * - Son profil dans public.profiles
 * - Un accès à un module
 * - De la progression sur quelques leçons
 * 
 * Usage:
 *   node scripts/create-test-user-with-progress.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
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
const supabaseServiceRoleKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erreur: VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  console.error('   Créez un fichier .env.local avec ces variables');
  console.error('   Récupérez VITE_SUPABASE_SERVICE_ROLE_KEY depuis : Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

// Créer le client Supabase avec service_role key (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_USER_EMAIL = 'test-progress@example.com';
const TEST_USER_PASSWORD = 'TestPassword123!';
const TEST_USER_NAME = 'Utilisateur Test Progression';

async function main() {
  console.log('🔧 Création d\'un utilisateur de test avec progression...\n');

  try {
    // 1. Vérifier si l'utilisateur existe déjà
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === TEST_USER_EMAIL);

    let userId;
    if (existingUser) {
      console.log(`⚠️  L'utilisateur ${TEST_USER_EMAIL} existe déjà`);
      userId = existingUser.id;
      
      // Supprimer l'ancien profil et progression pour repartir propre
      await supabase.from('training_progress').delete().eq('user_id', userId);
      await supabase.from('training_access').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
      console.log('   Nettoyage des anciennes données...');
    } else {
      // 2. Créer l'utilisateur dans auth.users
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        email_confirm: true,
      });

      if (createError) {
        throw createError;
      }

      userId = newUser.user.id;
      console.log(`✅ Utilisateur créé : ${TEST_USER_EMAIL} (${userId})`);
    }

    // 3. Créer le profil via requête SQL directe pour éviter les problèmes de cache
    console.log('📝 Création du profil via SQL...');
    const { error: profileError } = await supabase.rpc('exec_sql', {
      query: `
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES ('${userId}', '${TEST_USER_EMAIL}', '${TEST_USER_NAME}', 'client')
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role;
      `,
    });

    if (profileError) {
      // Si RPC n'existe pas, utiliser l'approche standard
      console.log('⚠️  RPC non disponible, utilisation de l\'API standard...');
      await supabase.from('profiles').delete().eq('id', userId);
      
      // Essayer avec user_id au lieu de id (peut-être que la table a été modifiée)
      const { error: insertError } = await supabase.from('profiles').insert({
        user_id: userId,
        id: userId,
        email: TEST_USER_EMAIL,
        role: 'client',
      });

      if (insertError) {
        console.error('❌ Erreur lors de la création du profil:', insertError);
        console.error('   Détails:', JSON.stringify(insertError, null, 2));
        throw insertError;
      }
      console.log('✅ Profil créé (sans full_name)');
    } else {
      console.log('✅ Profil créé');
    }

    // 4. Récupérer le premier module actif
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })
      .limit(1);

    if (modulesError) {
      throw modulesError;
    }

    if (!modules || modules.length === 0) {
      console.error('❌ Aucun module actif trouvé. Créez d\'abord des modules via seed-test-data.sql');
      process.exit(1);
    }

    const module = modules[0];
    console.log(`📦 Module sélectionné : ${module.title}`);

    // 5. Donner accès au module
    const { error: accessError } = await supabase.from('training_access').upsert({
      user_id: userId,
      module_id: module.id,
      access_type: 'full',
    });

    if (accessError && accessError.code !== '23505') {
      // 23505 = duplicate key, on ignore
      throw accessError;
    }
    console.log('✅ Accès au module créé');

    // 6. Récupérer les leçons du module
    const { data: lessons, error: lessonsError } = await supabase
      .from('training_lessons')
      .select('*')
      .eq('module_id', module.id)
      .order('position', { ascending: true });

    if (lessonsError) {
      throw lessonsError;
    }

    if (!lessons || lessons.length === 0) {
      console.warn('⚠️  Aucune leçon trouvée pour ce module');
      console.log('\n✅ Utilisateur de test créé avec succès !');
      console.log(`   Email: ${TEST_USER_EMAIL}`);
      console.log(`   Password: ${TEST_USER_PASSWORD}`);
      console.log(`   User ID: ${userId}`);
      return;
    }

    console.log(`📚 ${lessons.length} leçon(s) trouvée(s)`);

    // 7. Créer de la progression (compléter la première, commencer la deuxième)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Compléter la première leçon
    if (lessons[0]) {
      await supabase.from('training_progress').upsert({
        user_id: userId,
        lesson_id: lessons[0].id,
        done: true,
        last_viewed: yesterday.toISOString(),
      });
      console.log(`✅ Progression créée : "${lessons[0].title}" (complétée)`);
    }

    // Commencer la deuxième leçon (si elle existe)
    if (lessons[1]) {
      await supabase.from('training_progress').upsert({
        user_id: userId,
        lesson_id: lessons[1].id,
        done: false,
        last_viewed: now.toISOString(),
      });
      console.log(`✅ Progression créée : "${lessons[1].title}" (en cours)`);
    }

    console.log('\n✅ Utilisateur de test créé avec succès !');
    console.log(`\n📋 Informations de connexion :`);
    console.log(`   Email: ${TEST_USER_EMAIL}`);
    console.log(`   Password: ${TEST_USER_PASSWORD}`);
    console.log(`   User ID: ${userId}`);
    console.log(`\n🧪 Vous pouvez maintenant tester avec :`);
    console.log(`   npm run test:progress ${userId}`);
    console.log(`   ou simplement : npm run test:progress`);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
    process.exit(1);
  }
}

main();

