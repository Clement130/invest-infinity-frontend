#!/usr/bin/env node

/**
 * Script de test automatique pour la connexion admin en production
 * Teste l'accès admin après chaque déploiement Vercel
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://investinfinity.fr';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'butcher13550@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Password130!';
const TEST_TIMEOUT = 30000; // 30 secondes

const tests = [
  {
    name: 'Test Connexion Admin',
    steps: [
      { action: 'navigate', url: `${PRODUCTION_URL}/login` },
      { action: 'wait', selector: 'input[type="email"], input[name="email"]' },
      { action: 'fill', selector: 'input[type="email"], input[name="email"]', value: ADMIN_EMAIL },
      { action: 'fill', selector: 'input[type="password"], input[name="password"]', value: ADMIN_PASSWORD },
      { action: 'click', selector: 'button[type="submit"], button:has-text("Se connecter")' },
      { action: 'wait', time: 3000 },
      { action: 'check-url', expected: '/admin' },
    ],
  },
  {
    name: 'Test Dashboard Admin',
    steps: [
      { action: 'navigate', url: `${PRODUCTION_URL}/admin` },
      { action: 'wait', time: 5000 },
      { action: 'check-no-error' },
      { action: 'check-console' },
    ],
  },
  {
    name: 'Test Pages Admin Critiques',
    pages: [
      { path: '/admin/users', name: 'Page Utilisateurs' },
      { path: '/admin/formations', name: 'Page Formations' },
      { path: '/admin/paiements', name: 'Page Paiements' },
    ],
  },
];

async function testAdminLogin(browser) {
  const page = await browser.newPage();
  const results = {
    success: true,
    errors: [],
    warnings: [],
  };

  try {
    console.log('\n🔐 Test: Connexion Admin');
    console.log(`   URL: ${PRODUCTION_URL}/login`);

    // Capturer les erreurs de la console
    const consoleErrors = [];
    const consoleWarnings = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        // Filtrer les erreurs non critiques
        if (!text.includes('favicon') && !text.includes('analytics')) {
          results.errors.push(`Console Error: ${text}`);
        }
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
        if (text.includes('MIME') || text.includes('text/html')) {
          results.errors.push(`⚠️ MIME Error: ${text}`);
        }
      }
    });

    // Capturer les erreurs JavaScript
    page.on('pageerror', (error) => {
      const errorMsg = error.message;
      if (!errorMsg.includes('favicon') && !errorMsg.includes('analytics')) {
        consoleErrors.push(errorMsg);
        results.errors.push(`JavaScript Error: ${errorMsg}`);
      }
    });

    // Test 1: Connexion
    console.log('   📝 Étape 1: Navigation vers /login');
    await page.goto(`${PRODUCTION_URL}/login`, { 
      waitUntil: 'networkidle',
      timeout: TEST_TIMEOUT 
    });

    // Attendre que le formulaire soit chargé
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    console.log('   ✅ Formulaire de connexion chargé');

    // Remplir le formulaire
    console.log('   📝 Étape 2: Remplissage du formulaire');
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    
    if (!emailInput || !passwordInput) {
      throw new Error('Champs de formulaire non trouvés');
    }

    await emailInput.fill(ADMIN_EMAIL);
    await passwordInput.fill(ADMIN_PASSWORD);
    console.log('   ✅ Formulaire rempli');

    // Cliquer sur le bouton de connexion
    console.log('   📝 Étape 3: Connexion');
    const submitButton = await page.$('button[type="submit"], button:has-text("Se connecter")');
    if (!submitButton) {
      throw new Error('Bouton de connexion non trouvé');
    }

    await submitButton.click();
    await page.waitForTimeout(3000);

    // Vérifier la redirection vers /admin
    console.log('   📝 Étape 4: Vérification de la redirection');
    const currentUrl = page.url();
    console.log(`   URL actuelle: ${currentUrl}`);

    if (!currentUrl.includes('/admin')) {
      // Prendre une capture d'écran pour debug
      await page.screenshot({ 
        path: join(__dirname, '..', 'test-admin-login-failed.png'), 
        fullPage: true 
      });
      throw new Error(`Redirection échouée. URL actuelle: ${currentUrl}. Attendu: /admin`);
    }

    console.log('   ✅ Redirection vers /admin réussie');

    // Attendre que la page admin se charge
    await page.waitForTimeout(3000);

    // Vérifier les erreurs de console
    if (consoleErrors.length > 0) {
      console.log(`   ⚠️  ${consoleErrors.length} erreur(s) détectée(s) dans la console`);
      consoleErrors.forEach(err => console.log(`      - ${err}`));
    }

    // Vérifier spécifiquement l'erreur MIME type
    const mimeErrors = results.errors.filter(e => e.includes('MIME') || e.includes('text/html'));
    if (mimeErrors.length > 0) {
      results.success = false;
      console.error('   ❌ Erreur MIME type détectée:', mimeErrors);
    }

    // Test 2: Vérifier que le dashboard admin se charge
    console.log('\n📊 Test: Dashboard Admin');
    await page.goto(`${PRODUCTION_URL}/admin`, { 
      waitUntil: 'networkidle',
      timeout: TEST_TIMEOUT 
    });

    await page.waitForTimeout(3000);

    // Vérifier qu'il n'y a pas d'erreur de chargement
    const pageContent = await page.content();
    if (pageContent.includes('Une erreur est survenue') || 
        pageContent.includes('text/html') && pageContent.includes('MIME')) {
      results.success = false;
      results.errors.push('Erreur de chargement détectée sur la page admin');
    }

    // Test 3: Tester les pages admin critiques
    console.log('\n📋 Test: Pages Admin Critiques');
    const criticalPages = [
      { path: '/admin/users', name: 'Utilisateurs' },
      { path: '/admin/formations', name: 'Formations' },
      { path: '/admin/paiements', name: 'Paiements' },
    ];

    for (const pageTest of criticalPages) {
      try {
        console.log(`   🧪 Test: ${pageTest.name}`);
        await page.goto(`${PRODUCTION_URL}${pageTest.path}`, { 
          waitUntil: 'networkidle',
          timeout: TEST_TIMEOUT 
        });
        await page.waitForTimeout(2000);

        const pageErrors = [];
        page.once('console', (msg) => {
          if (msg.type() === 'error') {
            const text = msg.text();
            if (!text.includes('favicon') && !text.includes('analytics')) {
              pageErrors.push(text);
            }
          }
        });

        const content = await page.content();
        if (content.includes('Une erreur est survenue')) {
          results.errors.push(`Erreur sur ${pageTest.name}`);
        } else {
          console.log(`   ✅ ${pageTest.name} chargée correctement`);
        }
      } catch (error) {
        console.error(`   ❌ Erreur sur ${pageTest.name}:`, error.message);
        results.errors.push(`Erreur sur ${pageTest.name}: ${error.message}`);
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(60));
    if (results.success && results.errors.length === 0) {
      console.log('✅ Tous les tests de connexion admin ont réussi');
      return true;
    } else {
      console.error('❌ Certains tests ont échoué:');
      results.errors.forEach(err => console.error(`   - ${err}`));
      return false;
    }

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    await page.screenshot({ 
      path: join(__dirname, '..', 'test-admin-login-error.png'), 
      fullPage: true 
    });
    return false;
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🧪 Test Automatique - Connexion Admin en Production');
  console.log('='.repeat(60));
  console.log(`URL: ${PRODUCTION_URL}`);
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log('='.repeat(60));

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const success = await testAdminLogin(browser);
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();




















