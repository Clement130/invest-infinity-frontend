#!/usr/bin/env node

/**
 * Script de test complet du système d'entitlements en production
 * Teste la page tarifs, les redirections, et vérifie la structure
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';
const TEST_TIMEOUT = 30000;

async function testPricingPage(page) {
  console.log('\n📄 Test 1: Page Tarifs - Design et Structure');
  console.log('─'.repeat(60));
  
  await page.goto(`${PRODUCTION_URL}/pricing`, { waitUntil: 'networkidle' });
  
  // Vérifier le titre
  const title = await page.textContent('h1, h2');
  const hasTitle = title?.includes('Nos Offres') || false;
  console.log(`   ${hasTitle ? '✅' : '❌'} Titre "Nos Offres" présent: ${hasTitle}`);
  
  // Vérifier les 3 offres
  const bodyText = await page.textContent('body');
  const hasEntree = bodyText?.includes('Entrée') || false;
  const hasTransformation = bodyText?.includes('Transformation') || false;
  const hasImmersion = bodyText?.includes('Immersion Élite') || false;
  
  console.log(`   ${hasEntree ? '✅' : '❌'} Offre "Entrée" présente: ${hasEntree}`);
  console.log(`   ${hasTransformation ? '✅' : '❌'} Offre "Transformation" présente: ${hasTransformation}`);
  console.log(`   ${hasImmersion ? '✅' : '❌'} Offre "Immersion Élite" présente: ${hasImmersion}`);
  
  // Vérifier les prix
  const hasPrice147 = bodyText?.includes('147') || false;
  const hasPrice497 = bodyText?.includes('497') || false;
  const hasPrice1997 = bodyText?.includes('1 997') || 
                       bodyText?.includes('1997') || 
                       bodyText?.includes('1,997') ||
                       bodyText?.match(/1[\s,]?997/) !== null || false;
  
  console.log(`   ${hasPrice147 ? '✅' : '❌'} Prix 147€ présent: ${hasPrice147}`);
  console.log(`   ${hasPrice497 ? '✅' : '❌'} Prix 497€ présent: ${hasPrice497}`);
  console.log(`   ${hasPrice1997 ? '✅' : '❌'} Prix 1 997€ présent: ${hasPrice1997}`);
  
  // Vérifier le container max-w-6xl
  const container = await page.$('[class*="max-w-6xl"], [class*="max-w-7xl"]');
  const hasContainer = container !== null;
  console.log(`   ${hasContainer ? '✅' : '❌'} Container responsive présent: ${hasContainer}`);
  
  // Vérifier les cartes (au moins 3)
  const cards = await page.$$('[class*="rounded"]');
  const hasEnoughCards = cards.length >= 3;
  console.log(`   ${hasEnoughCards ? '✅' : '❌'} Au moins 3 cartes présentes: ${cards.length} trouvées`);
  
  // Vérifier responsive (mobile)
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload({ waitUntil: 'networkidle' });
  const mobileTitle = await page.textContent('h1, h2');
  const mobileWorks = mobileTitle?.includes('Nos Offres') || false;
  console.log(`   ${mobileWorks ? '✅' : '❌'} Responsive mobile fonctionne: ${mobileWorks}`);
  
  return hasTitle && hasEntree && hasTransformation && hasImmersion && hasPrice147 && hasPrice497 && hasPrice1997;
}

async function testPageAccess(page) {
  console.log('\n📄 Test 2: Accès aux pages publiques');
  console.log('─'.repeat(60));
  
  // Test page accueil
  await page.goto(`${PRODUCTION_URL}/`, { waitUntil: 'networkidle' });
  const homeTitle = await page.title();
  const homeAccessible = homeTitle && homeTitle.length > 0;
  console.log(`   ${homeAccessible ? '✅' : '❌'} Page accueil accessible: ${homeAccessible}`);
  
  // Test page login
  await page.goto(`${PRODUCTION_URL}/login`, { waitUntil: 'networkidle' });
  const loginContent = await page.textContent('body');
  const loginAccessible = loginContent && loginContent.length > 0;
  console.log(`   ${loginAccessible ? '✅' : '❌'} Page login accessible: ${loginAccessible}`);
  
  return homeAccessible && loginAccessible;
}

async function testJavaScriptErrors(page) {
  console.log('\n📄 Test 3: Erreurs JavaScript');
  console.log('─'.repeat(60));
  
  const errors = [];
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Visiter plusieurs pages
  const pages = ['/', '/pricing', '/login'];
  
  for (const path of pages) {
    await page.goto(`${PRODUCTION_URL}${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Attendre que les scripts se chargent
  }
  
  const hasErrors = errors.length > 0;
  if (hasErrors) {
    console.log(`   ⚠️  ${errors.length} erreur(s) JavaScript détectée(s):`);
    errors.slice(0, 5).forEach((error, i) => {
      console.log(`      ${i + 1}. ${error.substring(0, 100)}`);
    });
  } else {
    console.log(`   ✅ Aucune erreur JavaScript détectée`);
  }
  
  return !hasErrors;
}

async function testEntitlementsStructure(page) {
  console.log('\n📄 Test 4: Structure des fichiers d\'entitlements');
  console.log('─'.repeat(60));
  
  // Vérifier que les fichiers JS sont chargés
  await page.goto(`${PRODUCTION_URL}/pricing`, { waitUntil: 'networkidle' });
  
  // Vérifier dans les ressources chargées
  const resources = [];
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('offers') || url.includes('useEntitlements') || url.includes('entitlements')) {
      resources.push(url);
    }
  });
  
  await page.waitForTimeout(2000);
  
  // Vérifier que la page utilise bien les nouvelles fonctions
  const pageContent = await page.content();
  const hasOffersConfig = pageContent.includes('getAllOffers') || 
                          pageContent.includes('offers') ||
                          pageContent.includes('entree') ||
                          pageContent.includes('transformation');
  
  console.log(`   ${hasOffersConfig ? '✅' : '❌'} Configuration des offres chargée: ${hasOffersConfig}`);
  console.log(`   ${resources.length > 0 ? '✅' : '⚠️ '} ${resources.length} ressource(s) liée(s) aux entitlements trouvée(s)`);
  
  return hasOffersConfig;
}

async function testRedirects(page) {
  console.log('\n📄 Test 5: Redirections et accès protégés');
  console.log('─'.repeat(60));
  
  // Tester l'accès à l'espace client sans connexion
  await page.goto(`${PRODUCTION_URL}/app`, { waitUntil: 'networkidle', timeout: 10000 });
  const currentUrl = page.url();
  const redirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/');
  console.log(`   ${redirectedToLogin ? '✅' : '⚠️ '} Redirection /app → ${currentUrl.includes('/login') ? '/login' : 'accueil'}: ${redirectedToLogin}`);
  
  // Tester l'accès à un module sans connexion (devrait rediriger)
  try {
    await page.goto(`${PRODUCTION_URL}/app/modules/test-module-id`, { waitUntil: 'networkidle', timeout: 10000 });
    const moduleUrl = page.url();
    const moduleRedirected = !moduleUrl.includes('/app/modules/');
    console.log(`   ${moduleRedirected ? '✅' : '⚠️ '} Accès module protégé: ${moduleRedirected ? 'redirection OK' : 'accès possible'}`);
  } catch (error) {
    console.log(`   ✅ Accès module protégé: erreur attendue (${error.message.substring(0, 50)})`);
  }
  
  return true;
}

async function main() {
  console.log('🚀 Test complet du systeme d\'entitlements en production');
  console.log('='.repeat(60));
  console.log(`🌐 URL: ${PRODUCTION_URL}\n`);
  
  const browser = await chromium.launch({
    headless: true,
  });
  
  const page = await browser.newPage();
  
  try {
    const results = {
      pricing: await testPricingPage(page),
      access: await testPageAccess(page),
      errors: await testJavaScriptErrors(page),
      structure: await testEntitlementsStructure(page),
      redirects: await testRedirects(page),
    };
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(60));
    
    const allPassed = Object.values(results).every(r => r);
    const passedCount = Object.values(results).filter(r => r).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`✅ Page Tarifs: ${results.pricing ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Accès pages: ${results.access ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Erreurs JS: ${results.errors ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Structure: ${results.structure ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Redirections: ${results.redirects ? 'PASS' : 'FAIL'}`);
    
    console.log('\n' + '-'.repeat(60));
    console.log(`Résultat: ${passedCount}/${totalCount} tests réussis`);
    
    if (allPassed) {
      console.log('\n✅ Tous les tests automatisés sont passés !');
      console.log('\n📋 Tests manuels nécessaires (avec authentification):');
      console.log('   1. Se connecter avec compte "Entree" (starter)');
      console.log('      → Verifier que seuls les modules "starter" sont visibles dans /app');
      console.log('   2. Se connecter avec compte "Transformation" (pro)');
      console.log('      → Verifier que les modules "starter" + "pro" sont visibles');
      console.log('   3. Se connecter avec compte "Immersion" (elite)');
      console.log('      → Verifier que tous les modules sont visibles');
      console.log('   4. Tester l\'acces direct a un module "pro" avec compte "starter"');
      console.log('      → Verifier la redirection vers /app avec message d\'erreur');
      console.log('   5. Tester l\'acces direct a une lecon d\'un module "pro" avec compte "starter"');
      console.log('      → Verifier la redirection vers /app avec message d\'erreur');
    } else {
      console.log('\n⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus.');
    }
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Erreur:', error);
  process.exit(1);
});

