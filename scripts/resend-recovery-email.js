/**
 * Script pour renvoyer un email de récupération de mot de passe
 * à un utilisateur qui a eu des problèmes avec son lien de confirmation
 * 
 * Usage: node scripts/resend-recovery-email.js email@example.com
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vveswlmcgmizmjsriezw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY non défini');
  console.log('Exécutez: $env:SUPABASE_SERVICE_ROLE_KEY = "votre-service-role-key"');
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Email requis');
  console.log('Usage: node scripts/resend-recovery-email.js email@example.com');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resendRecoveryEmail(userEmail) {
  console.log(`📧 Envoi d'un email de récupération à: ${userEmail}`);
  
  try {
    // Utiliser resetPasswordForEmail qui enverra un email via le hook send-auth-email
    const { data, error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: 'https://www.investinfinity.fr/create-password'
    });
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      return false;
    }
    
    console.log('✅ Email de récupération envoyé avec succès !');
    console.log('   L\'utilisateur recevra un email avec un lien pour créer son mot de passe.');
    return true;
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return false;
  }
}

resendRecoveryEmail(email);

