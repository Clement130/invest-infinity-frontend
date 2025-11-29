/**
 * Script Playwright pour récupérer automatiquement les clés Stripe TEST
 * 
 * Usage:
 *   npm install playwright
 *   node scripts/get-stripe-test-keys.js
 * 
 * OU avec Playwright déjà installé:
 *   npx playwright run scripts/get-stripe-test-keys.js
 */

import { chromium } from 'playwright';

async function getStripeTestKeys() {
  console.log('🚀 Démarrage de la récupération des clés Stripe TEST...\n');

  const browser = await chromium.launch({ 
    headless: false, // Affiche le navigateur pour que tu puisses te connecter
    slowMo: 1000 // Ralentit pour voir ce qui se passe
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Aller sur la page des API Keys TEST
    console.log('📋 Étape 1: Récupération de STRIPE_SECRET_KEY_TEST...');
    console.log('   ⚠️  Si tu n\'es pas connecté, connecte-toi à Stripe dans le navigateur qui va s\'ouvrir...');
    
    await page.goto('https://dashboard.stripe.com/test/apikeys', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Attendre que la page charge (peut être une page de login)
    console.log('   ⏳ Attente du chargement de la page (30 secondes max)...');
    await page.waitForTimeout(5000);
    
    // Vérifier si on est sur la page de login
    const isLoginPage = await page.locator('input[type="email"], button:has-text("Sign in"), button:has-text("Se connecter")').first().isVisible().catch(() => false);
    
    if (isLoginPage) {
      console.log('   🔐 Page de connexion détectée. Connecte-toi manuellement...');
      console.log('   ⏳ Attente de la connexion (60 secondes)...');
      // Attendre que l'utilisateur se connecte (vérifier que l'URL change ou qu'un élément spécifique apparaît)
      await page.waitForURL('**/test/apikeys', { timeout: 60000 }).catch(() => {
        console.log('   ⚠️  Timeout - vérifie que tu es bien connecté');
      });
    }

    // Chercher le bouton "Reveal test key" ou "Show test key"
    const revealButton = await page.locator('button:has-text("Reveal"), button:has-text("Show"), button:has-text("Révéler")').first();
    
    if (await revealButton.isVisible()) {
      await revealButton.click();
      await page.waitForTimeout(2000);
    }

    // Récupérer la clé secrète (sk_test_xxx)
    const secretKeyElement = await page.locator('code, input[type="text"], [data-testid*="secret"], [class*="secret"]').filter({ 
      hasText: /sk_test_/ 
    }).first();

    let stripeSecretKeyTest = '';
    if (await secretKeyElement.isVisible()) {
      stripeSecretKeyTest = await secretKeyElement.textContent() || '';
      console.log(`✅ STRIPE_SECRET_KEY_TEST trouvé: ${stripeSecretKeyTest.substring(0, 20)}...`);
    } else {
      // Essayer de copier depuis le clipboard ou chercher autrement
      const allText = await page.textContent('body');
      const match = allText.match(/sk_test_[a-zA-Z0-9]{32,}/);
      if (match) {
        stripeSecretKeyTest = match[0];
        console.log(`✅ STRIPE_SECRET_KEY_TEST trouvé: ${stripeSecretKeyTest.substring(0, 20)}...`);
      } else {
        console.log('⚠️  STRIPE_SECRET_KEY_TEST non trouvé automatiquement. Veuillez le copier manuellement.');
        console.log('   Va sur: https://dashboard.stripe.com/test/apikeys');
        console.log('   Clique sur "Reveal test key" et copie la clé (sk_test_xxx)');
      }
    }

    // 2. Aller sur la page des Webhooks TEST
    console.log('\n📋 Étape 2: Configuration du webhook TEST...');
    await page.goto('https://dashboard.stripe.com/test/webhooks', { 
      waitUntil: 'networkidle' 
    });

    await page.waitForTimeout(3000);

    // Chercher si un webhook existe déjà avec notre URL
    const webhookUrl = 'https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook-test';
    const existingWebhook = await page.locator(`text=${webhookUrl}`).first();

    let stripeWebhookSecretTest = '';

    if (await existingWebhook.isVisible()) {
      console.log('✅ Webhook TEST existe déjà !');
      // Cliquer sur le webhook pour voir le signing secret
      await existingWebhook.click();
      await page.waitForTimeout(2000);

      // Chercher le bouton "Reveal" pour le signing secret
      const revealSecretButton = await page.locator('button:has-text("Reveal"), button:has-text("Show"), button:has-text("Révéler")').first();
      if (await revealSecretButton.isVisible()) {
        await revealSecretButton.click();
        await page.waitForTimeout(2000);
      }

      // Récupérer le signing secret (whsec_xxx)
      const secretElement = await page.locator('code, input[type="text"]').filter({ 
        hasText: /whsec_/ 
      }).first();

      if (await secretElement.isVisible()) {
        stripeWebhookSecretTest = await secretElement.textContent() || '';
        console.log(`✅ STRIPE_WEBHOOK_SECRET_TEST trouvé: ${stripeWebhookSecretTest.substring(0, 20)}...`);
      }
    } else {
      console.log('📝 Création d\'un nouveau webhook TEST...');
      
      // Cliquer sur "Add endpoint" ou "Add webhook"
      const addButton = await page.locator('button:has-text("Add"), button:has-text("Ajouter"), a:has-text("Add endpoint")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(2000);

        // Remplir l'URL
        const urlInput = await page.locator('input[type="url"], input[name*="url"], input[placeholder*="URL"]').first();
        if (await urlInput.isVisible()) {
          await urlInput.fill(webhookUrl);
          console.log(`✅ URL du webhook saisie: ${webhookUrl}`);
        }

        // Sélectionner les événements
        const events = [
          'checkout.session.completed',
          'invoice.paid',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'payment_intent.succeeded',
          'payment_intent.payment_failed'
        ];

        for (const event of events) {
          const checkbox = await page.locator(`input[type="checkbox"][value*="${event}"], label:has-text("${event}")`).first();
          if (await checkbox.isVisible()) {
            await checkbox.check();
          }
        }

        // Cliquer sur "Add endpoint" ou "Save"
        const saveButton = await page.locator('button:has-text("Add"), button:has-text("Save"), button:has-text("Enregistrer")').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(3000);

          // Récupérer le signing secret après création
          const secretElement = await page.locator('code, input[type="text"]').filter({ 
            hasText: /whsec_/ 
          }).first();

          if (await secretElement.isVisible()) {
            stripeWebhookSecretTest = await secretElement.textContent() || '';
            console.log(`✅ STRIPE_WEBHOOK_SECRET_TEST trouvé: ${stripeWebhookSecretTest.substring(0, 20)}...`);
          }
        }
      }
    }

    // 3. Afficher les résultats
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSULTATS:');
    console.log('='.repeat(60));
    
    if (stripeSecretKeyTest) {
      console.log(`\n✅ STRIPE_SECRET_KEY_TEST=${stripeSecretKeyTest}`);
    } else {
      console.log('\n❌ STRIPE_SECRET_KEY_TEST non trouvé');
    }

    if (stripeWebhookSecretTest) {
      console.log(`\n✅ STRIPE_WEBHOOK_SECRET_TEST=${stripeWebhookSecretTest}`);
    } else {
      console.log('\n❌ STRIPE_WEBHOOK_SECRET_TEST non trouvé');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 Commandes à exécuter pour configurer Supabase:');
    console.log('='.repeat(60));
    
    if (stripeSecretKeyTest) {
      console.log(`\nsupabase secrets set STRIPE_SECRET_KEY_TEST=${stripeSecretKeyTest} --project-ref vveswlmcgmizmjsriezw`);
    }
    
    if (stripeWebhookSecretTest) {
      console.log(`\nsupabase secrets set STRIPE_WEBHOOK_SECRET_TEST=${stripeWebhookSecretTest} --project-ref vveswlmcgmizmjsriezw`);
    }

    // Garder le navigateur ouvert 10 secondes pour vérification manuelle
    console.log('\n⏸️  Navigateur ouvert pour vérification manuelle (10 secondes)...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.log('\n💡 Solution: Récupère manuellement les clés depuis:');
    console.log('   - https://dashboard.stripe.com/test/apikeys');
    console.log('   - https://dashboard.stripe.com/test/webhooks');
  } finally {
    await browser.close();
  }
}

// Exécuter le script
getStripeTestKeys().catch(console.error);

