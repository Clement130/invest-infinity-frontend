import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SEND_EMAIL_HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET')!;

interface AuthEmailPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      prenom?: string;
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change';
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

// Sujets des emails en français
const subjects: Record<string, string> = {
  signup: 'Confirme ton inscription - Invest Infinity 🚀',
  recovery: 'Réinitialise ton mot de passe - Invest Infinity',
  invite: 'Tu as été invité sur Invest Infinity 🎉',
  magiclink: 'Ton lien de connexion - Invest Infinity',
  email_change: 'Confirme ton changement d\'email - Invest Infinity',
};

// Génère l'URL de confirmation
function generateConfirmationURL(email_data: AuthEmailPayload['email_data']): string {
  return `https://vveswlmcgmizmjsriezw.supabase.co/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to || 'https://www.investinfinity.fr/')}`;
}

// Template HTML professionnel
function generateEmailHTML(
  type: string,
  prenom: string,
  confirmationUrl: string,
  token: string
): string {
  // Contenu spécifique selon le type d'email
  const content = getEmailContent(type, prenom, confirmationUrl, token);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjects[type] || 'Invest Infinity'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f13;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0f0f13;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #1a1a1f 0%, #0f0f13 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
          
          <!-- Header avec logo -->
          <tr>
            <td align="center" style="padding: 40px 20px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                🚀 Invest Infinity
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Ta communauté de traders performants
              </p>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>

          <!-- Section Discord -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="padding: 20px; background: linear-gradient(135deg, rgba(88, 101, 242, 0.15) 0%, rgba(88, 101, 242, 0.05) 100%); border-radius: 12px; border: 1px solid rgba(88, 101, 242, 0.3);">
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="vertical-align: middle; width: 50px;">
                      <div style="width: 40px; height: 40px; background: #5865F2; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">
                        💬
                      </div>
                    </td>
                    <td style="vertical-align: middle; padding-left: 15px;">
                      <p style="margin: 0 0 4px 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                        Rejoins notre Discord !
                      </p>
                      <p style="margin: 0; color: #a1a1aa; font-size: 13px;">
                        +100 traders actifs • Alertes en temps réel • Lives quotidiens
                      </p>
                    </td>
                    <td style="vertical-align: middle; text-align: right;">
                      <a href="https://discord.gg/Y9RvKDCrWH" style="display: inline-block; background: #5865F2; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px;">
                        Rejoindre →
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 30px; border-top: 1px solid rgba(255, 255, 255, 0.1); background: rgba(0,0,0,0.2);">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; color: #a1a1aa; font-size: 13px;">
                      Des questions ? Contacte-nous sur Discord ou réponds à cet email.
                    </p>
                    <p style="margin: 0 0 16px 0; color: #71717a; font-size: 12px;">
                      © ${new Date().getFullYear()} Invest Infinity - Tous droits réservés
                    </p>
                    <div style="margin-top: 12px;">
                      <a href="https://www.investinfinity.fr" style="color: #ec4899; text-decoration: none; font-size: 12px; margin: 0 10px;">Site web</a>
                      <span style="color: #52525b;">•</span>
                      <a href="https://discord.gg/Y9RvKDCrWH" style="color: #ec4899; text-decoration: none; font-size: 12px; margin: 0 10px;">Discord</a>
                      <span style="color: #52525b;">•</span>
                      <a href="https://fr.trustpilot.com/review/investinfinity.fr" style="color: #ec4899; text-decoration: none; font-size: 12px; margin: 0 10px;">Avis Trustpilot</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getEmailContent(type: string, prenom: string, confirmationUrl: string, token: string): string {
  switch (type) {
    case 'signup':
      return `
        <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
          Bienvenue ${prenom} ! 🎉
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
          Tu y es presque ! Confirme ton adresse email pour accéder à ta formation et rejoindre notre communauté de traders.
        </p>

        <div style="margin: 24px 0; padding: 20px; background: rgba(236, 72, 153, 0.1); border-radius: 12px; border: 1px solid rgba(236, 72, 153, 0.2);">
          <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 14px; font-weight: 600;">
            ✨ Ce qui t'attend :
          </p>
          <ul style="margin: 0; padding-left: 20px; color: #a1a1aa; font-size: 14px; line-height: 1.8;">
            <li>Accès à la formation complète</li>
            <li>Alertes trading en temps réel</li>
            <li>Lives et sessions de trading</li>
            <li>Communauté Discord privée</li>
          </ul>
        </div>

        <!-- Bouton CTA -->
        <table role="presentation" style="margin: 32px 0; width: 100%;">
          <tr>
            <td align="center">
              <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.4);">
                ✅ Confirmer mon email
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 24px 0 8px 0; color: #71717a; font-size: 13px; text-align: center;">
          Ou utilise ce code de confirmation :
        </p>
        <div style="text-align: center; margin: 16px 0;">
          <span style="display: inline-block; background: rgba(255,255,255,0.1); color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 8px; padding: 16px 32px; border-radius: 12px; border: 2px dashed rgba(236, 72, 153, 0.5);">
            ${token}
          </span>
        </div>

        <p style="margin: 24px 0 0 0; color: #71717a; font-size: 12px; line-height: 1.5; text-align: center;">
          ⏰ Ce lien expire dans 24 heures. Si tu n'as pas créé de compte, ignore cet email.
        </p>
      `;

    case 'recovery':
      return `
        <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
          Réinitialisation du mot de passe 🔐
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
          Salut ${prenom},
        </p>

        <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
          Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous pour en créer un nouveau :
        </p>

        <!-- Bouton CTA -->
        <table role="presentation" style="margin: 32px 0; width: 100%;">
          <tr>
            <td align="center">
              <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.4);">
                🔑 Réinitialiser mon mot de passe
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 24px 0 8px 0; color: #71717a; font-size: 13px; text-align: center;">
          Ou utilise ce code :
        </p>
        <div style="text-align: center; margin: 16px 0;">
          <span style="display: inline-block; background: rgba(255,255,255,0.1); color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 8px; padding: 16px 32px; border-radius: 12px; border: 2px dashed rgba(236, 72, 153, 0.5);">
            ${token}
          </span>
        </div>

        <div style="margin: 24px 0; padding: 16px; background: rgba(251, 191, 36, 0.1); border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3);">
          <p style="margin: 0; color: #fbbf24; font-size: 13px;">
            ⚠️ Si tu n'as pas demandé cette réinitialisation, ignore cet email. Ton mot de passe restera inchangé.
          </p>
        </div>

        <p style="margin: 16px 0 0 0; color: #71717a; font-size: 12px; text-align: center;">
          ⏰ Ce lien expire dans 1 heure pour des raisons de sécurité.
        </p>
      `;

    case 'magiclink':
      return `
        <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
          Ton lien de connexion magique ✨
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
          Salut ${prenom},
        </p>

        <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
          Clique sur le bouton ci-dessous pour te connecter instantanément à ton compte :
        </p>

        <!-- Bouton CTA -->
        <table role="presentation" style="margin: 32px 0; width: 100%;">
          <tr>
            <td align="center">
              <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.4);">
                🚀 Me connecter
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 24px 0 0 0; color: #71717a; font-size: 12px; text-align: center;">
          ⏰ Ce lien expire dans 1 heure et ne peut être utilisé qu'une seule fois.
        </p>
      `;

    case 'invite':
      return `
        <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
          Tu as été invité ! 🎉
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
          Salut ${prenom},
        </p>

        <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
          Tu as été invité à rejoindre Invest Infinity ! Clique sur le bouton ci-dessous pour accepter l'invitation et créer ton compte :
        </p>

        <!-- Bouton CTA -->
        <table role="presentation" style="margin: 32px 0; width: 100%;">
          <tr>
            <td align="center">
              <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.4);">
                ✅ Accepter l'invitation
              </a>
            </td>
          </tr>
        </table>
      `;

    case 'email_change':
      return `
        <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
          Confirme ton nouvel email 📧
        </h2>
        
        <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
          Salut ${prenom},
        </p>

        <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
          Tu as demandé à changer ton adresse email. Clique sur le bouton ci-dessous pour confirmer ce changement :
        </p>

        <!-- Bouton CTA -->
        <table role="presentation" style="margin: 32px 0; width: 100%;">
          <tr>
            <td align="center">
              <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.4);">
                ✅ Confirmer le changement
              </a>
            </td>
          </tr>
        </table>

        <div style="margin: 24px 0; padding: 16px; background: rgba(251, 191, 36, 0.1); border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3);">
          <p style="margin: 0; color: #fbbf24; font-size: 13px;">
            ⚠️ Si tu n'as pas demandé ce changement, contacte-nous immédiatement sur Discord.
          </p>
        </div>
      `;

    default:
      return `
        <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
          Action requise
        </h2>
        
        <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
          Clique sur le bouton ci-dessous pour continuer :
        </p>

        <table role="presentation" style="margin: 32px 0; width: 100%;">
          <tr>
            <td align="center">
              <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 20px rgba(236, 72, 153, 0.4);">
                Continuer
              </a>
            </td>
          </tr>
        </table>
      `;
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Vérifier la signature du webhook
    const base64Secret = SEND_EMAIL_HOOK_SECRET.replace('v1,whsec_', '');
    const wh = new Webhook(base64Secret);
    
    let data: AuthEmailPayload;
    try {
      data = wh.verify(payload, headers) as AuthEmailPayload;
    } catch (err) {
      console.error('[send-auth-email] Webhook verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { user, email_data } = data;
    const prenom = user.user_metadata?.prenom || user.user_metadata?.full_name || 'Cher membre';
    const emailType = email_data.email_action_type;
    const confirmationUrl = generateConfirmationURL(email_data);
    const subject = subjects[emailType] || 'Notification - Invest Infinity';

    // Générer le HTML de l'email
    const htmlContent = generateEmailHTML(emailType, prenom, confirmationUrl, email_data.token);

    // Envoyer l'email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Invest Infinity <noreply@investinfinity.fr>',
        to: [user.email],
        subject: subject,
        html: htmlContent,
      }),
    });

    const resendData = await response.json();

    if (!response.ok) {
      console.error('[send-auth-email] Resend error:', resendData);
      return new Response(
        JSON.stringify({ error: { http_code: response.status, message: resendData.message } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-auth-email] Email sent successfully: ${emailType} to ${user.email}, id: ${resendData.id}`);

    // Retourner une réponse vide avec status 200 (requis par Supabase Auth Hook)
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-auth-email] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: errorMessage } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

