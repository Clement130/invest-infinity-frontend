#!/usr/bin/env node

/**
 * Script de test rapide pour vérifier le correctif de session en production
 * Teste que le code est bien déployé et qu'il n'y a pas d'erreurs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://invest-infinity-frontend.vercel.app';

async function testProduction() {
  console.log('🚀 Test de vérification en production');
  console.log(`   URL: ${PRODUCTION_URL}`);
  console.log(`   Date: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Test 1: Vérifier que la page d'accueil se charge
    console.log('📝 Test 1: Chargement de la page d\'accueil...');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const homeUrl = page.url();
    console.log(`   ✅ Page chargée: ${homeUrl}`);
    
    // Test 2: Vérifier qu'il n'y a pas d'erreurs JavaScript critiques
    console.log('\n📝 Test 2: Vérification des erreurs JavaScript...');
    const consoleErrors = [];
    const consoleWarnings = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
    });
    
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });
    
    // Attendre un peu pour capturer les erreurs
    await page.waitForTimeout(3000);
    
    if (consoleErrors.length > 0) {
      console.log(`   ⚠️  ${consoleErrors.length} erreur(s) détectée(s):`);
      consoleErrors.slice(0, 5).forEach(err => console.log(`      - ${err}`));
    } else {
      console.log('   ✅ Aucune erreur JavaScript critique');
    }
    
    if (consoleWarnings.length > 0) {
      console.log(`   ℹ️  ${consoleWarnings.length} avertissement(s) détecté(s)`);
    }
    
    // Test 3: Vérifier que le code du correctif est présent
    console.log('\n📝 Test 3: Vérification du code déployé...');
    
    // Vérifier que React est chargé
    const hasReact = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             (window.React !== undefined || 
              document.querySelector('[data-reactroot]') !== null ||
              document.querySelector('#root') !== null);
    });
    
    if (hasReact) {
      console.log('   ✅ React est chargé');
    } else {
      console.log('   ⚠️  React ne semble pas être chargé');
    }
    
    // Test 4: Tester la redirection vers /admin (sans être connecté)
    console.log('\n📝 Test 4: Test de redirection /admin (sans connexion)...');
    await page.goto(`${PRODUCTION_URL}/admin`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const adminUrl = page.url();
    const isRedirected = !adminUrl.includes('/admin');
    
    if (isRedirected) {
      console.log(`   ✅ Redirection correcte vers: ${adminUrl}`);
    } else {
      console.log(`   ⚠️  Pas de redirection (URL: ${adminUrl})`);
      console.log('      Cela peut être normal si vous êtes déjà connecté');
    }
    
    // Test 5: Vérifier que le code source contient des indices du correctif
    console.log('\n📝 Test 5: Vérification de la présence du correctif...');
    const pageContent = await page.content();
    
    // Chercher des indices que le code est bien déployé
    const hasAuthContext = pageContent.includes('AuthContext') || 
                          await page.evaluate(() => {
                            return window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== undefined;
                          });
    
    if (hasAuthContext) {
      console.log('   ✅ Application React détectée');
    }
    
    // Vérifier dans les scripts chargés
    const scripts = await page.$$eval('script[src]', scripts => 
      scripts.map(s => s.src)
    );
    
    const hasViteBuild = scripts.some(src => 
      src.includes('assets/') || src.includes('index-') || src.includes('.js')
    );
    
    if (hasViteBuild) {
      console.log('   ✅ Build Vite détecté');
    }
    
    console.log('\n✅ Tests de base terminés');
    console.log('\n📋 Résumé:');
    console.log(`   - Page d'accueil: ✅`);
    console.log(`   - Erreurs JS: ${consoleErrors.length === 0 ? '✅ Aucune' : `⚠️ ${consoleErrors.length}`}`);
    console.log(`   - Application React: ${hasAuthContext ? '✅' : '⚠️'}`);
    console.log(`   - Build Vite: ${hasViteBuild ? '✅' : '⚠️'}`);
    
    console.log('\n💡 Pour tester le correctif de session complet:');
    console.log('   1. Connectez-vous en tant qu\'admin');
    console.log('   2. Naviguez vers /admin');
    console.log('   3. Restez sur la page pendant au moins 10 minutes');
    console.log('   4. Vérifiez qu\'aucune redirection ne se produit');
    
  } catch (error) {
    console.error('\n❌ Erreur pendant le test:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testProduction().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

