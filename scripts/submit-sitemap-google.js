/**
 * Script pour soumettre le sitemap dans Google Search Console via l'API
 * 
 * PRÉREQUIS :
 * 1. Installer : npm install googleapis
 * 2. Créer un projet dans Google Cloud Console
 * 3. Activer l'API "Google Search Console API"
 * 4. Créer des credentials OAuth 2.0
 * 5. Télécharger le fichier credentials.json
 * 
 * UTILISATION :
 * node scripts/submit-sitemap-google.js
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SITEMAP_URL = 'https://www.investinfinity.fr/sitemap.xml';
const PROPERTY_URL = 'https://www.investinfinity.fr'; // ou sc-domain:investinfinity.fr

// Chemin vers le fichier de credentials
const CREDENTIALS_PATH = path.join(__dirname, '../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../token.json');

/**
 * Charge ou demande les credentials OAuth
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Charge les credentials sauvegardés s'ils existent
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.promises.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Authentifie l'utilisateur et obtient les credentials
 */
async function authenticate(options) {
  const auth = new google.auth.GoogleAuth({
    ...options,
    keyFile: CREDENTIALS_PATH,
  });
  return auth;
}

/**
 * Sauvegarde les credentials pour la prochaine fois
 */
async function saveCredentials(client) {
  const content = await fs.promises.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.promises.writeFile(TOKEN_PATH, payload);
}

/**
 * Soumet le sitemap dans Google Search Console
 */
async function submitSitemap() {
  try {
    console.log('🔐 Authentification...');
    const auth = await authorize();
    
    console.log('📡 Connexion à Google Search Console API...');
    const searchconsole = google.searchconsole({
      version: 'v1',
      auth,
    });

    console.log(`📄 Soumission du sitemap : ${SITEMAP_URL}`);
    console.log(`🏠 Propriété : ${PROPERTY_URL}`);
    
    const response = await searchconsole.sitemaps.submit({
      siteUrl: PROPERTY_URL,
      feedpath: SITEMAP_URL,
    });

    console.log('✅ Sitemap soumis avec succès !');
    console.log('📊 Réponse:', JSON.stringify(response.data, null, 2));
    
    // Vérifier le statut après quelques secondes
    console.log('\n⏳ Attente de 5 secondes avant vérification du statut...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const status = await searchconsole.sitemaps.get({
      siteUrl: PROPERTY_URL,
      feedpath: SITEMAP_URL,
    });
    
    console.log('\n📈 Statut du sitemap:');
    console.log(JSON.stringify(status.data, null, 2));
    
  } catch (error) {
    if (error.code === 'ENOENT' && error.path === CREDENTIALS_PATH) {
      console.error('❌ Erreur : Fichier credentials.json non trouvé');
      console.error('\n📖 Pour configurer :');
      console.error('1. Allez sur https://console.cloud.google.com/');
      console.error('2. Créez un projet ou sélectionnez-en un');
      console.error('3. Activez "Google Search Console API"');
      console.error('4. Créez des credentials OAuth 2.0');
      console.error('5. Téléchargez le fichier et placez-le à la racine du projet sous le nom "credentials.json"');
    } else {
      console.error('❌ Erreur lors de la soumission:', error.message);
      if (error.response) {
        console.error('📋 Détails:', JSON.stringify(error.response.data, null, 2));
      }
    }
    process.exit(1);
  }
}

// Exécuter
submitSitemap();

