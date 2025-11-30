import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'investinfinityfr@gmail.com';

// CORS headers
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://www.investinfinity.fr',
  'https://investinfinity.fr',
  'https://invest-infinity-frontend.vercel.app',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  let allowedOrigin = ALLOWED_ORIGINS[0];
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    allowedOrigin = origin;
  } else if (origin?.match(/^https:\/\/invest-infinity-frontend.*\.vercel\.app$/)) {
    allowedOrigin = origin;
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

// Rate limiting simple (par IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // Max 5 demandes
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // Par heure

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

// Labels pour les types de RDV
const rdvTypeLabels: Record<string, string> = {
  appel_decouverte: 'Appel découverte (15 min)',
  appel_qualification: 'Appel qualification (30 min)',
  visio_presentation: 'Visio présentation détaillée',
};

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Trop de demandes. Réessayez dans une heure.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    
    // Extraire les champs (compatibilité ancien et nouveau format)
    const {
      name,
      email,
      phone,
      preferences,
      sessionId,
      userId,
      // Nouveaux champs
      offerId,
      offerName,
      location,
      type: rdvType,
      availability,
      goals,
      source,
    } = body;

    // Validation
    if (!name || !email || !phone) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and phone are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Construire les préférences enrichies pour l'ancien format de stockage
    const enrichedPreferences = buildEnrichedPreferences({
      preferences,
      location,
      rdvType,
      availability,
      goals,
      source,
    });

    // 1. Sauvegarder la demande dans la table
    const { data: rdvData, error: insertError } = await supabaseAdmin
      .from('rdv_requests')
      .insert({
        name,
        email: email.toLowerCase().trim(),
        phone,
        preferences: enrichedPreferences,
        session_id: sessionId || null,
        user_id: userId || null,
        status: 'pending',
        // Nouveaux champs si la table les supporte
        offer_id: offerId || 'immersion_elite',
        offer_name: offerName || 'Bootcamp Élite',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting RDV request:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Envoyer un email à l'admin via Resend
    if (RESEND_API_KEY) {
      try {
        const rdvTypeLabel = rdvType ? (rdvTypeLabels[rdvType] || rdvType) : 'Non spécifié';
        const offerLabel = offerName || 'Bootcamp Élite';
        
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%); padding: 30px; border-radius: 12px 12px 0 0; color: white; text-align: center; }
    .header h2 { margin: 0; font-size: 24px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
    .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .section { margin: 20px 0; padding: 20px; background: #fafafa; border-radius: 8px; border-left: 4px solid #f97316; }
    .section-title { font-weight: bold; color: #f97316; margin-bottom: 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-row { margin: 12px 0; display: flex; }
    .label { font-weight: 600; color: #666; min-width: 120px; }
    .value { color: #333; }
    .cta { margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #f97316 0%, #fbbf24 100%); border-radius: 8px; text-align: center; }
    .cta a { color: white; text-decoration: none; font-weight: bold; font-size: 16px; }
    .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📅 Nouvelle demande de RDV</h2>
      <div class="badge">${offerLabel}</div>
    </div>
    <div class="content">
      <p style="font-size: 16px; color: #666;">Une nouvelle demande de rendez-vous a été soumise via le chatbot.</p>
      
      <div class="section">
        <div class="section-title">👤 Informations client</div>
        <div class="info-row">
          <span class="label">Nom :</span>
          <span class="value">${name}</span>
        </div>
        <div class="info-row">
          <span class="label">Email :</span>
          <span class="value"><a href="mailto:${email}" style="color: #f97316;">${email}</a></span>
        </div>
        <div class="info-row">
          <span class="label">Téléphone :</span>
          <span class="value"><a href="tel:${phone}" style="color: #f97316;">${phone}</a></span>
        </div>
        ${location ? `<div class="info-row">
          <span class="label">Localisation :</span>
          <span class="value">${location}</span>
        </div>` : ''}
      </div>
      
      <div class="section">
        <div class="section-title">📞 Détails du rendez-vous</div>
        <div class="info-row">
          <span class="label">Type de RDV :</span>
          <span class="value">${rdvTypeLabel}</span>
        </div>
        ${availability ? `<div class="info-row">
          <span class="label">Disponibilités :</span>
          <span class="value">${availability}</span>
        </div>` : ''}
        ${goals ? `<div class="info-row">
          <span class="label">Objectifs :</span>
          <span class="value">${goals}</span>
        </div>` : ''}
        ${source ? `<div class="info-row">
          <span class="label">Source :</span>
          <span class="value">${source}</span>
        </div>` : ''}
      </div>
      
      ${sessionId ? `<div class="section">
        <div class="section-title">📋 Session Immersion</div>
        <div class="info-row">
          <span class="label">Session ID :</span>
          <span class="value">${sessionId}</span>
        </div>
      </div>` : ''}
      
      <div class="cta">
        <a href="mailto:${email}?subject=Votre demande de RDV ${offerLabel}">📧 Contacter le client</a>
      </div>
      
      <div class="footer">
        <p>ID de la demande : ${rdvData.id}</p>
        <p>Reçu le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  </div>
</body>
</html>
        `;

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Invest Infinity <noreply@investinfinity.fr>',
            to: [ADMIN_EMAIL],
            subject: `📅 Nouvelle demande RDV ${offerLabel} - ${name}`,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          console.error('Resend error:', errorData);
          // Ne pas faire échouer la requête si l'email échoue
        } else {
          console.log('Admin notification email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Ne pas faire échouer la requête si l'email échoue
      }
    }

    return new Response(
      JSON.stringify({ success: true, id: rdvData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Construit une chaîne de préférences enrichie pour stocker tous les détails
 */
function buildEnrichedPreferences(data: {
  preferences?: string;
  location?: string;
  rdvType?: string;
  availability?: string;
  goals?: string;
  source?: string;
}): string {
  const parts: string[] = [];
  
  if (data.location) {
    parts.push(`📍 Localisation: ${data.location}`);
  }
  if (data.rdvType) {
    const label = rdvTypeLabels[data.rdvType] || data.rdvType;
    parts.push(`📞 Type de RDV: ${label}`);
  }
  if (data.availability) {
    parts.push(`📅 Disponibilités: ${data.availability}`);
  }
  if (data.goals) {
    parts.push(`🎯 Objectifs: ${data.goals}`);
  }
  if (data.source) {
    parts.push(`🔗 Source: ${data.source}`);
  }
  if (data.preferences && !parts.length) {
    // Si on a des préférences brutes et aucun nouveau champ
    return data.preferences;
  }
  
  return parts.join('\n') || data.preferences || 'Aucune préférence spécifiée';
}

