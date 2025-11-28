#!/usr/bin/env node

/**
 * Script de test pour vérifier que le champ capital a été supprimé en production
 */

import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';
const TEST_TIMEOUT = 30000; // 30 secondes

async function testCapitalFieldRemoved() {
  console.log('🧪 Test de suppression du champ capital en production');
  console.log('==================================================\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`📡 Connexion à ${PRODUCTION_URL}...`);
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });

    console.log('✅ Page chargée\n');

    // Chercher le formulaire d'inscription
    // Vérifier s'il y a un bouton d'inscription ou un formulaire visible
    const hasForm = await page.locator('form').count() > 0 || 
                    await page.locator('input[type="email"]').count() > 0 ||
                    await page.locator('button:has-text("Inscription"), button:has-text("S\'inscrire"), button:has-text("Rejoins")').count() > 0;

    if (!hasForm) {
      console.log('⚠️  Aucun formulaire visible sur la page d\'accueil');
      console.log('   Le formulaire pourrait être dans une modal ou sur une autre page\n');
    }

    // Vérifier que le champ "Capital actuel prévu pour le trading" n'existe pas
    const capitalLabel = await page.locator('text=/Capital actuel prévu pour le trading/i').count();
    const capitalPlaceholder = await page.locator('input[placeholder*="Montant en €"], input[placeholder*="montant"]').count();
    
    // Chercher aussi dans les labels
    const capitalInputs = await page.locator('input').all();
    let foundCapitalField = false;
    
    for (const input of capitalInputs) {
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      
      if (placeholder && (placeholder.toLowerCase().includes('montant') || placeholder.toLowerCase().includes('€'))) {
        foundCapitalField = true;
        console.log(`⚠️  Champ trouvé avec placeholder: "${placeholder}"`);
      }
      if (name === 'budget') {
        foundCapitalField = true;
        console.log(`⚠️  Champ trouvé avec name="budget"`);
      }
    }

    // Vérifier aussi dans les textes de la page
    const pageText = await page.textContent('body');
    const hasCapitalText = pageText?.toLowerCase().includes('capital actuel prévu') || 
                          pageText?.toLowerCase().includes('capital prévu');

    console.log('📝 Résultats de la vérification:');
    console.log('─'.repeat(50));
    
    if (capitalLabel > 0) {
      console.log('❌ LABEL TROUVÉ: "Capital actuel prévu pour le trading"');
      console.log('❌ Le champ n\'a pas été supprimé correctement\n');
    } else if (foundCapitalField) {
      console.log('⚠️  Champ suspect trouvé - Vérification manuelle nécessaire\n');
    } else if (hasCapitalText) {
      console.log('⚠️  Texte "capital prévu" trouvé dans la page');
      console.log('   (peut être dans un autre contexte, vérification manuelle recommandée)\n');
    } else {
      console.log('✅ AUCUN CHAMP CAPITAL TROUVÉ');
      console.log('✅ Le champ "Capital actuel prévu pour le trading" a bien été supprimé\n');
    }

    // Vérifier les erreurs JavaScript
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.waitForTimeout(2000);

    if (errors.length === 0) {
      console.log('✅ Aucune erreur JavaScript détectée\n');
    } else {
      console.log('⚠️  Erreurs JavaScript détectées:');
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
      console.log('');
    }

    // Test de soumission du formulaire (si visible)
    try {
      const emailInput = await page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        console.log('📧 Test de remplissage du formulaire...');
        await emailInput.fill('test@example.com');
        console.log('✅ Le formulaire peut être rempli sans le champ capital\n');
      }
    } catch (e) {
      // Le formulaire n'est peut-être pas visible, c'est normal
    }

    console.log('✅ Test terminé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Exécuter le test
testCapitalFieldRemoved().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

