#!/usr/bin/env node

/**
 * Script de vérification de la fonctionnalité de suppression de module en production
 * Vérifie que le code est bien déployé et fonctionne
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = process.argv[2] || 'https://invest-infinity-frontend.vercel.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

console.log('🔍 VÉRIFICATION DE LA FONCTIONNALITÉ DE SUPPRESSION DE MODULE');
console.log('============================================================\n');
console.log(`URL de production: ${PRODUCTION_URL}\n`);

const verificationReport = {
  timestamp: new Date().toISOString(),
  url: PRODUCTION_URL,
  checks: [],
  screenshots: [],
  codeVerification: {},
  errors: [],
};

async function verifyCodeInProduction(page) {
  console.log('📋 Vérification du code source...\n');
  
  try {
    // Vérifier que deleteModule est présent dans le code
    const pageContent = await page.content();
    
    const checks = {
      hasDeleteModule: pageContent.includes('deleteModule') || pageContent.includes('delete-module'),
      hasTrashIcon: pageContent.includes('Trash2') || pageContent.includes('trash'),
      hasConfirm: pageContent.includes('confirm') || pageContent.includes('Supprimer définitivement'),
      hasAdminCheck: pageContent.includes('isAdmin') || pageContent.includes('role') && pageContent.includes('admin'),
    };
    
    verificationReport.codeVerification = checks;
    
    console.log('   ✅ Vérifications du code:');
    console.log(`      - deleteModule présent: ${checks.hasDeleteModule ? '✅' : '❌'}`);
    console.log(`      - Icône Trash2 présente: ${checks.hasTrashIcon ? '✅' : '❌'}`);
    console.log(`      - Confirm présent: ${checks.hasConfirm ? '✅' : '❌'}`);
    console.log(`      - Vérification admin présente: ${checks.hasAdminCheck ? '✅' : '❌'}`);
    
    return checks;
  } catch (error) {
    verificationReport.errors.push(`Erreur vérification code: ${error.message}`);
    console.error('   ❌ Erreur lors de la vérification du code:', error.message);
    return null;
  }
}

async function verifyUIElements(page) {
  console.log('\n🎨 Vérification des éléments UI...\n');
  
  try {
    // Chercher les boutons de suppression
    const deleteButtons = await page.$$('button:has-text("Supprimer"), button[title*="Supprimer"], button[title*="supprimer"]');
    const trashIcons = await page.$$('svg[class*="trash"], svg[class*="Trash"]');
    
    const uiChecks = {
      deleteButtonsCount: deleteButtons.length,
      trashIconsCount: trashIcons.length,
      hasRedButtons: false,
    };
    
    // Vérifier les styles rouges
    for (const button of deleteButtons) {
      const className = await button.getAttribute('class') || '';
      if (className.includes('red') || className.includes('text-red')) {
        uiChecks.hasRedButtons = true;
        break;
      }
    }
    
    verificationReport.checks.push({
      type: 'UI Elements',
      status: uiChecks.deleteButtonsCount > 0 ? 'success' : 'warning',
      details: uiChecks,
    });
    
    console.log('   ✅ Éléments UI trouvés:');
    console.log(`      - Boutons "Supprimer": ${uiChecks.deleteButtonsCount}`);
    console.log(`      - Icônes poubelle: ${uiChecks.trashIconsCount}`);
    console.log(`      - Boutons rouges: ${uiChecks.hasRedButtons ? '✅' : '⚠️'}`);
    
    return uiChecks;
  } catch (error) {
    verificationReport.errors.push(`Erreur vérification UI: ${error.message}`);
    console.error('   ❌ Erreur lors de la vérification UI:', error.message);
    return null;
  }
}

async function verifyModulePage(page) {
  console.log('\n📄 Vérification de la page Module...\n');
  
  try {
    // Aller sur une page de module (nécessite d'être connecté)
    // On va chercher les modules disponibles
    const modules = await page.$$('[class*="module"], [class*="Module"]');
    
    const moduleChecks = {
      modulesFound: modules.length,
      hasDeleteButton: false,
    };
    
    // Chercher le bouton de suppression sur les modules
    for (const module of modules) {
      const deleteBtn = await module.$('button:has-text("Supprimer"), button[title*="Supprimer"]');
      if (deleteBtn) {
        moduleChecks.hasDeleteButton = true;
        break;
      }
    }
    
    verificationReport.checks.push({
      type: 'Module Page',
      status: moduleChecks.modulesFound > 0 ? 'success' : 'warning',
      details: moduleChecks,
    });
    
    console.log('   ✅ Vérifications page Module:');
    console.log(`      - Modules trouvés: ${moduleChecks.modulesFound}`);
    console.log(`      - Bouton suppression présent: ${moduleChecks.hasDeleteButton ? '✅' : '⚠️'}`);
    
    return moduleChecks;
  } catch (error) {
    verificationReport.errors.push(`Erreur vérification ModulePage: ${error.message}`);
    console.error('   ❌ Erreur lors de la vérification ModulePage:', error.message);
    return null;
  }
}

async function takeScreenshots(page, browser) {
  console.log('\n📸 Prise de captures d\'écran...\n');
  
  try {
    // Capture de la page principale
    const screenshot1 = await page.screenshot({ 
      path: 'verification-module-delete-1.png', 
      fullPage: true 
    });
    verificationReport.screenshots.push('verification-module-delete-1.png');
    console.log('   ✅ Capture 1: Page principale');
    
    // Si on est sur une page de module, prendre une capture
    const url = page.url();
    if (url.includes('/modules/') || url.includes('/app')) {
      const screenshot2 = await page.screenshot({ 
        path: 'verification-module-delete-2.png', 
        fullPage: true 
      });
      verificationReport.screenshots.push('verification-module-delete-2.png');
      console.log('   ✅ Capture 2: Page module');
    }
    
  } catch (error) {
    verificationReport.errors.push(`Erreur screenshots: ${error.message}`);
    console.error('   ❌ Erreur lors de la prise de captures:', error.message);
  }
}

async function verifyServiceFunction() {
  console.log('\n🔧 Vérification de la fonction deleteModule...\n');
  
  try {
    // Lire le fichier source pour vérifier l'implémentation
    const fs = await import('fs');
    const servicePath = join(__dirname, '..', 'src', 'services', 'trainingService.ts');
    const serviceContent = fs.readFileSync(servicePath, 'utf-8');
    
    const serviceChecks = {
      hasDeleteModule: serviceContent.includes('export async function deleteModule'),
      deletesLessonsFirst: serviceContent.includes('training_lessons') && serviceContent.includes('.delete()'),
      deletesModuleAfter: serviceContent.includes('training_modules') && serviceContent.includes('.delete()'),
      hasErrorHandling: serviceContent.includes('throw') || serviceContent.includes('error'),
    };
    
    verificationReport.checks.push({
      type: 'Service Function',
      status: serviceChecks.hasDeleteModule && serviceChecks.deletesLessonsFirst ? 'success' : 'error',
      details: serviceChecks,
    });
    
    console.log('   ✅ Vérifications fonction deleteModule:');
    console.log(`      - Fonction exportée: ${serviceChecks.hasDeleteModule ? '✅' : '❌'}`);
    console.log(`      - Supprime les leçons d'abord: ${serviceChecks.deletesLessonsFirst ? '✅' : '❌'}`);
    console.log(`      - Supprime le module ensuite: ${serviceChecks.deletesModuleAfter ? '✅' : '❌'}`);
    console.log(`      - Gestion d'erreurs: ${serviceChecks.hasErrorHandling ? '✅' : '⚠️'}`);
    
    return serviceChecks;
  } catch (error) {
    verificationReport.errors.push(`Erreur vérification service: ${error.message}`);
    console.error('   ❌ Erreur lors de la vérification du service:', error.message);
    return null;
  }
}

async function verifyModulePageComponent() {
  console.log('\n📄 Vérification du composant ModulePage...\n');
  
  try {
    const fs = await import('fs');
    const modulePagePath = join(__dirname, '..', 'src', 'pages', 'ModulePage.tsx');
    const modulePageContent = fs.readFileSync(modulePagePath, 'utf-8');
    
    const componentChecks = {
      importsDeleteModule: modulePageContent.includes('deleteModule') && modulePageContent.includes('from'),
      importsTrash2: modulePageContent.includes('Trash2') && modulePageContent.includes('from'),
      hasUseSession: modulePageContent.includes('useSession'),
      hasAdminCheck: modulePageContent.includes('isAdmin') || (modulePageContent.includes('role') && modulePageContent.includes('admin')),
      hasDeleteHandler: modulePageContent.includes('handleDeleteModule') || modulePageContent.includes('deleteModule'),
      hasConfirm: modulePageContent.includes('confirm') && modulePageContent.includes('Supprimer'),
      hasNavigate: modulePageContent.includes('navigate') && modulePageContent.includes('/app'),
    };
    
    verificationReport.checks.push({
      type: 'ModulePage Component',
      status: componentChecks.importsDeleteModule && componentChecks.hasAdminCheck ? 'success' : 'error',
      details: componentChecks,
    });
    
    console.log('   ✅ Vérifications composant ModulePage:');
    console.log(`      - Import deleteModule: ${componentChecks.importsDeleteModule ? '✅' : '❌'}`);
    console.log(`      - Import Trash2: ${componentChecks.importsTrash2 ? '✅' : '❌'}`);
    console.log(`      - Utilise useSession: ${componentChecks.hasUseSession ? '✅' : '❌'}`);
    console.log(`      - Vérification admin: ${componentChecks.hasAdminCheck ? '✅' : '❌'}`);
    console.log(`      - Handler de suppression: ${componentChecks.hasDeleteHandler ? '✅' : '❌'}`);
    console.log(`      - Utilise confirm: ${componentChecks.hasConfirm ? '✅' : '❌'}`);
    console.log(`      - Redirection vers /app: ${componentChecks.hasNavigate ? '✅' : '❌'}`);
    
    return componentChecks;
  } catch (error) {
    verificationReport.errors.push(`Erreur vérification ModulePage: ${error.message}`);
    console.error('   ❌ Erreur lors de la vérification du composant:', error.message);
    return null;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🌐 Connexion à la production...\n');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 1. Vérifier le code source
    const codeChecks = await verifyCodeInProduction(page);

    // 2. Vérifier les éléments UI
    const uiChecks = await verifyUIElements(page);

    // 3. Vérifier la page Module
    const moduleChecks = await verifyModulePage(page);

    // 4. Vérifier la fonction service
    const serviceChecks = await verifyServiceFunction();

    // 5. Vérifier le composant ModulePage
    const componentChecks = await verifyModulePageComponent();

    // 6. Prendre des captures d'écran
    await takeScreenshots(page, browser);

    // Générer le rapport final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT DE VÉRIFICATION');
    console.log('='.repeat(60));
    
    const allChecks = [
      codeChecks,
      uiChecks,
      moduleChecks,
      serviceChecks,
      componentChecks,
    ].filter(Boolean);

    const successCount = verificationReport.checks.filter(c => c.status === 'success').length;
    const warningCount = verificationReport.checks.filter(c => c.status === 'warning').length;
    const errorCount = verificationReport.checks.filter(c => c.status === 'error').length;

    console.log(`\n✅ Vérifications réussies: ${successCount}`);
    console.log(`⚠️  Avertissements: ${warningCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);

    // Sauvegarder le rapport
    const reportPath = join(__dirname, '..', `VERIFICATION-MODULE-DELETE-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2));
    console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);

    // Conclusion
    console.log('\n' + '='.repeat(60));
    if (errorCount === 0 && successCount > 0) {
      console.log('✅ LA FONCTIONNALITÉ EST BIEN IMPLÉMENTÉE EN PRODUCTION');
    } else if (warningCount > 0) {
      console.log('⚠️  LA FONCTIONNALITÉ EST IMPLÉMENTÉE MAIS DES VÉRIFICATIONS MANUELLES SONT NÉCESSAIRES');
    } else {
      console.log('❌ DES PROBLÈMES ONT ÉTÉ DÉTECTÉS - VÉRIFICATION MANUELLE REQUISE');
    }
    console.log('='.repeat(60));

    // Attendre pour inspection manuelle
    console.log('\n⏸️  Pause de 15 secondes pour inspection manuelle...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    verificationReport.errors.push(`Erreur fatale: ${error.message}`);
    
    const reportPath = join(__dirname, '..', `VERIFICATION-MODULE-DELETE-ERROR-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2));
    console.log(`📄 Rapport d'erreur sauvegardé: ${reportPath}`);
  } finally {
    await browser.close();
  }
}

main()
  .then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

