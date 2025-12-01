// Script pour mettre à jour les templates d'email Supabase Auth
// avec le style Invest Infinity (noir/rose)

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'vveswlmcgmizmjsriezw';

// Template HTML pour les emails avec le style Invest Infinity
const emailBaseStyle = `
  <style>
    body { margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(236, 72, 153, 0.2); }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo-text { font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    h1 { color: #ffffff; font-size: 28px; margin: 0 0 20px 0; text-align: center; }
    p { color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; }
    .highlight { color: #ec4899; font-weight: 600; }
    .button { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .button:hover { background: linear-gradient(135deg, #f472b6 0%, #ec4899 100%); }
    .code { background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ec4899; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
    .footer p { color: #71717a; font-size: 14px; margin: 0; }
    .footer a { color: #ec4899; text-decoration: none; }
  </style>
`;

// Template Recovery (Reset Password)
const recoveryTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${emailBaseStyle}
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">🚀 Invest Infinity</span>
      </div>
      <h1>Réinitialise ton mot de passe</h1>
      <p>Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Réinitialiser mon mot de passe</a>
      </div>
      <p style="text-align: center; color: #71717a; font-size: 14px;">Ce lien expire dans 24 heures.</p>
      <p style="color: #71717a; font-size: 14px;">Si tu n'as pas fait cette demande, ignore simplement cet email. Ton compte reste sécurisé.</p>
      <div class="footer">
        <p>© 2024 <a href="https://www.investinfinity.fr">Invest Infinity</a> - Tous droits réservés</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Template Confirmation (Signup)
const confirmationTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${emailBaseStyle}
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">🚀 Invest Infinity</span>
      </div>
      <h1>Bienvenue chez Invest Infinity !</h1>
      <p>Merci de t'être inscrit ! Confirme ton adresse email en cliquant sur le bouton ci-dessous :</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Confirmer mon email</a>
      </div>
      <p style="text-align: center; color: #71717a; font-size: 14px;">Ce lien expire dans 24 heures.</p>
      <div class="footer">
        <p>© 2024 <a href="https://www.investinfinity.fr">Invest Infinity</a> - Tous droits réservés</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Template Magic Link
const magicLinkTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${emailBaseStyle}
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">🚀 Invest Infinity</span>
      </div>
      <h1>Ton lien de connexion</h1>
      <p>Clique sur le bouton ci-dessous pour te connecter à ton compte Invest Infinity :</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Me connecter</a>
      </div>
      <p style="text-align: center; color: #71717a; font-size: 14px;">Ce lien expire dans 24 heures et ne peut être utilisé qu'une seule fois.</p>
      <div class="footer">
        <p>© 2024 <a href="https://www.investinfinity.fr">Invest Infinity</a> - Tous droits réservés</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Template Email Change
const emailChangeTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${emailBaseStyle}
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">🚀 Invest Infinity</span>
      </div>
      <h1>Confirme ton nouvel email</h1>
      <p>Tu as demandé à changer ton adresse email. Clique sur le bouton ci-dessous pour confirmer ce changement :</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Confirmer le changement</a>
      </div>
      <p style="text-align: center; color: #71717a; font-size: 14px;">Ce lien expire dans 24 heures.</p>
      <p style="color: #71717a; font-size: 14px;">Si tu n'as pas fait cette demande, contacte-nous immédiatement.</p>
      <div class="footer">
        <p>© 2024 <a href="https://www.investinfinity.fr">Invest Infinity</a> - Tous droits réservés</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Template Invite
const inviteTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${emailBaseStyle}
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">🚀 Invest Infinity</span>
      </div>
      <h1>Tu es invité à rejoindre Invest Infinity !</h1>
      <p>Tu as été invité à créer un compte sur Invest Infinity. Clique sur le bouton ci-dessous pour accepter l'invitation :</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Accepter l'invitation</a>
      </div>
      <p style="text-align: center; color: #71717a; font-size: 14px;">Ce lien expire dans 24 heures.</p>
      <div class="footer">
        <p>© 2024 <a href="https://www.investinfinity.fr">Invest Infinity</a> - Tous droits réservés</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

async function updateEmailTemplates() {
  if (!SUPABASE_ACCESS_TOKEN) {
    console.error('❌ SUPABASE_ACCESS_TOKEN non défini');
    console.log('Exécutez: $env:SUPABASE_ACCESS_TOKEN = "votre-token"');
    process.exit(1);
  }

  const config = {
    // Sujets en français
    mailer_subjects_confirmation: "Confirme ton inscription - Invest Infinity 🚀",
    mailer_subjects_recovery: "Réinitialise ton mot de passe - Invest Infinity",
    mailer_subjects_magic_link: "Ton lien de connexion - Invest Infinity",
    mailer_subjects_email_change: "Confirme le changement de ton email - Invest Infinity",
    mailer_subjects_invite: "Tu es invité à rejoindre Invest Infinity 🚀",
    
    // Templates HTML
    mailer_templates_confirmation_content: confirmationTemplate.replace(/\n/g, ''),
    mailer_templates_recovery_content: recoveryTemplate.replace(/\n/g, ''),
    mailer_templates_magic_link_content: magicLinkTemplate.replace(/\n/g, ''),
    mailer_templates_email_change_content: emailChangeTemplate.replace(/\n/g, ''),
    mailer_templates_invite_content: inviteTemplate.replace(/\n/g, ''),
  };

  console.log('📧 Mise à jour des templates email Supabase Auth...');
  console.log('Project:', PROJECT_REF);

  try {
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
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Templates email mis à jour avec succès !');
    console.log('');
    console.log('📋 Sujets configurés :');
    console.log('  - Confirmation: "Confirme ton inscription - Invest Infinity 🚀"');
    console.log('  - Recovery: "Réinitialise ton mot de passe - Invest Infinity"');
    console.log('  - Magic Link: "Ton lien de connexion - Invest Infinity"');
    console.log('  - Email Change: "Confirme le changement de ton email - Invest Infinity"');
    console.log('  - Invite: "Tu es invité à rejoindre Invest Infinity 🚀"');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

updateEmailTemplates();

