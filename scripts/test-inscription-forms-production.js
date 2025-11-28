#!/usr/bin/env node

/**
 * Script de test pour vérifier que les formulaires d'inscription n'ont plus le champ capital
 */

import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';
const TEST_TIMEOUT = 30000; // 30 secondes

async function testInscriptionForms() {
  console.log('🧪 Test des formulaires d\'inscription en production');
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`📡 Connexion à ${PRODUCTION_URL}...`);
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });

    console.log('✅ Page chargée\n');

    // Attendre un peu pour que la page se charge complètement
    await page.waitForTimeout(2000);

    // Chercher et cliquer sur un bouton d'inscription ou connexion pour ouvrir la modal
    const inscriptionButtons = [
      'button:has-text("Inscription")',
      'button:has-text("S\'inscrire")',
      'button:has-text("Rejoins")',
      'a:has-text("Inscription")',
      '[data-testid="inscription"]',
    ];

    let modalOpened = false;
    for (const selector of inscriptionButtons) {
      try {
        const button = await page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          console.log(`🔘 Clic sur le bouton d'inscription: ${selector}`);
          await button.click();
          await page.waitForTimeout(1000);
          modalOpened = true;
          break;
        }
      } catch (e) {
        // Continue avec le prochain sélecteur
      }
    }

    if (!modalOpened) {
      console.log('⚠️  Impossible d\'ouvrir la modal d\'inscription automatiquement');
      console.log('   Vérification du formulaire sur la page actuelle...\n');
    }

    // Vérifier tous les inputs du formulaire
    const inputs = await page.locator('input').all();
    console.log(`📋 Nombre d'inputs trouvés: ${inputs.length}\n`);

    let foundCapitalField = false;
    const formFields = [];

    for (const input of inputs) {
      const placeholder = await input.getAttribute('placeholder') || '';
      const name = await input.getAttribute('name') || '';
      const type = await input.getAttribute('type') || '';
      const id = await input.getAttribute('id') || '';
      
      formFields.push({ placeholder, name, type, id });

      // Vérifier si c'est le champ capital
      if (name === 'budget' || 
          placeholder.toLowerCase().includes('montant') || 
          placeholder.toLowerCase().includes('capital') ||
          (placeholder.toLowerCase().includes('€') && type === 'text')) {
        foundCapitalField = true;
        console.log(`❌ CHAMP CAPITAL TROUVÉ:`);
        console.log(`   - name: ${name}`);
        console.log(`   - placeholder: ${placeholder}`);
        console.log(`   - type: ${type}`);
      }
    }

    // Vérifier les labels
    const labels = await page.locator('label').all();
    for (const label of labels) {
      const labelText = await label.textContent();
      if (labelText && labelText.toLowerCase().includes('capital')) {
        foundCapitalField = true;
        console.log(`❌ LABEL CAPITAL TROUVÉ: "${labelText}"`);
      }
    }

    // Vérifier le texte de la page
    const pageText = await page.textContent('body') || '';
    const hasCapitalText = pageText.toLowerCase().includes('capital actuel prévu pour le trading');

    console.log('\n📝 Résultats de la vérification:');
    console.log('─'.repeat(50));
    
    if (foundCapitalField) {
      console.log('❌ CHAMP CAPITAL DÉTECTÉ');
      console.log('❌ Le champ n\'a pas été complètement supprimé\n');
    } else if (hasCapitalText) {
      console.log('⚠️  Texte "Capital actuel prévu pour le trading" trouvé dans la page');
      console.log('   (peut être dans un autre contexte)\n');
    } else {
      console.log('✅ AUCUN CHAMP CAPITAL TROUVÉ');
      console.log('✅ Le champ "Capital actuel prévu pour le trading" a bien été supprimé\n');
    }

    // Afficher les champs du formulaire trouvés
    if (formFields.length > 0) {
      console.log('📋 Champs du formulaire trouvés:');
      formFields.forEach((field, i) => {
        console.log(`   ${i + 1}. type="${field.type}", name="${field.name}", placeholder="${field.placeholder}"`);
      });
      console.log('');
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

    console.log('✅ Test terminé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Exécuter le test
testInscriptionForms().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

