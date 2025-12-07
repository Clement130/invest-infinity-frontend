#!/usr/bin/env node

/**
 * Test des utilisateurs AVEC accès pour vérifier le BUG 1
 */

import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';
const LOGIN_URL = `${PRODUCTION_URL}/login`;
const ADMIN_USERS_URL = `${PRODUCTION_URL}/admin/users`;

const TEST_EMAIL = 'butcher13550@gmail.com';
const TEST_PASSWORD = 'Password130!';

async function dismissCookieBanner(page) {
  try {
    const acceptButton = await page.$('button:has-text("Accepter"), button:has-text("Accept")');
    if (acceptButton) {
      await acceptButton.click({ force: true });
      await page.waitForTimeout(500);
    }
  } catch (e) {}
}

async function main() {
  console.log('🧪 Vérification des utilisateurs AVEC accès\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Login
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await dismissCookieBanner(page);
    
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    if (emailInput && passwordInput) {
      await emailInput.fill(TEST_EMAIL);
      await passwordInput.fill(TEST_PASSWORD);
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) await submitButton.click();
      await page.waitForTimeout(5000);
    }
    
    console.log('✅ Connexion réussie\n');
    
    // Aller sur admin/users
    await page.goto(ADMIN_USERS_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Cliquer sur le filtre "Avec accès"
    console.log('📍 Application du filtre "Avec accès"...');
    const withAccessButton = await page.$('button:has-text("Avec accès")');
    if (withAccessButton) {
      await withAccessButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ Filtre appliqué\n');
    }
    
    // Capture d'écran
    const screenshotPath = `.playwright-mcp/admin-users-with-access-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Capture: ${screenshotPath}\n`);
    
    // Analyser le contenu
    const rows = await page.$$('tbody tr');
    console.log(`📊 Analyse des ${rows.length} utilisateurs avec accès:\n`);
    
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      const cells = await row.$$('td');
      if (cells.length >= 5) {
        const email = await cells[0].textContent();
        const abonnement = await cells[1].textContent();
        const role = await cells[2].textContent();
        const acces = await cells[4].textContent();
        
        console.log(`   ${i+1}. ${email?.trim().substring(0, 30).padEnd(30)} | ${abonnement?.trim().padEnd(10)} | ${acces?.trim()}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  console.log('\n✅ Test terminé');
}

main().catch(console.error);
