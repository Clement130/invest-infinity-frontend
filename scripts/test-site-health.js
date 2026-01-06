#!/usr/bin/env node

/**
 * Script de vérification rapide de la santé du site en production
 */

const PRODUCTION_URL = 'https://investinfinity.fr';

const pagesToTest = [
  { path: '/', name: 'Page d\'accueil' },
  { path: '/app', name: 'Page App' },
  { path: '/admin', name: 'Page Admin' },
  { path: '/pricing', name: 'Page Tarifs' },
];

async function testPage(path, name) {
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
    const hasReact = html.includes('root') || html.includes('react') || html.includes('vite');
    const hasCriticalErrors = html.includes('Error:') || html.includes('TypeError') || html.includes('ReferenceError');
    
    return {
      name,
      path,
      status: response.status,
      ok: response.ok,
      hasReact,
      hasCriticalErrors,
    };
  } catch (error) {
    return {
      name,
      path,
      status: 0,
      ok: false,
      hasReact: false,
      hasCriticalErrors: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log('🏥 Vérification de la santé du site en production');
  console.log(`   URL: ${PRODUCTION_URL}`);
  console.log(`   Date: ${new Date().toISOString()}\n`);

  const results = await Promise.all(
    pagesToTest.map(page => testPage(page.path, page.name))
  );

  console.log('📊 Résultats des tests:\n');
  
  let allOk = true;
  results.forEach(result => {
    const statusIcon = result.ok ? '✅' : '❌';
    const reactIcon = result.hasReact ? '✅' : '⚠️';
    const errorIcon = result.hasCriticalErrors ? '❌' : '✅';
    
    console.log(`${statusIcon} ${result.name} (${result.path})`);
    console.log(`   Status: ${result.status}`);
    console.log(`   React: ${reactIcon}`);
    console.log(`   Erreurs critiques: ${errorIcon}`);
    if (result.error) {
      console.log(`   Erreur: ${result.error}`);
    }
    console.log('');
    
    if (!result.ok || result.hasCriticalErrors) {
      allOk = false;
    }
  });

  console.log('='.repeat(60));
  if (allOk) {
    console.log('✅ Le site fonctionne correctement !');
  } else {
    console.log('⚠️  Certains problèmes ont été détectés');
  }
  console.log('='.repeat(60));
}

main().catch(console.error);
















