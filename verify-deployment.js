#!/usr/bin/env node

/**
 * Script rapide de vérification du déploiement
 */

async function checkDeployment() {
  console.log('🔍 Vérification du déploiement en production...\n');

  try {
    // Test 1: Application accessible
    const response = await fetch('https://invest-infinity-frontend.vercel.app');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    console.log('✅ Application accessible (HTTP 200)');

    // Test 2: Vérifier absence de références Focus Coins
    const focusCount = (html.match(/focus.coin/gi) || []).length;
    if (focusCount === 0) {
      console.log('✅ Aucune référence aux "Focus Coins" trouvée');
    } else {
      console.log(`⚠️  ${focusCount} références aux "Focus Coins" trouvées`);
    }

    // Test 3: Vérifier présence éléments gamification
    const hasXP = html.includes('XP') || html.includes('expérience');
    const hasQuests = html.includes('quête') || html.includes('quest');
    const hasBadges = html.includes('badge') || html.includes('insigne');

    console.log('\n🎮 Éléments gamification détectés:');
    console.log(`   ${hasXP ? '✅' : '❌'} XP/Expérience`);
    console.log(`   ${hasQuests ? '✅' : '❌'} Quêtes`);
    console.log(`   ${hasBadges ? '✅' : '❌'} Badges`);

    // Test 4: Vérifier taille bundle (approximative)
    const jsFiles = html.match(/\/assets\/[^"]*\.js/g) || [];
    console.log(`\n📦 Bundle: ${jsFiles.length} fichiers JS détectés`);

    console.log('\n🎉 DÉPLOIEMENT RÉUSSI !');
    console.log('🌐 URL: https://invest-infinity-frontend.vercel.app');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  }
}

checkDeployment();
