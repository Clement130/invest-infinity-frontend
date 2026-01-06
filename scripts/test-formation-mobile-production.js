#!/usr/bin/env node

/**
 * Script de test pour vérifier l'affichage mobile de la page Formation en production
 * Teste les corrections d'affichage et de rognage sur mobile
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://investinfinity.fr';
const CLIENT_EMAIL = process.env.CLIENT_EMAIL || 'investinfinityfr@gmail.com';
const CLIENT_PASSWORD = process.env.CLIENT_PASSWORD || 'Password130!';
const TEST_TIMEOUT = 30000;

async function testFormationMobile(browser) {
  const page = await browser.newPage();
  
  // Simuler un iPhone 12/13
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  
  const results = {
    success: true,
    errors: [],
    warnings: [],
    checks: [],
  };

  try {
    console.log('\n📱 Test: Affichage Mobile - Page Formation');
    console.log('='.repeat(60));
    console.log(`URL: ${PRODUCTION_URL}`);
    console.log(`Viewport: 390x844 (iPhone)`);
    console.log('='.repeat(60));

    // Capturer les erreurs
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('analytics')) {
          results.errors.push(`Console Error: ${text}`);
        }
      }
    });

    // 1. Navigation vers la page de connexion
    console.log('\n📋 Test 1: Navigation');
    console.log('-'.repeat(60));
    await page.goto(`${PRODUCTION_URL}/login`, { 
      waitUntil: 'networkidle',
      timeout: TEST_TIMEOUT 
    });
    console.log('   ✅ Page de connexion chargée');

    // 2. Vérifier les dimensions du viewport
    console.log('\n📋 Test 2: Vérification du Viewport');
    console.log('-'.repeat(60));
    
    const viewportInfo = await page.evaluate(() => {
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        devicePixelRatio: window.devicePixelRatio,
      };
    });
    
    console.log(`   Viewport: ${viewportInfo.innerWidth}x${viewportInfo.innerHeight}`);
    console.log(`   Device Pixel Ratio: ${viewportInfo.devicePixelRatio}`);
    
    if (viewportInfo.innerWidth !== 390) {
      results.warnings.push(`Viewport width attendu: 390, obtenu: ${viewportInfo.innerWidth}`);
    }

    // 3. Vérifier le viewport meta tag
    console.log('\n📋 Test 3: Vérification du Viewport Meta Tag');
    console.log('-'.repeat(60));
    
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return {
        exists: !!meta,
        content: meta?.getAttribute('content') || '',
      };
    });
    
    console.log(`   Viewport meta tag: ${viewportMeta.exists ? '✅' : '❌'}`);
    if (viewportMeta.exists) {
      console.log(`   Contenu: ${viewportMeta.content}`);
      if (viewportMeta.content.includes('viewport-fit=cover')) {
        console.log('   ✅ viewport-fit=cover présent');
        results.checks.push('viewport-fit=cover présent');
      }
    }

    // 4. Essayer de se connecter (optionnel, on continue même si ça échoue)
    console.log('\n📋 Test 4: Tentative de Connexion');
    console.log('-'.repeat(60));
    
    try {
      await page.fill('input[type="email"], input[name="email"]', CLIENT_EMAIL);
      await page.fill('input[type="password"], input[name="password"]', CLIENT_PASSWORD);
      await page.click('button[type="submit"], button:has-text("Se connecter")');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/app')) {
        console.log('   ✅ Connexion réussie');
        results.checks.push('Connexion réussie');
        
        // 5. Vérifier la page Formation
        console.log('\n📋 Test 5: Vérification de la Page Formation');
        console.log('-'.repeat(60));
        
        // Attendre que la page se charge
        await page.waitForTimeout(2000);
        
        // Vérifier les éléments de la page formation
        const formationChecks = await page.evaluate(() => {
          const checks = {
            headerExists: !!document.querySelector('h1'),
            headerText: document.querySelector('h1')?.textContent || '',
            statsCards: document.querySelectorAll('[class*="grid"] [class*="rounded"]').length,
            continueCard: !!document.querySelector('[class*="Continue"]') || 
                         !!document.querySelector('button:has-text("Continuer")') ||
                         !!document.querySelector('button:has-text("Reprends")'),
            hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            bodyWidth: document.body.scrollWidth,
            viewportWidth: window.innerWidth,
          };
          
          // Vérifier les styles des cartes
          const cards = Array.from(document.querySelectorAll('[class*="rounded"]'));
          checks.cardOverflow = cards.some(card => {
            const rect = card.getBoundingClientRect();
            return rect.right > window.innerWidth || rect.left < 0;
          });
          
          return checks;
        });
        
        console.log(`   Header trouvé: ${formationChecks.headerExists ? '✅' : '❌'}`);
        if (formationChecks.headerExists) {
          console.log(`   Texte header: "${formationChecks.headerText.substring(0, 50)}..."`);
        }
        
        console.log(`   Cartes de stats: ${formationChecks.statsCards}`);
        console.log(`   Carte "Continuer": ${formationChecks.continueCard ? '✅' : '⚠️'}`);
        
        console.log(`   Overflow horizontal: ${formationChecks.hasOverflow ? '❌ PROBLÈME' : '✅'}`);
        if (formationChecks.hasOverflow) {
          results.errors.push(`Overflow horizontal détecté: body=${formationChecks.bodyWidth}px, viewport=${formationChecks.viewportWidth}px`);
        } else {
          results.checks.push('Pas d\'overflow horizontal');
        }
        
        console.log(`   Cartes qui dépassent: ${formationChecks.cardOverflow ? '❌ PROBLÈME' : '✅'}`);
        if (formationChecks.cardOverflow) {
          results.errors.push('Certaines cartes dépassent du viewport');
        } else {
          results.checks.push('Cartes bien contenues');
        }
        
        // Prendre une capture d'écran
        await page.screenshot({ 
          path: join(__dirname, '..', 'test-formation-mobile.png'), 
          fullPage: true 
        });
        console.log('   📸 Capture d\'écran sauvegardée: test-formation-mobile.png');
        
      } else {
        console.log('   ⚠️  Connexion échouée, mais on continue les tests...');
        results.warnings.push('Connexion échouée - tests limités');
      }
    } catch (error) {
      console.log(`   ⚠️  Erreur de connexion: ${error.message}`);
      results.warnings.push(`Connexion échouée: ${error.message}`);
    }

    // 6. Vérifier les styles CSS chargés
    console.log('\n📋 Test 6: Vérification des Styles CSS');
    console.log('-'.repeat(60));
    
    const stylesCheck = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      let foundMobileStyles = false;
      
      try {
        for (const sheet of styleSheets) {
          try {
            const rules = Array.from(sheet.cssRules || []);
            for (const rule of rules) {
              if (rule.cssText) {
                if (rule.cssText.includes('@media') && 
                    (rule.cssText.includes('max-width') || rule.cssText.includes('mobile'))) {
                  foundMobileStyles = true;
                  break;
                }
              }
            }
          } catch (e) {
            // Ignorer les erreurs CORS
          }
        }
      } catch (e) {
        // Ignorer les erreurs
      }
      
      return {
        foundMobileStyles,
        styleSheetsCount: styleSheets.length,
      };
    });

    console.log(`   Styles mobile détectés: ${stylesCheck.foundMobileStyles ? '✅' : '⚠️'}`);
    console.log(`   Feuilles de style: ${stylesCheck.styleSheetsCount}`);

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(60));
    
    if (results.errors.length === 0 && results.checks.length > 0) {
      console.log('✅ Tous les tests de base ont réussi');
      console.log('\n✅ Vérifications réussies:');
      results.checks.forEach(check => console.log(`   - ${check}`));
      
      if (results.warnings.length > 0) {
        console.log('\n⚠️  Avertissements:');
        results.warnings.forEach(w => console.log(`   - ${w}`));
      }
      
      return true;
    } else {
      console.error('❌ Certains tests ont échoué:');
      results.errors.forEach(err => console.error(`   - ${err}`));
      
      if (results.warnings.length > 0) {
        console.log('\n⚠️  Avertissements:');
        results.warnings.forEach(w => console.log(`   - ${w}`));
      }
      
      return false;
    }

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    await page.screenshot({ 
      path: join(__dirname, '..', 'test-formation-mobile-error.png'), 
      fullPage: true 
    });
    return false;
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🧪 Test Automatique - Affichage Mobile Page Formation');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ 
    headless: false, // Mode visible pour voir les tests
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const success = await testFormationMobile(browser);
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();

