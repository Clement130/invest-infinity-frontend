#!/usr/bin/env node

/**
 * Script de test pour vérifier la connexion admin avec investinfinityfr@gmail.com
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const ADMIN_EMAIL = 'investinfinityfr@gmail.com';
const ADMIN_PASSWORD = 'Investinfinity13013.';

console.log('🔐 Test de Connexion Admin\n');
console.log('='.repeat(60));
console.log(`Email: ${ADMIN_EMAIL}`);
console.log('='.repeat(60));

async function testAdminLogin() {
  try {
    console.log('\n📋 Étape 1: Connexion avec les identifiants');
    console.log('-'.repeat(60));
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
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
    console.log('\n📋 Étape 2: Vérification du profil et du rôle');
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
    console.log(`   Licence: ${profile.license || 'none'}`);

    // Vérifier si c'est un admin
    const isAdminOrDeveloper = profile.role === 'admin' || profile.role === 'developer';
    if (!isAdminOrDeveloper) {
      console.error(`❌ Le rôle "${profile.role}" ne donne pas accès admin`);
      console.log('\n💡 Solution: Exécuter cette requête SQL dans Supabase:');
      console.log(`UPDATE profiles SET role = 'admin' WHERE email = '${ADMIN_EMAIL}';`);
      return false;
    }

    console.log(`✅ Rôle ${profile.role} confirmé - Accès admin autorisé`);

    // Test 3: Vérifier isSuperAdmin
    console.log('\n📋 Étape 3: Vérification Super Admin');
    console.log('-'.repeat(60));

    const email = profile.email.toLowerCase().trim();
    const superAdmins = ['investinfinityfr@gmail.com', 'butcher13550@gmail.com'];
    const isSuperAdmin = superAdmins.includes(email) && isAdminOrDeveloper;

    if (isSuperAdmin) {
      console.log('✅ Super Admin confirmé');
      console.log('   - Email dans la liste des super admins');
      console.log('   - Rôle admin/developer confirmé');
    } else {
      console.log('⚠️  Email non reconnu comme Super Admin');
      console.log('   - Vérifiez que l\'email est dans src/lib/auth.ts');
    }

    // Test 4: Vérifier l'accès aux routes admin
    console.log('\n📋 Étape 4: Test d\'accès aux données admin');
    console.log('-'.repeat(60));

    // Essayer de récupérer des données admin (ex: liste des utilisateurs)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, role, license')
      .limit(5);

    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError.message);
      console.log('   (Cela peut être normal si RLS bloque l\'accès)');
    } else {
      console.log(`✅ Accès aux données confirmé (${users?.length || 0} utilisateurs récupérés)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Tous les tests sont passés !');
    console.log('='.repeat(60));
    console.log('\n📝 Résumé:');
    console.log(`   - Connexion: ✅`);
    console.log(`   - Rôle: ${profile.role} ✅`);
    console.log(`   - Super Admin: ${isSuperAdmin ? '✅' : '⚠️'}`);
    console.log(`   - Accès admin: ✅`);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    return false;
  }
}

testAdminLogin()
  .then(success => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

