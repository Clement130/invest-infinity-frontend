import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement depuis .env.local
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
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminAccount() {
  const adminEmail = 'investinfinityfr@gmail.com';
  const adminPassword = 'Investinfinity13013.';

  console.log('🔧 Création du compte admin...\n');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${'*'.repeat(adminPassword.length)}\n`);

  try {
    // 1. Vérifier si l'utilisateur existe déjà
    console.log('1️⃣  Vérification de l\'existence de l\'utilisateur...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error(`❌ Erreur lors de la vérification: ${listError.message}`);
      return;
    }

    const existingUser = existingUsers.users.find(u => u.email === adminEmail);
    
    let userId;
    if (existingUser) {
      console.log(`   ⚠️  L'utilisateur existe déjà (ID: ${existingUser.id})`);
      userId = existingUser.id;
      
      // Mettre à jour le mot de passe si nécessaire
      console.log('   🔄 Mise à jour du mot de passe...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: adminPassword }
      );
      
      if (updateError) {
        console.error(`   ❌ Erreur lors de la mise à jour du mot de passe: ${updateError.message}`);
      } else {
        console.log('   ✅ Mot de passe mis à jour');
      }
    } else {
      // 2. Créer l'utilisateur dans auth.users
      console.log('2️⃣  Création de l\'utilisateur dans auth.users...');
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Confirmer l'email automatiquement
      });

      if (createError) {
        console.error(`❌ Erreur lors de la création de l'utilisateur: ${createError.message}`);
        return;
      }

      userId = authUser.user.id;
      console.log(`   ✅ Utilisateur créé (ID: ${userId})`);
    }

    // 3. Vérifier si le profil existe
    console.log('\n3️⃣  Vérification du profil...');
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error(`❌ Erreur lors de la vérification du profil: ${profileError.message}`);
      return;
    }

    if (existingProfile) {
      console.log(`   ⚠️  Le profil existe déjà`);
      
      // Mettre à jour le profil pour s'assurer qu'il est admin
      if (existingProfile.role !== 'admin') {
        console.log('   🔄 Mise à jour du rôle en admin...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin', email: adminEmail })
          .eq('id', userId);

        if (updateError) {
          console.error(`   ❌ Erreur lors de la mise à jour: ${updateError.message}`);
          return;
        }
        console.log('   ✅ Rôle mis à jour en admin');
      } else {
        console.log('   ✅ Le profil est déjà admin');
      }
    } else {
      // 4. Créer le profil admin via API REST (bypass RLS)
      console.log('4️⃣  Création du profil admin via API REST...');
      
      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'apikey': supabaseServiceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          id: userId,
          user_id: userId,
          email: adminEmail,
          role: 'admin',
        }),
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error(`❌ Erreur lors de la création du profil: ${profileResponse.status}`);
        console.error(`   ${errorText}`);
        console.log('\n💡 Solution manuelle:');
        console.log('   1. Va dans Supabase Dashboard > Table Editor > profiles');
        console.log('   2. Clique sur "Insert row"');
        console.log(`   3. id: ${userId}`);
        console.log(`   4. email: ${adminEmail}`);
        console.log('   5. role: admin');
        console.log('   6. Clique sur "Save"');
        return;
      }

      const newProfile = await profileResponse.json();
      console.log('   ✅ Profil créé avec succès');
      console.log(`      ID: ${newProfile.id || userId}`);
      console.log(`      Email: ${newProfile.email || adminEmail}`);
      console.log(`      Role: ${newProfile.role || 'admin'}`);
    }

    console.log('\n✅ Compte admin créé/mis à jour avec succès !');
    console.log(`\n📧 Email: ${adminEmail}`);
    console.log(`🔑 Mot de passe: ${adminPassword}`);
    console.log(`\n🌐 Vous pouvez maintenant vous connecter sur: https://invest-infinity-frontend.vercel.app/login`);

  } catch (error) {
    console.error(`\n❌ Erreur inattendue: ${error.message}`);
    console.error(error);
  }
}

createAdminAccount()
  .then(() => {
    console.log('\n✨ Terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

