/**
 * Script simple pour extraire et configurer Trustpilot
 * Usage: Collez le code TrustBox HTML quand demandé
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractConfig(htmlCode) {
  const config = {
    templateId: null,
    businessUnitId: null,
    domain: null,
    locale: 'fr-FR',
    theme: 'dark',
  };

  const templateIdMatch = htmlCode.match(/data-template-id=["']([^"']+)["']/i);
  if (templateIdMatch) config.templateId = templateIdMatch[1];

  const businessUnitIdMatch = htmlCode.match(/data-businessunit-id=["']([^"']+)["']/i);
  if (businessUnitIdMatch) config.businessUnitId = businessUnitIdMatch[1];

  const domainMatch = htmlCode.match(/trustpilot\.com\/review\/([^"'\s>]+)/i);
  if (domainMatch) config.domain = domainMatch[1];

  const localeMatch = htmlCode.match(/data-locale=["']([^"']+)["']/i);
  if (localeMatch) config.locale = localeMatch[1];

  const themeMatch = htmlCode.match(/data-theme=["']([^"']+)["']/i);
  if (themeMatch) config.theme = themeMatch[1];

  return config;
}

function updateConfig(config) {
  const configPath = path.join(__dirname, '../src/config/trustpilot.ts');
  let content = fs.readFileSync(configPath, 'utf8');

  content = content.replace(
    /templateId:\s*import\.meta\.env\.VITE_TRUSTPILOT_TEMPLATE_ID\s*\|\|\s*"[^"]*"/,
    `templateId: import.meta.env.VITE_TRUSTPILOT_TEMPLATE_ID || "${config.templateId || 'TON_TEMPLATE_ID'}"`
  );

  content = content.replace(
    /businessUnitId:\s*import\.meta\.env\.VITE_TRUSTPILOT_BUSINESSUNIT_ID\s*\|\|\s*"[^"]*"/,
    `businessUnitId: import.meta.env.VITE_TRUSTPILOT_BUSINESSUNIT_ID || "${config.businessUnitId || 'TON_BUSINESSUNIT_ID'}"`
  );

  content = content.replace(
    /domain:\s*import\.meta\.env\.VITE_TRUSTPILOT_DOMAIN\s*\|\|\s*"[^"]*"/,
    `domain: import.meta.env.VITE_TRUSTPILOT_DOMAIN || "${config.domain || 'TON_DOMAINE'}"`
  );

  if (config.locale) {
    content = content.replace(/locale:\s*"[^"]*"/, `locale: "${config.locale}"`);
  }

  if (config.theme) {
    content = content.replace(/theme:\s*"dark"/, `theme: "${config.theme}"`);
  }

  fs.writeFileSync(configPath, content, 'utf8');
}

async function main() {
  console.log('🔍 Extraction Trustpilot - Mode simple\n');
  console.log('📋 Instructions:');
  console.log('   1. Allez sur: https://businessapp.b2b.trustpilot.com/features/trustbox-widgets');
  console.log('   2. Connectez-vous si nécessaire');
  console.log('   3. Cliquez sur "Get code" / "Obtenir le code"');
  console.log('   4. Copiez le code HTML complet');
  console.log('   5. Collez-le ci-dessous\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('Collez le code TrustBox HTML (appuyez sur Entrée deux fois pour terminer):\n');
    let lines = [];
    
    rl.on('line', (line) => {
      if (line.trim() === '' && lines.length > 0) {
        rl.close();
        const htmlCode = lines.join('\n');
        console.log('\n🔍 Extraction des informations...\n');
        
        const config = extractConfig(htmlCode);
        
        console.log('Informations extraites:');
        console.log(`  Template ID: ${config.templateId || '❌ Non trouvé'}`);
        console.log(`  Business Unit ID: ${config.businessUnitId || '❌ Non trouvé'}`);
        console.log(`  Domaine: ${config.domain || '❌ Non trouvé'}`);
        console.log(`  Locale: ${config.locale}`);
        console.log(`  Thème: ${config.theme}\n`);
        
        if (config.templateId && config.businessUnitId) {
          updateConfig(config);
          console.log('✅ Configuration mise à jour avec succès!');
          console.log('   Fichier: src/config/trustpilot.ts\n');
          console.log('🎉 Configuration Trustpilot complétée!');
        } else {
          console.log('⚠️ Certaines informations manquent.');
          updateConfig(config);
        }
        
        resolve();
      } else if (line.trim() !== '') {
        lines.push(line);
      }
    });
  });
}

main().catch(console.error);

