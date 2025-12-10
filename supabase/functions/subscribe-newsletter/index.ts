import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
import {
  checkRateLimit,
  getClientIP,
  rateLimitResponse,
  isValidEmail,
  secureLog,
  addSecurityHeaders,
} from '../_shared/security.ts';

// Helper CORS sécurisé
function getCorsHeaders(origin: string | null): Record<string, string> {
  const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'https://www.investinfinity.fr',
    'https://investinfinity.fr',
    'https://invest-infinity-frontend.vercel.app',
  ];
  
  let allowedOrigin = ALLOWED_ORIGINS[0];
  
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowedOrigin = origin;
    }
    else if (origin.match(/^https:\/\/invest-infinity-frontend.*\.vercel\.app$/)) {
      allowedOrigin = origin;
    }
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

type NewsletterPayload = {
  email: string;
};

// Contenu des 7 erreurs mortelles
const ERREURS = [
  {
    titre: 'Trader sans plan de trading',
    description: 'Le trading sans plan, c\'est comme naviguer sans boussole. Un plan de trading définit vos règles d\'entrée, de sortie, de gestion du risque et vos objectifs. Sans plan, vous êtes à la merci des émotions et des impulsions, ce qui conduit invariablement à des pertes.',
    conseil: 'Créez un plan écrit avec vos règles précises : quand entrer, quand sortir, combien risquer par trade, et respectez-le religieusement.',
  },
  {
    titre: 'Ne pas gérer son risque (pas de stop-loss)',
    description: 'Le stop-loss est votre filet de sécurité. Sans lui, une seule mauvaise transaction peut anéantir votre compte. Les débutants laissent souvent leurs pertes s\'accumuler en espérant que le marché reviendra, ce qui amplifie les dégâts.',
    conseil: 'Toujours placer un stop-loss à un pourcentage fixe de votre capital (généralement 1-2% par trade). Protégez votre capital avant tout.',
  },
  {
    titre: 'Sur-trader (trop de positions simultanées)',
    description: 'Croire que plus de trades = plus de profits est une illusion dangereuse. Le sur-trading disperse votre attention, augmente les frais de courtage et multiplie les risques. La qualité prime toujours sur la quantité.',
    conseil: 'Limitez-vous à 2-3 positions maximum simultanées. Concentrez-vous sur des trades de qualité plutôt que sur la quantité.',
  },
  {
    titre: 'Suivre aveuglément les "experts" sur les réseaux sociaux',
    description: 'Les réseaux sociaux regorgent de prétendus experts qui partagent des prédictions et des signaux. La plupart ne révèlent pas leurs pertes, créant une image biaisée du trading. Suivre ces "gourous" sans comprendre leur stratégie est une voie rapide vers la perte.',
    conseil: 'Apprenez à analyser par vous-même. Utilisez les réseaux sociaux pour l\'éducation, pas pour copier aveuglément des signaux. Si ça semble trop beau pour être vrai, c\'est probablement le cas.',
  },
  {
    titre: 'Ne pas tenir un journal de trading',
    description: 'Comment savoir ce qui fonctionne si vous ne suivez pas vos performances ? Un journal de trading vous permet d\'identifier vos patterns, vos forces, vos faiblesses et d\'améliorer votre stratégie au fil du temps.',
    conseil: 'Tenez un journal détaillé de chaque trade : entrée, sortie, raison, résultat, émotions. Analysez-le régulièrement pour identifier vos erreurs récurrentes.',
  },
  {
    titre: 'Trader avec l\'argent dont on a besoin',
    description: 'Trader avec de l\'argent destiné aux factures, au loyer ou aux urgences crée une pression émotionnelle insoutenable. Cette pression conduit à prendre des risques inconsidérés ou à sortir trop tôt de trades gagnants.',
    conseil: 'Ne tradez qu\'avec de l\'argent que vous pouvez vous permettre de perdre complètement. Votre capital de trading doit être séparé de vos finances essentielles.',
  },
  {
    titre: 'Ne pas se former correctement avant de commencer',
    description: 'Le trading n\'est pas un jeu de hasard. C\'est une compétence qui s\'apprend. Se lancer sans formation, c\'est comme essayer de construire une maison sans connaître les bases de la construction. Vous allez tout casser.',
    conseil: 'Investissez dans votre éducation avant d\'investir sur les marchés. Apprenez l\'analyse technique, fondamentale, la gestion du risque, la psychologie du trading. La formation est le meilleur investissement.',
  },
];

/**
 * Génère le PDF des 7 erreurs mortelles
 * Utilise pdf-lib qui est compatible avec Deno
 */
async function generatePdf(): Promise<Uint8Array> {
  try {
    // Utiliser pdf-lib qui est plus compatible avec Deno
    const { PDFDocument, rgb, StandardFonts } = await import('https://esm.sh/pdf-lib@1.17.1?target=deno');
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    const margin = 50;
    const maxWidth = width - 2 * margin;
    
    let yPosition = height - margin;
    const lineHeight = 20;
    const titleSize = 24;
    const headingSize = 18;
    const bodySize = 12;
    
    // Page de couverture
    page.drawText('7 ERREURS MORTELLES', {
      x: margin,
      y: yPosition,
      size: titleSize,
      font: boldFont,
      color: rgb(0.92, 0.28, 0.60), // Rose Invest Infinity
    });
    
    yPosition -= 30;
    page.drawText('DES DÉBUTANTS EN TRADING', {
      x: margin,
      y: yPosition,
      size: titleSize,
      font: boldFont,
      color: rgb(0.92, 0.28, 0.60),
    });
    
    yPosition -= 60;
    page.drawText('Évite ces pièges courants et protège ton capital', {
      x: margin,
      y: yPosition,
      size: 14,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    yPosition -= 80;
    page.drawText('Invest Infinity', {
      x: margin,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: rgb(0.55, 0.36, 0.96), // Violet Invest Infinity
    });
    
    yPosition -= 100;
    page.drawText(`${new Date().getFullYear()}`, {
      x: margin,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Nouvelle page pour l'introduction
    const introPage = pdfDoc.addPage([595, 842]);
    let introY = height - margin;
    
    introPage.drawText('Introduction', {
      x: margin,
      y: introY,
      size: headingSize,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    introY -= 40;
    const introText = 'En tant que débutant en trading, tu es exposé à des erreurs courantes qui peuvent rapidement anéantir ton capital. Ce guide identifie les 7 erreurs les plus mortelles que commettent les traders débutants et comment les éviter. En comprenant ces pièges, tu augmentes considérablement tes chances de réussite.';
    
    // Découper le texte en lignes (simplifié)
    const words = introText.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length * 6 < maxWidth) {
        currentLine = testLine;
      } else {
        introPage.drawText(currentLine, {
          x: margin,
          y: introY,
          size: bodySize,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });
        introY -= lineHeight;
        currentLine = word;
      }
    }
    if (currentLine) {
      introPage.drawText(currentLine, {
        x: margin,
        y: introY,
        size: bodySize,
        font: font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    
    // Pages pour chaque erreur
    for (let i = 0; i < ERREURS.length; i++) {
      const errorPage = pdfDoc.addPage([595, 842]);
      let errorY = height - margin;
      const erreur = ERREURS[i];
      
      // Numéro de l'erreur
      errorPage.drawText(`Erreur ${i + 1}/7`, {
        x: margin,
        y: errorY,
        size: 12,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      errorY -= 30;
      
      // Titre de l'erreur
      errorPage.drawText(erreur.titre, {
        x: margin,
        y: errorY,
        size: headingSize,
        font: boldFont,
        color: rgb(0.92, 0.28, 0.60),
      });
      
      errorY -= 40;
      
      // Description
      const descWords = erreur.description.split(' ');
      let descLine = '';
      for (const word of descWords) {
        const testLine = descLine ? `${descLine} ${word}` : word;
        if (testLine.length * 6 < maxWidth) {
          descLine = testLine;
        } else {
          errorPage.drawText(descLine, {
            x: margin,
            y: errorY,
            size: bodySize,
            font: font,
            color: rgb(0.2, 0.2, 0.2),
          });
          errorY -= lineHeight;
          descLine = word;
        }
      }
      if (descLine) {
        errorPage.drawText(descLine, {
          x: margin,
          y: errorY,
          size: bodySize,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });
        errorY -= lineHeight * 2;
      }
      
      // Section Conseil
      errorY -= 20;
      errorPage.drawText('💡 CONSEIL', {
        x: margin,
        y: errorY,
        size: 14,
        font: boldFont,
        color: rgb(0.55, 0.36, 0.96),
      });
      
      errorY -= 30;
      const conseilWords = erreur.conseil.split(' ');
      let conseilLine = '';
      for (const word of conseilWords) {
        const testLine = conseilLine ? `${conseilLine} ${word}` : word;
        if (testLine.length * 6 < maxWidth) {
          conseilLine = testLine;
        } else {
          errorPage.drawText(conseilLine, {
            x: margin,
            y: errorY,
            size: bodySize,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
          });
          errorY -= lineHeight;
          conseilLine = word;
        }
      }
      if (conseilLine) {
        errorPage.drawText(conseilLine, {
          x: margin,
          y: errorY,
          size: bodySize,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
    }
    
    // Page de conclusion
    const conclusionPage = pdfDoc.addPage([595, 842]);
    let conclY = height - margin;
    
    conclusionPage.drawText('Conclusion', {
      x: margin,
      y: conclY,
      size: headingSize,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    conclY -= 40;
    const conclText = 'Éviter ces 7 erreurs est la première étape vers le succès en trading. La clé est l\'éducation, la discipline et la patience. Si tu veux aller plus loin et apprendre des stratégies éprouvées, rejoins Invest Infinity pour une formation complète et un accompagnement personnalisé.';
    
    const conclWords = conclText.split(' ');
    let conclLine = '';
    for (const word of conclWords) {
      const testLine = conclLine ? `${conclLine} ${word}` : word;
      if (testLine.length * 6 < maxWidth) {
        conclLine = testLine;
      } else {
        conclusionPage.drawText(conclLine, {
          x: margin,
          y: conclY,
          size: bodySize,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });
        conclY -= lineHeight;
        conclLine = word;
      }
    }
    if (conclLine) {
      conclusionPage.drawText(conclLine, {
        x: margin,
        y: conclY,
        size: bodySize,
        font: font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    
    conclY -= 60;
    conclusionPage.drawText('Découvre nos formations sur investinfinity.fr', {
      x: margin,
      y: conclY,
      size: 14,
      font: boldFont,
      color: rgb(0.92, 0.28, 0.60),
    });
    
    const pdfBytes = await pdfDoc.save();
    return new Uint8Array(pdfBytes);
    
  } catch (error) {
    secureLog('subscribe-newsletter', 'PDF generation error', { 
      error: error instanceof Error ? error.message : 'Unknown' 
    });
    throw error;
  }
}

/**
 * Génère le contenu HTML de l'email
 */
function generateEmailHTML(): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ton PDF gratuit - Invest Infinity</title>
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
                Ton PDF gratuit est prêt ! 🎉
              </h2>
              
              <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                Merci de t'être inscrit à notre newsletter ! Tu trouveras en pièce jointe ton guide gratuit :
              </p>

              <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border-radius: 12px; border: 1px solid rgba(236, 72, 153, 0.2);">
                <h3 style="margin: 0 0 12px 0; color: #ffffff; font-size: 20px; font-weight: 600;">
                  7 Erreurs Mortelles des Débutants en Trading
                </h3>
                <p style="margin: 0; color: #a1a1aa; font-size: 14px; line-height: 1.5;">
                  Découvre les pièges les plus courants et comment les éviter pour protéger ton capital.
                </p>
              </div>

              <p style="margin: 24px 0 16px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                Le PDF est disponible en pièce jointe de cet email. 📎
              </p>

              <p style="margin: 0 0 24px 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                💡 <strong style="color: #ffffff;">Conseil :</strong> Conserve ce guide et consulte-le régulièrement pour éviter ces erreurs courantes.
              </p>

              <!-- Bouton CTA -->
              <table role="presentation" style="margin: 32px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="https://www.investinfinity.fr/pricing" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(236, 72, 153, 0.3);">
                      Découvre nos formations
                    </a>
                  </td>
                </tr>
              </table>

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
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 30px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0 0 8px 0; color: #71717a; font-size: 12px; line-height: 1.5; text-align: center;">
                Tu as des questions ? Réponds à cet email ou contacte-nous sur Discord.
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
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ==================== RATE LIMITING ====================
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit({
    identifier: `subscribe-newsletter:${clientIP}`,
    maxRequests: 5,      // 5 inscriptions max
    windowMs: 60 * 1000,  // par minute
  });

  if (!rateLimit.allowed) {
    secureLog('subscribe-newsletter', 'Rate limit exceeded', { ip: clientIP });
    return rateLimitResponse(rateLimit.resetIn, corsHeaders);
  }

  // Vérifier la configuration
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    secureLog('subscribe-newsletter', 'Missing configuration', {});
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: addSecurityHeaders(corsHeaders) },
    );
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: addSecurityHeaders(corsHeaders) },
    );
  }

  try {
    const payload = (await req.json()) as NewsletterPayload;

    // ==================== VALIDATION ====================
    const email = payload.email?.toLowerCase().trim();
    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    // Rate limit additionnel par email (anti-spam)
    const emailRateLimit = checkRateLimit({
      identifier: `subscribe-newsletter:email:${email}`,
      maxRequests: 3,       // 3 tentatives max par email
      windowMs: 60 * 60 * 1000,  // par heure
    });

    if (!emailRateLimit.allowed) {
      secureLog('subscribe-newsletter', 'Email rate limit exceeded', { email });
      return rateLimitResponse(emailRateLimit.resetIn, corsHeaders);
    }

    // ==================== ENREGISTREMENT DANS LA BASE ====================
    // Vérifier si le lead existe déjà
    const { data: existingLead } = await supabase
      .from('leads')
      .select('email, newsletter')
      .eq('email', email)
      .single();

    const newsletterAlreadySent = existingLead?.newsletter === true;

    // Upsert le lead avec newsletter: true
    const { error: dbError } = await supabase.from('leads').upsert(
      {
        email,
        newsletter: true,
        metadata: {
          newsletter_subscribed_at: new Date().toISOString(),
          pdf_sent: !newsletterAlreadySent, // True si c'est nouveau, false si déjà envoyé
          ip_hash: await hashIP(clientIP),
        },
      },
      { onConflict: 'email' },
    );

    if (dbError) {
      secureLog('subscribe-newsletter', 'Database error', { error: dbError.message });
      return new Response(
        JSON.stringify({ error: 'Unable to subscribe. Please try again.' }),
        { status: 500, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    // ==================== GÉNÉRATION ET ENVOI DU PDF ====================
    // Si le PDF a déjà été envoyé, ne pas le renvoyer automatiquement
    if (newsletterAlreadySent) {
      secureLog('subscribe-newsletter', 'Newsletter already sent, skipping PDF', { email });
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Already subscribed',
          pdf_sent: false 
        }),
        { status: 200, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    // Générer le PDF
    let pdfBytes: Uint8Array;
    try {
      pdfBytes = await generatePdf();
    } catch (pdfError) {
      secureLog('subscribe-newsletter', 'PDF generation failed', { 
        error: pdfError instanceof Error ? pdfError.message : 'Unknown' 
      });
      // Continuer même si le PDF échoue, mais logger l'erreur
      // On peut envoyer l'email sans PDF si nécessaire
      pdfBytes = new Uint8Array(0);
    }

    // Convertir le PDF en base64 pour Resend
    // Note: btoa peut avoir des problèmes avec de grandes chaînes, donc on utilise une approche plus sûre
    let pdfBase64: string;
    if (pdfBytes.length > 0) {
      // Convertir Uint8Array en base64 de manière sûre
      const binary = Array.from(pdfBytes, (byte) => String.fromCharCode(byte)).join('');
      pdfBase64 = btoa(binary);
    } else {
      pdfBase64 = '';
    }

    // Générer le contenu HTML de l'email
    const htmlContent = generateEmailHTML();

    // Envoyer l'email via Resend avec PDF en pièce jointe
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Invest Infinity <noreply@investinfinity.fr>',
        to: [email],
        subject: '🎁 Ton PDF gratuit : 7 Erreurs Mortelles des Débutants en Trading',
        html: htmlContent,
        attachments: pdfBytes.length > 0 ? [
          {
            filename: '7-erreurs-mortelles-debutants-trading.pdf',
            content: pdfBase64,
          },
        ] : [],
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      secureLog('subscribe-newsletter', 'Resend API error', { 
        error: emailResult 
      });
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: emailResult }),
        { status: 500, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    // Mettre à jour le metadata pour indiquer que le PDF a été envoyé
    await supabase
      .from('leads')
      .update({ 
        metadata: {
          newsletter_subscribed_at: new Date().toISOString(),
          pdf_sent: true,
          pdf_sent_at: new Date().toISOString(),
          email_id: emailResult.id,
        },
      })
      .eq('email', email);

    secureLog('subscribe-newsletter', 'Newsletter subscription successful', { 
      email, 
      emailId: emailResult.id 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'PDF sent successfully',
        emailId: emailResult.id 
      }),
      { status: 200, headers: addSecurityHeaders(corsHeaders) },
    );

  } catch (err) {
    secureLog('subscribe-newsletter', 'Unexpected error', { 
      error: err instanceof Error ? err.message : 'Unknown' 
    });
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: addSecurityHeaders(corsHeaders) },
    );
  }
});

// Hash l'IP pour l'audit sans stocker l'IP en clair
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + Deno.env.get('SUPABASE_URL')); // Salt avec URL
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}
