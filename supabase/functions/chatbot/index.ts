import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Embedded CORS logic to avoid dependency issues during deployment
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'https://www.investinfinity.fr',
  'https://investinfinity.fr',
  'https://invest-infinity-frontend.vercel.app',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
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
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

// In-memory store for simple rate limiting (reset on cold start)
// For production scale, use Redis or Database. 
// Structure: { ip: { count: number, resetTime: number } }
const rateLimitStore = new Map<string, { count: number, resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_MESSAGE_LENGTH = 1000;
const TOXIC_PATTERNS = [
    /\b(merde|connard|salope|pd|pute|encul[ée])\b/i, // Insultes basiques
    /\b(ignore.*rules|ignore.*règles|ignore.*instructions)\b/i, // Prompt injection simple
    /\b(donne.*clé.*api|give.*api.*key)\b/i, // Vol de clé
    /\b(système|system)\b/i // Tentative de manipulation système
];

console.log('Chatbot Function Initialized')

serve(async (req) => {
  const origin = req.headers.get('Origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 0. Rate Limiting Check
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const currentTime = Date.now();
    
    let rateData = rateLimitStore.get(clientIp);
    
    if (!rateData || currentTime > rateData.resetTime) {
        rateData = { count: 0, resetTime: currentTime + RATE_LIMIT_WINDOW_MS };
    }
    
    if (rateData.count >= MAX_REQUESTS_PER_WINDOW) {
        console.warn(`Rate limit exceeded for IP: ${clientIp}`);
        return new Response(
            JSON.stringify({ 
                error: 'Tu envoies beaucoup de messages d’un coup, je vais ralentir un peu pour rester disponible pour tout le monde. Réessaie dans quelques instants.' 
            }),
            { 
                status: 429, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
        );
    }

    rateData.count++;
    rateLimitStore.set(clientIp, rateData);


    // 1. Get request body
    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required and must be an array' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const lastUserMessage = messages[messages.length - 1];
    
    // 2. Content Filtering & Security Checks
    if (lastUserMessage.role === 'user') {
        const content = lastUserMessage.content || '';
        
        // Check message length
        if (content.length > MAX_MESSAGE_LENGTH) {
            return new Response(
                JSON.stringify({ 
                    error: 'Ton message est très long, peux-tu le résumer en quelques phrases ?' 
                }),
                { 
                    status: 400, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
            );
        }

        // Check toxic content / injection
        for (const pattern of TOXIC_PATTERNS) {
            if (pattern.test(content)) {
                console.warn(`Toxic content blocked from IP: ${clientIp}`);
                // Fake response to discourage trying again
                return new Response(
                    JSON.stringify({
                        choices: [{
                            message: {
                                role: 'assistant',
                                content: "Je suis là pour t’aider sur la plateforme et la formation. Je ne peux pas répondre à ce type de message."
                            }
                        }]
                    }),
                    { 
                        status: 200, 
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                    }
                );
            }
        }
    }

    // 3. Initialize Supabase Clients
    // Client Admin pour lire les settings et clés API
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Vérifier l'authentification de l'utilisateur
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: corsHeaders },
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: corsHeaders },
      );
    }

    // 4. CHECK LICENSE ENTITLEMENTS (Security Hardening)
    // Seuls les utilisateurs avec une licence (ou admin) peuvent utiliser le chatbot (coûteux)
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('license, role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return new Response(
            JSON.stringify({ error: 'Profile not found' }),
            { status: 403, headers: corsHeaders }
        );
    }

    const hasLicense = profile.license && profile.license !== 'none';
    const isAdmin = profile.role === 'admin' || profile.role === 'developer';

    if (!hasLicense && !isAdmin) {
         return new Response(
            JSON.stringify({ error: 'Cette fonctionnalité est réservée aux membres de la formation.' }),
            { status: 403, headers: corsHeaders }
        );
    }


    // 5. Fetch OpenAI API Key from settings
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'openai_api_key')
      .single()

    if (settingsError || !settingsData?.value) {
      console.error('API Key missing or error:', settingsError)
      return new Response(
        JSON.stringify({ 
          error: 'Le service chatbot n’est pas encore configuré. Merci de contacter votre administrateur.' 
        }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openaiApiKey = settingsData.value

    // 6. Optimize Context (Last 10 messages max)
    const contextMessages = messages.slice(-10);

    // 7. Call OpenAI API with limits
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost effective model
        messages: contextMessages,
        max_tokens: 500, // Hard limit on output tokens
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI Error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la communication avec le fournisseur IA.' }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await openaiResponse.json()

    // 8. Return result
    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
