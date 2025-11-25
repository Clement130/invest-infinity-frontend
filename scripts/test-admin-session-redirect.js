#!/usr/bin/env node

/**
 * Script de test spécifique pour vérifier le bug de redirection admin
 * Teste que l'utilisateur admin ne soit pas redirigé après un rafraîchissement de session
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://invest-infinity-frontend.vercel.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function testAdminSessionStability() {
  console.log('🔐 Test de stabilité de session admin');
  console.log(`   URL: ${PRODUCTION_URL}`);
  console.log(`   Date: ${new Date().toISOString()}\n`);

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('❌ Variables d\'environnement manquantes:');
    console.error('   ADMIN_EMAIL et ADMIN_PASSWORD doivent être définies');
    console.error('\n   Exemple:');
    console.error('   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=password node scripts/test-admin-session-redirect.js');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false }); // headless: false pour voir ce qui se passe
  const page = await browser.newPage();

  try {
    console.log('📝 Étape 1: Connexion à l\'application...');
    
    // Aller à la page d'accueil
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Ouvrir le modal de connexion (si nécessaire)
    const loginButton = await page.$('button:has-text("Connexion"), a:has-text("Connexion")');
    if (loginButton) {
      await loginButton.click();
      await page.waitForTimeout(1000);
    }

    // Remplir le formulaire de connexion
    console.log('   Remplissage du formulaire de connexion...');
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    
    if (emailInput && passwordInput) {
      await emailInput.fill(ADMIN_EMAIL);
      await passwordInput.fill(ADMIN_PASSWORD);
      
      // Cliquer sur le bouton de connexion
      const submitButton = await page.$('button[type="submit"], button:has-text("Se connecter")');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(3000);
      }
    }

    console.log('📝 Étape 2: Navigation vers le dashboard admin...');
    
    // Aller directement au dashboard admin
    await page.goto(`${PRODUCTION_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Vérifier qu'on est bien sur le dashboard admin
    const currentUrl = page.url();
    const isOnAdminPage = currentUrl.includes('/admin');
    
    if (!isOnAdminPage) {
      console.error(`❌ Échec: Redirigé vers ${currentUrl} au lieu de /admin`);
      await page.screenshot({ path: join(__dirname, '..', 'test-redirect-failed-1.png'), fullPage: true });
      process.exit(1);
    }

    console.log('   ✅ Connecté au dashboard admin');
    console.log(`   URL actuelle: ${currentUrl}`);

    console.log('\n📝 Étape 3: Simulation d\'un rafraîchissement de session...');
    console.log('   Attente de 10 secondes pour simuler une session active...');
    
    // Attendre 10 secondes pour simuler une session active
    const startTime = Date.now();
    let redirectCount = 0;
    const maxWaitTime = 10000; // 10 secondes

    // Surveiller les changements d'URL
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        const newUrl = frame.url();
        if (!newUrl.includes('/admin') && newUrl !== currentUrl) {
          redirectCount++;
          console.error(`\n❌ Redirection détectée vers: ${newUrl}`);
        }
      }
    });

    // Attendre et vérifier périodiquement
    while (Date.now() - startTime < maxWaitTime) {
      await page.waitForTimeout(1000);
      const currentUrlCheck = page.url();
      
      if (!currentUrlCheck.includes('/admin')) {
        redirectCount++;
        console.error(`\n❌ Redirection détectée après ${Math.floor((Date.now() - startTime) / 1000)}s`);
        console.error(`   URL: ${currentUrlCheck}`);
        await page.screenshot({ path: join(__dirname, '..', 'test-redirect-failed-2.png'), fullPage: true });
        break;
      }
    }

    // Vérifier le résultat final
    const finalUrl = page.url();
    const finalIsOnAdminPage = finalUrl.includes('/admin');

    console.log(`\n📊 Résultats:`);
    console.log(`   Temps d'attente: ${Math.floor((Date.now() - startTime) / 1000)}s`);
    console.log(`   Redirections détectées: ${redirectCount}`);
    console.log(`   URL finale: ${finalUrl}`);
    console.log(`   Reste sur /admin: ${finalIsOnAdminPage ? '✅' : '❌'}`);

    if (redirectCount > 0 || !finalIsOnAdminPage) {
      console.error('\n❌ TEST ÉCHOUÉ: Redirection détectée pendant la session');
      await page.screenshot({ path: join(__dirname, '..', 'test-redirect-failed-final.png'), fullPage: true });
      process.exit(1);
    } else {
      console.log('\n✅ TEST RÉUSSI: Aucune redirection détectée');
      await page.screenshot({ path: join(__dirname, '..', 'test-redirect-success.png'), fullPage: true });
    }

  } catch (error) {
    console.error('\n❌ Erreur pendant le test:', error);
    await page.screenshot({ path: join(__dirname, '..', 'test-redirect-error.png'), fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testAdminSessionStability().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

