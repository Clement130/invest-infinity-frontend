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
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAuth() {
  const email = 'butcher13550@gmail.com';
  const password = process.argv[2]; // Mot de passe en argument

  if (!password) {
    console.error('❌ Usage: node scripts/debug-auth.js <mot_de_passe>');
    process.exit(1);
  }

  console.log('🔍 Diagnostic de l\'authentification...\n');

  try {
    // 1. Test de connexion
    console.log('1️⃣ Test de connexion...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('❌ Erreur de connexion:', authError.message);
      process.exit(1);
    }

    console.log('✅ Connexion réussie');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
    console.log('');

    // 2. Test de chargement du profil
    console.log('2️⃣ Test de chargement du profil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Erreur lors du chargement du profil:', profileError.message);
      console.error('   Code:', profileError.code);
    } else if (!profile) {
      console.error('❌ Profil non trouvé pour cet utilisateur');
      console.log('   L\'ID de l\'utilisateur:', authData.user.id);
    } else {
      console.log('✅ Profil chargé');
      console.log('   ID:', profile.id);
      console.log('   Email:', profile.email);
      console.log('   Role:', profile.role);
      console.log('');
    }

    // 3. Test de la fonction is_admin
    console.log('3️⃣ Test de la fonction is_admin...');
    const { data: isAdminResult, error: isAdminError } = await supabase
      .rpc('is_admin', { uid: authData.user.id });

    if (isAdminError) {
      console.error('❌ Erreur lors de l\'appel is_admin:', isAdminError.message);
    } else {
      console.log('✅ is_admin retourne:', isAdminResult);
      console.log('');
    }

    // 4. Test de récupération des modules
    console.log('4️⃣ Test de récupération des modules...');
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select('*')
      .eq('is_active', true)
      .order('position');

    if (modulesError) {
      console.error('❌ Erreur lors de la récupération des modules:', modulesError.message);
      console.error('   Code:', modulesError.code);
      console.error('   Détails:', modulesError.details);
      console.error('   Hint:', modulesError.hint);
    } else {
      console.log('✅ Modules récupérés:', modules?.length || 0);
      if (modules && modules.length > 0) {
        modules.forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.title} (ID: ${m.id})`);
        });
      }
      console.log('');
    }

    // 5. Test de récupération des accès
    console.log('5️⃣ Test de récupération des accès...');
    const { data: access, error: accessError } = await supabase
      .from('training_access')
      .select('*')
      .eq('user_id', authData.user.id);

    if (accessError) {
      console.error('❌ Erreur lors de la récupération des accès:', accessError.message);
    } else {
      console.log('✅ Accès récupérés:', access?.length || 0);
      if (access && access.length > 0) {
        access.forEach((a, i) => {
          console.log(`   ${i + 1}. Module ID: ${a.module_id}, Type: ${a.access_type}`);
        });
      }
    }

    console.log('\n✅ Diagnostic terminé !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

debugAuth();


