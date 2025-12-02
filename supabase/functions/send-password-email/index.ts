import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

// Headers CORS pour permettre les appels depuis le frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailRequest {
  email: string;
  verificationUrl: string; // URL complète de vérification Supabase
  prenom?: string;
  // Rétro-compatibilité avec l'ancien format (token)
  token?: string;
}

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Seules les requêtes POST sont autorisées
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { email, verificationUrl, token, prenom = 'Cher membre' }: EmailRequest = await req.json();

    if (!email || (!verificationUrl && !token)) {
      return new Response(
        JSON.stringify({ error: 'Email and verificationUrl (or token for legacy) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Utiliser verificationUrl si fourni, sinon construire l'ancien format (rétro-compatibilité)
    // Le nouveau format passe par /auth/v1/verify qui établit une session avant de rediriger
    const passwordUrl = verificationUrl || `https://www.investinfinity.fr/create-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Template HTML de l'email
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Invest Infinity</title>
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
                Invest Infinity
              </h1>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Paiement validé ! 🎉
              </h2>
              
              <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                Bonjour <strong style="color: #ffffff;">${prenom}</strong>,
              </p>

              <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                Ton paiement a bien été confirmé ! 🚀 Pour accéder à ta formation et rejoindre notre communauté, crée ton mot de passe dès maintenant :
              </p>

              <!-- Bouton CTA -->
              <table role="presentation" style="margin: 32px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${passwordUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(236, 72, 153, 0.3);">
                      Créer mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 8px 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                Ou copie ce lien dans ton navigateur :
              </p>
              <p style="margin: 0 0 24px 0; word-break: break-all; padding: 12px; background-color: rgba(255, 255, 255, 0.05); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <a href="${passwordUrl}" style="color: #ec4899; text-decoration: none; font-size: 13px;">${passwordUrl}</a>
              </p>

              <!-- Section Discord -->
              <div style="margin: 32px 0; padding: 20px; background: linear-gradient(135deg, rgba(88, 101, 242, 0.1) 0%, rgba(88, 101, 242, 0.05) 100%); border-radius: 12px; border: 1px solid rgba(88, 101, 242, 0.2);">
                <h3 style="margin: 0 0 12px 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                  📱 Rejoins notre Discord !
                </h3>
                <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 14px; line-height: 1.5;">
                  Accède aux alertes trading, aux lives quotidiens et à notre communauté de +100 traders.
                </p>
                <a href="https://discord.gg/Y9RvKDCrWH" style="color: #5865F2; text-decoration: none; font-weight: 600; font-size: 14px;">
                  Rejoindre le Discord →
                </a>
              </div>

              <p style="margin: 24px 0 0 0; color: #71717a; font-size: 13px; line-height: 1.5;">
                ⚠️ Ce lien expire dans 1 heure pour des raisons de sécurité. Si tu as besoin d'aide, contacte-nous sur Discord !
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 30px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0 0 8px 0; color: #71717a; font-size: 12px; line-height: 1.5; text-align: center;">
                Tu as des questions ? Écris-nous sur Discord ou réponds à cet email.
              </p>
              <p style="margin: 0; color: #52525b; font-size: 11px; text-align: center;">
                © ${new Date().getFullYear()} Invest Infinity - Tous droits réservés
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Envoyer l'email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Invest Infinity <noreply@investinfinity.fr>',
        to: [email],
        subject: 'Crée ton mot de passe - Invest Infinity 🚀',
        html: htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[send-password-email] Resend error:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: data }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-password-email] Email sent successfully:', data.id);

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-password-email] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

