#!/usr/bin/env node

/**
 * Script pour vérifier que le code est bien déployé en production
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Vérification du déploiement en production\n');
console.log('='.repeat(60));

// Vérifier le dernier commit
try {
  const { execSync } = await import('child_process');
  const lastCommit = execSync('git log -1 --oneline', { encoding: 'utf-8' }).trim();
  const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  
  console.log('📝 Dernier commit local:');
  console.log(`   ${lastCommit}`);
  console.log(`   Hash: ${commitHash.substring(0, 7)}\n`);
  
  // Vérifier que les fichiers sont bien modifiés
  const modulePagePath = join(__dirname, '..', 'src', 'pages', 'ModulePage.tsx');
  const modulePageContent = readFileSync(modulePagePath, 'utf-8');
  
  const checks = {
    hasDeleteModule: modulePageContent.includes('deleteModule') && modulePageContent.includes('from'),
    hasTrash2: modulePageContent.includes('Trash2'),
    hasIsAdmin: modulePageContent.includes('isAdmin'),
    hasHandleDelete: modulePageContent.includes('handleDeleteModule'),
    hasConfirm: modulePageContent.includes('confirm') && modulePageContent.includes('Supprimer'),
    hasButton: modulePageContent.includes('isAdmin') && modulePageContent.includes('Trash2') && modulePageContent.includes('Supprimer'),
  };
  
  console.log('✅ Vérifications du code source:');
  Object.entries(checks).forEach(([key, value]) => {
    console.log(`   ${value ? '✅' : '❌'} ${key}: ${value}`);
  });
  
  const allChecksPass = Object.values(checks).every(v => v === true);
  
  console.log('\n' + '='.repeat(60));
  if (allChecksPass) {
    console.log('✅ CODE LOCAL: Tous les éléments sont présents');
    console.log('\n📤 Pour déployer en production:');
    console.log('   1. Vérifier que le commit est poussé: git log origin/main');
    console.log('   2. Vérifier Vercel: https://vercel.com/invest-infinity-s-projects/invest-infinity-frontend/deployments');
    console.log('   3. Attendre 3-5 minutes après le push');
    console.log('   4. Vider le cache: Ctrl+F5');
  } else {
    console.log('❌ CODE LOCAL: Des éléments manquent');
  }
  console.log('='.repeat(60));
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}

