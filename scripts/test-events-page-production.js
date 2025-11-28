#!/usr/bin/env node

/**
 * Script de test spécifique pour vérifier la suppression des sections
 * sur la page des événements en production
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';
const EVENTS_PAGE_URL = `${PRODUCTION_URL}/events`;
const TEST_TIMEOUT = 30000;

async function testEventsPage() {
  console.log('🧪 Test de la page Événements en production');
  console.log(`   URL: ${EVENTS_PAGE_URL}`);
  console.log(`   Date: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({ headless: false }); // headless: false pour voir ce qui se passe
  const page = await browser.newPage();

  const results = {
    sectionsRemoved: [],
    sectionsStillPresent: [],
    errors: [],
  };

  try {
    // Naviguer vers la page
    console.log('⏳ Navigation vers la page...');
    await page.goto(EVENTS_PAGE_URL, {
      waitUntil: 'networkidle',
      timeout: TEST_TIMEOUT,
    });

    // Attendre que React se monte
    await page.waitForTimeout(5000);

    // Prendre une capture d'écran
    const screenshotPath = join(__dirname, '..', '.playwright-mcp', `events-page-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Capture d'écran: ${screenshotPath}\n`);

    // Récupérer tout le texte de la page
    const pageContent = await page.textContent('body');

    // Vérifier que les sections supprimées ne sont PAS présentes
    const sectionsToCheck = [
      {
        name: 'Événements à Venir',
        keywords: ['Événements à Venir', 'Événements à Venir'],
      },
      {
        name: 'Inscriptions',
        keywords: ['Inscriptions'],
      },
      {
        name: 'Heures de contenu',
        keywords: ['Heures de contenu'],
      },
      {
        name: 'Types d\'événements',
        keywords: ['Types d\'événements', 'Types d\'événements'],
      },
      {
        name: 'Sessions Live',
        keywords: ['Sessions Live', 'Analyse en direct des marchés'],
      },
      {
        name: 'Ateliers',
        keywords: ['Ateliers', 'Sessions pratiques'],
      },
      {
        name: 'Masterclass',
        keywords: ['Masterclass', 'Contenu premium'],
      },
    ];

    console.log('🔍 Vérification des sections...\n');

    for (const section of sectionsToCheck) {
      const found = section.keywords.some((keyword) =>
        pageContent?.includes(keyword)
      );

      if (found) {
        results.sectionsStillPresent.push(section.name);
        console.log(`❌ "${section.name}" est TOUJOURS présente sur la page`);
      } else {
        results.sectionsRemoved.push(section.name);
        console.log(`✅ "${section.name}" a bien été supprimée`);
      }
    }

    // Vérifier que le header "Événements" est toujours présent
    const hasEventsHeader = pageContent?.includes('Événements');
    if (hasEventsHeader) {
      console.log(`\n✅ Le header "Événements" est présent (normal)`);
    }

    // Afficher le résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DU TEST');
    console.log('='.repeat(60));
    console.log(`✅ Sections supprimées correctement: ${results.sectionsRemoved.length}`);
    console.log(`❌ Sections encore présentes: ${results.sectionsStillPresent.length}`);
    console.log('='.repeat(60));

    if (results.sectionsStillPresent.length > 0) {
      console.log('\n⚠️  ATTENTION: Les sections suivantes sont encore présentes:');
      results.sectionsStillPresent.forEach((section) => {
        console.log(`   - ${section}`);
      });
      console.log('\n💡 Les modifications n\'ont peut-être pas été déployées en production.');
      console.log('   Vérifiez que le code a bien été commité et déployé sur Vercel.');
    } else {
      console.log('\n✅ Toutes les sections ont été correctement supprimées !');
    }

    // Attendre un peu pour voir le résultat
    await page.waitForTimeout(3000);
  } catch (error) {
    results.errors.push(error.message);
    console.error(`❌ Erreur: ${error.message}`);
  } finally {
    await browser.close();
  }

  return results;
}

testEventsPage()
  .then((results) => {
    process.exit(results.sectionsStillPresent.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

