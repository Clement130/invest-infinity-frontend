#!/usr/bin/env node

/**
 * Script pour configurer automatiquement les tokens Bunny Stream
 * Une fois que l'utilisateur aura accès au dashboard Bunny.net
 */

import crypto from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateEmbedTokenKey() {
  // Générer une clé sécurisée de 32 caractères
  return crypto.randomBytes(32).toString('hex');
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function generateSecureToken(videoId, tokenKey, expiryHours = 24) {
  const expires = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
  const tokenString = tokenKey + videoId + expires;
  const token = crypto.createHash('sha256').update(tokenString).digest('hex');
  return { token, expires };
}

async function main() {
  console.log('🔐 Configuration automatique des tokens Bunny Stream\n');
  console.log('Ce script va vous aider à configurer les protections de sécurité.\n');

  const hasAccess = await question('Avez-vous accès au dashboard Bunny.net ? (y/n): ');

  if (hasAccess.toLowerCase() !== 'y') {
    console.log('\n❌ Vous devez d\'abord accéder au dashboard Bunny.net.');
    console.log('   Rendez-vous sur: https://dash.bunny.net');
    console.log('   Et rechargez votre compte si nécessaire.\n');
    process.exit(1);
  }

  console.log('\n✅ Générons votre clé de sécurité...\n');

  // Générer la clé de sécurité
  const embedTokenKey = generateEmbedTokenKey();

  console.log('🔑 Votre clé de sécurité générée:');
  console.log(`   ${embedTokenKey}`);
  console.log('');

  // Tester avec un exemple
  const testVideoId = 'example-video-id';
  const { token, expires } = generateSecureToken(testVideoId, embedTokenKey);

  console.log('🧪 Test avec un exemple:');
  console.log(`   Video ID: ${testVideoId}`);
  console.log(`   Token: ${token}`);
  console.log(`   Expires: ${expires} (${new Date(expires * 1000).toLocaleString()})`);
  console.log('');

  // URL d'exemple
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || 'VOTRE_LIBRARY_ID';
  const embedBaseUrl = 'https://iframe.mediadelivery.net/embed';
  const secureUrl = `${embedBaseUrl}/${libraryId}/${testVideoId}?token=${token}&expires=${expires}`;

  console.log('🔗 URL sécurisée d\'exemple:');
  console.log(`   ${secureUrl}`);
  console.log('');

  console.log('📋 INSTRUCTIONS À SUIVRE DANS BUNNY.NET:');
  console.log('==========================================\n');

  console.log('1️⃣ Aller dans Stream > Votre Bibliothèque > Security\n');

  console.log('2️⃣ ACTIVER L\'AUTHENTIFICATION PAR TOKEN:');
  console.log('   ✅ Cochez "Enable embed view token authentication"');
  console.log(`   🔑 Utilisez cette clé: ${embedTokenKey}\n`);

  console.log('3️⃣ CONFIGURER LES DOMAINES AUTORISÉS:');
  console.log('   ✅ Activez "Allowed Domains"');
  console.log('   ✅ Ajoutez:');
  console.log('      - investinfinity.com');
  console.log('      - *.vercel.app');
  console.log('      - localhost:5173 (pour développement)\n');

  console.log('4️⃣ ACTIVER MEDIACAGE DRM (OPTIONNEL):');
  console.log('   ✅ Cochez "Enable MediaCage DRM"\n');

  console.log('5️⃣ REVENIR DANS LE TERMINAL ET TAPER:');
  console.log(`   export BUNNY_EMBED_TOKEN_KEY="${embedTokenKey}"`);
  console.log('   ./scripts/configure-secrets-final.ps1\n');

  const configured = await question('Avez-vous configuré Bunny.net selon ces instructions ? (y/n): ');

  if (configured.toLowerCase() === 'y') {
    console.log('\n✅ Configuration terminée !');
    console.log('   Exécutez maintenant: ./scripts/configure-secrets-final.ps1');
    console.log('   Puis testez avec: node scripts/test-bunny-security.js\n');
  } else {
    console.log('\n⏳ Revenez quand vous aurez terminé la configuration dans Bunny.net');
    console.log('   Gardez cette clé en sécurité:');
    console.log(`   ${embedTokenKey}\n`);
  }

  rl.close();
}

main().catch(console.error);
