/**
 * CORRECTION FINALE DES EMAILS
 * 
 * Ce script va:
 * 1. DÉSACTIVER complètement le hook send-auth-email
 * 2. Configurer le SMTP Resend correctement
 * 3. Activer mailer_autoconfirm pour connexion immédiate
 */

import 'dotenv/config';

const PROJECT_REF = 'vveswlmcgmizmjsriezw';
const SUPABASE_ACCESS_TOKEN = process.argv[2] || process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN requis');
  console.log('Usage: node scripts/fix-email-final.js <SUPABASE_ACCESS_TOKEN>');
  process.exit(1);
}

async function getAuthConfig() {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur récupération config: ${response.status} - ${error}`);
  }

  return response.json();
}

async function updateAuthConfig(config) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur mise à jour config: ${response.status} - ${error}`);
  }

  return response.json();
}

async function main() {
  console.log('🔧 CORRECTION FINALE DES EMAILS');
  console.log('='.repeat(50));
  console.log('');

  try {
    // 1. Récupérer la config actuelle
    console.log('📋 Configuration actuelle...');
    const currentConfig = await getAuthConfig();
    
    console.log('');
    console.log('État actuel:');
    console.log(`   - Hook enabled: ${currentConfig.hook_send_email_enabled}`);
    console.log(`   - Hook URI: ${currentConfig.hook_send_email_uri || 'vide'}`);
    console.log(`   - SMTP Host: ${currentConfig.smtp_host || 'non configuré'}`);
    console.log(`   - SMTP User: ${currentConfig.smtp_user || 'non configuré'}`);
    console.log(`   - mailer_autoconfirm: ${currentConfig.mailer_autoconfirm}`);
    console.log('');

    // 2. Appliquer la correction
    console.log('🔧 Application des corrections...');

    const newConfig = {
      // DÉSACTIVER le hook complètement
      hook_send_email_enabled: false,
      
      // SMTP Resend - utiliser la nouvelle clé API
      smtp_host: 'smtp.resend.com',
      smtp_port: '465',
      smtp_user: 'resend',
      smtp_pass: 're_5Yarwbve_BXLvdXedAsaUe8FJgXVRrp5S',
      smtp_admin_email: 'noreply@investinfinity.fr',
      smtp_sender_name: 'Invest Infinity',
      
      // Activer la confirmation automatique
      mailer_autoconfirm: true,
      external_email_enabled: true,
    };

    await updateAuthConfig(newConfig);
    console.log('✅ Configuration mise à jour!');
    console.log('');

    // 3. Vérifier
    console.log('🔍 Vérification...');
    const verifyConfig = await getAuthConfig();
    
    console.log('');
    console.log('Nouvelle configuration:');
    console.log(`   - Hook enabled: ${verifyConfig.hook_send_email_enabled}`);
    console.log(`   - SMTP Host: ${verifyConfig.smtp_host}`);
    console.log(`   - SMTP User: ${verifyConfig.smtp_user}`);
    console.log(`   - mailer_autoconfirm: ${verifyConfig.mailer_autoconfirm}`);
    console.log('');

    if (verifyConfig.hook_send_email_enabled === false && verifyConfig.mailer_autoconfirm === true) {
      console.log('✅ SUCCÈS! Le hook est désactivé et les emails passent par SMTP Resend.');
    } else {
      console.log('⚠️ Vérification partielle - vérifiez manuellement dans le dashboard Supabase.');
    }

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    process.exit(1);
  }
}

main();

