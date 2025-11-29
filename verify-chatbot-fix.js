import { chromium } from 'playwright';

async function verifyChatbotFix() {
  console.log('🔍 Vérification des corrections du chatbot en production...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('📱 Navigation vers https://www.investinfinity.fr/...');
    await page.goto('https://www.investinfinity.fr/');

    // Attendre que la page se charge
    await page.waitForLoadState('networkidle');
    console.log('✅ Page chargée');

    // Fermer les modals ou overlays potentiels
    try {
      const closeButtons = page.locator('[aria-label*="close"], [class*="close"], button:has-text("×"), button:has-text("✕")').all();
      for (const button of await closeButtons) {
        if (await button.isVisible()) {
          await button.click({ force: true });
          await page.waitForTimeout(500);
        }
      }
    } catch (e) {
      // Ignorer les erreurs de fermeture
    }

    // Chercher le bouton du chatbot
    const chatbotButton = page.locator('[data-testid="chatbot-button"], .chatbot-button, [class*="chat"], button:has-text("chat")').first();

    if (await chatbotButton.isVisible()) {
      console.log('🤖 Chatbot trouvé, ouverture...');

      // Essayer de cliquer avec force pour éviter les overlays
      await chatbotButton.click({ force: true });

      // Attendre que le chatbot s'ouvre
      await page.waitForTimeout(3000);

      // Tester un message simple qui devrait déclencher la réponse "how_it_works"
      console.log(`\n💬 Test du message: "comment ça fonctionne"`);

      // Trouver le champ input du chatbot
      const input = page.locator('input[type="text"], textarea, [class*="input"]').first();

      if (await input.isVisible()) {
        console.log('📝 Champ input trouvé');

        // Effacer et taper le message
        await input.clear();
        await input.fill('comment ça fonctionne');
        await input.press('Enter');

        console.log('✅ Message envoyé, attente de la réponse...');

        // Attendre la réponse
        await page.waitForTimeout(5000);

        // Chercher toutes les réponses du chatbot
        const allMessages = await page.locator('[class*="message"], [class*="response"], [class*="bot"], [class*="chat"]').all();
        console.log(`📊 ${allMessages.length} éléments de message trouvés`);

        // Vérifier chaque message pour des références à "gratuit"
        let foundGratuit = false;
        for (const msg of allMessages) {
          const text = await msg.textContent();
          if (text && text.toLowerCase().includes('gratuit')) {
            console.log('❌ ATTENTION: Référence à "gratuit" trouvée !');
            console.log('Message:', text);
            foundGratuit = true;
          }
        }

        if (!foundGratuit) {
          console.log('✅ Aucune référence à "gratuit" détectée dans les messages');
        }

        // Prendre une capture d'écran pour vérification manuelle
        await page.screenshot({ path: 'chatbot-verification.png' });
        console.log('📸 Capture d\'écran sauvegardée: chatbot-verification.png');

      } else {
        console.log('❌ Champ input du chatbot non trouvé');
      }

      console.log('\n✅ Vérification terminée');

    } else {
      console.log('❌ Chatbot non trouvé sur la page');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  } finally {
    await browser.close();
  }
}

verifyChatbotFix();
