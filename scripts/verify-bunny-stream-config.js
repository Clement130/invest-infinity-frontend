#!/usr/bin/env node

/**
 * Script de vérification complète de la configuration Bunny Stream
 * Vérifie que la formule de token est correcte et que tout est synchronisé
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Configuration attendue
const EXPECTED_TOKEN_KEY = 'cdaab1ec-9e16-46d8-9765-28f6a26fbb48';
const EXPECTED_LIBRARY_ID = '542258';

// Fonction pour générer un token selon la nouvelle formule
function generateToken(videoId, tokenKey, libraryId, expiryHours = 4) {
  const expires = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
  const path = `/${libraryId}/${videoId}`;
  const tokenString = tokenKey + path + expires;
  const hash = crypto.createHash('sha256').update(tokenString).digest('hex');
  return { token: hash, expires, path };
}

// Vérifier la configuration dans le code
function verifyCodeConfiguration() {
  log(colors.bold, '\n📋 VÉRIFICATION DE LA CONFIGURATION DU CODE\n');

  try {
    // Lire la fonction Edge
    const functionPath = join(process.cwd(), 'supabase', 'functions', 'generate-bunny-token', 'index.ts');
    const functionCode = readFileSync(functionPath, 'utf-8');

    // Vérifier que la formule utilise le path
    const hasPathFormula = functionCode.includes('const path = `/${bunnyLibraryId}/${videoId}`') ||
                          functionCode.includes('path = `/${bunnyLibraryId}/${videoId}`');

    if (hasPathFormula) {
      log(colors.green, '✅ Formule de token correcte (avec path)');
    } else {
      log(colors.red, '❌ Formule de token incorrecte - doit inclure le path');
      log(colors.yellow, '   La formule doit être: token_key + /{libraryId}/{videoId} + expires');
      return false;
    }

    // Vérifier que la formule utilise bien le path dans le hash
    const hasPathInHash = functionCode.includes('tokenString = bunnyEmbedTokenKey + path + expires') ||
                         functionCode.includes('bunnyEmbedTokenKey + path + expires');

    if (hasPathInHash) {
      log(colors.green, '✅ Le path est inclus dans le calcul du hash');
    } else {
      log(colors.red, '❌ Le path n\'est pas inclus dans le calcul du hash');
      return false;
    }

    // Vérifier l'URL de base
    const hasCorrectBaseUrl = functionCode.includes('https://iframe.mediadelivery.net/embed');
    if (hasCorrectBaseUrl) {
      log(colors.green, '✅ URL de base Bunny Stream correcte');
    } else {
      log(colors.yellow, '⚠️  URL de base peut être incorrecte');
    }

    return true;
  } catch (error) {
    log(colors.red, `❌ Erreur lors de la lecture du code: ${error.message}`);
    return false;
  }
}

// Vérifier les variables d'environnement
function verifyEnvironmentVariables() {
  log(colors.bold, '\n🔐 VÉRIFICATION DES VARIABLES D\'ENVIRONNEMENT\n');

  const tokenKey = process.env.BUNNY_EMBED_TOKEN_KEY;
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || process.env.VITE_BUNNY_STREAM_LIBRARY_ID;

  let allOk = true;

  if (!tokenKey) {
    log(colors.red, '❌ BUNNY_EMBED_TOKEN_KEY non défini');
    allOk = false;
  } else if (tokenKey === EXPECTED_TOKEN_KEY) {
    log(colors.green, `✅ BUNNY_EMBED_TOKEN_KEY configuré: ${tokenKey.substring(0, 8)}...`);
  } else {
    log(colors.yellow, `⚠️  BUNNY_EMBED_TOKEN_KEY différent de la valeur attendue`);
    log(colors.yellow, `   Attendu: ${EXPECTED_TOKEN_KEY.substring(0, 8)}...`);
    log(colors.yellow, `   Actuel: ${tokenKey.substring(0, 8)}...`);
  }

  if (!libraryId) {
    log(colors.red, '❌ BUNNY_STREAM_LIBRARY_ID non défini');
    allOk = false;
  } else if (libraryId === EXPECTED_LIBRARY_ID) {
    log(colors.green, `✅ BUNNY_STREAM_LIBRARY_ID configuré: ${libraryId}`);
  } else {
    log(colors.yellow, `⚠️  BUNNY_STREAM_LIBRARY_ID différent de la valeur attendue`);
    log(colors.yellow, `   Attendu: ${EXPECTED_LIBRARY_ID}`);
    log(colors.yellow, `   Actuel: ${libraryId}`);
  }

  return allOk;
}

// Tester la génération de token
function testTokenGeneration() {
  log(colors.bold, '\n🧪 TEST DE GÉNÉRATION DE TOKEN\n');

  const tokenKey = process.env.BUNNY_EMBED_TOKEN_KEY || EXPECTED_TOKEN_KEY;
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || process.env.VITE_BUNNY_STREAM_LIBRARY_ID || EXPECTED_LIBRARY_ID;
  const testVideoId = '25190d8d-6d1f-44f0-888c-c6cdaf494c34'; // ID de la vidéo en erreur

  log(colors.blue, `Test avec:`);
  log(colors.blue, `  - Video ID: ${testVideoId}`);
  log(colors.blue, `  - Library ID: ${libraryId}`);
  log(colors.blue, `  - Token Key: ${tokenKey.substring(0, 8)}...`);

  const { token, expires, path } = generateToken(testVideoId, tokenKey, libraryId, 4);

  log(colors.green, '\n✅ Token généré avec succès:');
  log(colors.cyan, `  Path: ${path}`);
  log(colors.cyan, `  Expires: ${new Date(expires * 1000).toLocaleString('fr-FR')}`);
  log(colors.cyan, `  Token (premiers 16 chars): ${token.substring(0, 16)}...`);

  const embedUrl = `https://iframe.mediadelivery.net/embed${path}?token=${token}&expires=${expires}`;
  log(colors.blue, `\n📺 URL d'embed générée:`);
  log(colors.cyan, `  ${embedUrl.substring(0, 80)}...`);

  return { token, expires, path, embedUrl };
}

// Vérifier la synchronisation avec Bunny.net
function verifyBunnyNetSync() {
  log(colors.bold, '\n🌐 VÉRIFICATION DE LA SYNCHRONISATION BUNNY.NET\n');

  log(colors.blue, '📋 Checklist de configuration Bunny.net:');
  console.log('');
  console.log('  1. Token Authentication:');
  console.log('     ✅ Doit être ACTIVÉ dans Bunny.net Dashboard');
  console.log(`     ✅ Clé de sécurité: ${EXPECTED_TOKEN_KEY}`);
  console.log('');
  console.log('  2. Allowed Domains:');
  console.log('     ✅ investinfinity.fr');
  console.log('     ✅ www.investinfinity.fr');
  console.log('     ✅ investinfinity.com');
  console.log('     ✅ *.vercel.app');
  console.log('     ✅ localhost:5173 (dev)');
  console.log('');
  console.log('  3. MediaCage DRM (optionnel):');
  console.log('     ✅ Basic DRM activé pour anti-téléchargement');
  console.log('');

  log(colors.yellow, '⚠️  Vérifiez manuellement dans votre dashboard Bunny.net:');
  log(colors.cyan, '   https://bunny.net/dashboard/stream');
}

// Fonction principale
async function main() {
  log(colors.bold, '🔍 VÉRIFICATION COMPLÈTE DE LA CONFIGURATION BUNNY STREAM\n');
  log(colors.blue, '========================================================\n');

  const codeOk = verifyCodeConfiguration();
  const envOk = verifyEnvironmentVariables();
  const tokenResult = testTokenGeneration();
  verifyBunnyNetSync();

  log(colors.bold, '\n📊 RÉSUMÉ\n');
  
  if (codeOk && envOk) {
    log(colors.green, '✅ Configuration du code: OK');
    log(colors.green, '✅ Variables d\'environnement: OK');
    log(colors.green, '✅ Génération de token: OK');
    log(colors.yellow, '⚠️  Vérifiez manuellement la configuration Bunny.net');
    
    log(colors.bold, '\n✨ PROCHAINES ÉTAPES:\n');
    log(colors.cyan, '1. Vérifiez que la clé de sécurité dans Bunny.net est:');
    log(colors.white, `   ${EXPECTED_TOKEN_KEY}`);
    log(colors.cyan, '\n2. Vérifiez que les domaines autorisés sont configurés');
    log(colors.cyan, '\n3. Testez la lecture d\'une vidéo dans l\'application');
    log(colors.cyan, '\n4. Si l\'erreur persiste, vérifiez les logs Supabase:');
    log(colors.white, '   supabase functions logs generate-bunny-token');
  } else {
    log(colors.red, '❌ Des problèmes ont été détectés');
    if (!codeOk) {
      log(colors.red, '   - Le code doit être corrigé');
    }
    if (!envOk) {
      log(colors.red, '   - Les variables d\'environnement doivent être configurées');
    }
  }

  console.log('');
}

main().catch((error) => {
  log(colors.red, `❌ Erreur: ${error.message}`);
  process.exit(1);
});

