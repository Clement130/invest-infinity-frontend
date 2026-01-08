#!/usr/bin/env node

/**
 * Script de vérification que les fonctionnalités supprimées
 * (défis, événements, newsletter) ne sont plus accessibles en production
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://investinfinity.fr';

const pagesToCheck = [
  { path: '/app/challenges', name: 'Page Défis', shouldExist: false },
  { path: '/app/events', name: 'Page Événements', shouldExist: false },
  { path: '/admin/challenges', name: 'Page Admin Défis', shouldExist: false },
  { path: '/admin/events', name: 'Page Admin Événements', shouldExist: false },
  { path: '/propfirm-challenge', name: 'Page PropFirm Challenge', shouldExist: false },
  { path: '/', name: 'Page d\'accueil', shouldExist: true },
  { path: '/app', name: 'Page App', shouldExist: true },
  { path: '/admin', name: 'Page Admin', shouldExist: true },
];

async function checkPage(path, name, shouldExist) {
  try {
    const url = `${PRODUCTION_URL}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });

    const html = await response.text();
    const hasReactContent = html.includes('root') || html.includes('react') || html.includes('vite');
    const is404 = response.status === 404 || html.includes('404') || html.includes('Page non trouvée');
    
    if (shouldExist) {
      if (response.ok && hasReactContent && !is404) {
        return { success: true, message: `✅ ${name}: Accessible et fonctionnelle` };
      } else {
        return { success: false, message: `❌ ${name}: Problème (status: ${response.status})` };
      }
    } else {
      if (is404 || response.status === 404) {
        return { success: true, message: `✅ ${name}: Correctement supprimée (404)` };
      } else if (response.ok && html.includes('Page non trouvée')) {
        return { success: true, message: `✅ ${name}: Correctement supprimée (page 404)` };
      } else {
        return { success: false, message: `⚠️  ${name}: Toujours accessible (status: ${response.status})` };
      }
    }
  } catch (error) {
    return { success: false, message: `❌ ${name}: Erreur - ${error.message}` };
  }
}

async function main() {
  console.log('🔍 Vérification des fonctionnalités supprimées en production');
  console.log(`   URL: ${PRODUCTION_URL}`);
  console.log(`   Date: ${new Date().toISOString()}\n`);

  const results = [];

  for (const page of pagesToCheck) {
    const result = await checkPage(page.path, page.name, page.shouldExist);
    results.push(result);
    console.log(result.message);
    await new Promise(resolve => setTimeout(resolve, 500)); // Délai entre les requêtes
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(60));

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log(`✅ Tests réussis: ${successCount}/${totalCount}`);

  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\n⚠️  Problèmes détectés:');
    failures.forEach(f => console.log(`   - ${f.message}`));
  } else {
    console.log('\n🎉 Tous les tests sont passés !');
    console.log('   Les fonctionnalités ont été correctement supprimées.');
  }

  console.log('='.repeat(60));
}

main().catch(console.error);


















