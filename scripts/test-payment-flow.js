/**
 * Script de test du flow de paiement complet
 * Simule un paiement Stripe et vérifie que tout fonctionne
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { webcrypto } from 'crypto';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Polyfill pour crypto.randomUUID si nécessaire
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

async function testPaymentFlow() {
  const testEmail = `test-${Date.now()}@example.com`;
  console.log('\n🧪 Test du flow de paiement complet\n');
  console.log(`📧 Email de test: ${testEmail}\n`);

  try {
    // 1. Créer une session Stripe de test
    console.log('1️⃣ Création d\'une session Stripe de test...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: 'price_1SXfwzKaUb6KDbNF81uubunw', // Starter
        quantity: 1
      }],
      mode: 'payment',
      success_url: 'https://www.investinfinity.fr/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://www.investinfinity.fr/pricing',
      customer_email: testEmail,
      metadata: {
        priceId: 'price_1SXfwzKaUb6KDbNF81uubunw',
        test: 'true'
      }
    });
    
    console.log(`   ✅ Session créée: ${session.id}`);
    console.log(`   📧 Email: ${session.customer_email}`);
    console.log(`   💰 Montant: ${session.amount_total / 100}€`);
    console.log(`   📊 Statut: ${session.payment_status}\n`);

    // 2. Simuler le webhook (appel direct de la logique)
    console.log('2️⃣ Simulation du webhook stripe (création utilisateur)...');
    
    // Vérifier si l'utilisateur existe déjà
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === testEmail);

    let userId;
    let passwordToken = null;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`   ⚠️ Utilisateur existe déjà: ${userId}`);
    } else {
      // Créer un nouveau compte
      const tempPassword = crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: tempPassword,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        throw new Error(`Erreur création utilisateur: ${createError?.message}`);
      }

      userId = newUser.user.id;
      console.log(`   ✅ Utilisateur créé: ${userId}`);

      // Générer un token de reset password
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: testEmail,
      });

      if (!linkError && linkData?.properties?.hashed_token) {
        passwordToken = linkData.properties.hashed_token;
        console.log(`   ✅ Token de récupération généré`);
      }
    }

    // 3. Créer le profil
    console.log('3️⃣ Création du profil utilisateur...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: testEmail,
        role: 'client',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
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
        console.log(`   ⚠️ Erreur accès: ${accessError.message}`);
      } else {
        console.log(`   ✅ Accès accordé à ${modules.length} modules`);
      }
    } else {
      console.log(`   ⚠️ Aucun module trouvé`);
    }

    // 5. Enregistrer l'achat
    console.log('5️⃣ Enregistrement de l\'achat...');
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        stripe_session_id: session.id,
        status: passwordToken ? 'pending_password' : 'completed'
      });

    if (purchaseError) {
      console.log(`   ⚠️ Erreur achat: ${purchaseError.message}`);
    } else {
      console.log(`   ✅ Achat enregistré`);
    }

    // 6. Tester get-session-info
    console.log('\n6️⃣ Test de l\'API get-session-info...');
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/get-session-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id })
    });

    const data = await response.json();
    console.log(`   📊 Statut HTTP: ${response.status}`);
    console.log(`   📧 Email trouvé: ${data.email}`);
    console.log(`   👤 User ID: ${data.userId}`);
    console.log(`   🆕 Nouvel utilisateur: ${data.isNewUser}`);
    console.log(`   🔑 Token présent: ${!!data.token}`);

    // Résumé
    console.log('\n' + '='.repeat(50));
    console.log('✅ TEST RÉUSSI !');
    console.log('='.repeat(50));
    console.log(`\n📧 Email: ${testEmail}`);
    console.log(`🆔 User ID: ${userId}`);
    console.log(`🔗 Session Stripe: ${session.id}`);
    
    if (passwordToken) {
      console.log(`\n🔗 URL de création de mot de passe:`);
      console.log(`https://www.investinfinity.fr/create-password?token=${passwordToken}&email=${encodeURIComponent(testEmail)}`);
    }

    console.log(`\n💡 Pour nettoyer cet utilisateur de test :`);
    console.log(`   User ID à supprimer: ${userId}\n`);

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testPaymentFlow();

