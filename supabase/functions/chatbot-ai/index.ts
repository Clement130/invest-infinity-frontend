import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIP, rateLimitResponse } from '../_shared/security.ts';
import { sanitizeString } from '../_shared/security.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
  };
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: getCorsHeaders(req.headers.get('origin')),
    });
  }

  // Vérifier que la méthode est POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Vérifier que la clé API est configurée
  if (!OPENAI_API_KEY) {
    console.error('[chatbot-ai] OPENAI_API_KEY not configured');
    return new Response(
      JSON.stringify({ error: 'Service configuration error' }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Rate limiting : 20 requêtes par minute par IP
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit({
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    identifier: clientIP,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetIn, getCorsHeaders(req.headers.get('origin')));
  }

  try {
    // Parser le body de la requête
    const body = await req.json();
    const { message, context } = body;

    // Valider et sanitizer le message
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const sanitizedMessage = sanitizeString(message, 1000);

    // Construire le système prompt avec le contexte Invest Infinity
    const systemPrompt = `Tu es l'assistant IA d'Invest Infinity, une plateforme de formation au trading.

CONTEXTE DE LA PLATEFORME:
- Invest Infinity est 100% gratuit (modèle basé sur partenariat avec RaiseFX)
- Formations vidéo complètes sur le trading
- Discord VIP avec alertes quotidiennes
- Communauté de traders actifs
- Fondateur: Mickaël (trader principal)

TON RÔLE:
- Répondre de manière amicale et professionnelle en français
- Guider les utilisateurs vers les formations et ressources disponibles
- Être précis sur le modèle économique (gratuit via partenariat RaiseFX)
- Encourager l'apprentissage autonome plutôt que la dépendance aux signaux
- Rester dans le domaine du trading et de la formation

${context ? `CONTEXTE UTILISATEUR:\n${JSON.stringify(context, null, 2)}` : ''}

Réponds de manière concise, utile et engageante.`;

    // Construire les messages pour OpenAI
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: sanitizedMessage },
    ];

    // Appeler l'API OpenAI
    const openAIRequest: OpenAIRequest = {
      messages,
      model: 'gpt-3.5-turbo',
      max_tokens: 500, // Limiter pour réduire les coûts
      temperature: 0.7, // Équilibrer créativité et précision
    };

    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAIRequest),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error('[chatbot-ai] OpenAI API error:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de la génération de la réponse',
          details: openAIResponse.status === 429 ? 'Quota dépassé' : 'Service temporairement indisponible'
        }),
        {
          status: openAIResponse.status === 429 ? 429 : 502,
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const data: OpenAIResponse = await openAIResponse.json();
    const aiMessage = data.choices[0]?.message?.content;

    if (!aiMessage) {
      return new Response(
        JSON.stringify({ error: 'Aucune réponse générée' }),
        {
          status: 500,
          headers: {
            ...getCorsHeaders(req.headers.get('origin')),
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Retourner la réponse
    return new Response(
      JSON.stringify({
        message: aiMessage,
        usage: data.usage,
        rateLimit: {
          remaining: rateLimit.remaining,
          resetIn: rateLimit.resetIn,
        },
      }),
      {
        status: 200,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('[chatbot-ai] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(req.headers.get('origin')),
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

