#!/usr/bin/env node

/**
 * Script pour s'assurer que investinfinityfr@gmail.com existe et est admin
 * Si le compte n'existe pas, il sera créé
 * Si le compte existe mais n'est pas admin, le rôle sera mis à jour
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
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY // Utiliser SERVICE_ROLE_KEY pour les opérations admin
);

const ADMIN_EMAIL = 'investinfinityfr@gmail.com';
const ADMIN_PASSWORD = 'Investinfinity13013.';

console.log('🔧 Vérification et Configuration du Compte Admin\n');
console.log('='.repeat(60));
console.log(`Email: ${ADMIN_EMAIL}`);
console.log('='.repeat(60));

async function ensureAdminAccount() {
  try {
    // 1. Vérifier si l'utilisateur existe dans auth.users
    console.log('\n📋 Étape 1: Vérification de l\'existence du compte');
    console.log('-'.repeat(60));

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', listError.message);
      return false;
    }

    const existingUser = users.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

    if (!existingUser) {
      console.log('⚠️  Compte non trouvé dans auth.users');
      console.log('   Création du compte...');
      
      // Créer l'utilisateur
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true, // Confirmer l'email automatiquement
      });

      if (createError) {
        console.error('❌ Erreur lors de la création du compte:', createError.message);
        return false;
      }

      console.log('✅ Compte créé avec succès');
      console.log(`   User ID: ${newUser.user.id}`);

      // Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: ADMIN_EMAIL,
          role: 'admin',
          license: 'immersion', // Elite par défaut
        });

      if (profileError) {
        console.error('❌ Erreur lors de la création du profil:', profileError.message);
        console.log('\n💡 Créer manuellement le profil avec cette requête SQL:');
        console.log(`INSERT INTO profiles (id, email, role, license)`);
        console.log(`VALUES ('${newUser.user.id}', '${ADMIN_EMAIL}', 'admin', 'immersion');`);
        return false;
      }

      console.log('✅ Profil créé avec succès (rôle: admin)');
      return true;
    }

    console.log('✅ Compte trouvé');
    console.log(`   User ID: ${existingUser.id}`);
    console.log(`   Email confirmé: ${existingUser.email_confirmed_at ? '✅' : '❌'}`);

    // 2. Vérifier le profil
    console.log('\n📋 Étape 2: Vérification du profil');
    console.log('-'.repeat(60));

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', existingUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Erreur lors de la récupération du profil:', profileError.message);
      return false;
    }

    if (!profile) {
      console.log('⚠️  Profil non trouvé, création...');
      
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: existingUser.id,
          email: ADMIN_EMAIL,
          role: 'admin',
          license: 'immersion',
        });

      if (createProfileError) {
        console.error('❌ Erreur lors de la création du profil:', createProfileError.message);
        return false;
      }

      console.log('✅ Profil créé avec succès (rôle: admin)');
      return true;
    }

    console.log('✅ Profil trouvé');
    console.log(`   Rôle actuel: ${profile.role}`);
    console.log(`   Licence: ${profile.license || 'none'}`);

    // 3. Vérifier et corriger le rôle
    if (profile.role !== 'admin' && profile.role !== 'developer') {
      console.log('\n📋 Étape 3: Correction du rôle');
      console.log('-'.repeat(60));
      console.log(`⚠️  Le rôle est "${profile.role}" au lieu de "admin"`);
      console.log('   Mise à jour du rôle...');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour du rôle:', updateError.message);
        console.log('\n💡 Mettre à jour manuellement avec cette requête SQL:');
        console.log(`UPDATE profiles SET role = 'admin' WHERE id = '${existingUser.id}';`);
        return false;
      }

      console.log('✅ Rôle mis à jour avec succès (admin)');
    } else {
      console.log('\n📋 Étape 3: Vérification du rôle');
      console.log('-'.repeat(60));
      console.log(`✅ Rôle correct: ${profile.role}`);
    }

    // 4. Réinitialiser le mot de passe si nécessaire
    console.log('\n📋 Étape 4: Vérification du mot de passe');
    console.log('-'.repeat(60));
    console.log('💡 Pour réinitialiser le mot de passe, exécuter:');
    console.log(`   supabase.auth.admin.updateUserById('${existingUser.id}', { password: '${ADMIN_PASSWORD}' })`);
    console.log('\n   Ou utiliser cette requête SQL (via Supabase Dashboard):');
    console.log(`   UPDATE auth.users SET encrypted_password = crypt('${ADMIN_PASSWORD}', gen_salt('bf')) WHERE id = '${existingUser.id}';`);
    console.log('\n   ⚠️  Note: La réinitialisation du mot de passe nécessite des privilèges admin Supabase');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Configuration terminée !');
    console.log('='.repeat(60));
    console.log('\n📝 Résumé:');
    console.log(`   - Compte: ${existingUser ? '✅ Existe' : '✅ Créé'}`);
    console.log(`   - Profil: ${profile ? '✅ Existe' : '✅ Créé'}`);
    console.log(`   - Rôle: ${profile?.role === 'admin' || profile?.role === 'developer' ? '✅ Admin' : '⚠️  À corriger'}`);
    console.log(`   - Super Admin: ✅ (dans src/lib/auth.ts)`);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    return false;
  }
}

ensureAdminAccount()
  .then(success => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

