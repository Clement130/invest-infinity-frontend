/**
 * Script pour réinitialiser le mot de passe du développeur et tester l'accès
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement
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
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erreur: Variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises');
  console.log('💡 Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DEVELOPER_EMAIL = 'butcher13550@gmail.com';
const NEW_PASSWORD = process.argv[2] || 'Password130§';

async function resetPasswordAndTest() {
  try {
    console.log('🔧 Réinitialisation du mot de passe...\n');
    
    // 1. Trouver l'utilisateur
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erreur lors de la liste des utilisateurs:', listError.message);
      return false;
    }

    const user = users.users.find(u => u.email === DEVELOPER_EMAIL);
    
    if (!user) {
      console.error(`❌ Utilisateur ${DEVELOPER_EMAIL} non trouvé`);
      console.log('\n💡 Pour créer l\'utilisateur:');
      console.log('   1. Allez sur https://supabase.com/dashboard');
      console.log('   2. Auth > Users > Add User');
      console.log(`   3. Email: ${DEVELOPER_EMAIL}`);
      console.log(`   4. Password: ${NEW_PASSWORD}`);
      return false;
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`);

    // 2. Réinitialiser le mot de passe
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: NEW_PASSWORD }
    );

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour du mot de passe:', updateError.message);
      return false;
    }

    console.log('✅ Mot de passe mis à jour avec succès');
    console.log(`   Nouveau mot de passe: ${NEW_PASSWORD}`);

    // 3. Vérifier le profil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Erreur lors de la récupération du profil:', profileError.message);
    } else if (!profile) {
      console.warn('⚠️  Profil non trouvé - création...');
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email: DEVELOPER_EMAIL,
          role: 'developer',
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur lors de la création du profil:', createError.message);
      } else {
        console.log('✅ Profil créé avec le rôle developer');
      }
    } else {
      console.log('✅ Profil trouvé');
      console.log(`   Rôle: ${profile.role}`);
      
      if (profile.role !== 'developer' && profile.role !== 'admin') {
        console.log('⚠️  Mise à jour du rôle vers developer...');
        const { error: roleError } = await supabaseAdmin
          .from('profiles')
          .update({ role: 'developer' })
          .eq('id', user.id);

        if (roleError) {
          console.error('❌ Erreur lors de la mise à jour du rôle:', roleError.message);
        } else {
          console.log('✅ Rôle mis à jour vers developer');
        }
      }
    }

    // 4. Tester la connexion
    console.log('\n🧪 Test de connexion...');
    const supabaseClient = createClient(SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY);
    
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: DEVELOPER_EMAIL,
      password: NEW_PASSWORD,
    });

    if (authError) {
      console.error('❌ Erreur de connexion:', authError.message);
      return false;
    }

    console.log('✅ Connexion réussie!');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);

    // 5. Vérifier l'accès à la licence
    console.log('\n📋 Vérification de l\'accès à la licence...');
    const { data: license, error: licenseError } = await supabaseClient
      .from('developer_license')
      .select('*')
      .maybeSingle();

    if (licenseError) {
      console.error('❌ Erreur lors de la récupération de la licence:', licenseError.message);
    } else if (!license) {
      console.warn('⚠️  Aucune licence trouvée');
    } else {
      console.log('✅ Licence trouvée');
      console.log(`   Active: ${license.is_active ? '✅ Oui' : '❌ Non'}`);
      console.log(`   Dernier paiement: ${new Date(license.last_payment_date).toLocaleString('fr-FR')}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ RÉINITIALISATION ET TEST RÉUSSIS');
    console.log('='.repeat(60));
    console.log(`\n📝 Identifiants:`);
    console.log(`   Email: ${DEVELOPER_EMAIL}`);
    console.log(`   Mot de passe: ${NEW_PASSWORD}`);
    console.log(`   Rôle: developer (accès admin)`);

    return true;
  } catch (error) {
    console.error('\n❌ Erreur inattendue:', error);
    return false;
  }
}

resetPasswordAndTest()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Opération terminée avec succès!');
      process.exit(0);
    } else {
      console.log('\n❌ L\'opération a échoué');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

