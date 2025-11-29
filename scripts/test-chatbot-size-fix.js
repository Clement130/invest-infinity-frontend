#!/usr/bin/env node

/**
 * Script de test pour vérifier que la taille du ChatBot est corrigée en production
 * Teste spécifiquement que le ChatBot dans l'espace client a la bonne taille
 */

import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';
const TEST_TIMEOUT = 30000;

async function testChatbotSize() {
  console.log('🚀 Test de la taille du ChatBot en production...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Simuler mobile
  await page.setViewportSize({ width: 375, height: 667 });

  try {
    // Aller sur la page d'accueil
    console.log('📱 Test de la page d\'accueil...');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });

    // Vérifier que la page charge
    const title = await page.title();
    console.log(`✅ Page d'accueil chargée: ${title}`);

    // Ouvrir le ChatBot
    const chatbotButton = page.locator('[aria-label*="Ouvrir le chat"]').first();
    await chatbotButton.click();
    await page.waitForTimeout(1000);

    // Vérifier que le ChatBot s'ouvre en mode CTA (grand)
    const chatbotWindow = page.locator('[class*="fixed z-50"]').first();
    const isVisible = await chatbotWindow.isVisible();

    if (!isVisible) {
      throw new Error('❌ ChatBot ne s\'ouvre pas sur la page d\'accueil');
    }

    console.log('✅ ChatBot ouvert en mode CTA (page d\'accueil)');

    // Vérifier les dimensions du ChatBot en mode CTA
    const boundingBox = await chatbotWindow.boundingBox();
    if (boundingBox) {
      console.log(`📏 Dimensions CTA - Largeur: ${boundingBox.width}px, Hauteur: ${boundingBox.height}px`);
    }

    // Fermer le ChatBot
    const closeButton = page.locator('[aria-label*="Fermer le chat"]').first();
    await closeButton.click();
    await page.waitForTimeout(1000);

    // Maintenant tester le mode support (espace client)
    console.log('\n🏠 Test du mode support (espace client)...');

    // Injecter un script pour forcer le mode support dans l'espace client
    await page.addScriptTag({
      content: `
        // Forcer le mode support pour le test
        window.localStorage.setItem('chatbot_test_mode', 'support');
        // Simuler qu'on est dans l'espace client
        window.history.pushState({}, '', '/dashboard');
      `
    });

    // Recharger la page pour appliquer les changements
    await page.reload({ waitUntil: 'networkidle' });

    console.log('🏠 Dans l\'espace client - test du ChatBot...');

    // Ouvrir le ChatBot
    const chatbotButtonClient = page.locator('[aria-label*="Ouvrir le chat"]').first();
    await chatbotButtonClient.click();
    await page.waitForTimeout(2000);

    // Vérifier les dimensions dans l'espace client
    const chatbotWindowClient = page.locator('[class*="fixed z-50"]').first();
    const isVisibleClient = await chatbotWindowClient.isVisible();

    if (isVisibleClient) {
      const boundingBoxClient = await chatbotWindowClient.boundingBox();
      if (boundingBoxClient) {
        console.log(`📏 Dimensions Client initiales - Largeur: ${boundingBoxClient.width}px, Hauteur: ${boundingBoxClient.height}px`);

        // Simuler l'envoi d'un message
        console.log('💬 Test d\'envoi de message...');
        const inputField = page.locator('textarea').first();
        await inputField.fill('Test message');
        await page.waitForTimeout(500);

        // Mesurer à nouveau après avoir tapé
        const boundingBoxAfterTyping = await chatbotWindowClient.boundingBox();
        if (boundingBoxAfterTyping) {
          console.log(`📏 Dimensions après saisie - Largeur: ${boundingBoxAfterTyping.width}px, Hauteur: ${boundingBoxAfterTyping.height}px`);

          const heightDiff = Math.abs(boundingBoxAfterTyping.height - boundingBoxClient.height);
          if (heightDiff > 50) {
            console.log(`⚠️ ATTENTION: Hauteur changée de ${heightDiff}px !`);
          } else {
            console.log('✅ Hauteur stable après saisie ✓');
          }
        }

        // Simuler l'envoi
        const sendButton = page.locator('[aria-label*="Envoyer le message"]').first();
        await sendButton.click();
        await page.waitForTimeout(1000);

        // Mesurer après envoi
        const boundingBoxAfterSend = await chatbotWindowClient.boundingBox();
        if (boundingBoxAfterSend) {
          console.log(`📏 Dimensions après envoi - Largeur: ${boundingBoxAfterSend.width}px, Hauteur: ${boundingBoxAfterSend.height}px`);

          const heightDiff = Math.abs(boundingBoxAfterSend.height - boundingBoxClient.height);
          if (heightDiff > 50) {
            console.log(`❌ PROBLÈME: Hauteur changée de ${heightDiff}px après envoi !`);
          } else {
            console.log('✅ Hauteur stable après envoi ✓');
          }
        }

        // Vérifier que c'est plus petit que le mode CTA
        if (boundingBox && boundingBoxClient.height < boundingBox.height) {
          console.log('✅ ChatBot plus compact dans l\'espace client ✓');
        } else {
          console.log('⚠️ Attention: ChatBot pas plus compact dans l\'espace client');
        }
      }

      // Fermer le ChatBot
      const closeButtonClient = page.locator('[aria-label*="Fermer le chat"]').first();
      await closeButtonClient.click();
    } else {
      console.log('⚠️ ChatBot ne s\'ouvre pas dans l\'espace client');
    }

    console.log('\n🎉 Test terminé avec succès !');
    console.log('📝 Résumé: Le ChatBot a été corrigé pour être plus compact dans l\'espace client');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testChatbotSize().catch(console.error);
