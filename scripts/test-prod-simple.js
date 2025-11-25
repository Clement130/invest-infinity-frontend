#!/usr/bin/env node

/**
 * Script de test simple pour vérifier le déploiement en production
 * Utilise fetch au lieu de Playwright
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://invest-infinity-frontend.vercel.app';

async function testProduction() {
  console.log('🚀 Test de vérification en production');
  console.log(`   URL: ${PRODUCTION_URL}`);
  console.log(`   Date: ${new Date().toISOString()}\n`);

  try {
    // Test 1: Vérifier que la page d'accueil répond
    console.log('📝 Test 1: Vérification de la disponibilité...');
    const startTime = Date.now();
    const response = await fetch(PRODUCTION_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const loadTime = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`   ✅ Page accessible (${response.status}) - Temps: ${loadTime}ms`);
    } else {
      console.log(`   ⚠️  Réponse: ${response.status} ${response.statusText}`);
    }
    
    // Test 2: Vérifier le contenu HTML
    console.log('\n📝 Test 2: Vérification du contenu HTML...');
    const html = await response.text();
    
    const checks = {
      'React': html.includes('react') || html.includes('React') || html.includes('root'),
      'Vite': html.includes('vite') || html.includes('assets/'),
      'Scripts': html.includes('<script') && html.includes('src='),
      'Meta tags': html.includes('<meta') || html.includes('<title>'),
    };
    
    Object.entries(checks).forEach(([name, passed]) => {
      console.log(`   ${passed ? '✅' : '⚠️'} ${name}: ${passed ? 'Détecté' : 'Non détecté'}`);
    });
    
    // Test 3: Vérifier les routes admin
    console.log('\n📝 Test 3: Test de la route /admin...');
    try {
      const adminResponse = await fetch(`${PRODUCTION_URL}/admin`, {
        method: 'GET',
        redirect: 'manual', // Ne pas suivre les redirections automatiquement
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const status = adminResponse.status;
      const location = adminResponse.headers.get('location');
      
      if (status === 200) {
        console.log('   ✅ Route /admin accessible (200)');
        console.log('      Note: Peut nécessiter une authentification');
      } else if (status === 301 || status === 302 || status === 307 || status === 308) {
        console.log(`   ✅ Redirection détectée (${status})`);
        if (location) {
          console.log(`      Redirigé vers: ${location}`);
        }
      } else {
        console.log(`   ⚠️  Statut: ${status}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Erreur lors du test /admin: ${error.message}`);
    }
    
    // Test 4: Vérifier les assets
    console.log('\n📝 Test 4: Vérification des assets...');
    const assetPatterns = [
      /<script[^>]*src=["']([^"']*\.js)["']/g,
      /<link[^>]*href=["']([^"']*\.css)["']/g,
    ];
    
    const assets = [];
    assetPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        assets.push(match[1]);
      }
    });
    
    if (assets.length > 0) {
      console.log(`   ✅ ${assets.length} asset(s) détecté(s)`);
      // Tester le premier asset
      const firstAsset = assets[0].startsWith('http') ? assets[0] : `${PRODUCTION_URL}${assets[0]}`;
      try {
        const assetResponse = await fetch(firstAsset, { method: 'HEAD' });
        if (assetResponse.ok) {
          console.log(`   ✅ Premier asset accessible: ${assets[0]}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Impossible de vérifier l'asset: ${error.message}`);
      }
    } else {
      console.log('   ⚠️  Aucun asset détecté dans le HTML');
    }
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`✅ Application déployée: ${response.ok ? 'Oui' : 'Non'}`);
    console.log(`✅ Temps de réponse: ${loadTime}ms`);
    console.log(`✅ Contenu HTML: ${html.length > 0 ? 'Présent' : 'Absent'}`);
    console.log(`✅ Assets détectés: ${assets.length}`);
    console.log('='.repeat(60));
    
    console.log('\n💡 Pour tester le correctif de session complet:');
    console.log('   1. Ouvrez https://invest-infinity-frontend.vercel.app dans votre navigateur');
    console.log('   2. Connectez-vous en tant qu\'admin');
    console.log('   3. Naviguez vers /admin');
    console.log('   4. Ouvrez la console (F12) et surveillez les logs');
    console.log('   5. Restez sur la page pendant au moins 10 minutes');
    console.log('   6. Vérifiez qu\'aucune redirection ne se produit');
    console.log('\n   Logs à surveiller:');
    console.log('   - [AuthContext] : Chargement du profil');
    console.log('   - [useRoleGuard] : Vérification du rôle');
    console.log('   - [ProtectedRoute] : Protection des routes');
    
    if (response.ok) {
      console.log('\n✅ Tests de base réussis - Application accessible en production');
      process.exit(0);
    } else {
      console.log('\n⚠️  Application accessible mais avec des avertissements');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Erreur pendant le test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testProduction();

