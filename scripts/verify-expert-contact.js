#!/usr/bin/env node

/**
 * Script de vérification du module Expert Contact en production
 * Vérifie que les éléments de contact consulting sont bien présents
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://invest-infinity-frontend.vercel.app';
const CONTACT_WEBSITE = 'https://www.obsidian-autonomy.com/';
const CONTACT_LABEL = 'obsidian-autonomy.com';

console.log('🔍 Vérification du module Expert Contact en production...\n');

// Vérifier que les fichiers source contiennent bien les modifications
const checks = [
  {
    name: 'ClientSidebar.tsx - Module contact sidebar',
    file: join(__dirname, '../src/components/navigation/ClientSidebar.tsx'),
    patterns: [
      /https:\/\/www\.obsidian-autonomy\.com\//,
      /Besoin d'un expert IA \?/,
      /Sparkles/,
    ],
  },
  {
    name: 'SettingsPage.tsx - Section Support avancé',
    file: join(__dirname, '../src/pages/SettingsPage.tsx'),
    patterns: [
      /https:\/\/www\.obsidian-autonomy\.com\//,
      /Support avancé/,
      /Si tu cherches à mettre en place de l'IA/,
      /Sparkles/,
    ],
  },
  {
    name: 'ExpertContact.tsx - Composant réutilisable',
    file: join(__dirname, '../src/components/ExpertContact.tsx'),
    patterns: [
      /obsidian-autonomy\.com/,
      /ExpertContact/,
      /variant.*compact.*expanded/,
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
console.log('   1. Se connecter à l\'espace client');
console.log('   2. Vérifier dans la sidebar (desktop) :');
console.log('      - Module "Besoin d\'un expert IA ?" visible en bas');
console.log('      - Opacité réduite (70%) par défaut');
console.log('      - Hover : opacité 100% + glow violet');
console.log(`      - Clic ouvre ${CONTACT_WEBSITE}`);
console.log('   3. Aller dans Paramètres (/app/settings) :');
console.log('      - Section "Support avancé" visible');
console.log('      - Texte descriptif présent');
console.log('      - Lien email cliquable');
console.log('   4. Tester sur mobile :');
console.log('      - Module visible dans le drawer sidebar');
console.log('      - Responsive et non intrusif');

if (allPassed) {
  console.log('\n✅ Tous les fichiers source sont corrects !');
  console.log(`\n🌐 URL de production: ${PRODUCTION_URL}`);
  console.log('   Vérifiez manuellement que les éléments sont visibles en production.');
} else {
  console.log('\n❌ Certains fichiers nécessitent des corrections.');
  process.exit(1);
}

