import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
import {
  checkRateLimit,
  getClientIP,
  rateLimitResponse,
  sanitizeString,
  isValidEmail,
  secureLog,
  addSecurityHeaders,
} from '../_shared/security.ts';

// ============================================
// CORS Helper
// ============================================
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

// ============================================
// Supabase Client
// ============================================
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, serviceRoleKey);

// ============================================
// Types
// ============================================
type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  source?: string;
};

// ============================================
// Main Handler
// ============================================
serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ==================== RATE LIMITING ====================
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit({
    identifier: `contact:${clientIP}`,
    maxRequests: 5,       // 5 messages max
    windowMs: 60 * 1000,  // par minute
  });

  if (!rateLimit.allowed) {
    secureLog('contact', 'Rate limit exceeded', { ip: clientIP });
    return rateLimitResponse(rateLimit.resetIn, corsHeaders);
  }

  // Vérifier la configuration
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: addSecurityHeaders(corsHeaders) },
    );
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: addSecurityHeaders(corsHeaders) },
    );
  }

  try {
    const payload = (await req.json()) as ContactPayload;

    // ==================== VALIDATION ====================
    
    // Valider et sanitizer le nom
    const name = sanitizeString(payload.name, 100);
    if (!name || name.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Le nom est requis (minimum 2 caractères)' }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    // Valider l'email
    const email = payload.email?.toLowerCase().trim();
    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Format d\'email invalide' }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    // Rate limit additionnel par email (anti-spam)
    const emailRateLimit = checkRateLimit({
      identifier: `contact:email:${email}`,
      maxRequests: 3,       // 3 messages max
      windowMs: 5 * 60 * 1000,  // par 5 minutes
    });

    if (!emailRateLimit.allowed) {
      secureLog('contact', 'Email rate limit exceeded', { email });
      return rateLimitResponse(emailRateLimit.resetIn, corsHeaders);
    }

    // Valider le message
    const message = sanitizeString(payload.message, 5000);
    if (!message || message.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Le message doit contenir au moins 10 caractères' }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    // Sanitizer les champs optionnels
    const phone = payload.phone ? sanitizeString(payload.phone, 30) : null;
    const subject = payload.subject ? sanitizeString(payload.subject, 100) : null;
    const source = payload.source ? sanitizeString(payload.source, 50) : 'contact_page';

    // ==================== INSERTION EN BASE ====================
    const { data, error } = await supabase.from('contact_messages').insert({
      name,
      email,
      phone,
      subject,
      message,
      source,
      ip_hash: await hashIP(clientIP),
      created_at: new Date().toISOString(),
      status: 'new', // new, read, replied, archived
    }).select('id').single();

    if (error) {
      secureLog('contact', 'Database error', { error: error.message });
      
      // Si la table n'existe pas, on log mais on continue (pour ne pas bloquer l'utilisateur)
      if (error.code === '42P01') {
        secureLog('contact', 'Table contact_messages does not exist - creating notification only');
      } else {
        return new Response(
          JSON.stringify({ error: 'Erreur lors de l\'enregistrement. Veuillez réessayer.' }),
          { status: 500, headers: addSecurityHeaders(corsHeaders) },
        );
      }
    }

    // ==================== NOTIFICATION (TODO) ====================
    // TODO: Ajouter l'envoi d'email de notification à l'équipe
    // Exemple avec Resend, SendGrid, ou autre service d'email
    // 
    // await sendNotificationEmail({
    //   to: 'contact@investinfinity.fr',
    //   subject: `Nouveau message de ${name} - ${subject || 'Contact'}`,
    //   body: `
    //     Nom: ${name}
    //     Email: ${email}
    //     Téléphone: ${phone || 'Non renseigné'}
    //     Sujet: ${subject || 'Non spécifié'}
    //     
    //     Message:
    //     ${message}
    //   `,
    // });

    // ==================== DÉCLENCHEMENT CLOSER IA ====================
    // Si un numéro de téléphone est fourni, déclencher l'appel automatique via n8n
    if (phone && phone.trim()) {
      const n8nWebhookUrl = Deno.env.get('N8N_CLOSER_WEBHOOK_URL');
      
      if (n8nWebhookUrl) {
        // Appel asynchrone pour ne pas bloquer la réponse à l'utilisateur
        fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            phone: phone.trim(),
            subject: subject || '',
            message,
            source,
          }),
        }).catch((err) => {
          // Log l'erreur mais ne bloque pas la réponse
          secureLog('contact', 'Failed to trigger closer IA', {
            error: err instanceof Error ? err.message : 'Unknown',
            email,
            phone: phone.substring(0, 4) + '***', // Masquer le numéro dans les logs
          });
        });
        
        secureLog('contact', 'Closer IA triggered', {
          email,
          hasPhone: true,
          messageId: data?.id,
        });
      } else {
        secureLog('contact', 'N8N webhook URL not configured', {
          email,
          hasPhone: true,
        });
      }
    }

    secureLog('contact', 'Contact message saved', { 
      email, 
      subject: subject || 'none',
      messageId: data?.id 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message envoyé avec succès' 
      }),
      { status: 200, headers: addSecurityHeaders(corsHeaders) },
    );

  } catch (err) {
    secureLog('contact', 'Unexpected error', { 
      error: err instanceof Error ? err.message : 'Unknown' 
    });
    return new Response(
      JSON.stringify({ error: 'Une erreur inattendue est survenue' }),
      { status: 500, headers: addSecurityHeaders(corsHeaders) },
    );
  }
});

// ============================================
// Hash l'IP pour l'audit sans stocker l'IP en clair
// ============================================
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + Deno.env.get('SUPABASE_URL'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

