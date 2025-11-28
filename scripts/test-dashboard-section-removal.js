#!/usr/bin/env node

/**
 * Script de test pour vérifier la suppression de la section "Continue ta progression"
 * en production
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';
const TEST_TIMEOUT = 60000; // 60 secondes

async function testDashboardSectionRemoval() {
  console.log('🔍 Vérification de la suppression de la section "Continue ta progression"');
  console.log(`   URL: ${PRODUCTION_URL}/app/dashboard`);
  console.log(`   Date: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({ headless: false }); // headless: false pour voir ce qui se passe
  const page = await browser.newPage();

  try {
    // Naviguer vers la page d'accueil
    console.log('📄 Navigation vers la page d\'accueil...');
    await page.goto(PRODUCTION_URL, { 
      waitUntil: 'networkidle',
      timeout: TEST_TIMEOUT 
    });

    // Attendre un peu pour que la page se charge
    await page.waitForTimeout(2000);

    // Vérifier si l'utilisateur doit se connecter
    const currentUrl = page.url();
    console.log(`   URL actuelle: ${currentUrl}`);

    // Prendre une capture d'écran pour inspection
    const screenshotPath = join(__dirname, '..', `dashboard-check-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   📸 Capture d'écran: ${screenshotPath}`);

    // Vérifier le contenu de la page
    const pageContent = await page.textContent('body');
    
    // Vérifier que la section "Continue ta progression" n'existe PAS
    const hasContinueProgression = pageContent?.includes('Continue ta progression');
    const hasModulesRecommandes = pageContent?.includes('Modules recommandés');

    console.log('\n📊 Résultats de la vérification:');
    console.log('='.repeat(60));
    
    if (hasContinueProgression) {
      console.log('❌ La section "Continue ta progression" est toujours présente');
    } else {
      console.log('✅ La section "Continue ta progression" a bien été supprimée');
    }

    if (hasModulesRecommandes) {
      console.log('❌ Le texte "Modules recommandés" est toujours présent');
    } else {
      console.log('✅ Le texte "Modules recommandés" a bien été supprimé');
    }

    // Vérifier le code source de la page pour être sûr
    const pageSource = await page.content();
    const hasTargetIcon = pageSource.includes('lucide-react') && pageSource.includes('Target');
    
    console.log('\n🔍 Vérifications supplémentaires:');
    console.log(`   Code source contient "Target": ${hasTargetIcon ? '⚠️ Oui (peut être utilisé ailleurs)' : '✅ Non'}`);

    // Vérifier s'il y a des erreurs JavaScript
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.waitForTimeout(3000);

    if (consoleErrors.length > 0) {
      console.log(`\n⚠️  ${consoleErrors.length} erreur(s) JavaScript détectée(s):`);
      consoleErrors.slice(0, 5).forEach(error => {
        console.log(`   - ${error}`);
      });
    } else {
      console.log('\n✅ Aucune erreur JavaScript détectée');
    }

    const success = !hasContinueProgression && !hasModulesRecommandes;
    
    console.log('\n' + '='.repeat(60));
    console.log(success ? '✅ TEST RÉUSSI: La section a bien été supprimée' : '❌ TEST ÉCHOUÉ: La section est toujours présente');
    console.log('='.repeat(60));

    return success;

  } catch (error) {
    console.error(`\n❌ Erreur lors du test: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('⏳ Attente de 30 secondes pour que Vercel déploie...\n');
  await new Promise(resolve => setTimeout(resolve, 30000));

  const success = await testDashboardSectionRemoval();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

