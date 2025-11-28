#!/usr/bin/env node

/**
 * Script pour générer automatiquement la clé de sécurité Bunny Stream
 */

import crypto from 'crypto';

function generateEmbedTokenKey() {
  // Générer une clé sécurisée de 64 caractères (32 bytes en hex)
  return crypto.randomBytes(32).toString('hex');
}

function generateSecureToken(videoId, tokenKey, expiryHours = 24) {
  const expires = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
  const tokenString = tokenKey + videoId + expires;
  const token = crypto.createHash('sha256').update(tokenString).digest('hex');
  return { token, expires };
}

console.log('🔐 GÉNÉRATION DE LA CLÉ DE SÉCURITÉ BUNNY STREAM');
console.log('=================================================\n');

// Générer la clé de sécurité
const embedTokenKey = generateEmbedTokenKey();

console.log('🔑 VOTRE CLÉ DE SÉCURITÉ GÉNÉRÉE:');
console.log('====================================');
console.log(`${embedTokenKey}`);
console.log('');

// Tester avec un exemple
const testVideoId = 'example-video-id';
const { token, expires } = generateSecureToken(testVideoId, embedTokenKey);

console.log('🧪 EXEMPLE DE TOKEN GÉNÉRÉ:');
console.log('===========================');
console.log(`Video ID: ${testVideoId}`);
console.log(`Token: ${token}`);
console.log(`Expires: ${expires} (${new Date(expires * 1000).toLocaleString()})`);
console.log('');

// Instructions pour Bunny.net
console.log('📋 INSTRUCTIONS POUR BUNNY.NET:');
console.log('===============================');
console.log('');
console.log('1️⃣ CONNECTEZ-VOUS À BUNNY.NET:');
console.log('   https://dash.bunny.net');
console.log('');

console.log('2️⃣ ALLEZ DANS VOTRE BIBLIOTHÈQUE STREAM:');
console.log('   Stream > Votre Bibliothèque > Security');
console.log('');

console.log('3️⃣ ACTIVEZ L\'AUTHENTIFICATION PAR TOKEN:');
console.log('   ✅ Cochez "Enable embed view token authentication"');
console.log(`   🔑 Collez cette clé: ${embedTokenKey}`);
console.log('');

console.log('4️⃣ CONFIGUREZ LES DOMAINES AUTORISÉS:');
console.log('   ✅ Activez "Allowed Domains"');
console.log('   ✅ Ajoutez ces domaines:');
console.log('      - investinfinity.com');
console.log('      - *.vercel.app');
console.log('      - localhost:5173');
console.log('');

console.log('5️⃣ ACTIVEZ MEDIACAGE DRM (RECOMMANDÉ):');
console.log('   ✅ Cochez "Enable MediaCage DRM"');
console.log('');

console.log('🚀 APRÈS CONFIGURATION, EXÉCUTEZ:');
console.log('==================================');
console.log(`$env:BUNNY_EMBED_TOKEN_KEY = "${embedTokenKey}"`);
console.log('./setup-bunny-security.ps1');
console.log('');

console.log('🧪 PUIS TESTEZ:');
console.log('===============');
console.log('node scripts/test-bunny-security.js');
console.log('');

console.log('✨ VOS VIDÉOS SERONT ALORS PROTÉGÉES ! 🔒');

export { generateEmbedTokenKey, generateSecureToken };
