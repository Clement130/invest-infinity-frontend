#!/usr/bin/env node

/**
 * Script de test pour vérifier la suppression de la carte "Niveau actuel"
 * de la section Stats Cards en production
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';
const TEST_TIMEOUT = 60000; // 60 secondes

async function testStatsCardsRemoval() {
  console.log('🔍 Vérification de la suppression de la carte "Niveau actuel"');
  console.log(`   URL: ${PRODUCTION_URL}/app/progress`);
  console.log(`   Date: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Naviguer vers la page de progression
    console.log('📄 Navigation vers la page de progression...');
    await page.goto(`${PRODUCTION_URL}/app/progress`, { 
      waitUntil: 'networkidle',
      timeout: TEST_TIMEOUT 
    });

    // Attendre que la page se charge complètement
    await page.waitForTimeout(5000);

    // Prendre une capture d'écran pour inspection
    const screenshotPath = join(__dirname, '..', `stats-cards-check-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   📸 Capture d'écran: ${screenshotPath}`);

    // Vérifier le contenu de la page
    const pageContent = await page.textContent('body');
    
    // Vérifications
    const hasStatsCardsSection = pageContent?.includes('Stats Cards') || false;
    
    // Compter le nombre de fois que "Niveau actuel" apparaît
    const niveauActuelMatches = (pageContent?.match(/Niveau actuel/g) || []).length;
    
    // Vérifier le code source pour la section Stats Cards
    const pageSource = await page.content();
    const hasStatsCardsInCode = pageSource.includes('Stats Cards') || 
                                (pageSource.includes('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4') && 
                                 pageSource.includes('Niveau actuel'));
    
    // Vérifier s'il y a des cartes avec "Niveau actuel" dans la section Stats Cards
    const hasStatsCardWithNiveau = pageSource.includes('text-yellow-400') && 
                                    pageSource.includes('Niveau actuel') &&
                                    pageSource.includes('text-2xl font-bold');

    console.log('\n📊 Résultats de la vérification:');
    console.log('='.repeat(60));
    
    // Vérification 1: Section Stats Cards supprimée
    if (hasStatsCardsInCode) {
      console.log('⚠️  La section "Stats Cards" est encore présente dans le code source');
    } else {
      console.log('✅ La section "Stats Cards" a bien été supprimée du code source');
    }

    // Vérification 2: Carte "Niveau actuel" dans Stats Cards
    if (hasStatsCardWithNiveau) {
      console.log('❌ La carte "Niveau actuel" avec style yellow-400 est encore présente');
    } else {
      console.log('✅ La carte "Niveau actuel" de la section Stats Cards a été supprimée');
    }

    // Vérification 3: "Niveau actuel" dans Progress Overview (doit rester)
    // On vérifie qu'il reste au moins une occurrence (dans Progress Overview)
    if (niveauActuelMatches === 1) {
      console.log('✅ "Niveau actuel" reste uniquement dans Progress Overview');
    } else if (niveauActuelMatches === 0) {
      console.log('⚠️  "Niveau actuel" n\'est trouvé nulle part');
    } else {
      console.log(`⚠️  "Niveau actuel" apparaît ${niveauActuelMatches} fois (devrait être 1)`);
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

    const success = !hasStatsCardsInCode && !hasStatsCardWithNiveau && niveauActuelMatches === 1;
    
    console.log('\n' + '='.repeat(60));
    console.log(success ? '✅ TEST RÉUSSI: La carte a bien été supprimée' : '⚠️  TEST PARTIEL: Vérification manuelle recommandée');
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

  const success = await testStatsCardsRemoval();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

