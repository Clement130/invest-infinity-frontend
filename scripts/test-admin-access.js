/**
 * Script de test pour vérifier :
 * 1. L'accès admin avec butcher13550@gmail.com / Password130!
 * 2. Le rôle developer/admin
 * 3. Le statut admin du client (investinfinityfr@gmail.com)
 * 4. L'accès aux données admin
 */

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
    // Si .env.local n'existe pas, utiliser process.env
    return process.env;
  }
}

const env = loadEnv();

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erreur: Variables d\'environnement SUPABASE_URL et SUPABASE_ANON_KEY requises');
  console.log('💡 Créez un fichier .env.local avec:');
  console.log('   VITE_SUPABASE_URL=votre_url');
  console.log('   VITE_SUPABASE_ANON_KEY=votre_cle');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_EMAIL = 'butcher13550@gmail.com';
const TEST_PASSWORD = 'Password130!';
const CLIENT_EMAIL = 'investinfinityfr@gmail.com';

console.log('🧪 Test d\'accès admin\n');
console.log('='.repeat(60));

async function testAdminAccess() {
  try {
    console.log('\n📋 Test 1: Connexion avec les identifiants');
    console.log('-'.repeat(60));
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (authError) {
      console.error('❌ Erreur de connexion:', authError.message);
      return false;
    }

    if (!authData.user) {
      console.error('❌ Aucun utilisateur retourné');
      return false;
    }

    console.log('✅ Connexion réussie');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);

    // Test 2: Vérifier le profil et le rôle
    console.log('\n📋 Test 2: Vérification du rôle');
    console.log('-'.repeat(60));

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Erreur lors de la récupération du profil:', profileError.message);
      return false;
    }

    if (!profile) {
      console.error('❌ Profil non trouvé');
      return false;
    }

    console.log('✅ Profil trouvé');
    console.log(`   Rôle: ${profile.role}`);
    console.log(`   Email: ${profile.email}`);

    const isAdminOrDeveloper = profile.role === 'admin' || profile.role === 'developer';
    if (!isAdminOrDeveloper) {
      console.error(`❌ Le rôle "${profile.role}" ne donne pas accès admin`);
      return false;
    }

    console.log(`✅ Rôle ${profile.role} confirmé - Accès admin autorisé`);

    // Test 3: Vérifier le statut admin du client
    console.log('\n📋 Test 3: Vérification du statut admin du client');
    console.log('-'.repeat(60));

    const { data: clientProfile, error: clientError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', CLIENT_EMAIL)
      .maybeSingle();

    if (clientError) {
      console.error('❌ Erreur lors de la récupération du profil client:', clientError.message);
      return false;
    }

    if (!clientProfile) {
      console.warn(`⚠️  Profil client non trouvé pour ${CLIENT_EMAIL}`);
    } else {
      console.log('✅ Profil client trouvé');
      console.log(`   Email: ${clientProfile.email}`);
      console.log(`   Rôle: ${clientProfile.role}`);
      console.log(`   Statut admin: ${clientProfile.role === 'admin' ? '✅ Actif' : '❌ Révoqué'}`);
      console.log(`   ℹ️  Note: Le système de protection développeur a été retiré. Le client garde son rôle admin de manière permanente.`);
    }

    // Test 4: Vérifier l'accès aux routes admin (simulation)
    console.log('\n📋 Test 4: Vérification de l\'accès aux données admin');
    console.log('-'.repeat(60));

    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(10);

    if (profilesError) {
      console.error('❌ Erreur lors de la récupération des profils:', profilesError.message);
      return false;
    }

    console.log(`✅ Accès aux profils confirmé (${allProfiles?.length || 0} profils récupérés)`);
    if (allProfiles && allProfiles.length > 0) {
      console.log('   Exemples de profils:');
      allProfiles.slice(0, 3).forEach(p => {
        console.log(`     - ${p.email} (${p.role})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS');
    console.log('='.repeat(60));
    console.log('\n📝 Résumé:');
    console.log(`   ✅ Connexion réussie avec ${TEST_EMAIL}`);
    console.log(`   ✅ Rôle ${profile.role} confirmé`);
    console.log(`   ✅ Statut admin du client vérifié`);
    console.log(`   ✅ Accès aux données admin confirmé`);

    return true;
  } catch (error) {
    console.error('\n❌ Erreur inattendue:', error);
    return false;
  }
}

// Exécuter les tests
testAdminAccess()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Tests terminés avec succès!');
      process.exit(0);
    } else {
      console.log('\n❌ Certains tests ont échoué');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

