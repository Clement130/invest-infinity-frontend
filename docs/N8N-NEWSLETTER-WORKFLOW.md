# Workflow N8N pour Newsletters Automatisées

## Vue d'ensemble

Ce document décrit la configuration complète d'un workflow N8N professionnel pour l'envoi automatique de newsletters avec des intervalles optimisés basés sur les meilleures pratiques de l'industrie.

## Structure de la Base de Données

### Table `leads`
- `id` (uuid)
- `email` (text, unique)
- `prenom` (text)
- `newsletter` (boolean) - Statut d'abonnement
- `metadata` (jsonb) - Contient:
  - `segment`: 'low' | 'medium' | 'high' (basé sur capital)
  - `newsletter_sequence`: 'welcome' | 'regular' (type de séquence)
  - `last_email_sent`: timestamp ISO
  - `last_email_type`: type du dernier email envoyé
  - `email_count`: nombre total d'emails envoyés
  - `unsubscribed`: boolean (si désinscrit)
  - `emails_sent`: array des types d'emails déjà envoyés

## Stratégie d'Envoi Professionnelle

### Séquence de Bienvenue (Onboarding)
1. **Email #1** : Immédiatement après inscription (déjà géré par `subscribe-newsletter`)
2. **Email #2** : 3 jours après (conseils avancés)
3. **Email #3** : 7 jours après (témoignages et social proof)
4. **Email #4** : 14 jours après (offre spéciale ou upgrade)

### Newsletters Régulières
- **Fréquence** : 1 fois par semaine (tous les mardis à 10h30)
- **Jour optimal** : Mardi (meilleur taux d'ouverture)
- **Heure optimale** : 10h30 (France UTC+1)
- **Contenu** : Analyses de marché, conseils, cas d'études

### Bonnes Pratiques Appliquées
- ✅ Éviter lundi matin et vendredi après-midi
- ✅ Respecter le fuseau horaire français (UTC+1/UTC+2)
- ✅ Segmenter par capital (low/medium/high)
- ✅ Tracking des emails pour éviter doublons
- ✅ Gestion des désinscriptions
- ✅ Limite de 3 tentatives d'envoi max
- ✅ Pause de 24h minimum entre emails

## Configuration N8N

### Prérequis

1. **Variables d'environnement N8N** :
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@investinfinity.fr
ADMIN_EMAIL=admin@investinfinity.fr
```

2. **Créer les credentials dans N8N** :
   - Supabase (Postgres)
   - HTTP Request (pour Resend API)

### Structure du Workflow

#### Workflow 1: Séquence de Bienvenue

**Trigger** : Cron (toutes les heures)
```
0 * * * *  // Toutes les heures pour vérifier les nouveaux inscrits
```

**Étapes** :

1. **Supabase - Récupérer les leads** (Query)
```sql
SELECT 
  id,
  email,
  prenom,
  metadata,
  created_at
FROM leads
WHERE 
  newsletter = true
  AND (metadata->>'unsubscribed' IS NULL OR metadata->>'unsubscribed' = 'false')
  AND (
    -- Email #2 : 3 jours après inscription
    (metadata->>'last_email_type' IS NULL OR metadata->>'last_email_type' = 'welcome_1')
    AND created_at <= NOW() - INTERVAL '3 days'
    AND created_at > NOW() - INTERVAL '4 days'
  )
  OR (
    -- Email #3 : 7 jours après inscription
    metadata->>'last_email_type' = 'welcome_2'
    AND (metadata->>'last_email_sent')::timestamp <= NOW() - INTERVAL '4 days'
    AND (metadata->>'last_email_sent')::timestamp > NOW() - INTERVAL '5 days'
  )
  OR (
    -- Email #4 : 14 jours après inscription
    metadata->>'last_email_type' = 'welcome_3'
    AND (metadata->>'last_email_sent')::timestamp <= NOW() - INTERVAL '7 days'
    AND (metadata->>'last_email_sent')::timestamp > NOW() - INTERVAL '8 days'
  )
```

2. **Set - Déterminer le type d'email** (Code)
```javascript
const created = new Date($json.created_at);
const now = new Date();
const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
const lastType = $json.metadata?.last_email_type;

let emailType;
if (!lastType || lastType === 'welcome_1') {
  emailType = 'welcome_2'; // 3 jours
} else if (lastType === 'welcome_2') {
  emailType = 'welcome_3'; // 7 jours
} else if (lastType === 'welcome_3') {
  emailType = 'welcome_4'; // 14 jours
}

return {
  ...$json,
  emailType,
  segment: $json.metadata?.segment || 'medium'
};
```

3. **HTTP Request - Envoyer email via Resend** (pour chaque item)
```json
{
  "method": "POST",
  "url": "https://api.resend.com/emails",
  "authentication": "predefinedCredentialType",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "Bearer {{$env.RESEND_API_KEY}}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "bodyParameters": {
    "parameters": []
  },
  "specifyBody": "json",
  "jsonBody": "={{{\n  \"from\": \"Invest Infinity <{{$env.FROM_EMAIL}}>\",\n  \"to\": [{{$json.email}}],\n  \"subject\": {{generateSubject($json.emailType, $json.segment)}},\n  \"html\": {{generateEmailHTML($json.emailType, $json.prenom, $json.segment)}}\n}}}"
}
```

4. **Code - Générer le contenu email** (Function)
```javascript
function generateSubject(emailType, segment) {
  const subjects = {
    welcome_2: "🚀 3 conseils avancés pour protéger ton capital",
    welcome_3: "💎 Comment nos membres multiplient leurs gains",
    welcome_4: "🎁 Offre spéciale : Passe au niveau supérieur"
  };
  return subjects[emailType] || "Newsletter Invest Infinity";
}

function generateEmailHTML(emailType, prenom, segment) {
  const name = prenom || "Cher trader";
  
  const templates = {
    welcome_2: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%); padding: 30px; border-radius: 12px 12px 0 0; color: white; text-align: center; }
          .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; }
          .cta { background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Salut ${name} ! 👋</h1>
          </div>
          <div class="content">
            <p>Tu as téléchargé notre guide "7 Erreurs Mortelles", bravo ! 🎉</p>
            
            <h2>3 conseils avancés pour aller plus loin :</h2>
            
            <h3>1️⃣ Utilise toujours un Risk/Reward ratio minimum de 1:2</h3>
            <p>Ne prends jamais une position où le risque est supérieur au gain potentiel. C'est la règle d'or.</p>
            
            <h3>2️⃣ Respecte ton capital</h3>
            <p>Ne risque jamais plus de 1-2% de ton capital sur une seule position. La patience est la clé.</p>
            
            <h3>3️⃣ Tiens un journal de trading</h3>
            <p>Chaque trade doit être noté avec le raisonnement. C'est comme ça qu'on progresse vraiment.</p>
            
            <a href="https://investinfinity.fr" class="cta">Découvrir notre formation complète →</a>
          </div>
          <div class="footer">
            <p>Invest Infinity - Formation Trading</p>
            <p><a href="https://investinfinity.fr/unsubscribe?email={{$json.email}}">Se désinscrire</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    // ... autres templates
  };
  
  return templates[emailType] || templates.welcome_2;
}

return {
  subject: generateSubject($json.emailType, $json.segment),
  html: generateEmailHTML($json.emailType, $json.prenom || "Cher trader", $json.segment)
};
```

5. **Supabase - Mettre à jour le tracking** (Execute Query)
```sql
UPDATE leads
SET 
  metadata = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{last_email_sent}',
        to_jsonb(NOW()::text)
      ),
      '{last_email_type}',
      to_jsonb({{$json.emailType}}::text)
    ),
    '{email_count}',
    to_jsonb(COALESCE((metadata->>'email_count')::int, 0) + 1)
  )
WHERE id = '{{$json.id}}';
```

#### Workflow 2: Newsletters Hebdomadaires

**Trigger** : Cron (tous les mardis à 10h30)
```
30 10 * * 2  // Mardi à 10h30 (France)
```

**Étapes** :

1. **Supabase - Récupérer les abonnés actifs**
```sql
SELECT 
  id,
  email,
  prenom,
  metadata,
  created_at
FROM leads
WHERE 
  newsletter = true
  AND (metadata->>'unsubscribed' IS NULL OR metadata->>'unsubscribed' = 'false')
  AND (
    -- Soit jamais reçu de newsletter régulière
    metadata->>'last_email_type' IS NULL
    OR metadata->>'last_email_type' LIKE 'welcome_%'
    -- Soit dernière newsletter il y a 7+ jours
    OR (
      (metadata->>'last_email_sent')::timestamp <= NOW() - INTERVAL '7 days'
      AND metadata->>'last_email_type' = 'weekly'
    )
  )
  AND created_at <= NOW() - INTERVAL '14 days'  -- Minimum 14 jours après inscription
```

2. **HTTP Request - Envoyer newsletter hebdomadaire** (identique au workflow 1)

3. **Supabase - Mettre à jour le tracking**
```sql
UPDATE leads
SET 
  metadata = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{last_email_sent}',
        to_jsonb(NOW()::text)
      ),
      '{last_email_type}',
      to_jsonb('weekly'::text)
    ),
    '{email_count}',
    to_jsonb(COALESCE((metadata->>'email_count')::int, 0) + 1)
  )
WHERE id = '{{$json.id}}';
```

## Gestion des Erreurs

### Retry Logic
- Maximum 3 tentatives
- Backoff exponentiel : 1h, 3h, 24h
- Logger les échecs dans `metadata->email_errors`

### Gestion des Bounces
- Webhook Resend pour détecter les bounces
- Marquer automatiquement `unsubscribed = true` après 3 bounces hard

## Analytics et Reporting

### Métriques à tracker
- Taux d'ouverture (via Resend analytics)
- Taux de clics
- Désinscriptions
- Bounces

### Dashboard N8N
- Nombre d'emails envoyés aujourd'hui
- Taux de réussite
- Emails en erreur

## Sécurité

1. **API Keys** : Stockées uniquement dans les credentials N8N
2. **RLS Supabase** : Utiliser Service Role Key uniquement pour les workflows
3. **Rate Limiting** : Maximum 100 emails/heure (Resend free tier)

## Test et Débogage

### Mode Test
- Activer le flag `test_mode` dans metadata
- Envoyer uniquement à `ADMIN_EMAIL`
- Logger tous les emails dans la console N8N

## Exports N8N

Les workflows complets sont exportés dans :
- `workflows/n8n-newsletter-welcome.json`
- `workflows/n8n-newsletter-weekly.json`

















