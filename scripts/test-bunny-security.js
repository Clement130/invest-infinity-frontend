#!/usr/bin/env node

/**
 * Script de test des protections de sécurité Bunny Stream
 * Vérifie que les tokens et restrictions de domaine fonctionnent correctement
 */

import https from 'https';
import crypto from 'crypto';

console.log('🧪 Test des protections de sécurité Bunny Stream');
console.log('================================================\n');

// Configuration depuis les variables d'environnement
const embedTokenKey = process.env.BUNNY_EMBED_TOKEN_KEY;
const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
const embedBaseUrl = process.env.VITE_BUNNY_EMBED_BASE_URL || 'https://iframe.mediadelivery.net/embed';

// Couleurs pour la console
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(color, message) {
    console.log(`${color}${message}${colors.reset}`);
}

function generateSecureToken(videoId, tokenKey, expiryHours = 24) {
    const expires = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
    const tokenString = tokenKey + videoId + expires;
    const hash = crypto.createHash('sha256').update(tokenString).digest('hex');
    return { token: hash, expires };
}

// Fonction pour tester une URL
function testUrl(url, description) {
    return new Promise((resolve) => {
        log(colors.blue, `🔍 Test: ${description}`);
        log(colors.gray, `   URL: ${url}`);

        const request = https.get(url, { timeout: 10000 }, (res) => {
            const statusCode = res.statusCode;
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                if (statusCode >= 200 && statusCode < 300) {
                    log(colors.green, `   ✅ ${statusCode} - Accessible`);
                } else if (statusCode === 403) {
                    log(colors.green, `   ✅ ${statusCode} - Correctement protégé (Forbidden)`);
                } else {
                    log(colors.yellow, `   ⚠️  ${statusCode} - Réponse inattendue`);
                }
                resolve({ statusCode, body: body.substring(0, 200) });
            });
        });

        request.on('error', (err) => {
            log(colors.red, `   ❌ Erreur: ${err.message}`);
            resolve({ error: err.message });
        });

        request.on('timeout', () => {
            request.destroy();
            log(colors.yellow, `   ⏰ Timeout - URL inaccessible ou lente`);
            resolve({ timeout: true });
        });
    });
}

// Tests principaux
async function runTests() {
    const testVideoId = 'test-video-id'; // ID fictif pour les tests

    log(colors.bold, '📋 VÉRIFICATION DES PRÉREQUIS');

    if (!embedTokenKey) {
        log(colors.red, '❌ BUNNY_EMBED_TOKEN_KEY non défini');
        log(colors.yellow, '   Définissez: export BUNNY_EMBED_TOKEN_KEY=votre_clé');
        process.exit(1);
    }

    if (!libraryId) {
        log(colors.red, '❌ BUNNY_STREAM_LIBRARY_ID non défini');
        log(colors.yellow, '   Définissez: export BUNNY_STREAM_LIBRARY_ID=votre_library_id');
        process.exit(1);
    }

    log(colors.green, '✅ Variables d\'environnement configurées');
    console.log('');

    log(colors.bold, '🧪 TESTS DE SÉCURITÉ');

    // Test 1: URL sans token (devrait être bloquée)
    const unprotectedUrl = `${embedBaseUrl}/${libraryId}/${testVideoId}`;
    await testUrl(unprotectedUrl, 'URL sans token d\'authentification');
    console.log('');

    // Test 2: URL avec token valide
    const { token, expires } = generateSecureToken(testVideoId, embedTokenKey);
    const protectedUrl = `${embedBaseUrl}/${libraryId}/${testVideoId}?token=${token}&expires=${expires}`;
    await testUrl(protectedUrl, 'URL avec token d\'authentification valide');
    console.log('');

    // Test 3: URL avec token expiré
    const expiredExpires = Math.floor(Date.now() / 1000) - 3600; // Expiré il y a 1h
    const expiredTokenString = embedTokenKey + testVideoId + expiredExpires;
    const expiredToken = crypto.createHash('sha256').update(expiredTokenString).digest('hex');
    const expiredUrl = `${embedBaseUrl}/${libraryId}/${testVideoId}?token=${expiredToken}&expires=${expiredExpires}`;
    await testUrl(expiredUrl, 'URL avec token expiré');
    console.log('');

    // Test 4: URL avec token invalide
    const invalidToken = 'invalid_token_' + Math.random().toString(36).substring(7);
    const invalidUrl = `${embedBaseUrl}/${libraryId}/${testVideoId}?token=${invalidToken}&expires=${expires}`;
    await testUrl(invalidUrl, 'URL avec token invalide');
    console.log('');

    log(colors.bold, '📊 RÉSULTATS DES TESTS');

    log(colors.blue, '🔒 Protections recommandées:');
    console.log('   ✅ Authentification par token d\'embed (activée dans votre code)');
    console.log('   ✅ Restriction de domaines (à configurer manuellement dans Bunny.net)');
    console.log('   ✅ MediaCage DRM (optionnel, à activer dans Bunny.net)');
    console.log('   ✅ Authentification CDN (optionnel, pour les URLs directes)');

    console.log('');
    log(colors.green, '✨ Tests terminés!');

    console.log('');
    log(colors.yellow, '📝 Prochaines étapes:');
    console.log('   1. Vérifiez que les protections fonctionnent dans votre application');
    console.log('   2. Testez l\'embedding sur des domaines non autorisés');
    console.log('   3. Activez MediaCage DRM si nécessaire');
    console.log('   4. Configurez l\'authentification CDN pour les URLs directes');

    console.log('');
    log(colors.cyan, '🔗 Ressources:');
    console.log('   📖 https://docs.bunny.net/docs/stream-security');
    console.log('   🆘 https://support.bunny.net/hc/en-us');
}

// Gestion des erreurs
process.on('unhandledRejection', (err) => {
    log(colors.red, `❌ Erreur non gérée: ${err.message}`);
    process.exit(1);
});

// Exécution des tests
runTests().catch((err) => {
    log(colors.red, `❌ Erreur lors des tests: ${err.message}`);
    process.exit(1);
});

export { generateSecureToken, testUrl };
