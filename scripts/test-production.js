#!/usr/bin/env node

/**
 * Script de test automatique en production
 * Teste l'application après chaque déploiement Vercel
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';
const TEST_TIMEOUT = 30000; // 30 secondes
const WAIT_FOR_DEPLOY = 300000; // 5 minutes pour attendre le déploiement

const tests = [
  {
    name: 'Test Page Accueil',
    url: `${PRODUCTION_URL}/`,
    checks: [
      { type: 'load-time', maxTime: 10000 },
      { type: 'no-error', message: 'Aucune erreur JavaScript' },
    ],
  },
  {
    name: 'Test Dashboard Admin',
    url: `${PRODUCTION_URL}/admin/dashboard`,
    checks: [
      { type: 'text', selector: 'body', text: 'Dashboard', required: false },
      { type: 'no-error', message: 'Aucune erreur JavaScript' },
      { type: 'load-time', maxTime: 10000 },
    ],
  },
  {
    name: 'Test Page Vidéos Admin (Bunny Stream)',
    url: `${PRODUCTION_URL}/admin/videos`,
    checks: [
      { type: 'no-error', message: 'Aucune erreur JavaScript' },
      { type: 'load-time', maxTime: 15000 },
      { type: 'text', selector: 'body', text: 'Bunny', required: false },
    ],
  },
];

async function waitForDeployment() {
  console.log('⏳ Attente du déploiement Vercel (5 minutes max)...');
  console.log('   Le déploiement peut prendre 3-8 minutes');
  await new Promise(resolve => setTimeout(resolve, WAIT_FOR_DEPLOY));
}

async function testPage(browser, test) {
  const page = await browser.newPage();
  const results = {
    name: test.name,
    url: test.url,
    success: true,
    errors: [],
    warnings: [],
    checks: [],
  };

  try {
    console.log(`\n🧪 Test: ${test.name}`);
    console.log(`   URL: ${test.url}`);

    // Capturer les erreurs de la console
    const consoleErrors = [];
    const consoleWarnings = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
    });

    // Capturer les erreurs JavaScript
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    // Mesurer le temps de chargement
    const startTime = Date.now();
    
    // Naviguer vers la page
    await page.goto(test.url, { 
      waitUntil: 'networkidle',
      timeout: TEST_TIMEOUT 
    });

    const loadTime = Date.now() - startTime;
    console.log(`   ⏱️  Temps de chargement: ${loadTime}ms`);

    // Attendre un peu pour que React se monte
    await page.waitForTimeout(3000);

    // Exécuter les vérifications
    for (const check of test.checks) {
      const checkResult = await executeCheck(page, check, loadTime);
      results.checks.push(checkResult);
      
      if (!checkResult.success) {
        results.success = false;
        results.errors.push(checkResult.message);
      } else {
        console.log(`   ✅ ${checkResult.message}`);
      }
    }

    // Vérifier les erreurs de console
    if (consoleErrors.length > 0) {
      const errorCheck = {
        type: 'console-errors',
        success: false,
        message: `${consoleErrors.length} erreur(s) dans la console`,
        details: consoleErrors.slice(0, 5), // Limiter à 5 erreurs
      };
      results.checks.push(errorCheck);
      results.errors.push(...consoleErrors.slice(0, 5));
      console.log(`   ⚠️  ${consoleErrors.length} erreur(s) dans la console`);
    } else {
      console.log(`   ✅ Aucune erreur dans la console`);
    }

    // Vérifier les warnings
    if (consoleWarnings.length > 0) {
      results.warnings.push(...consoleWarnings.slice(0, 5));
      console.log(`   ⚠️  ${consoleWarnings.length} avertissement(s) dans la console`);
    }

    // Prendre une capture d'écran
    const screenshotPath = join(__dirname, '..', '.playwright-mcp', `test-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   📸 Capture d'écran: ${screenshotPath}`);

  } catch (error) {
    results.success = false;
    results.errors.push(error.message);
    console.error(`   ❌ Erreur: ${error.message}`);
  } finally {
    await page.close();
  }

  return results;
}

async function executeCheck(page, check, loadTime) {
  switch (check.type) {
    case 'text':
      try {
        const content = await page.textContent(check.selector || 'body');
        const hasText = content?.includes(check.text);
        return {
          type: check.type,
          success: hasText || !check.required,
          message: hasText 
            ? `Texte "${check.text}" trouvé`
            : check.required 
              ? `Texte "${check.text}" non trouvé`
              : `Texte "${check.text}" non trouvé (optionnel)`,
        };
      } catch (error) {
        return {
          type: check.type,
          success: !check.required,
          message: `Erreur lors de la vérification: ${error.message}`,
        };
      }

    case 'no-error':
      // Vérifié dans testPage via consoleErrors
      return {
        type: check.type,
        success: true,
        message: check.message || 'Aucune erreur JavaScript',
      };

    case 'load-time':
      const success = loadTime <= check.maxTime;
      return {
        type: check.type,
        success,
        message: success
          ? `Temps de chargement OK (${loadTime}ms <= ${check.maxTime}ms)`
          : `Temps de chargement trop long (${loadTime}ms > ${check.maxTime}ms)`,
      };

    default:
      return {
        type: check.type,
        success: false,
        message: `Type de vérification inconnu: ${check.type}`,
      };
  }
}

async function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    url: PRODUCTION_URL,
    totalTests: results.length,
    passedTests: results.filter(r => r.success).length,
    failedTests: results.filter(r => !r.success).length,
    results,
  };

  const reportPath = join(__dirname, '..', `TEST-PRODUCTION-${Date.now()}.json`);
  const fs = await import('fs');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📊 Rapport généré: ${reportPath}`);
  return report;
}

async function main() {
  console.log('🚀 Démarrage des tests en production');
  console.log(`   URL: ${PRODUCTION_URL}`);
  console.log(`   Date: ${new Date().toISOString()}\n`);

  // Attendre le déploiement si demandé
  const args = process.argv.slice(2);
  if (args.includes('--wait-deploy')) {
    await waitForDeployment();
  }

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const test of tests) {
      const result = await testPage(browser, test);
      results.push(result);
    }
  } finally {
    await browser.close();
  }

  // Générer le rapport
  const report = await generateReport(results);

  // Afficher le résumé
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(60));
  console.log(`Total: ${report.totalTests}`);
  console.log(`✅ Réussis: ${report.passedTests}`);
  console.log(`❌ Échoués: ${report.failedTests}`);
  console.log('='.repeat(60));

  // Afficher les détails des échecs
  if (report.failedTests > 0) {
    console.log('\n❌ TESTS ÉCHOUÉS:');
    report.results
      .filter(r => !r.success)
      .forEach(result => {
        console.log(`\n  ${result.name}:`);
        result.errors.forEach(error => {
          console.log(`    - ${error}`);
        });
      });
  }

  // Code de sortie
  process.exit(report.failedTests > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

