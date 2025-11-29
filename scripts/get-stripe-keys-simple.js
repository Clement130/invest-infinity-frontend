/**
 * Script simple pour récupérer les clés Stripe TEST
 * 
 * Ce script ouvre Stripe Dashboard dans ton navigateur et te guide
 * pour copier les clés manuellement.
 * 
 * Usage: node scripts/get-stripe-keys-simple.js
 */

import { chromium } from 'playwright';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 Script de récupération des clés Stripe TEST\n');
  console.log('Ce script va ouvrir Stripe Dashboard dans ton navigateur.');
  console.log('Tu devras copier les clés manuellement.\n');

  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. API Keys TEST
    console.log('📋 Étape 1: Récupération de STRIPE_SECRET_KEY_TEST');
    console.log('   Ouvre: https://dashboard.stripe.com/test/apikeys');
    await page.goto('https://dashboard.stripe.com/test/apikeys');
    
    console.log('\n   ✅ Navigateur ouvert sur la page des API Keys TEST');
    console.log('   👉 Clique sur "Reveal test key" ou "Révéler"');
    console.log('   👉 Copie la clé qui commence par sk_test_\n');
    
    const secretKey = await question('   Colle ici STRIPE_SECRET_KEY_TEST (sk_test_xxx): ');
    
    if (!secretKey.startsWith('sk_test_')) {
      console.log('   ⚠️  La clé ne semble pas valide (doit commencer par sk_test_)');
    }

    // 2. Webhook TEST
    console.log('\n📋 Étape 2: Configuration du webhook TEST');
    console.log('   Ouvre: https://dashboard.stripe.com/test/webhooks');
    await page.goto('https://dashboard.stripe.com/test/webhooks');
    
    console.log('\n   ✅ Navigateur ouvert sur la page des Webhooks TEST');
    console.log('   👉 Si un webhook existe déjà avec l\'URL:');
    console.log('      https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook-test');
    console.log('      → Clique dessus et copie le "Signing secret" (whsec_xxx)');
    console.log('   👉 Sinon, crée un nouveau webhook:');
    console.log('      → Clique sur "Add endpoint"');
    console.log('      → URL: https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook-test');
    console.log('      → Sélectionne les événements (checkout.session.completed, invoice.paid, etc.)');
    console.log('      → Clique sur "Add endpoint"');
    console.log('      → Copie le "Signing secret" qui s\'affiche\n');
    
    const webhookSecret = await question('   Colle ici STRIPE_WEBHOOK_SECRET_TEST (whsec_xxx): ');
    
    if (!webhookSecret.startsWith('whsec_')) {
      console.log('   ⚠️  Le secret ne semble pas valide (doit commencer par whsec_)');
    }

    // 3. Afficher les commandes à exécuter
    console.log('\n' + '='.repeat(70));
    console.log('✅ RÉSULTATS:');
    console.log('='.repeat(70));
    console.log(`\nSTRIPE_SECRET_KEY_TEST=${secretKey.trim()}`);
    console.log(`STRIPE_WEBHOOK_SECRET_TEST=${webhookSecret.trim()}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('💡 Commandes à exécuter pour configurer Supabase:');
    console.log('='.repeat(70));
    console.log(`\nsupabase secrets set STRIPE_SECRET_KEY_TEST="${secretKey.trim()}" --project-ref vveswlmcgmizmjsriezw`);
    console.log(`\nsupabase secrets set STRIPE_WEBHOOK_SECRET_TEST="${webhookSecret.trim()}" --project-ref vveswlmcgmizmjsriezw`);
    
    console.log('\n✅ Copie ces commandes et exécute-les dans ton terminal !');
    console.log('   Ou donne-moi les valeurs et je les configure pour toi.\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  } finally {
    await question('\n⏸️  Appuie sur Entrée pour fermer le navigateur...');
    await browser.close();
    rl.close();
  }
}

main().catch(console.error);

