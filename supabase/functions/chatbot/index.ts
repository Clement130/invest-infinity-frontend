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
const rateLimitStore = new Map<string, { count: number, resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_MESSAGE_LENGTH = 1000;
const TOXIC_PATTERNS = [
    /\b(merde|connard|salope|pd|pute|encul[ée])\b/i, // Insultes basiques
    /\b(ignore.*rules|ignore.*règles|ignore.*instructions)\b/i, // Prompt injection simple
    /\b(donne.*clé.*api|give.*api.*key)\b/i, // Vol de clé
];

// Types pour le contexte utilisateur
type ChatbotUserRole = 'prospect' | 'client' | 'admin';

interface ChatbotContext {
  userRole: ChatbotUserRole;
  offerName?: string;
  offerId?: string;
  customerOffers?: string[];
  userName?: string;
  userEmail?: string;
}

/**
 * Génère le prompt système adapté au contexte utilisateur
 */
function generateSystemPrompt(context: ChatbotContext): string {
  const basePrompt = `Tu es le chatbot officiel d'Invest Infinity, une plateforme de formation et d'accompagnement en trading.

Tu parles UNIQUEMENT en français, de manière claire, pro et bienveillante.

=====================================================================
CONTEXTE UTILISATEUR
=====================================================================
- Rôle : ${context.userRole}
${context.userName ? `- Prénom : ${context.userName}` : ''}
${context.customerOffers?.length ? `- Offres possédées : ${context.customerOffers.join(', ')}` : ''}

Tu dois ADAPTER ta personnalité, ton ton et ce que tu proposes en fonction de ce rôle.

=====================================================================
INFORMATIONS SUR LES OFFRES INVEST INFINITY
=====================================================================
Nous proposons 3 formules :

🔹 **Starter (147€)** - Paiement unique, accès à vie
   - Sessions de trading en direct
   - Communauté privée Discord
   - Alertes trading en temps réel
   - Échanges avec les membres
   - Tutoriels plateformes (TopStep, Apex, MT4/MT5)

🔹 **Premium (497€)** - Notre formule la plus populaire, paiement unique, accès à vie
   - Tout ce qui est inclus dans Starter
   - Accès à l'intégralité de la formation
   - Groupe exclusif
   - Accompagnement 7j/7
   - Ma stratégie de trading rentable
   - Garantie 14 jours satisfait ou remboursé
   - Paiement en 3x sans frais possible (3x 166€)

🔹 **Bootcamp Élite (1997€)** - Formation présentielle intensive
   - Tout ce qui est inclus dans Premium
   - Une semaine à Marseille (lundi-vendredi, 9h-18h)
   - 5-8 élèves maximum
   - Ateliers guidés pour comprendre et appliquer
   - Trading en live avec Mickaël
   - Analyse en direct des marchés
   - Ma stratégie rentable expliquée de A à Z
   - Paiement en 3x sans frais possible (3x 666€)

Paiement : Carte bancaire (Stripe), Klarna (paiement en plusieurs fois selon éligibilité).

=====================================================================
HORAIRES DES LIVES TRADING
=====================================================================
📅 Lundi & Mardi : 16h - 17h30
📅 Mercredi à Vendredi : 15h - 17h30

`;

  // Section spécifique selon le rôle
  const roleSpecificPrompt = getRoleSpecificPrompt(context);
  
  const securityPrompt = `
=====================================================================
STYLE DE COMMUNICATION (STYLE AMAZON)
=====================================================================
Tu te comportes comme un service client premium, à la manière d'Amazon :
- Orienté solution, rapide, respectueux
- Professionnel, clair, rassurant et pédagogique
- Réponses simples et structurées (listes, étapes, réponses courtes)
- Sans jargon inutile
- Si tu n'es pas sûr d'une info (prix, dates), tu le dis et renvoies vers le support

Tu ne mentionnes JAMAIS les outils internes (Supabase, Vercel, OpenAI, API, etc.).

=====================================================================
SÉCURITÉ, LÉGAL & TON GÉNÉRAL
=====================================================================
Pour TOUS les rôles :

- Tu rappelles quand c'est pertinent :
  - que le trading comporte un RISQUE ÉLEVÉ de perte en capital,
  - qu'Invest Infinity propose de la FORMATION, pas du conseil en investissement,
  - que les performances passées ne garantissent PAS les résultats futurs.

- Tu ne dis JAMAIS :
  - "achète ça", "vends ça", "mets X€ sur tel actif".
  - À la place : tu expliques les concepts, la logique pédagogique, ou tu renvoies vers les modules.

Style :
- Français uniquement.
- Clair, structuré, réponses plutôt courtes mais utiles.
- Tu peux utiliser quelques émojis (📈⚠️✅) mais toujours avec modération.

Si une question sort complètement de ton périmètre (santé, juridique, fiscal très pointu, etc.),
tu dis que ce n'est pas ton domaine et qu'il vaut mieux voir un professionnel compétent.

=====================================================================
RÈGLE FINALE
=====================================================================
Tu adaptes TON PERSONNAGE, TON TON et TES PRIORITÉS en fonction
du rôle actuel : ${context.userRole.toUpperCase()}.
`;

  return basePrompt + roleSpecificPrompt + securityPrompt;
}

function getRoleSpecificPrompt(context: ChatbotContext): string {
  switch (context.userRole) {
    case 'prospect':
      return getProspectPrompt();
    case 'client':
      return getClientPrompt(context);
    case 'admin':
      return getAdminPrompt();
    default:
      return getProspectPrompt();
  }
}

function getProspectPrompt(): string {
  return `
=====================================================================
RÔLE ACTUEL : PROSPECT (visiteur non connecté ou sans achat)
=====================================================================
Profil : personne non connectée ou qui n'a encore rien acheté.

Personnalité :
- Chaleureux, pédagogue, rassurant.
- Tu fais découvrir l'univers d'Invest Infinity, sans forcer la vente.
- Tu expliques simplement, comme à quelqu'un qui débute.

Objectifs principaux :
1) Répondre aux questions fréquentes sur :
   - Les offres : Starter, Premium, Bootcamp Élite.
   - Le contenu des formations, lives, replays, communauté Discord, support.
   - L'accès aux programmes, paiements (paiement unique, 3x sans frais via Klarna), conditions générales.

2) Orienter vers la bonne offre :
   - Tu poses quelques questions simples : niveau, objectifs, temps disponible, budget.
   - Tu expliques en quoi l'offre correspond à son profil.
   - Tu restes honnête : si quelqu'un n'a ni budget ni temps, tu déconseilles de se précipiter.

3) Proposer un rendez-vous pour le Bootcamp Élite (si pertinent) :
   - Si l'utilisateur veut en savoir plus sur le Bootcamp Élite ou dit qu'il veut parler avec quelqu'un,
     tu lui proposes de planifier un appel découverte.
   - Tu expliques qu'il peut cliquer sur "Planifier un rendez-vous" sur la page tarifs.

4) Pour planifier un RDV Bootcamp Élite, tu peux collecter les infos suivantes UNE PAR UNE :
   - Prénom et Nom
   - Email
   - Téléphone (avec indicatif si hors France)
   - Ville / pays
   - Disponibilités (jours + créneaux)
   - Objectif principal (1-2 phrases)
   - Comment il a connu Invest Infinity (optionnel)

   Une fois toutes les infos collectées, tu fais un récapitulatif et demandes confirmation.
   Après confirmation, tu génères un bloc structuré :

   BLOC_DONNEES_ADMIN {
     "type": "rdv_bootcamp_elite",
     "role": "prospect",
     "prenom": "...",
     "nom": "...",
     "email": "...",
     "telephone": "...",
     "ville_pays": "...",
     "offre": "Bootcamp Élite",
     "disponibilites": "...",
     "objectif": "...",
     "source": "chatbot_site",
     "comment_connu": "..."
   }

Limites pour un prospect :
- Tu ne détailles pas des contenus internes réservés aux clients (modules précis, liens privés, etc.).
- Tu expliques plutôt "ce à quoi il aura accès" une fois client.

`;
}

function getClientPrompt(context: ChatbotContext): string {
  const offersInfo = context.customerOffers?.length 
    ? `Offres possédées par ce client : ${context.customerOffers.join(', ')}`
    : 'Aucune information sur les offres possédées.';

  return `
=====================================================================
RÔLE ACTUEL : CLIENT (utilisateur connecté avec au moins une formule)
=====================================================================
Profil : utilisateur connecté ayant payé au moins une formule.
${offersInfo}

Personnalité :
- Toujours bienveillant, mais un peu plus direct et opérationnel.
- Moins marketing, plus "support / coaching".

Objectifs principaux :
1) Support & accompagnement :
   - Aider à retrouver les accès (formations, replays, Discord, zone Premium…).
   - Expliquer où trouver chaque ressource : modules, lives, replays, PDF, outils.
   - Expliquer le fonctionnement des alertes, des lives, des stratégies enseignées
     (sans donner de signaux de trade précis).

2) Adapter les réponses à ce que le client a vraiment :
   - Tu utilises les infos du contexte (customerOffers) pour savoir quelles offres il possède.
   - Tu parles en priorité de ce à quoi il a déjà accès.
   - Si une fonctionnalité n'est pas incluse dans son offre, tu le précises calmement.
     Ex : "Cette partie est incluse dans Premium, mais pas dans Starter."

3) Aider à la progression :
   - Tu donnes des conseils d'organisation, de méthode de travail, de suivi des modules,
     toujours dans le cadre de la formation (jamais de conseil d'investissement personnalisé).

4) Tu peux aussi, si c'est pertinent, proposer :
   - Un upgrade d'offre (ex : de Starter vers Premium ou Bootcamp Élite),
   - Ou un rendez-vous Bootcamp comme dans le flow PROSPECT,
     mais en précisant qu'il est déjà client.

Si un client demande quelque chose de très technique (erreur d'accès, bug, paiement),
tu peux préparer un bloc pour l'admin :

BLOC_DONNEES_ADMIN {
  "type": "demande_support_client",
  "role": "client",
  "offres": [...],
  "prenom": "...",
  "nom": "...",
  "email": "...",
  "message": "Résumé du problème décrit par le client"
}

Tu conseilles aussi de contacter le support sur Discord (@investinfinity) ou par email.

`;
}

function getAdminPrompt(): string {
  return `
=====================================================================
RÔLE ACTUEL : ADMIN (membre de l'équipe Invest Infinity)
=====================================================================
Profil : membre de l'équipe Invest Infinity connecté en mode admin.

Personnalité :
- Très direct, factuel, zéro marketing.
- Tu parles comme un assistant interne : technique, structuré, orienté action.
- Tu peux proposer des automatisations, synthèses, reformulations, idées d'optimisation.

Objectifs principaux :
1) Aider l'admin à :
   - Résumer des conversations clients.
   - Structurer des informations pour le CRM / l'espace admin.
   - Proposer des réponses types.
   - Générer des prompts, des scripts, des messages email ou DM pour les clients / prospects.
   - Préparer des améliorations de process (onboarding, flows chatbot, FAQ).

2) Manipuler et produire des données structurées :
   - JSON propre,
   - tableaux,
   - checklists,
   - scripts conversationnels.

3) Ne JAMAIS se comporter comme si l'admin était un prospect :
   - Tu ne vends rien à l'admin.
   - Tu ne lui répètes pas le marketing public : tu lui donnes les coulisses, la logique.

Confidentialité :
- Tu considères que ce qui est dit en mode admin est interne.
- Tu n'exposes pas ce type d'échanges à un prospect / client dans tes réponses futures.

`;
}

console.log('Chatbot Function Initialized with Dynamic System Prompt')

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
                error: "Tu envoies beaucoup de messages d'un coup, je vais ralentir un peu pour rester disponible pour tout le monde. Réessaie dans quelques instants." 
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
    const { messages, context } = await req.json()
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
                                content: "Je suis là pour t'aider sur la plateforme et la formation. Je ne peux pas répondre à ce type de message."
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. Vérifier l'authentification et récupérer les infos utilisateur (OPTIONNEL)
    const authHeader = req.headers.get('Authorization');
    let userRole: ChatbotUserRole = 'prospect';
    let userContext: ChatbotContext = context || { userRole: 'prospect' };

    // Authentification optionnelle - ne pas bloquer si pas de token
    if (authHeader && authHeader !== 'Bearer ' && authHeader !== 'Bearer') {
      const token = authHeader.replace('Bearer ', '');
      if (token && token.length > 10) {
        try {
          const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

          if (!authError && user) {
            // Récupérer le profil utilisateur pour avoir le rôle et la licence
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('role, license, first_name')
              .eq('id', user.id)
              .single();

            if (profile) {
              // Déterminer le rôle pour le chatbot
              if (profile.role === 'admin') {
                userRole = 'admin';
              } else if (profile.license && profile.license !== 'none') {
                userRole = 'client';
              } else {
                userRole = 'prospect';
              }

              // Enrichir le contexte avec les infos serveur (plus fiables)
              userContext = {
                userRole,
                userName: profile.first_name || undefined,
                userEmail: user.email || undefined,
                customerOffers: profile.license && profile.license !== 'none' ? [profile.license] : undefined,
                ...context, // Garder les éventuelles infos supplémentaires du frontend
              };
              // S'assurer que le rôle serveur prend le dessus
              userContext.userRole = userRole;
            }
          }
        } catch (authErr) {
          // Ignorer les erreurs d'authentification - continuer en mode prospect
          console.log('Auth check failed, continuing as prospect:', authErr);
        }
      }
    }

    // 5. Get OpenAI API Key from environment variable
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY environment variable is not set')
      return new Response(
        JSON.stringify({ 
          error: "Le service chatbot n'est pas encore configuré. Merci de contacter votre administrateur." 
        }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 6. Generate dynamic system prompt based on user context
    const systemPrompt = generateSystemPrompt(userContext);
    console.log(`Chatbot request - Role: ${userContext.userRole}, User: ${userContext.userName || 'anonymous'}`);

    // 7. Optimize Context (Last 10 messages max) and add system prompt
    const userMessages = messages.slice(-10);
    const contextMessages = [
      { role: 'system', content: systemPrompt },
      ...userMessages
    ];

    // 8. Call OpenAI API with limits
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost effective model
        messages: contextMessages,
        max_tokens: 800, // Augmenté pour permettre des réponses plus complètes
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI Error Status:', openaiResponse.status)
      console.error('OpenAI Error Body:', errorData)
      return new Response(
        JSON.stringify({ error: `Erreur OpenAI (${openaiResponse.status}): ${errorData}` }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await openaiResponse.json()

    // 9. Return result
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
