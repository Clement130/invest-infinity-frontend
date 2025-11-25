#!/usr/bin/env node

/**
 * Test simple de la bibliothèque Bunny Stream en production
 * Vérifie que les variables d'environnement sont bien configurées
 */

const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';

async function testBunnyStreamConfig() {
  console.log('🧪 Test de la configuration Bunny Stream en production\n');
  console.log(`URL: ${PRODUCTION_URL}/admin/videos\n`);

  try {
    // Test 1: Vérifier que la page répond
    console.log('1️⃣ Test de réponse HTTP...');
    const response = await fetch(`${PRODUCTION_URL}/admin/videos`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      console.log('   ✅ Page accessible (HTTP', response.status, ')');
    } else {
      console.log('   ⚠️  Page accessible mais avec erreur HTTP', response.status);
    }

    // Test 2: Vérifier le contenu HTML pour les variables d'environnement
    console.log('\n2️⃣ Analyse du contenu HTML...');
    const html = await response.text();
    
    // Vérifier si le message d'erreur de configuration est présent
    const hasConfigError = html.includes('Configuration requise') || 
                          html.includes('variables d\'environnement Bunny Stream ne sont pas configurées');
    
    if (hasConfigError) {
      console.log('   ⚠️  Message d\'erreur de configuration détecté');
      console.log('   ℹ️  Les variables d\'environnement ne sont peut-être pas configurées en production');
    } else {
      console.log('   ✅ Aucun message d\'erreur de configuration détecté');
    }

    // Vérifier si la bibliothèque Bunny Stream est mentionnée
    const hasBunnyLibrary = html.includes('Bunny') || html.includes('BIBLIOTHÈQUE');
    if (hasBunnyLibrary) {
      console.log('   ✅ Bibliothèque Bunny Stream détectée dans le contenu');
    }

    // Test 3: Vérifier les erreurs JavaScript potentielles
    console.log('\n3️⃣ Vérification des erreurs JavaScript...');
    const hasJsErrors = html.includes('Uncaught') || html.includes('ReferenceError');
    if (hasJsErrors) {
      console.log('   ⚠️  Erreurs JavaScript potentielles détectées');
    } else {
      console.log('   ✅ Aucune erreur JavaScript évidente');
    }

    console.log('\n✨ Test terminé!');
    console.log('\n📝 Note: Pour un test complet, connectez-vous en tant qu\'admin');
    console.log('   et vérifiez que la bibliothèque Bunny Stream s\'affiche correctement.');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  }
}

testBunnyStreamConfig();

