/**
 * Script pour configurer Resend comme SMTP pour Supabase Auth
 * 
 * Configuration Resend SMTP:
 * - Host: smtp.resend.com
 * - Port: 465 (SSL) ou 587 (TLS)
 * - User: resend
 * - Password: Votre clé API Resend (re_xxx...)
 */

const PROJECT_REF = 'vveswlmcgmizmjsriezw';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function configureSmtp() {
  console.log('🔧 Configuration de Resend SMTP pour Supabase Auth...\n');

  if (!ACCESS_TOKEN) {
    console.error('❌ SUPABASE_ACCESS_TOKEN non défini');
    process.exit(1);
  }

  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY non défini');
    console.log('\n💡 Pour obtenir votre clé API Resend:');
    console.log('   1. Allez sur https://resend.com/api-keys');
    console.log('   2. Créez une nouvelle clé ou copiez une existante');
    console.log('   3. Relancez avec: $env:RESEND_API_KEY="re_xxx"; node scripts/configure-resend-smtp.js');
    process.exit(1);
  }

  // Configuration SMTP Resend
  const smtpConfig = {
    // Activer SMTP personnalisé
    external_email_enabled: true,
    
    // Configuration Resend SMTP
    smtp_host: 'smtp.resend.com',
    smtp_port: '465',
    smtp_user: 'resend',
    smtp_pass: RESEND_API_KEY,
    smtp_admin_email: 'noreply@investinfinity.fr',
    smtp_sender_name: 'Invest Infinity',
    smtp_max_frequency: 60, // 1 email par minute par utilisateur
  };

  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smtpConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur API: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    console.log('✅ SMTP Resend configuré avec succès!\n');
    console.log('📋 Configuration appliquée:');
    console.log('   Host:', result.smtp_host);
    console.log('   Port:', result.smtp_port);
    console.log('   User:', result.smtp_user);
    console.log('   Sender:', result.smtp_sender_name, `<${result.smtp_admin_email}>`);
    console.log('');
    console.log('🎉 Les emails d\'authentification seront maintenant envoyés depuis:');
    console.log('   Invest Infinity <noreply@investinfinity.fr>');
    console.log('');
    console.log('📧 Types d\'emails concernés:');
    console.log('   - Confirmation d\'inscription');
    console.log('   - Réinitialisation de mot de passe');
    console.log('   - Magic links');
    console.log('   - Changement d\'email');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

configureSmtp();

