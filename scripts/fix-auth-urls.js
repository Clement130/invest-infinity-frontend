/**
 * Script pour corriger les URLs d'authentification Supabase
 * - Met à jour Site URL vers https://www.investinfinity.fr
 * - Ajoute les Redirect URLs de production
 */

const PROJECT_REF = 'vveswlmcgmizmjsriezw';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function getAuthConfig() {
  console.log('📖 Récupération de la configuration actuelle...\n');
  
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur GET config: ${response.status} - ${error}`);
  }

  return response.json();
}

async function updateAuthConfig() {
  console.log('🔧 Mise à jour de la configuration Auth Supabase...\n');

  // Configuration à mettre à jour
  const config = {
    // Site URL principal (utilisé dans les emails de confirmation)
    site_url: 'https://www.investinfinity.fr',
    
    // URLs de redirection autorisées
    uri_allow_list: [
      'https://www.investinfinity.fr/**',
      'https://investinfinity.fr/**',
      'http://localhost:3000/**',
      'http://127.0.0.1:3000/**',
    ].join(','),
    
    // Garder la confirmation email activée mais avec les bonnes URLs
    mailer_autoconfirm: false,
  };

  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur PATCH config: ${response.status} - ${error}`);
  }

  return response.json();
}

async function main() {
  if (!ACCESS_TOKEN) {
    console.error('❌ SUPABASE_ACCESS_TOKEN non défini dans .env.local');
    process.exit(1);
  }

  try {
    // 1. Afficher la config actuelle
    const currentConfig = await getAuthConfig();
    console.log('📋 Configuration actuelle:');
    console.log('   Site URL:', currentConfig.site_url || '(non défini)');
    console.log('   Redirect URLs:', currentConfig.uri_allow_list || '(non défini)');
    console.log('   Auto-confirm emails:', currentConfig.mailer_autoconfirm);
    console.log('');

    // 2. Mettre à jour
    console.log('🚀 Application des corrections...\n');
    const updatedConfig = await updateAuthConfig();
    
    console.log('✅ Configuration mise à jour avec succès!\n');
    console.log('📋 Nouvelle configuration:');
    console.log('   Site URL:', updatedConfig.site_url);
    console.log('   Redirect URLs:', updatedConfig.uri_allow_list);
    console.log('');
    
    console.log('🎉 Les emails de confirmation redirigeront maintenant vers:');
    console.log('   https://www.investinfinity.fr');
    console.log('');
    console.log('⚠️  Note: Les utilisateurs qui ont déjà reçu des emails avec localhost');
    console.log('   devront se réinscrire ou être confirmés manuellement.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();

