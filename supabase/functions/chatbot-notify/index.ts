import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Edge Function: chatbot-notify
 * 
 * Envoie des notifications email aux admins quand:
 * - Une demande de contact est soumise
 * - Un ticket support est créé
 * - Une demande de RDV Bootcamp est faite
 */

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://www.investinfinity.fr',
  'https://investinfinity.fr',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  let allowedOrigin = ALLOWED_ORIGINS[0];
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    allowedOrigin = origin;
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Types de notification
type NotificationType = 'contact' | 'support' | 'rdv_bootcamp' | 'urgent';

interface NotificationPayload {
  type: NotificationType;
  subject: string;
  data: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

// Templates email HTML
function getEmailTemplate(payload: NotificationPayload): { subject: string; html: string } {
  const { type, data, priority } = payload;
  const priorityBadge = priority === 'high' 
    ? '<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">URGENT</span>' 
    : '';

  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #0f0f0f;
    color: #e5e5e5;
    padding: 20px;
  `;

  const cardStyle = `
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    border: 1px solid #ec4899;
    border-radius: 12px;
    padding: 24px;
    margin: 20px 0;
  `;

  const labelStyle = `color: #ec4899; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;`;
  const valueStyle = `color: #ffffff; font-size: 14px; margin-bottom: 16px;`;

  switch (type) {
    case 'contact':
      return {
        subject: `📬 Nouvelle demande de contact - ${data.subject || 'Général'}`,
        html: `
          <div style="${baseStyle}">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: #ec4899; margin-bottom: 8px;">📬 Nouvelle demande de contact ${priorityBadge}</h1>
              <p style="color: #888; margin-bottom: 24px;">Via le chatbot Invest Infinity</p>
              
              <div style="${cardStyle}">
                <div style="${labelStyle}">Nom</div>
                <div style="${valueStyle}">${data.name || 'Non renseigné'}</div>
                
                <div style="${labelStyle}">Email</div>
                <div style="${valueStyle}"><a href="mailto:${data.email}" style="color: #ec4899;">${data.email}</a></div>
                
                ${data.phone ? `
                <div style="${labelStyle}">Téléphone</div>
                <div style="${valueStyle}"><a href="tel:${data.phone}" style="color: #ec4899;">${data.phone}</a></div>
                ` : ''}
                
                <div style="${labelStyle}">Sujet</div>
                <div style="${valueStyle}">${data.subject || 'Non précisé'}</div>
                
                <div style="${labelStyle}">Message</div>
                <div style="${valueStyle}; white-space: pre-wrap;">${data.message}</div>
              </div>
              
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #333;">
                <p style="color: #666; font-size: 12px;">
                  Source: ${data.source || 'chatbot'} • 
                  Date: ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}
                </p>
              </div>
            </div>
          </div>
        `,
      };

    case 'support':
      return {
        subject: `🔧 Ticket Support - ${data.problemType || 'Problème technique'}`,
        html: `
          <div style="${baseStyle}">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: #f59e0b; margin-bottom: 8px;">🔧 Nouveau ticket support ${priorityBadge}</h1>
              <p style="color: #888; margin-bottom: 24px;">Demande d'assistance technique</p>
              
              <div style="${cardStyle}">
                <div style="${labelStyle}">Client</div>
                <div style="${valueStyle}">${data.name || 'Non renseigné'}</div>
                
                <div style="${labelStyle}">Email</div>
                <div style="${valueStyle}"><a href="mailto:${data.email}" style="color: #ec4899;">${data.email}</a></div>
                
                <div style="${labelStyle}">Offre souscrite</div>
                <div style="${valueStyle}">${data.offer || 'Non précisé'}</div>
                
                <div style="${labelStyle}">Type de problème</div>
                <div style="${valueStyle}; color: #f59e0b;">${data.problemType || 'Non précisé'}</div>
                
                <div style="${labelStyle}">Description</div>
                <div style="${valueStyle}; white-space: pre-wrap;">${data.description}</div>
              </div>
              
              <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin-top: 16px;">
                <p style="color: #888; font-size: 12px; margin: 0;">
                  💡 Conseil: Vérifiez d'abord si ce problème est courant dans la FAQ avant de répondre.
                </p>
              </div>
            </div>
          </div>
        `,
      };

    case 'rdv_bootcamp':
      return {
        subject: `🎯 Demande de RDV Bootcamp Élite - ${data.name}`,
        html: `
          <div style="${baseStyle}">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: #10b981; margin-bottom: 8px;">🎯 Nouvelle demande de RDV Bootcamp ${priorityBadge}</h1>
              <p style="color: #888; margin-bottom: 24px;">Un prospect souhaite en savoir plus sur le Bootcamp Élite</p>
              
              <div style="${cardStyle}">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div>
                    <div style="${labelStyle}">Nom complet</div>
                    <div style="${valueStyle}">${data.firstName} ${data.lastName}</div>
                  </div>
                  <div>
                    <div style="${labelStyle}">Localisation</div>
                    <div style="${valueStyle}">${data.location || 'Non précisé'}</div>
                  </div>
                </div>
                
                <div style="${labelStyle}">Email</div>
                <div style="${valueStyle}"><a href="mailto:${data.email}" style="color: #ec4899;">${data.email}</a></div>
                
                <div style="${labelStyle}">Téléphone</div>
                <div style="${valueStyle}"><a href="tel:${data.phone}" style="color: #ec4899;">${data.phone}</a></div>
                
                <div style="${labelStyle}">Type de RDV souhaité</div>
                <div style="${valueStyle}; color: #10b981;">${data.type === 'appel_qualification' ? 'Appel qualification (30 min)' : 'Appel découverte (15 min)'}</div>
                
                <div style="${labelStyle}">Disponibilités</div>
                <div style="${valueStyle}">${data.availability || 'Non précisé'}</div>
                
                <div style="${labelStyle}">Objectif</div>
                <div style="${valueStyle}; white-space: pre-wrap;">${data.goals || 'Non précisé'}</div>
              </div>
              
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 16px; margin-top: 16px; text-align: center;">
                <p style="color: white; margin: 0; font-weight: 600;">
                  🚀 Action requise: Contacter ce prospect dans les 24h
                </p>
              </div>
            </div>
          </div>
        `,
      };

    case 'urgent':
      return {
        subject: `🚨 URGENT - ${payload.subject}`,
        html: `
          <div style="${baseStyle}">
            <div style="max-width: 600px; margin: 0 auto;">
              <div style="background: #ef4444; color: white; padding: 16px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0;">🚨 NOTIFICATION URGENTE</h1>
              </div>
              <div style="${cardStyle}; border-radius: 0 0 12px 12px; border-top: none;">
                <div style="${labelStyle}">Sujet</div>
                <div style="${valueStyle}">${payload.subject}</div>
                
                <div style="${labelStyle}">Détails</div>
                <div style="${valueStyle}; white-space: pre-wrap;">${JSON.stringify(data, null, 2)}</div>
              </div>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: `📢 Notification Chatbot - ${payload.subject}`,
        html: `
          <div style="${baseStyle}">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: #ec4899;">${payload.subject}</h1>
              <pre style="background: #1a1a1a; padding: 16px; border-radius: 8px; overflow: auto;">
                ${JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        `,
      };
  }
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();

    if (!payload.type || !payload.data) {
      return new Response(
        JSON.stringify({ error: 'type and data are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer la clé Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@investinfinity.fr';
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'chatbot@investinfinity.fr';

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured, skipping email notification');
      // On ne retourne pas d'erreur, juste un warning
      return new Response(
        JSON.stringify({ success: true, warning: 'Email notifications not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Générer l'email
    const { subject, html } = getEmailTemplate(payload);

    // Envoyer via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Chatbot Invest Infinity <${fromEmail}>`,
        to: [adminEmail],
        subject: subject,
        html: html,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();

    // Logger dans Supabase pour audit
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseAdmin.from('chatbot_analytics').insert({
      session_id: payload.data.sessionId as string || 'notification',
      user_role: 'admin',
      event_type: 'action_executed',
      event_data: {
        action: `email_notification_${payload.type}`,
        success: true,
        email_id: emailResult.id,
        recipient: adminEmail,
        subject: subject,
      },
    });

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

