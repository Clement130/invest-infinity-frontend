/**
 * ============================================================================
 * CONVERT LEAD TO USER - Edge Function
 * ============================================================================
 * 
 * Convertit un lead en utilisateur avec compte Supabase
 * 
 * ENDPOINT: /functions/v1/convert-lead-to-user
 * METHOD: POST
 * 
 * PAYLOAD:
 * {
 *   "email": "user@example.com"
 * }
 * 
 * RÉPONSE SUCCÈS:
 * {
 *   "success": true,
 *   "userId": "uuid",
 *   "email": "user@example.com",
 *   "message": "Lead converti en utilisateur avec succès"
 * }
 * 
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
import { getCorsHeaders } from '../_shared/cors.ts';
import {
  checkRateLimit,
  getClientIP,
  rateLimitResponse,
  isValidEmail,
  secureLog,
  addSecurityHeaders,
} from '../_shared/security.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type ConvertLeadPayload = {
  email: string;
};

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ==================== RATE LIMITING ====================
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit({
    identifier: `convert-lead:${clientIP}`,
    maxRequests: 20,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    secureLog('convert-lead-to-user', 'Rate limit exceeded', { ip: clientIP });
    return rateLimitResponse(rateLimit.resetIn, corsHeaders);
  }

  // Vérifier la configuration
  if (!supabaseUrl || !serviceRoleKey) {
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

  // ==================== VÉRIFICATION AUTHENTIFICATION ====================
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
      { status: 401, headers: addSecurityHeaders(corsHeaders) },
    );
  }

  // Vérifier que l'utilisateur est admin
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    secureLog('convert-lead-to-user', 'Auth error', { error: authError?.message });
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid token' }),
      { status: 401, headers: addSecurityHeaders(corsHeaders) },
    );
  }

  // Vérifier le rôle admin
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    secureLog('convert-lead-to-user', 'Unauthorized: Not admin', { userId: user.id });
    return new Response(
      JSON.stringify({ error: 'Forbidden: Admin access required' }),
      { status: 403, headers: addSecurityHeaders(corsHeaders) },
    );
  }

  try {
    const payload = (await req.json()) as ConvertLeadPayload;
    const { email } = payload;

    // ==================== VALIDATION ====================
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    // ==================== RÉCUPÉRER LE LEAD ====================
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (leadError || !lead) {
      secureLog('convert-lead-to-user', 'Lead not found', { email });
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: addSecurityHeaders(corsHeaders) },
      );
    }

    // ==================== VÉRIFIER SI L'UTILISATEUR EXISTE DÉJÀ ====================
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
      secureLog('convert-lead-to-user', 'User already exists', { userId, email });
    } else {
      // ==================== CRÉER L'UTILISATEUR ====================
      const tempPassword = crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: tempPassword,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        secureLog('convert-lead-to-user', 'Error creating user', { 
          error: createError?.message,
          email 
        });
        return new Response(
          JSON.stringify({ error: `Failed to create user: ${createError?.message}` }),
          { status: 500, headers: addSecurityHeaders(corsHeaders) },
        );
      }

      userId = newUser.user.id;
      isNewUser = true;
      secureLog('convert-lead-to-user', 'User created', { userId, email });
    }

    // ==================== CRÉER/METTRE À JOUR LE PROFIL ====================
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          user_id: userId,
          email: email.toLowerCase().trim(),
          full_name: lead.prenom || null,
          role: 'client',
          license: 'none',
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (profileError) {
        secureLog('convert-lead-to-user', 'Error creating profile', { 
          error: profileError.message,
          userId 
        });
        // Ne pas échouer si le profil existe déjà
        if (profileError.code !== '23505') { // unique_violation
          return new Response(
            JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }),
            { status: 500, headers: addSecurityHeaders(corsHeaders) },
          );
        }
      } else {
        secureLog('convert-lead-to-user', 'Profile created', { userId });
      }
    }

    // ==================== GÉNÉRER LE LIEN DE RÉCUPÉRATION (si nouvel utilisateur) ====================
    if (isNewUser) {
      try {
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email.toLowerCase().trim(),
          options: {
            redirectTo: 'https://www.investinfinity.fr/create-password',
          },
        });

        if (!linkError && linkData?.properties?.hashed_token) {
          // Envoyer l'email de bienvenue avec le lien de création de mot de passe
          try {
            const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-password-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                email: email.toLowerCase().trim(),
                token: linkData.properties.hashed_token,
                prenom: lead.prenom || 'Cher membre',
              }),
            });

            if (emailResponse.ok) {
              secureLog('convert-lead-to-user', 'Password email sent', { email });
            } else {
              const errorData = await emailResponse.text();
              secureLog('convert-lead-to-user', 'Failed to send password email', { 
                error: errorData 
              });
            }
          } catch (emailError) {
            secureLog('convert-lead-to-user', 'Exception sending password email', { 
              error: emailError instanceof Error ? emailError.message : 'Unknown' 
            });
            // Ne pas échouer la conversion si l'email échoue
          }
        }
      } catch (linkError) {
        secureLog('convert-lead-to-user', 'Error generating recovery link', { 
          error: linkError instanceof Error ? linkError.message : 'Unknown' 
        });
        // Ne pas échouer la conversion si le lien échoue
      }
    }

    secureLog('convert-lead-to-user', 'Lead converted successfully', { 
      userId, 
      email,
      isNewUser 
    });

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        email: email.toLowerCase().trim(),
        isNewUser,
        message: isNewUser 
          ? 'Lead converti en utilisateur avec succès. Un email de création de mot de passe a été envoyé.'
          : 'Profil utilisateur créé pour ce lead existant.',
      }),
      { status: 200, headers: addSecurityHeaders(corsHeaders) },
    );

  } catch (err) {
    secureLog('convert-lead-to-user', 'Unexpected error', { 
      error: err instanceof Error ? err.message : 'Unknown' 
    });
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: addSecurityHeaders(corsHeaders) },
    );
  }
});

