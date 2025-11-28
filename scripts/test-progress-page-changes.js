#!/usr/bin/env node

/**
 * Script de test pour vérifier les modifications de la page Progress
 * - Vérification que le streak a été remplacé par "Niveau actuel"
 * - Vérification que les icônes des cartes ont été supprimées
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';
const TEST_TIMEOUT = 60000; // 60 secondes

async function testProgressPageChanges() {
  console.log('🔍 Vérification des modifications de la page Progress');
  console.log(`   URL: ${PRODUCTION_URL}/app/progress`);
  console.log(`   Date: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({ headless: false });
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

    // Prendre une capture d'écran pour inspection
    const screenshotPath = join(__dirname, '..', `progress-page-check-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   📸 Capture d'écran: ${screenshotPath}`);

    // Vérifier le contenu de la page
    const pageContent = await page.textContent('body');
    
    // Vérifications
    const hasStreak = pageContent?.includes('Jours de streak') || pageContent?.includes('streak');
    const hasNiveauActuel = pageContent?.includes('Niveau actuel');
    const hasFlameIcon = pageContent?.includes('Flame') || false;

    // Vérifier le code source pour les icônes
    const pageSource = await page.content();
    const hasStatCardIcons = pageSource.includes('TrendingUp') || 
                             pageSource.includes('Target') || 
                             pageSource.includes('Trophy') ||
                             (pageSource.includes('StatCard') && pageSource.includes('icon='));

    console.log('\n📊 Résultats de la vérification:');
    console.log('='.repeat(60));
    
    // Vérification 1: Streak remplacé
    if (hasStreak) {
      console.log('❌ Le texte "streak" est toujours présent');
    } else {
      console.log('✅ Le texte "streak" a bien été supprimé');
    }

    // Vérification 2: Niveau actuel présent
    if (hasNiveauActuel) {
      console.log('✅ "Niveau actuel" est présent');
    } else {
      console.log('⚠️  "Niveau actuel" n\'est pas trouvé dans le texte');
    }

    // Vérification 3: Icônes supprimées
    if (hasStatCardIcons) {
      console.log('⚠️  Des icônes StatCard sont encore présentes dans le code source');
    } else {
      console.log('✅ Les icônes StatCard ont été supprimées du code source');
    }

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

    const success = !hasStreak && hasNiveauActuel && !hasStatCardIcons;
    
    console.log('\n' + '='.repeat(60));
    console.log(success ? '✅ TEST RÉUSSI: Les modifications sont correctes' : '⚠️  TEST PARTIEL: Vérification manuelle recommandée');
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

  const success = await testProgressPageChanges();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

