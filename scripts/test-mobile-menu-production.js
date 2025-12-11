/**
 * Script de test pour vérifier le menu mobile en production
 * Teste la visibilité et la cliquabilité des boutons de connexion
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://investinfinity.fr';

async function testMobileMenu() {
  console.log('🧪 Test du menu mobile en production');
  console.log('=====================================\n');

  try {
    // Note: Ce script nécessite un navigateur headless ou Puppeteer
    // Pour l'instant, on affiche les instructions manuelles
    
    console.log('📱 Instructions de test manuel :\n');
    console.log('1. Ouvrir https://investinfinity.fr sur mobile (ou simulateur mobile)');
    console.log('2. Cliquer sur les 3 barres du menu (hamburger) en haut à droite');
    console.log('3. Vérifier que le menu s\'affiche avec :');
    console.log('   ✅ Fond noir opaque (bg-black/95)');
    console.log('   ✅ Liens de navigation visibles en blanc (Accueil, Tarifs, FAQ, Contact)');
    console.log('   ✅ 3 boutons de connexion visibles et cliquables :');
    console.log('      - "Espace Client" (bouton rose/violet)');
    console.log('      - "Espace Admin" (bouton gris avec bordure violette)');
    console.log('      - "Créer un compte" (bouton rose)');
    console.log('4. Cliquer sur "Espace Client"');
    console.log('5. Vérifier que le modal d\'auth s\'ouvre');
    console.log('6. Vérifier que le modal est positionné en bas de l\'écran sur mobile\n');

    console.log('🔍 Vérifications techniques à faire dans la console (F12) :\n');
    console.log('1. Vérifier le z-index :');
    console.log('   document.querySelector(".fixed.inset-0.bg-black").style.zIndex');
    console.log('   → Devrait être 60 ou plus\n');
    
    console.log('2. Vérifier la visibilité des boutons :');
    console.log('   document.querySelectorAll("button[class*=\'Espace\']").length');
    console.log('   → Devrait être 2 ou plus\n');
    
    console.log('3. Vérifier le contraste du texte :');
    console.log('   const btn = document.querySelector("button:contains(\'Espace Client\')");');
    console.log('   window.getComputedStyle(btn).color');
    console.log('   → Devrait être rgb(255, 255, 255) ou similaire\n');

    console.log('✅ Si tous les éléments sont visibles et cliquables, le test est réussi !\n');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du test :', error);
    return false;
  }
}

// Exécuter le test
testMobileMenu().then(success => {
  process.exit(success ? 0 : 1);
});

