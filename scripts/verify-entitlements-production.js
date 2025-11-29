#!/usr/bin/env node

/**
 * Script de vérification du système d'entitlements en production
 * Vérifie que les restrictions d'accès fonctionnent correctement
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://invest-infinity-frontend.vercel.app';

console.log('🔍 Vérification du système d\'entitlements en production...\n');

// Vérifier que les fichiers source contiennent bien les modifications
const checks = [
  {
    name: 'offers.ts - Configuration des offres',
    file: join(__dirname, '../src/config/offers.ts'),
    patterns: [
      /export type OfferId/,
      /entree.*transformation.*immersion_elite/,
      /hasModuleAccess/,
      /hasLicenseAccess/,
    ],
  },
  {
    name: 'useEntitlements.ts - Hook d\'entitlements',
    file: join(__dirname, '../src/hooks/useEntitlements.ts'),
    patterns: [
      /useEntitlements/,
      /hasModuleAccess/,
      /hasFeatureAccess/,
      /accessibleModules/,
    ],
  },
  {
    name: 'ClientApp.tsx - Filtrage des modules',
    file: join(__dirname, '../src/pages/ClientApp.tsx'),
    patterns: [
      /useEntitlements/,
      /accessibleModules/,
      /entitlements\.accessibleModules/,
    ],
  },
  {
    name: 'ModulePage.tsx - Vérification d\'accès',
    file: join(__dirname, '../src/pages/ModulePage.tsx'),
    patterns: [
      /useEntitlements/,
      /hasModuleAccess/,
      /navigate\('\/app'\)/,
    ],
  },
  {
    name: 'LessonPlayerPage.tsx - Vérification d\'accès',
    file: join(__dirname, '../src/pages/LessonPlayerPage.tsx'),
    patterns: [
      /useEntitlements/,
      /hasModuleAccess/,
      /navigate\('\/app'\)/,
    ],
  },
  {
    name: 'PricingPage.tsx - Utilisation de offers.ts',
    file: join(__dirname, '../src/pages/PricingPage.tsx'),
    patterns: [
      /getAllOffers/,
      /from.*config\/offers/,
      /max-w-6xl/,
    ],
  },
];

let allPassed = true;

for (const check of checks) {
  try {
    const content = readFileSync(check.file, 'utf-8');
    const missingPatterns = [];

    for (const pattern of check.patterns) {
      if (!pattern.test(content)) {
        missingPatterns.push(pattern.toString());
      }
    }

    if (missingPatterns.length === 0) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      console.log(`   Patterns manquants: ${missingPatterns.join(', ')}`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ ${check.name}`);
    console.log(`   Erreur: ${error.message}`);
    allPassed = false;
  }
}

console.log('\n📋 Checklist de vérification en production:');
console.log('\n1. Page Tarifs (/pricing):');
console.log('   - Vérifier que les 3 offres s\'affichent correctement');
console.log('   - Vérifier le design compact et responsive');
console.log('   - Vérifier que les cartes ont max 360px de largeur');
console.log('   - Vérifier que le titre est "Nos Offres" en text-4xl');

console.log('\n2. Espace Client - Liste des modules (/app):');
console.log('   - Se connecter avec un compte "Entrée" (starter)');
console.log('   - Vérifier que seuls les modules "starter" sont visibles');
console.log('   - Se connecter avec un compte "Transformation" (pro)');
console.log('   - Vérifier que les modules "starter" + "pro" sont visibles');
console.log('   - Se connecter avec un compte "Immersion" (elite)');
console.log('   - Vérifier que tous les modules sont visibles');

console.log('\n3. Accès direct aux modules (/app/modules/:moduleId):');
console.log('   - Tenter d\'accéder à un module "pro" avec un compte "starter"');
console.log('   - Vérifier la redirection vers /app avec message d\'erreur');
console.log('   - Vérifier que les admins ont accès à tout');

console.log('\n4. Accès direct aux leçons (/app/modules/:moduleId/lessons/:lessonId):');
console.log('   - Tenter d\'accéder à une leçon d\'un module "pro" avec un compte "starter"');
console.log('   - Vérifier la redirection vers /app avec message d\'erreur');
console.log('   - Vérifier que les admins ont accès à tout');

console.log('\n5. Système de hiérarchie:');
console.log('   - Vérifier qu\'une licence "elite" a accès aux modules "starter" et "pro"');
console.log('   - Vérifier qu\'une licence "pro" a accès aux modules "starter"');
console.log('   - Vérifier qu\'une licence "starter" n\'a accès qu\'aux modules "starter"');

if (allPassed) {
  console.log('\n✅ Tous les fichiers source sont corrects !');
  console.log(`\n🌐 URL de production: ${PRODUCTION_URL}`);
  console.log('   Vérifiez manuellement que les restrictions d\'accès fonctionnent en production.');
} else {
  console.log('\n❌ Certains fichiers nécessitent des corrections.');
  process.exit(1);
}

