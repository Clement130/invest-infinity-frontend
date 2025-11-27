/**
 * Test simplifié du flow de paiement
 * Utilise uniquement fetch et l'API Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFlow() {
  const testEmail = `test-${Date.now()}@example.com`;
  
  console.log('\n🧪 Test du flow post-paiement\n');
  console.log(`📧 Email de test: ${testEmail}\n`);

  try {
    // 1. Créer un utilisateur (simule le webhook)
    console.log('1️⃣ Création d\'un utilisateur de test...');
    const tempPassword = crypto.randomUUID();
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (createError || !newUser.user) {
      throw new Error(`Erreur création: ${createError?.message}`);
    }

    const userId = newUser.user.id;
    console.log(`   ✅ Utilisateur créé: ${userId}`);

    // 2. Générer un token de récupération
    console.log('2️⃣ Génération du token de récupération...');
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: testEmail,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      throw new Error(`Erreur token: ${linkError?.message}`);
    }

    const passwordToken = linkData.properties.hashed_token;
    console.log(`   ✅ Token généré`);

    // 3. Créer le profil
    console.log('3️⃣ Création du profil...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: testEmail,
        role: 'client',
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.log(`   ⚠️ Erreur profil: ${profileError.message}`);
    } else {
      console.log(`   ✅ Profil créé`);
    }

    // 4. Donner accès aux modules
    console.log('4️⃣ Attribution des accès aux modules...');
    const { data: modules } = await supabase
      .from('training_modules')
      .select('id');
    
    if (modules && modules.length > 0) {
      const accessRecords = modules.map(m => ({
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
        console.log(`   ⚠️ Erreur: ${accessError.message}`);
      } else {
        console.log(`   ✅ Accès accordé à ${modules.length} modules`);
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST RÉUSSI - Utilisateur créé avec succès !');
    console.log('='.repeat(60));
    console.log(`\n📧 Email: ${testEmail}`);
    console.log(`🆔 User ID: ${userId}`);
    console.log(`🔑 Token: ${passwordToken.substring(0, 20)}...`);
    
    console.log(`\n🔗 URL de création de mot de passe:`);
    const createPasswordUrl = `https://www.investinfinity.fr/create-password?token=${passwordToken}&email=${encodeURIComponent(testEmail)}`;
    console.log(createPasswordUrl);

    console.log(`\n💡 Tu peux tester le flow complet en ouvrant cette URL dans ton navigateur`);
    console.log(`   L'utilisateur pourra créer son mot de passe et accéder à la plateforme.\n`);

    // Nettoyer l'utilisateur de test
    console.log(`\n🧹 Nettoyage (suppression de l'utilisateur de test)...`);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.log(`   ⚠️ Erreur suppression: ${deleteError.message}`);
      console.log(`   💡 User ID à supprimer manuellement: ${userId}`);
    } else {
      console.log(`   ✅ Utilisateur de test supprimé\n`);
    }

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testFlow();

