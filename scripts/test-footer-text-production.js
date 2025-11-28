#!/usr/bin/env node

/**
 * Script de test pour vérifier le texte du footer en production
 * Vérifie que le texte a été modifié pour orientation formation
 */

import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';
const TEST_TIMEOUT = 30000; // 30 secondes

async function testFooterText() {
  console.log('🧪 Test du texte du footer en production');
  console.log('==========================================\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`📡 Connexion à ${PRODUCTION_URL}...`);
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });

    console.log('✅ Page chargée\n');

    // Attendre que le footer soit chargé
    await page.waitForSelector('footer', { timeout: 10000 });

    // Récupérer le texte du footer
    const footerText = await page.textContent('footer');
    
    console.log('📝 Texte du footer trouvé:');
    console.log('─'.repeat(50));
    
    // Vérifier que le nouveau texte CTA optimisé est présent
    const footerTextLower = footerText.toLowerCase();
    const expectedHookText = 'arrête de perdre de l\'argent';
    const expectedFormationText = 'rejoins la formation';
    const expectedStrategiesText = 'stratégies ict';
    const expectedGainsText = 'commence à générer';
    const oldText = 'copie mes alertes';
    
    if (footerTextLower.includes(expectedHookText) && footerTextLower.includes(expectedFormationText)) {
      console.log('✅ NOUVEAU CTA OPTIMISÉ TROUVÉ: "Arrête de perdre de l\'argent. Rejoins la formation..."');
      console.log('✅ CTA avec hook émotionnel et urgence maximale confirmé');
      if (footerTextLower.includes(expectedGainsText)) {
        console.log('✅ Mention des gains confirmée\n');
      } else {
        console.log('⚠️  Mention des gains partielle\n');
      }
    } else if (footerTextLower.includes(expectedFormationText) && footerTextLower.includes(expectedStrategiesText)) {
      console.log('⚠️  Texte partiel trouvé - Le hook émotionnel manque\n');
    } else if (footerTextLower.includes(oldText)) {
      console.log('❌ ANCIEN TEXTE TROUVÉ: "copie mes alertes"');
      console.log('❌ Le changement n\'est pas encore déployé\n');
    } else {
      console.log('⚠️  Texte non trouvé - Vérification manuelle nécessaire\n');
    }

    // Afficher un extrait du footer pour vérification
    const footerExcerpt = footerText.substring(0, 200);
    console.log('📄 Extrait du footer:');
    console.log(footerExcerpt + '...\n');

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
testFooterText().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

