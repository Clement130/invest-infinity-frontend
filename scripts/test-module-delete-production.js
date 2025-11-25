#!/usr/bin/env node

/**
 * Script de test pour vérifier la fonctionnalité de suppression de module en production
 * Teste que le bouton de suppression est présent et fonctionne
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Récupérer l'URL de production depuis les arguments ou utiliser la valeur par défaut
const PRODUCTION_URL = process.argv[2] || 'https://invest-infinity-frontend.vercel.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

console.log('🔍 Test de la fonctionnalité de suppression de module en production');
console.log('==================================================================\n');
console.log(`URL de production: ${PRODUCTION_URL}\n`);

async function testModuleDelete() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 1. Aller sur la page de login
    console.log('📝 Étape 1: Connexion à l\'application...');
    await page.goto(`${PRODUCTION_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 2. Se connecter (si credentials fournis)
    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
      console.log('   Connexion avec les credentials...');
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    } else {
      console.log('   ⚠️  Pas de credentials fournis, test manuel requis');
      console.log('   Utilisez: ADMIN_EMAIL=xxx ADMIN_PASSWORD=xxx node scripts/test-module-delete-production.js');
    }

    // 3. Aller sur la page de gestion des vidéos
    console.log('\n📹 Étape 2: Navigation vers la page de gestion des vidéos...');
    await page.goto(`${PRODUCTION_URL}/admin/videos`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 4. Vérifier que la page est chargée
    console.log('   Vérification du chargement de la page...');
    const pageTitle = await page.title();
    console.log(`   Titre de la page: ${pageTitle}`);

    // 5. Chercher les modules
    console.log('\n🔍 Étape 3: Recherche des modules...');
    await page.waitForTimeout(2000);

    // Chercher les sections de modules
    const moduleSections = await page.$$('[class*="ModuleSection"], [class*="module"]');
    console.log(`   Nombre de modules trouvés: ${moduleSections.length}`);

    // 6. Vérifier la présence du bouton de suppression
    console.log('\n🗑️  Étape 4: Vérification du bouton de suppression...');
    
    // Chercher les boutons de suppression (icône Trash2)
    const deleteButtons = await page.$$('button[title*="Supprimer"], button[title*="supprimer"], svg[class*="Trash"], button:has(svg[class*="trash"])');
    
    // Alternative: chercher par texte ou aria-label
    const deleteButtonsByText = await page.$$('button:has-text("Supprimer")');
    
    const allDeleteButtons = [...deleteButtons, ...deleteButtonsByText];
    
    console.log(`   Boutons de suppression trouvés: ${allDeleteButtons.length}`);

    if (allDeleteButtons.length === 0) {
      console.log('   ⚠️  Aucun bouton de suppression trouvé');
      console.log('   Vérification manuelle requise...');
      
      // Prendre une capture d'écran pour debug
      await page.screenshot({ path: 'test-module-delete-debug.png', fullPage: true });
      console.log('   📸 Capture d\'écran sauvegardée: test-module-delete-debug.png');
    } else {
      console.log('   ✅ Bouton(s) de suppression trouvé(s)');
    }

    // 7. Vérifier la structure HTML
    console.log('\n📋 Étape 5: Analyse de la structure HTML...');
    const moduleHTML = await page.evaluate(() => {
      const modules = Array.from(document.querySelectorAll('[class*="module"], [class*="Module"]'));
      return modules.map(m => ({
        title: m.textContent?.substring(0, 50),
        hasEditButton: !!m.querySelector('button[title*="Éditer"], button[title*="éditer"]'),
        hasDeleteButton: !!m.querySelector('button[title*="Supprimer"], button[title*="supprimer"]'),
        hasAddButton: !!m.querySelector('button[title*="Ajouter"], button[title*="ajouter"]'),
      }));
    });

    console.log('   Structure des modules:');
    moduleHTML.forEach((module, index) => {
      console.log(`   Module ${index + 1}:`);
      console.log(`     - Titre: ${module.title}`);
      console.log(`     - Bouton Éditer: ${module.hasEditButton ? '✅' : '❌'}`);
      console.log(`     - Bouton Supprimer: ${module.hasDeleteButton ? '✅' : '❌'}`);
      console.log(`     - Bouton Ajouter: ${module.hasAddButton ? '✅' : '❌'}`);
    });

    // 8. Vérifier les imports et erreurs console
    console.log('\n🔍 Étape 6: Vérification des erreurs console...');
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log(`   ⚠️  ${consoleErrors.length} erreur(s) trouvée(s):`);
      consoleErrors.forEach((error, index) => {
        console.log(`     ${index + 1}. ${error.substring(0, 100)}`);
      });
    } else {
      console.log('   ✅ Aucune erreur console');
    }

    // 9. Résumé
    console.log('\n📊 Résumé du test:');
    console.log('==================');
    const hasDeleteButton = moduleHTML.some(m => m.hasDeleteButton);
    const hasEditButton = moduleHTML.some(m => m.hasEditButton);
    
    if (hasDeleteButton) {
      console.log('✅ Le bouton de suppression est présent dans au moins un module');
    } else {
      console.log('❌ Le bouton de suppression n\'est pas visible');
      console.log('   Vérifiez que:');
      console.log('   1. Les changements ont été déployés sur Vercel');
      console.log('   2. Le cache du navigateur est vidé');
      console.log('   3. Le composant ModuleSection contient bien le bouton');
    }

    if (hasEditButton) {
      console.log('✅ Le bouton d\'édition est présent');
    }

    console.log('\n💡 Pour tester manuellement:');
    console.log('   1. Ouvrez la page /admin/videos');
    console.log('   2. Cherchez l\'icône de corbeille rouge à côté du bouton d\'édition');
    console.log('   3. Cliquez dessus pour voir le modal de confirmation');

    // Attendre un peu pour inspection manuelle
    console.log('\n⏸️  Pause de 10 secondes pour inspection manuelle...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    await page.screenshot({ path: 'test-module-delete-error.png', fullPage: true });
    console.log('   📸 Capture d\'écran d\'erreur sauvegardée');
  } finally {
    await browser.close();
  }
}

// Exécuter le test
testModuleDelete()
  .then(() => {
    console.log('\n✅ Test terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

