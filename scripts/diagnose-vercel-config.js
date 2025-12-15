#!/usr/bin/env node

/**
 * Script de diagnostic pour vérifier la configuration Vercel
 * Aide à identifier les problèmes de mapping repository/projet
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Diagnostic de Configuration Vercel\n');
console.log('=' .repeat(60));

// 1. Vérifier le repository Git
console.log('\n📦 1. Vérification du Repository Git');
console.log('-'.repeat(60));

try {
  const remoteUrl = execSync('git config --get remote.origin.url', {
    encoding: 'utf-8',
    cwd: rootDir
  }).trim();

  console.log(`✅ Repository Git : ${remoteUrl}`);

  if (remoteUrl.includes('invest-infinity-frontend')) {
    console.log('✅ Le repository semble correct pour invest-infinity-frontend');
  } else {
    console.log('⚠️  ATTENTION : Le repository ne semble pas être invest-infinity-frontend');
  }

  // Vérifier toutes les remotes
  const allRemotes = execSync('git remote -v', {
    encoding: 'utf-8',
    cwd: rootDir
  });

  console.log('\n📋 Toutes les remotes configurées :');
  console.log(allRemotes);
} catch (error) {
  console.error('❌ Erreur lors de la vérification Git :', error.message);
}

// 2. Vérifier la branche actuelle
console.log('\n🌿 2. Vérification de la Branche Actuelle');
console.log('-'.repeat(60));

try {
  const currentBranch = execSync('git branch --show-current', {
    encoding: 'utf-8',
    cwd: rootDir
  }).trim();

  console.log(`✅ Branche actuelle : ${currentBranch}`);

  if (currentBranch === 'main') {
    console.log('✅ Vous êtes sur la branche de production (main)');
  } else {
    console.log(`⚠️  Vous êtes sur la branche "${currentBranch}", pas sur "main"`);
  }
} catch (error) {
  console.error('❌ Erreur lors de la vérification de branche :', error.message);
}

// 3. Vérifier les derniers commits
console.log('\n📝 3. Derniers Commits');
console.log('-'.repeat(60));

try {
  const lastCommits = execSync('git log --oneline -5', {
    encoding: 'utf-8',
    cwd: rootDir
  });

  console.log('Derniers 5 commits :');
  console.log(lastCommits);
} catch (error) {
  console.error('❌ Erreur lors de la récupération des commits :', error.message);
}

// 4. Vérifier package.json
console.log('\n📦 4. Vérification du package.json');
console.log('-'.repeat(60));

try {
  const packageJson = JSON.parse(
    readFileSync(join(rootDir, 'package.json'), 'utf-8')
  );

  console.log(`✅ Nom du projet : ${packageJson.name}`);
  console.log(`✅ Version : ${packageJson.version || 'N/A'}`);
} catch (error) {
  console.error('❌ Erreur lors de la lecture du package.json :', error.message);
}

// 5. Vérifier vercel.json
console.log('\n⚙️  5. Vérification de vercel.json');
console.log('-'.repeat(60));

try {
  const vercelConfig = JSON.parse(
    readFileSync(join(rootDir, 'vercel.json'), 'utf-8')
  );

  console.log('✅ vercel.json trouvé');
  console.log(`   - Framework : ${vercelConfig.framework || 'N/A'}`);
  console.log(`   - Build Command : ${vercelConfig.buildCommand || 'N/A'}`);
  console.log(`   - Output Directory : ${vercelConfig.outputDirectory || 'N/A'}`);
} catch (error) {
  console.error('❌ Erreur lors de la lecture de vercel.json :', error.message);
}

// 6. Recommandations
console.log('\n💡 6. Recommandations');
console.log('='.repeat(60));

console.log(`
Pour résoudre le problème de configuration Vercel :

1. 🔍 Vérifiez dans Vercel Dashboard :
   - Allez sur https://vercel.com
   - Sélectionnez votre projet
   - Settings > Git
   - Vérifiez que le repository est : Clement130/invest-infinity-frontend

2. 🔄 Si le mauvais repository est lié :
   - Disconnect le repository actuel
   - Connect le bon repository : Clement130/invest-infinity-frontend

3. ✅ Vérifiez la branche de production :
   - Settings > Git > Production Branch
   - Doit être : main

4. 📋 Vérifiez les déploiements :
   - Regardez l'historique des déploiements
   - Vérifiez que les commits correspondent à ce projet

5. 📖 Consultez le guide complet :
   - docs/VERCEL-CONFIGURATION-FIX.md
`);

console.log('\n✅ Diagnostic terminé\n');

