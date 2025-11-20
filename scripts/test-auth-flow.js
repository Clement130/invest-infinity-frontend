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

async function testAuthFlow() {
  const email = 'butcher13550@gmail.com';
  const password = process.argv[2];

  if (!password) {
    console.error('❌ Usage: node scripts/test-auth-flow.js <mot_de_passe>');
    process.exit(1);
  }

  console.log('🧪 Test du flow d\'authentification complet...\n');

  try {
    // 1. Connexion
    console.log('1️⃣ Connexion...');
    const startTime = Date.now();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('❌ Erreur de connexion:', authError.message);
      process.exit(1);
    }

    const loginTime = Date.now() - startTime;
    console.log(`✅ Connexion réussie en ${loginTime}ms`);
    console.log('   User ID:', authData.user.id);
    console.log('');

    // 2. Chargement du profil
    console.log('2️⃣ Chargement du profil...');
    const profileStartTime = Date.now();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    const profileTime = Date.now() - profileStartTime;
    
    if (profileError) {
      console.error('❌ Erreur profil:', profileError.message);
      console.error('   Code:', profileError.code);
    } else if (!profile) {
      console.error('❌ Profil non trouvé');
    } else {
      console.log(`✅ Profil chargé en ${profileTime}ms`);
      console.log('   ID:', profile.id);
      console.log('   Email:', profile.email);
      console.log('   Role:', profile.role);
    }
    console.log('');

    // 3. Test de la fonction is_admin
    console.log('3️⃣ Test is_admin()...');
    const isAdminStartTime = Date.now();
    const { data: isAdminResult, error: isAdminError } = await supabase
      .rpc('is_admin', { uid: authData.user.id });

    const isAdminTime = Date.now() - isAdminStartTime;
    
    if (isAdminError) {
      console.error('❌ Erreur is_admin:', isAdminError.message);
    } else {
      console.log(`✅ is_admin() exécuté en ${isAdminTime}ms`);
      console.log('   Résultat:', isAdminResult);
    }
    console.log('');

    // 4. Test de récupération des modules
    console.log('4️⃣ Test getModules()...');
    const modulesStartTime = Date.now();
    const { data: modules, error: modulesError } = await supabase
      .from('training_modules')
      .select('*')
      .eq('is_active', true)
      .order('position');

    const modulesTime = Date.now() - modulesStartTime;
    
    if (modulesError) {
      console.error('❌ Erreur modules:', modulesError.message);
      console.error('   Code:', modulesError.code);
      console.error('   Détails:', modulesError.details);
      console.error('   Hint:', modulesError.hint);
    } else {
      console.log(`✅ Modules récupérés en ${modulesTime}ms`);
      console.log('   Nombre:', modules?.length || 0);
      if (modules && modules.length > 0) {
        modules.forEach((m, i) => {
          console.log(`   ${i + 1}. ${m.title}`);
        });
      }
    }
    console.log('');

    // 5. Test de récupération des accès
    console.log('5️⃣ Test getAccessList()...');
    const accessStartTime = Date.now();
    const { data: access, error: accessError } = await supabase
      .from('training_access')
      .select('*')
      .eq('user_id', authData.user.id);

    const accessTime = Date.now() - accessStartTime;
    
    if (accessError) {
      console.error('❌ Erreur accès:', accessError.message);
    } else {
      console.log(`✅ Accès récupérés en ${accessTime}ms`);
      console.log('   Nombre:', access?.length || 0);
    }

    console.log('\n📊 Résumé des temps:');
    console.log(`   Connexion: ${loginTime}ms`);
    console.log(`   Profil: ${profileTime}ms`);
    console.log(`   is_admin: ${isAdminTime}ms`);
    console.log(`   Modules: ${modulesTime}ms`);
    console.log(`   Accès: ${accessTime}ms`);
    console.log(`   Total: ${Date.now() - startTime}ms`);

    console.log('\n✅ Test terminé !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testAuthFlow();

