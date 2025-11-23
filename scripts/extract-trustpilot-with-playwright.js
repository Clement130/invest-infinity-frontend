/**
 * Script Playwright pour extraire automatiquement le code TrustBox depuis Trustpilot
 * 
 * Ce script:
 * 1. Ouvre le dashboard Trustpilot
 * 2. Attend que vous soyez connecté
 * 3. Navigue vers TrustBox widgets
 * 4. Extrait le code TrustBox
 * 5. Configure automatiquement le fichier trustpilot.ts
 * 
 * Usage: node scripts/extract-trustpilot-with-playwright.js
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractTrustpilotConfig() {
  console.log('🚀 Démarrage de l\'extraction Trustpilot avec Playwright...\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Affiche le navigateur pour que vous puissiez vous connecter
    slowMo: 1000 // Ralentit les actions pour faciliter le suivi
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Naviguer vers la page TrustBox widgets
    console.log(' Naviguer vers Trustpilot Business...');
    await page.goto('https://businessapp.b2b.trustpilot.com/features/trustbox-widgets', {
      waitUntil: 'networkidle'
    });
    
    // 2. Attendre que la page soit chargée (soit connecté, soit page de connexion)
    console.log('⏳ Attente du chargement de la page...');
    await page.waitForTimeout(3000);
    
    // 3. Vérifier si on est sur la page de connexion
    const currentUrl = page.url();
    if (currentUrl.includes('authenticate.trustpilot.com')) {
      console.log('🔐 Page de connexion détectée.');
      console.log('👉 Veuillez vous connecter dans le navigateur qui s\'est ouvert...');
      console.log('⏳ Attente de la connexion (60 secondes max)...\n');
      
      // Attendre que l'URL change (redirection après connexion)
      try {
        await page.waitForURL('**/trustbox-widgets**', { timeout: 60000 });
        console.log('✅ Connexion réussie!\n');
      } catch (error) {
        console.log('❌ Timeout: Veuillez vous connecter manuellement et relancer le script.');
        await browser.close();
        return;
      }
    }
    
    // 4. Attendre que la page TrustBox soit chargée
    console.log('📋 Recherche de la section TrustBox widgets...');
    await page.waitForTimeout(2000);
    
    // 5. Chercher le bouton "Get code" ou "Obtenir le code"
    console.log('🔍 Recherche du bouton "Get code"...');
    
    let getCodeButton = null;
    const possibleSelectors = [
      'text=Get code',
      'text=Obtenir le code',
      'button:has-text("Get code")',
      'button:has-text("Obtenir le code")',
      '[data-testid*="get-code"]',
      'a:has-text("Get code")',
      'a:has-text("Obtenir le code")'
    ];
    
    for (const selector of possibleSelectors) {
      try {
        getCodeButton = await page.locator(selector).first();
        if (await getCodeButton.isVisible({ timeout: 2000 })) {
          console.log(`✅ Bouton trouvé avec: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!getCodeButton || !(await getCodeButton.isVisible().catch(() => false))) {
      console.log('⚠️ Bouton "Get code" non trouvé automatiquement.');
      console.log('👉 Veuillez cliquer manuellement sur "Get code" dans le navigateur...');
      console.log('⏳ Attente de votre action (30 secondes)...\n');
      
      // Attendre que l'utilisateur clique manuellement
      await page.waitForTimeout(30000);
    } else {
      // Cliquer sur le bouton
      console.log('🖱️ Clic sur "Get code"...');
      await getCodeButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 6. Extraire le code TrustBox
    console.log('📝 Extraction du code TrustBox...');
    
    // Chercher le code dans différents endroits possibles
    let trustboxCode = null;
    
    // Option 1: Dans un textarea ou input
    const codeInputs = await page.locator('textarea, input[type="text"], code, pre').all();
    for (const input of codeInputs) {
      const text = await input.textContent().catch(() => '');
      if (text && text.includes('trustpilot-widget') && text.includes('data-template-id')) {
        trustboxCode = text.trim();
        console.log('✅ Code trouvé dans un champ texte!');
        break;
      }
    }
    
    // Option 2: Dans le HTML de la page
    if (!trustboxCode) {
      const pageContent = await page.content();
      const codeMatch = pageContent.match(/<div[^>]*class="[^"]*trustpilot-widget[^"]*"[^>]*>[\s\S]*?<\/div>/i);
      if (codeMatch) {
        trustboxCode = codeMatch[0];
        console.log('✅ Code trouvé dans le HTML de la page!');
      }
    }
    
    // Option 3: Copier depuis le presse-papier si disponible
    if (!trustboxCode) {
      console.log('⚠️ Code non trouvé automatiquement.');
      console.log('👉 Veuillez copier le code TrustBox manuellement et le coller ici:');
      console.log('   (Le script attendra 60 secondes pour votre saisie)\n');
      
      // Attendre que l'utilisateur colle le code
      // Note: On ne peut pas lire le presse-papier directement, donc on demande à l'utilisateur
      trustboxCode = await new Promise((resolve) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        console.log('Collez le code TrustBox HTML ici (appuyez sur Entrée deux fois pour terminer):');
        let lines = [];
        rl.on('line', (line) => {
          if (line.trim() === '' && lines.length > 0) {
            rl.close();
            resolve(lines.join('\n'));
          } else {
            lines.push(line);
          }
        });
        
        setTimeout(() => {
          rl.close();
          resolve(null);
        }, 60000);
      });
    }
    
    if (!trustboxCode) {
      console.log('❌ Code TrustBox non récupéré. Veuillez réessayer.');
      await browser.close();
      return;
    }
    
    console.log('\n📋 Code TrustBox récupéré:');
    console.log('─'.repeat(50));
    console.log(trustboxCode.substring(0, 200) + '...');
    console.log('─'.repeat(50));
    
    // 7. Extraire les informations
    console.log('\n🔍 Extraction des informations...');
    
    const config = {
      templateId: null,
      businessUnitId: null,
      domain: null,
      locale: 'fr-FR',
      theme: 'dark',
    };
    
    // Template ID
    const templateIdMatch = trustboxCode.match(/data-template-id=["']([^"']+)["']/i);
    if (templateIdMatch) {
      config.templateId = templateIdMatch[1];
      console.log(`✅ Template ID: ${config.templateId}`);
    }
    
    // Business Unit ID
    const businessUnitIdMatch = trustboxCode.match(/data-businessunit-id=["']([^"']+)["']/i);
    if (businessUnitIdMatch) {
      config.businessUnitId = businessUnitIdMatch[1];
      console.log(`✅ Business Unit ID: ${config.businessUnitId}`);
    }
    
    // Domaine
    const domainMatch = trustboxCode.match(/trustpilot\.com\/review\/([^"'\s>]+)/i);
    if (domainMatch) {
      config.domain = domainMatch[1];
      console.log(`✅ Domaine: ${config.domain}`);
    }
    
    // Locale
    const localeMatch = trustboxCode.match(/data-locale=["']([^"']+)["']/i);
    if (localeMatch) {
      config.locale = localeMatch[1];
    }
    
    // Theme
    const themeMatch = trustboxCode.match(/data-theme=["']([^"']+)["']/i);
    if (themeMatch) {
      config.theme = themeMatch[1];
    }
    
    // 8. Mettre à jour le fichier de configuration
    if (config.templateId && config.businessUnitId) {
      console.log('\n💾 Mise à jour de la configuration...');
      
      const configPath = path.join(__dirname, '../src/config/trustpilot.ts');
      let configContent = fs.readFileSync(configPath, 'utf8');
      
      configContent = configContent.replace(
        /templateId:\s*import\.meta\.env\.VITE_TRUSTPILOT_TEMPLATE_ID\s*\|\|\s*"[^"]*"/,
        `templateId: import.meta.env.VITE_TRUSTPILOT_TEMPLATE_ID || "${config.templateId}"`
      );
      
      configContent = configContent.replace(
        /businessUnitId:\s*import\.meta\.env\.VITE_TRUSTPILOT_BUSINESSUNIT_ID\s*\|\|\s*"[^"]*"/,
        `businessUnitId: import.meta.env.VITE_TRUSTPILOT_BUSINESSUNIT_ID || "${config.businessUnitId}"`
      );
      
      if (config.domain) {
        configContent = configContent.replace(
          /domain:\s*import\.meta\.env\.VITE_TRUSTPILOT_DOMAIN\s*\|\|\s*"[^"]*"/,
          `domain: import.meta.env.VITE_TRUSTPILOT_DOMAIN || "${config.domain}"`
        );
      }
      
      if (config.locale) {
        configContent = configContent.replace(
          /locale:\s*"[^"]*"/,
          `locale: "${config.locale}"`
        );
      }
      
      if (config.theme) {
        configContent = configContent.replace(
          /theme:\s*"dark"/,
          `theme: "${config.theme}"`
        );
      }
      
      fs.writeFileSync(configPath, configContent, 'utf8');
      
      console.log('✅ Configuration mise à jour avec succès!');
      console.log(`   Fichier: ${configPath}`);
      console.log('\n🎉 Configuration Trustpilot complétée!');
      console.log('   Le widget devrait maintenant fonctionner.');
    } else {
      console.log('\n⚠️ Certaines informations manquent:');
      if (!config.templateId) console.log('   ❌ Template ID manquant');
      if (!config.businessUnitId) console.log('   ❌ Business Unit ID manquant');
      if (!config.domain) console.log('   ⚠️ Domaine manquant (optionnel)');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'extraction:');
    console.error(error.message);
  } finally {
    console.log('\n⏳ Fermeture du navigateur dans 5 secondes...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Exécuter le script
extractTrustpilotConfig().catch(console.error);

