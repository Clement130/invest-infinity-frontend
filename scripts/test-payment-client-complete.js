/**
 * Script de test complet du système de paiement client
 * Vérifie que les paiements fonctionnent correctement de bout en bout
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

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logStep(step, message) {
  log(`\n${step} ${message}`, 'blue');
}

function logSuccess(message) {
  log(`   ✅ ${message}`, 'green');
}

function logError(message) {
  log(`   ❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`   ⚠️  ${message}`, 'yellow');
}

async function testPaymentFlow() {
  const testEmail = `test-payment-${Date.now()}@test.investinfinity.fr`;
  const testResults = {
    checkoutPublic: false,
    stripeSession: false,
    webhookProcessing: false,
    paymentRecorded: false,
    userCreated: false,
    profileCreated: false,
    accessGranted: false,
    licenseUpdated: false,
  };

  logSection('🧪 TEST COMPLET DU SYSTÈME DE PAIEMENT CLIENT');
  log(`📧 Email de test: ${testEmail}`, 'yellow');
  log(`🕐 Date: ${new Date().toISOString()}\n`, 'yellow');

  try {
    // ========================================================================
    // ÉTAPE 1: Vérifier la configuration Stripe
    // ========================================================================
    logStep('1️⃣', 'Vérification de la configuration Stripe...');
    
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY non définie dans .env.local');
    }
    logSuccess('Clé Stripe trouvée');

    // Vérifier que c'est bien une clé de test (commence par sk_test_)
    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      logWarning('ATTENTION: La clé Stripe ne semble pas être une clé de test (sk_test_)');
      logWarning('Le test va utiliser une clé de production - soyez prudent !');
    } else {
      logSuccess('Clé Stripe de test détectée');
    }

    // Récupérer les Price IDs depuis la base de données
    logStep('2️⃣', 'Récupération des Price IDs depuis la base de données...');
    const { data: stripePrices, error: pricesError } = await supabase
      .from('stripe_prices')
      .select('plan_type, stripe_price_id, plan_name, amount_cents, currency')
      .eq('is_active', true);

    if (pricesError) {
      logError(`Erreur lors de la récupération des prix: ${pricesError.message}`);
      throw pricesError;
    }

    if (!stripePrices || stripePrices.length === 0) {
      throw new Error('Aucun prix Stripe trouvé dans la base de données');
    }

    logSuccess(`${stripePrices.length} prix(s) trouvé(s) dans la base de données`);
    stripePrices.forEach(price => {
      const amount = price.amount_cents ? (price.amount_cents / 100).toFixed(2) : 'N/A';
      const currency = price.currency || 'EUR';
      log(`   - ${price.plan_name} (${price.plan_type}): ${amount} ${currency} - ${price.stripe_price_id}`, 'reset');
    });

    // Utiliser le premier prix disponible pour le test
    const testPrice = stripePrices[0];
    log(`\n💰 Utilisation du prix de test: ${testPrice.plan_name} (${testPrice.stripe_price_id})`, 'yellow');

    // ========================================================================
    // ÉTAPE 3: Tester la fonction checkout-public
    // ========================================================================
    logStep('3️⃣', 'Test de la fonction Edge checkout-public...');
    
    const checkoutPublicUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/checkout-public`;
    const checkoutResponse = await fetch(checkoutPublicUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': process.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        priceId: testPrice.stripe_price_id,
        userEmail: testEmail,
        successUrl: 'https://www.investinfinity.fr/success?session_id={CHECKOUT_SESSION_ID}',
        cancelUrl: 'https://www.investinfinity.fr/pricing',
      }),
    });

    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      logError(`Erreur lors de l'appel à checkout-public: ${checkoutResponse.status}`);
      logError(`Réponse: ${errorText}`);
      throw new Error(`checkout-public a échoué: ${checkoutResponse.status}`);
    }

    const checkoutData = await checkoutResponse.json();
    if (!checkoutData.url) {
      logError('La fonction checkout-public n\'a pas retourné d\'URL');
      throw new Error('URL de checkout manquante');
    }

    testResults.checkoutPublic = true;
    logSuccess('Fonction checkout-public fonctionne correctement');
    log(`   URL de checkout: ${checkoutData.url}`, 'reset');

    // Extraire le session_id de l'URL
    const sessionIdMatch = checkoutData.url.match(/\/cs_test_([a-zA-Z0-9]+)/);
    let sessionId = null;
    if (sessionIdMatch) {
      sessionId = `cs_test_${sessionIdMatch[1]}`;
    } else {
      // Récupérer la session depuis Stripe
      const sessions = await stripe.checkout.sessions.list({ limit: 1 });
      if (sessions.data.length > 0) {
        sessionId = sessions.data[0].id;
      }
    }

    if (!sessionId) {
      logWarning('Impossible de récupérer le session_id, création d\'une nouvelle session...');
      // Créer une session manuellement pour le test
      const manualSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: testPrice.stripe_price_id,
          quantity: 1
        }],
        mode: 'payment',
        success_url: 'https://www.investinfinity.fr/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://www.investinfinity.fr/pricing',
        customer_email: testEmail,
        metadata: {
          priceId: testPrice.stripe_price_id,
          test: 'true',
          testTimestamp: Date.now().toString(),
        }
      });
      sessionId = manualSession.id;
    }

    logSuccess(`Session Stripe créée: ${sessionId}`);
    testResults.stripeSession = true;

    // ========================================================================
    // ÉTAPE 4: Récupérer la session Stripe et simuler un paiement réussi
    // ========================================================================
    logStep('4️⃣', 'Récupération de la session Stripe...');
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logSuccess(`Session récupérée: ${session.id}`);
    log(`   Statut: ${session.payment_status}`, 'reset');
    log(`   Montant: ${session.amount_total ? (session.amount_total / 100).toFixed(2) + '€' : 'N/A'}`, 'reset');
    log(`   Email: ${session.customer_email || 'N/A'}`, 'reset');

    // ========================================================================
    // ÉTAPE 5: Simuler le traitement du webhook (checkout.session.completed)
    // ========================================================================
    logStep('5️⃣', 'Simulation du traitement du webhook Stripe...');
    
    // Vérifier si l'utilisateur existe déjà
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', testEmail)
      .maybeSingle();

    let userId = null;
    let isNewUser = false;

    if (existingProfile) {
      userId = existingProfile.id;
      logWarning(`Utilisateur existe déjà: ${userId}`);
    } else {
      // Créer un nouvel utilisateur
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
      isNewUser = true;
      testResults.userCreated = true;
      logSuccess(`Nouvel utilisateur créé: ${userId}`);
    }

    // Créer ou mettre à jour le profil
    logStep('6️⃣', 'Création/mise à jour du profil utilisateur...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        user_id: userId, // Ajouter user_id explicitement
        email: testEmail,
        role: 'client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      logError(`Erreur profil: ${profileError.message}`);
    } else {
      testResults.profileCreated = true;
      logSuccess('Profil créé/mis à jour');
    }

    // Déterminer le type de licence depuis le priceId
    // La table payments utilise 'entree', 'transformation', 'immersion' directement
    const licenseType = testPrice.plan_type;

    // Mettre à jour la licence dans le profil
    // Note: profiles.license accepte 'none', 'entree', 'transformation', 'immersion'
    logStep('7️⃣', 'Mise à jour de la licence utilisateur...');
    const { error: licenseError } = await supabase
      .from('profiles')
      .update({
        license: licenseType, // 'entree', 'transformation', ou 'immersion'
        license_valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 an
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (licenseError) {
      logError(`Erreur mise à jour licence: ${licenseError.message}`);
    } else {
      testResults.licenseUpdated = true;
      logSuccess(`Licence ${licenseType} attribuée`);
    }

    // Donner accès aux modules
    logStep('8️⃣', 'Attribution des accès aux modules de formation...');
    // Note: license_required peut utiliser 'starter', 'pro', 'elite' ou 'entree', 'transformation', 'immersion'
    // Vérifier les deux formats possibles
    const { data: modules } = await supabase
      .from('training_modules')
      .select('id, name, license_required')
      .or(`license_required.eq.${licenseType},license_required.eq.starter,license_required.eq.pro,license_required.eq.elite`);

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
        logError(`Erreur accès: ${accessError.message}`);
      } else {
        testResults.accessGranted = true;
        logSuccess(`Accès accordé à ${modules.length} module(s)`);
        modules.forEach(m => {
          log(`   - ${m.name}`, 'reset');
        });
      }
    } else {
      logWarning(`Aucun module trouvé pour la licence ${licenseType}`);
    }

    // Enregistrer le paiement
    logStep('9️⃣', 'Enregistrement du paiement dans la base de données...');
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency || 'eur',
        license_type: licenseType,
        status: 'completed',
      })
      .select()
      .single();

    if (paymentError) {
      logError(`Erreur enregistrement paiement: ${paymentError.message}`);
      throw paymentError;
    } else {
      testResults.paymentRecorded = true;
      logSuccess('Paiement enregistré dans la base de données');
      log(`   ID paiement: ${paymentData.id}`, 'reset');
      log(`   Montant: ${(paymentData.amount / 100).toFixed(2)}€`, 'reset');
      log(`   Statut: ${paymentData.status}`, 'reset');
    }

    // ========================================================================
    // ÉTAPE 10: Vérifications finales
    // ========================================================================
    logStep('🔟', 'Vérifications finales...');

    // Vérifier que le paiement est bien dans la base
    const { data: verifyPayment, error: verifyError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_session_id', session.id)
      .single();

    if (verifyError || !verifyPayment) {
      logError('Le paiement n\'a pas été trouvé lors de la vérification');
    } else {
      logSuccess('Paiement vérifié dans la base de données');
    }

    // Vérifier le profil utilisateur
    const { data: verifyProfile, error: verifyProfileError } = await supabase
      .from('profiles')
      .select('license, license_valid_until')
      .eq('id', userId)
      .single();

    if (verifyProfileError || !verifyProfile) {
      logError('Le profil n\'a pas été trouvé lors de la vérification');
    } else {
      logSuccess('Profil utilisateur vérifié');
      log(`   Licence: ${verifyProfile.license}`, 'reset');
      log(`   Valide jusqu'au: ${verifyProfile.license_valid_until ? new Date(verifyProfile.license_valid_until).toLocaleDateString('fr-FR') : 'N/A'}`, 'reset');
    }

    // ========================================================================
    // RÉSUMÉ
    // ========================================================================
    logSection('📊 RÉSUMÉ DU TEST');
    
    const allTestsPassed = Object.values(testResults).every(result => result === true);
    
    if (allTestsPassed) {
      log('✅ TOUS LES TESTS SONT PASSÉS !', 'green');
    } else {
      log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ', 'yellow');
    }

    console.log('\nDétails des tests:');
    Object.entries(testResults).forEach(([test, passed]) => {
      const icon = passed ? '✅' : '❌';
      const color = passed ? 'green' : 'red';
      log(`   ${icon} ${test}: ${passed ? 'PASSÉ' : 'ÉCHOUÉ'}`, color);
    });

    console.log('\n' + '='.repeat(60));
    log('📋 INFORMATIONS DE TEST', 'cyan');
    console.log('='.repeat(60));
    log(`📧 Email de test: ${testEmail}`, 'yellow');
    log(`🆔 User ID: ${userId}`, 'yellow');
    log(`🔗 Session Stripe: ${session.id}`, 'yellow');
    log(`💰 Montant: ${(session.amount_total / 100).toFixed(2)}€`, 'yellow');
    log(`📦 Formule: ${testPrice.plan_name}`, 'yellow');
    log(`🎫 Licence: ${licenseType}`, 'yellow');
    
    if (paymentData) {
      log(`💳 ID Paiement: ${paymentData.id}`, 'yellow');
    }

    console.log('\n' + '='.repeat(60));
    log('🧹 NETTOYAGE', 'cyan');
    console.log('='.repeat(60));
    log('Pour nettoyer les données de test:', 'yellow');
    log(`   1. Supprimer l'utilisateur: ${userId}`, 'reset');
    log(`   2. Supprimer le paiement: ${paymentData?.id || 'N/A'}`, 'reset');
    log(`   3. Supprimer la session Stripe: ${session.id}`, 'reset');
    console.log('');

    return {
      success: allTestsPassed,
      results: testResults,
      testData: {
        email: testEmail,
        userId,
        sessionId: session.id,
        paymentId: paymentData?.id,
        licenseType,
      }
    };

  } catch (error) {
    logSection('❌ ERREUR LORS DU TEST');
    logError(error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le test
testPaymentFlow()
  .then((result) => {
    if (result.success) {
      log('\n✅ Test terminé avec succès !', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  Test terminé avec des erreurs', 'yellow');
      process.exit(1);
    }
  })
  .catch((error) => {
    logError(`\n❌ Erreur fatale: ${error.message}`);
    console.error(error);
    process.exit(1);
  });

