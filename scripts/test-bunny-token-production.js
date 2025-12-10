#!/usr/bin/env node

/**
 * Test de génération de token Bunny Stream en production
 * Vérifie que la fonction Edge fonctionne correctement après le déploiement
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vveswlmcgmizmjsriezw.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TEST_VIDEO_ID = '8254f866-0ab0-498c-b1fe-5ef2b66a2ab8'; // ID de la vidéo problématique

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

async function testTokenGeneration() {
  log(colors.bold, '\n🧪 TEST DE GÉNÉRATION DE TOKEN BUNNY STREAM\n');
  log(colors.blue, '========================================================\n');

  if (!SUPABASE_ANON_KEY) {
    log(colors.red, '❌ VITE_SUPABASE_ANON_KEY non défini dans .env.local');
    process.exit(1);
  }

  log(colors.blue, `📋 Configuration:`);
  log(colors.cyan, `   Supabase URL: ${SUPABASE_URL}`);
  log(colors.cyan, `   Video ID: ${TEST_VIDEO_ID}`);
  log(colors.cyan, `   Function: generate-bunny-token\n`);

  // Note: Pour tester vraiment, il faudrait être authentifié
  // Ici on teste juste que l'endpoint répond
  log(colors.blue, '🔍 Test 1: Vérification de l\'endpoint (sans auth)...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-bunny-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        videoId: TEST_VIDEO_ID,
        expiryHours: 4,
      }),
    });

    const data = await response.json();

    if (response.status === 401) {
      log(colors.yellow, '   ⚠️  401 - Authentification requise (normal)');
      log(colors.cyan, `   Message: ${data.error || 'Non authentifié'}`);
    } else if (response.status === 403) {
      log(colors.yellow, '   ⚠️  403 - Accès refusé');
      log(colors.cyan, `   Message: ${data.error || 'Accès refusé'}`);
      log(colors.yellow, '   → L\'utilisateur n\'a peut-être pas les droits d\'accès au module');
    } else if (response.status === 200) {
      log(colors.green, '   ✅ 200 - Token généré avec succès !');
      log(colors.cyan, `   Embed URL: ${data.embedUrl?.substring(0, 80)}...`);
      log(colors.cyan, `   Expires: ${new Date(data.expires * 1000).toLocaleString('fr-FR')}`);
    } else {
      log(colors.red, `   ❌ ${response.status} - Erreur inattendue`);
      log(colors.cyan, `   Message: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    log(colors.red, `   ❌ Erreur réseau: ${error.message}`);
  }

  console.log('');
  log(colors.bold, '📊 RÉSUMÉ\n');
  log(colors.blue, 'Pour tester complètement:');
  log(colors.cyan, '1. Connectez-vous sur https://investinfinity.fr');
  log(colors.cyan, '2. Accédez à la leçon "Comment prendre un Trade sur MetaTrader ?"');
  log(colors.cyan, '3. Vérifiez la console du navigateur (F12) pour les erreurs');
  log(colors.cyan, '4. Vérifiez que vous avez un training_access pour le module "MetaTrader & TopStepX & Apex"');
  console.log('');
}

testTokenGeneration().catch((error) => {
  log(colors.red, `❌ Erreur: ${error.message}`);
  process.exit(1);
});

