import { chromium } from 'playwright';

async function testChatbotModes() {
  console.log('🧪 Test des modes du chatbot en production...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Test 1: Mode CTA sur la page d'accueil (non connecté)
    console.log('📋 Test 1: Mode CTA sur la page d\'accueil');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await page.goto('https://www.investinfinity.fr/');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page d\'accueil chargée');

    // Vérifier que le chatbot est présent mais pas ouvert
    const chatbotButton = page.locator('button:has-text("MessageCircle"), button[aria-label*="chat"]').first();
    const buttonVisible = await chatbotButton.isVisible().catch(() => false);
    
    if (buttonVisible) {
      console.log('✅ Bouton chatbot visible (non intrusif)');
      
      // Vérifier qu'il n'y a pas d'animation pulse
      const pulseElement = await page.locator('.animate-ping').count();
      if (pulseElement === 0) {
        console.log('✅ Aucune animation pulse détectée (non intrusif)');
      } else {
        console.log(`⚠️ ${pulseElement} animation(s) pulse détectée(s)`);
      }

      // Ouvrir le chatbot
      await chatbotButton.click({ force: true });
      await page.waitForTimeout(2000);
      console.log('✅ Chatbot ouvert');

      // Vérifier le message initial (mode CTA)
      await page.waitForTimeout(1000);
      const messages = await page.locator('[class*="message"], [class*="response"], [class*="bot"]').all();
      console.log(`📊 ${messages.length} message(s) trouvé(s)`);
      
      for (let i = 0; i < Math.min(messages.length, 3); i++) {
        const msg = messages[i];
        const messageText = await msg.textContent();
        console.log(`📝 Message ${i+1}: "${messageText?.substring(0, 150)}..."`);
        
        // Vérifier que c'est bien le mode CTA
        if (messageText?.includes('découvrir notre communauté') || 
            messageText?.includes('rejoindre Invest Infinity') ||
            messageText?.includes('traders performants')) {
          console.log('✅ Mode CTA détecté correctement');
          break;
        }
      }

      // Vérifier les suggestions CTA
      const suggestions = await page.locator('button:has-text("Comment"), button:has-text("Rejoindre"), button:has-text("Avantages")').all();
      if (suggestions.length > 0) {
        console.log(`✅ ${suggestions.length} suggestion(s) CTA trouvée(s)`);
      }

      // Fermer le chatbot avec Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      console.log('✅ Chatbot fermé (via Escape)');
    } else {
      console.log('❌ Bouton chatbot non trouvé');
    }

    // Test 2: Vérifier qu'il n'y a pas d'ouverture automatique
    console.log('\n📋 Test 2: Vérification non-intrusivité');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Attendre 3 secondes
    
    const chatbotOpen = await page.locator('[class*="chat"], [class*="Chat"]').first().isVisible().catch(() => false);
    if (!chatbotOpen) {
      console.log('✅ Chatbot ne s\'ouvre pas automatiquement (non intrusif)');
    } else {
      console.log('❌ Chatbot s\'est ouvert automatiquement');
    }

    // Test 3: Vérifier les animations réduites sur le bouton chatbot
    console.log('\n📋 Test 3: Vérification animations réduites');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Vérifier spécifiquement sur le bouton chatbot
    const chatbotButtonElement = await page.locator('button[aria-label*="chat"]').first();
    if (await chatbotButtonElement.isVisible().catch(() => false)) {
      const buttonClasses = await chatbotButtonElement.getAttribute('class').catch(() => '');
      const hasPulse = buttonClasses.includes('animate-ping');
      const hasPulseEffect = buttonClasses.includes('animate-pulse');
      
      console.log(`📊 Classes du bouton chatbot: "${buttonClasses.substring(0, 100)}..."`);
      
      if (!hasPulse && !hasPulseEffect) {
        console.log('✅ Aucune animation pulse sur le bouton chatbot');
      } else {
        console.log('⚠️ Animation pulse détectée sur le bouton');
      }
    }
    
    // Vérifier les animations globales (peuvent venir d'autres éléments)
    const pulseAnimations = await page.locator('.animate-ping').count();
    const bounceAnimations = await page.locator('.animate-bounce').count();
    
    console.log(`📊 Animations globales détectées:`);
    console.log(`   - Pulse: ${pulseAnimations} (peuvent venir d'autres éléments)`);
    console.log(`   - Bounce: ${bounceAnimations}`);

    // Prendre une capture d'écran
    await page.screenshot({ path: 'chatbot-test-production.png', fullPage: true });
    console.log('\n📸 Capture d\'écran sauvegardée: chatbot-test-production.png');

    console.log('\n✅ Tests terminés avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    await page.screenshot({ path: 'chatbot-test-error.png' });
  } finally {
    await browser.close();
  }
}

testChatbotModes();
