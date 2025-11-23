/**
 * Script pour configurer Trustpilot automatiquement depuis le code TrustBox
 * 
 * Usage: node scripts/configure-trustpilot.js "<code HTML TrustBox>"
 * 
 * Exemple:
 * node scripts/configure-trustpilot.js '<div class="trustpilot-widget" data-template-id="539adbd6dec7e10109cdf8c9" data-businessunit-id="5a1b2c3d4e5f6g7h8i9j0k1">...</div>'
 */

const fs = require('fs');
const path = require('path');

function extractTrustpilotConfig(htmlCode) {
  const config = {
    templateId: null,
    businessUnitId: null,
    domain: null,
    locale: 'fr-FR',
    theme: 'dark',
    height: '400px',
    width: '100%',
  };

  // Extraire template-id
  const templateIdMatch = htmlCode.match(/data-template-id=["']([^"']+)["']/i);
  if (templateIdMatch) {
    config.templateId = templateIdMatch[1];
  }

  // Extraire businessunit-id
  const businessUnitIdMatch = htmlCode.match(/data-businessunit-id=["']([^"']+)["']/i);
  if (businessUnitIdMatch) {
    config.businessUnitId = businessUnitIdMatch[1];
  }

  // Extraire le domaine depuis l'URL
  const domainMatch = htmlCode.match(/trustpilot\.com\/review\/([^"'\s>]+)/i);
  if (domainMatch) {
    config.domain = domainMatch[1];
  }

  // Extraire locale si présente
  const localeMatch = htmlCode.match(/data-locale=["']([^"']+)["']/i);
  if (localeMatch) {
    config.locale = localeMatch[1];
  }

  // Extraire theme si présent
  const themeMatch = htmlCode.match(/data-theme=["']([^"']+)["']/i);
  if (themeMatch) {
    config.theme = themeMatch[1];
  }

  return config;
}

function updateTrustpilotConfig(config) {
  const configPath = path.join(__dirname, '../src/config/trustpilot.ts');
  
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Remplacer les valeurs
  configContent = configContent.replace(
    /templateId:\s*"[^"]*"/,
    `templateId: "${config.templateId || 'TON_TEMPLATE_ID'}"`
  );
  
  configContent = configContent.replace(
    /businessUnitId:\s*"[^"]*"/,
    `businessUnitId: "${config.businessUnitId || 'TON_BUSINESSUNIT_ID'}"`
  );
  
  configContent = configContent.replace(
    /domain:\s*"[^"]*"/,
    `domain: "${config.domain || 'TON_DOMAINE'}"`
  );
  
  if (config.locale) {
    configContent = configContent.replace(
      /locale:\s*"[^"]*"/,
      `locale: "${config.locale}"`
    );
  }
  
  if (config.theme) {
    configContent = configContent.replace(
      /theme:\s*"dark"/,
      `theme: "${config.theme}"`
    );
  }
  
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log('✅ Configuration Trustpilot mise à jour!');
}

// Main
const htmlCode = process.argv[2];

if (!htmlCode) {
  console.log('❌ Usage: node scripts/configure-trustpilot.js "<code HTML TrustBox>"');
  console.log('');
  console.log('Exemple:');
  console.log('node scripts/configure-trustpilot.js \'<div class="trustpilot-widget" data-template-id="539adbd6dec7e10109cdf8c9" data-businessunit-id="5a1b2c3d4e5f6g7h8i9j0k1">...</div>\'');
  process.exit(1);
}

console.log('🔍 Extraction des informations Trustpilot...\n');

const config = extractTrustpilotConfig(htmlCode);

console.log('Informations extraites:');
console.log(`  Template ID: ${config.templateId || '❌ Non trouvé'}`);
console.log(`  Business Unit ID: ${config.businessUnitId || '❌ Non trouvé'}`);
console.log(`  Domaine: ${config.domain || '❌ Non trouvé'}`);
console.log(`  Locale: ${config.locale}`);
console.log(`  Thème: ${config.theme}`);
console.log('');

if (config.templateId && config.businessUnitId) {
  updateTrustpilotConfig(config);
  console.log('\n✅ Configuration complète! Le widget Trustpilot devrait maintenant fonctionner.');
} else {
  console.log('⚠️ Certaines informations manquent. Veuillez vérifier le code TrustBox.');
  console.log('Les informations manquantes seront laissées en placeholder.');
  updateTrustpilotConfig(config);
}

