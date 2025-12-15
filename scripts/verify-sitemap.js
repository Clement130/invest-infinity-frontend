/**
 * Script de vérification du sitemap
 * Vérifie que le sitemap est accessible et bien formaté
 */

import https from 'https';
import http from 'http';

const SITEMAP_URL = 'https://www.investinfinity.fr/sitemap.xml';
const ROBOTS_URL = 'https://www.investinfinity.fr/robots.txt';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function verifySitemap() {
  console.log('🔍 Vérification du sitemap...\n');
  
  try {
    // Vérifier le sitemap
    console.log(`📄 Vérification de ${SITEMAP_URL}...`);
    const sitemapResponse = await fetchUrl(SITEMAP_URL);
    
    if (sitemapResponse.status === 200) {
      console.log('✅ Sitemap accessible (HTTP 200)');
      console.log(`   Content-Type: ${sitemapResponse.headers['content-type']}`);
      
      // Vérifier le contenu XML
      if (sitemapResponse.body.includes('<?xml')) {
        console.log('✅ Format XML détecté');
      } else {
        console.log('⚠️  Format XML non détecté');
      }
      
      if (sitemapResponse.body.includes('<urlset')) {
        console.log('✅ Structure urlset détectée');
      } else {
        console.log('⚠️  Structure urlset non détectée');
      }
      
      // Compter les URLs
      const urlMatches = sitemapResponse.body.match(/<loc>/g);
      const urlCount = urlMatches ? urlMatches.length : 0;
      console.log(`✅ ${urlCount} URLs trouvées dans le sitemap`);
      
      // Vérifier la présence de la page d'accueil
      if (sitemapResponse.body.includes('https://investinfinity.fr/')) {
        console.log('✅ Page d\'accueil présente dans le sitemap');
      } else {
        console.log('⚠️  Page d\'accueil non trouvée');
      }
      
    } else {
      console.log(`❌ Erreur HTTP ${sitemapResponse.status}`);
    }
    
    console.log('\n📄 Vérification de robots.txt...');
    const robotsResponse = await fetchUrl(ROBOTS_URL);
    
    if (robotsResponse.status === 200) {
      console.log('✅ robots.txt accessible (HTTP 200)');
      
      // Vérifier la référence au sitemap
      if (robotsResponse.body.includes('sitemap.xml')) {
        console.log('✅ Sitemap référencé dans robots.txt');
      } else {
        console.log('⚠️  Sitemap non référencé dans robots.txt');
      }
    } else {
      console.log(`❌ robots.txt non accessible (HTTP ${robotsResponse.status})`);
    }
    
    console.log('\n✅ Vérification terminée !');
    console.log('\n📋 Prochaines étapes :');
    console.log('1. Allez sur https://search.google.com/search-console');
    console.log('2. Sélectionnez la propriété investinfinity.fr');
    console.log('3. Allez dans "Sitemaps"');
    console.log('4. Entrez "sitemap.xml" et cliquez sur "Envoyer"');
    console.log('\n📖 Guide complet : docs/GUIDE-SUBMIT-SITEMAP.md');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  }
}

verifySitemap();

