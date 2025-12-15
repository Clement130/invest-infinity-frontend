import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erreur : VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Restaure le compte admin investinfinityfr@gmail.com
 */
async function restoreAdminAccount() {
  const adminEmail = 'investinfinityfr@gmail.com';
  const adminName = 'test';
  const adminLicense = 'immersion';
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔧 RESTAURATION DU COMPTE ADMIN');
  console.log('='.repeat(80));
  console.log(`\n📧 Email: ${adminEmail}`);
  console.log(`👤 Nom: ${adminName}`);
  console.log(`🔑 Licence: ${adminLicense}`);
  console.log(`👑 Rôle: admin\n`);

  try {
    // 1. Vérifier si l'utilisateur existe déjà dans auth.users
    console.log('1️⃣ Vérification de l\'existence du compte...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail);

    let userId;

    if (existingUser) {
      console.log(`   ✅ Compte auth.users existe déjà (ID: ${existingUser.id})`);
      userId = existingUser.id;
    } else {
      // 2. Créer l'utilisateur dans auth.users
      console.log('2️⃣ Création du compte auth.users...');
      const tempPassword = crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: tempPassword,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        throw new Error(`Erreur lors de la création: ${createError?.message || 'Utilisateur non créé'}`);
      }

      userId = newUser.user.id;
      console.log(`   ✅ Compte auth.users créé (ID: ${userId})`);
      console.log(`   ⚠️  Mot de passe temporaire généré (utiliser la récupération de mot de passe)`);
    }

    // 3. Vérifier si le profil existe
    console.log('\n3️⃣ Vérification du profil...');
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      console.log('   ✅ Profil existe déjà');
      
      // Mettre à jour le profil pour s'assurer qu'il est correct
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: adminEmail,
          full_name: adminName,
          role: 'admin',
          license: adminLicense,
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Erreur lors de la mise à jour du profil: ${updateError.message}`);
      }
      console.log('   ✅ Profil mis à jour');
    } else {
      // 4. Créer le profil
      console.log('4️⃣ Création du profil...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: adminEmail,
          full_name: adminName,
          role: 'admin',
          license: adminLicense,
          created_at: new Date().toISOString(),
        });

      if (profileError) {
        throw new Error(`Erreur lors de la création du profil: ${profileError.message}`);
      }
      console.log('   ✅ Profil créé');
    }

    // 5. Vérifier les accès aux modules (admin devrait avoir accès à tout)
    console.log('\n5️⃣ Vérification des accès aux modules...');
    const { data: modules } = await supabase
      .from('training_modules')
      .select('id, title')
      .eq('is_active', true);

    if (modules && modules.length > 0) {
      const { data: currentAccess } = await supabase
        .from('training_access')
        .select('module_id')
        .eq('user_id', userId);

      const currentModuleIds = new Set((currentAccess || []).map(a => a.module_id));
      const missingModules = modules.filter(m => !currentModuleIds.has(m.id));

      if (missingModules.length > 0) {
        console.log(`   ⚠️  ${missingModules.length} accès manquants, création...`);
        
        const accessRecords = missingModules.map(m => ({
          user_id: userId,
          module_id: m.id,
          access_type: 'full',
          granted_at: new Date().toISOString()
        }));

        const { error: accessError } = await supabase
          .from('training_access')
          .upsert(accessRecords, {
            onConflict: 'user_id,module_id'
          });

        if (accessError) {
          console.log(`   ⚠️  Erreur lors de la création des accès: ${accessError.message}`);
        } else {
          console.log(`   ✅ ${missingModules.length} accès créés`);
        }
      } else {
        console.log('   ✅ Tous les accès sont en place');
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ COMPTE ADMIN RESTAURÉ AVEC SUCCÈS');
    console.log('='.repeat(80));
    console.log(`\n📧 Email: ${adminEmail}`);
    console.log(`🆔 ID: ${userId}`);
    console.log(`👑 Rôle: admin`);
    console.log(`🔑 Licence: ${adminLicense}`);
    console.log(`\n💡 Note: Si le mot de passe a été réinitialisé, utilisez la fonction`);
    console.log('   de récupération de mot de passe pour définir un nouveau mot de passe.\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de la restauration:', error.message);
    process.exit(1);
  }
}

restoreAdminAccount().catch(console.error);

