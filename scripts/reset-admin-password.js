#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erreur : VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  console.error('💡 Ajoutez ces variables dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ADMIN_EMAIL = 'investinfinityfr@gmail.com';
const NEW_PASSWORD = process.argv[2] || 'Investinfinity13013.';

async function resetAdminPassword() {
  console.log('\n🔐 Réinitialisation du mot de passe admin\n');
  console.log(`📧 Email: ${ADMIN_EMAIL}`);
  console.log(`🔑 Nouveau mot de passe: ${NEW_PASSWORD}\n`);

  try {
    // 1. Trouver l'utilisateur
    console.log('1️⃣ Recherche de l\'utilisateur...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users.find(u => u.email === ADMIN_EMAIL);
    
    if (!user) {
      console.error(`❌ Utilisateur ${ADMIN_EMAIL} non trouvé dans auth.users`);
      console.log('\n💡 Pour créer l\'utilisateur:');
      console.log('   1. Allez sur https://supabase.com/dashboard');
      console.log('   2. Auth > Users > Add User');
      console.log(`   3. Email: ${ADMIN_EMAIL}`);
      console.log(`   4. Password: ${NEW_PASSWORD}`);
      console.log('   5. Confirmez l\'email');
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.id}\n`);

    // 2. Réinitialiser le mot de passe
    console.log('2️⃣ Réinitialisation du mot de passe...');
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: NEW_PASSWORD }
    );

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Mot de passe réinitialisé avec succès !\n');

    // 3. Vérifier et mettre à jour le profil
    console.log('3️⃣ Vérification du profil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('⚠️  Erreur lors de la récupération du profil:', profileError.message);
    } else if (!profile) {
      console.log('⚠️  Profil non trouvé - création...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: ADMIN_EMAIL,
          role: 'admin',
          full_name: 'Admin Invest Infinity',
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur lors de la création du profil:', createError.message);
      } else {
        console.log('✅ Profil créé avec le rôle admin');
      }
    } else {
      console.log('✅ Profil trouvé');
      console.log(`   Rôle actuel: ${profile.role}`);
      
      if (profile.role !== 'admin') {
        console.log('⚠️  Mise à jour du rôle vers admin...');
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', user.id);

        if (roleError) {
          console.error('❌ Erreur lors de la mise à jour du rôle:', roleError.message);
        } else {
          console.log('✅ Rôle mis à jour vers admin');
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ RÉINITIALISATION TERMINÉE');
    console.log('='.repeat(60));
    console.log(`\n📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Nouveau mot de passe: ${NEW_PASSWORD}`);
    console.log(`🆔 ID utilisateur: ${user.id}`);
    console.log(`👑 Rôle: admin`);
    console.log('\n🎉 Vous pouvez maintenant vous connecter avec ce nouveau mot de passe !\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de la réinitialisation:', error.message);
    console.error('\n💡 Solution alternative:');
    console.error('   1. Allez sur le Supabase Dashboard');
    console.error('   2. Auth > Users');
    console.error(`   3. Trouvez ${ADMIN_EMAIL}`);
    console.error('   4. Cliquez sur "Send password recovery"');
    console.error('   5. Suivez le lien dans votre email pour réinitialiser le mot de passe');
    process.exit(1);
  }
}

resetAdminPassword();

