/**
 * Script de correction COMPLÈTE des problèmes d'emails
 * 
 * PROBLÈMES IDENTIFIÉS :
 * 1. Le hook send-auth-email a verify_jwt: true → Supabase Auth ne peut pas l'appeler
 * 2. Le SMTP Resend n'est peut-être pas correctement configuré
 * 
 * SOLUTION :
 * - Désactiver le hook Auth personnalisé
 * - Configurer le SMTP Resend directement dans Supabase Auth
 */

import 'dotenv/config';

const PROJECT_REF = 'vveswlmcgmizmjsriezw';

// Récupérer le token d'accès depuis les arguments ou l'environnement
const SUPABASE_ACCESS_TOKEN = process.argv[2] || process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN requis');
  console.log('');
  console.log('Usage: node scripts/fix-all-email-issues.js <SUPABASE_ACCESS_TOKEN>');
  console.log('');
  console.log('Obtenir le token: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

async function getAuthConfig() {
  console.log('📋 Récupération de la configuration Auth actuelle...');
  
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
  console.log('🔧 Mise à jour de la configuration Auth...');
  
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
  console.log('🚀 Correction complète des problèmes d\'emails');
  console.log('='.repeat(50));
  console.log('');

  try {
    // 1. Récupérer la config actuelle
    const currentConfig = await getAuthConfig();
    console.log('');
    console.log('📊 Configuration actuelle:');
    console.log(`   - SMTP Host: ${currentConfig.smtp_host || 'non configuré'}`);
    console.log(`   - SMTP User: ${currentConfig.smtp_user || 'non configuré'}`);
    console.log(`   - SMTP Admin Email: ${currentConfig.smtp_admin_email || 'non configuré'}`);
    console.log(`   - Hook URI: ${currentConfig.hook_send_email_uri || 'non configuré'}`);
    console.log(`   - Hook Enabled: ${currentConfig.hook_send_email_enabled || false}`);
    console.log('');

    // 2. Configurer le SMTP Resend et DÉSACTIVER le hook
    console.log('📧 Configuration du SMTP Resend et désactivation du hook...');
    
    const newConfig = {
      // SMTP Resend
      smtp_host: 'smtp.resend.com',
      smtp_port: '465',  // Doit être une string
      smtp_user: 'resend',
      smtp_pass: 're_5Yarwbve_BXLvdXedAsaUe8FJgXVRrp5S', // Clé API Resend - Nouvelle clé valide
      smtp_admin_email: 'noreply@investinfinity.fr',
      smtp_sender_name: 'Invest Infinity',
      smtp_max_frequency: 60, // 60 secondes entre les emails
      
      // DÉSACTIVER le hook Auth personnalisé
      hook_send_email_enabled: false,
      // Note: on ne peut pas mettre des valeurs vides, on doit garder les anciennes ou ne pas les inclure
      
      // S'assurer que les emails sont activés
      external_email_enabled: true,
      mailer_autoconfirm: true,  // IMPORTANT: Désactiver la confirmation d'email pour permettre la connexion immédiate
      mailer_secure_email_change_enabled: true,
    };

    const result = await updateAuthConfig(newConfig);
    console.log('');
    console.log('✅ Configuration mise à jour avec succès!');
    console.log('');
    
    // 3. Vérifier la nouvelle config
    console.log('🔍 Vérification de la nouvelle configuration...');
    const verifyConfig = await getAuthConfig();
    console.log('');
    console.log('📊 Nouvelle configuration:');
    console.log(`   - SMTP Host: ${verifyConfig.smtp_host}`);
    console.log(`   - SMTP User: ${verifyConfig.smtp_user}`);
    console.log(`   - SMTP Admin Email: ${verifyConfig.smtp_admin_email}`);
    console.log(`   - Hook Enabled: ${verifyConfig.hook_send_email_enabled}`);
    console.log('');
    
    console.log('='.repeat(50));
    console.log('✅ CORRECTION TERMINÉE!');
    console.log('');
    console.log('Les emails seront maintenant envoyés via Resend SMTP directement.');
    console.log('Plus besoin du hook send-auth-email.');
    console.log('');
    console.log('⚠️  Note: Les templates d\'email utilisent les templates Supabase par défaut.');
    console.log('   Tu peux les personnaliser dans: Dashboard > Auth > Email Templates');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERREUR:', error.message);
    process.exit(1);
  }
}

main();

