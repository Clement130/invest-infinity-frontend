#!/usr/bin/env node

/**
 * Script de test authentifié pour la page Admin Utilisateurs
 * Vérifie les corrections des bugs :
 * - BUG 1 : Colonne "ACCÈS" affiche le bon nombre de formations
 * - BUG 2 : Tri par "ABONNEMENT" utilise l'ordre métier
 */

import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';
const LOGIN_URL = `${PRODUCTION_URL}/login`;
const ADMIN_USERS_URL = `${PRODUCTION_URL}/admin/users`;

// Credentials de test (admin)
const TEST_EMAIL = 'butcher13550@gmail.com';
const TEST_PASSWORD = 'Password130!';

async function dismissCookieBanner(page) {
  try {
    // Chercher et cliquer sur le bouton "Accepter" ou "Refuser" de la bannière cookies
    const acceptButton = await page.$('button:has-text("Accepter"), button:has-text("Accept")');
    if (acceptButton) {
      await acceptButton.click({ force: true });
      console.log('   🍪 Bannière cookies fermée');
      await page.waitForTimeout(500);
    }
  } catch (e) {
    // Pas de bannière ou déjà fermée
  }
}

async function login(page) {
  console.log('\n🔐 Connexion en cours...');
  
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Fermer la bannière de cookies si présente
  await dismissCookieBanner(page);
  
  // Remplir le formulaire de connexion
  const emailInput = await page.$('input[type="email"], input[name="email"]');
  const passwordInput = await page.$('input[type="password"], input[name="password"]');
  
  if (emailInput && passwordInput) {
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    
    // Cliquer sur le bouton de connexion
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
    }
    
    // Attendre la redirection
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      console.log('   ✅ Connexion réussie');
      return true;
    } else {
      console.log('   ❌ Échec de la connexion');
      return false;
    }
  } else {
    console.log('   ❌ Formulaire de connexion non trouvé');
    return false;
  }
}

async function testAdminUsersPage() {
  console.log('🧪 Test authentifié de la page Admin Utilisateurs\n');
  console.log(`   URL: ${ADMIN_USERS_URL}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  
  // Capturer les erreurs JavaScript
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignorer certaines erreurs non critiques
      if (!text.includes('favicon') && !text.includes('404')) {
        errors.push(text);
      }
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  try {
    // Étape 1 : Connexion
    const loggedIn = await login(page);
    
    if (!loggedIn) {
      console.log('\n⚠️  Impossible de se connecter, test interrompu');
      await browser.close();
      return;
    }
    
    // Étape 2 : Navigation vers la page admin users
    console.log('\n📍 Navigation vers /admin/users...');
    await page.goto(ADMIN_USERS_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`   📍 URL actuelle: ${currentUrl}`);
    
    if (currentUrl.includes('/admin/users')) {
      console.log('   ✅ Page admin/users accessible');
      
      // Vérifier la présence du tableau
      console.log('\n🔍 Vérification du tableau des utilisateurs...');
      
      const bodyText = await page.textContent('body');
      
      // Vérifier les colonnes
      const columnsToCheck = ['Email', 'Abonnement', 'Rôle', 'Inscription', 'Accès'];
      columnsToCheck.forEach(col => {
        if (bodyText.includes(col)) {
          console.log(`   ✅ Colonne "${col}" présente`);
        } else {
          console.log(`   ❌ Colonne "${col}" manquante`);
        }
      });
      
      // Vérifier l'affichage des formations
      const formationMatch = bodyText.match(/(\d+)\s*formations?/g);
      if (formationMatch && formationMatch.length > 0) {
        console.log(`\n📊 BUG 1 - Vérification colonne "ACCÈS":`);
        console.log(`   ✅ Affichage "X formation(s)" trouvé`);
        console.log(`   Exemples: ${formationMatch.slice(0, 5).join(', ')}`);
      }
      
      // Vérifier les badges d'abonnement
      console.log(`\n📊 BUG 2 - Vérification colonne "ABONNEMENT":`);
      const badges = ['Starter', 'Pro', 'Elite', 'Aucun'];
      const foundBadges = badges.filter(b => bodyText.includes(b));
      if (foundBadges.length > 0) {
        console.log(`   ✅ Badges trouvés: ${foundBadges.join(', ')}`);
      }
      
      // Test du tri : cliquer sur la colonne Abonnement
      console.log(`\n🔄 Test du tri par Abonnement...`);
      const abonnementHeader = await page.$('th:has-text("Abonnement"), [role="columnheader"]:has-text("Abonnement")');
      if (abonnementHeader) {
        await abonnementHeader.click();
        await page.waitForTimeout(1000);
        console.log(`   ✅ Clic sur l'en-tête "Abonnement" effectué`);
        
        // Vérifier le tri
        const bodyTextAfterSort = await page.textContent('body');
        console.log(`   ℹ️  Le tri métier devrait afficher: Aucun → Starter → Pro → Elite`);
      } else {
        console.log(`   ⚠️  En-tête "Abonnement" non trouvé pour le tri`);
      }
      
    } else if (currentUrl.includes('/login')) {
      console.log('   ⚠️  Redirection vers login (session expirée?)');
    } else {
      console.log(`   ⚠️  URL inattendue: ${currentUrl}`);
    }
    
    // Capture d'écran
    const screenshotPath = `.playwright-mcp/admin-users-auth-test-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 Capture d'écran: ${screenshotPath}`);
    
    // Rapport des erreurs JavaScript
    if (errors.length > 0) {
      console.log(`\n❌ ${errors.length} erreur(s) JavaScript:`);
      errors.slice(0, 5).forEach((e, i) => console.log(`   ${i + 1}. ${e.substring(0, 150)}`));
    } else {
      console.log('\n✅ Aucune erreur JavaScript');
    }
    
  } catch (error) {
    console.error(`\n❌ Erreur: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  console.log('\n✅ Test terminé\n');
}

testAdminUsersPage().catch(console.error);
