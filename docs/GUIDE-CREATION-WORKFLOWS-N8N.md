# Guide de Création des Workflows N8N pour Newsletters

## 🎯 Vue d'Ensemble

Tu vas créer 2 workflows pour automatiser tes newsletters :
1. **Séquence de Bienvenue** : Emails automatiques à J+3, J+7, J+14
2. **Newsletter Hebdomadaire** : Tous les mardis à 10h30

---

## 📋 PRÉREQUIS

### 1. Credentials à créer dans N8N

**Postgres (Supabase)** :
- Menu → **Credentials** → **Add Credential** → **Postgres**
- Nom : `Supabase`
- Host : `db.[ton-projet].supabase.co`
- Port : `5432`
- Database : `postgres`
- User : `postgres`
- Password : [Ton mot de passe Supabase]
- SSL : **Enabled**

**HTTP Header Auth (Resend)** :
- Menu → **Credentials** → **Add Credential** → **HTTP Header Auth**
- Nom : `Resend API`
- Name : `Authorization`
- Value : `Bearer {{$env.RESEND_API_KEY}}`

### 2. Variables d'Environnement

Menu → **Settings** → **Environment Variables** :
- `RESEND_API_KEY` : `re_xxxxxxxxxxxxx`
- `FROM_EMAIL` : `noreply@investinfinity.fr`

---

## 🚀 WORKFLOW 1 : SÉQUENCE DE BIENVENUE

### Étape 1 : Créer le Workflow
1. **Workflows** → **+ Add Workflow**
2. Nom : `Newsletter - Séquence de Bienvenue`

### Étape 2 : Ajouter le Trigger
1. Clique sur **"+"** → Cherche **"Cron"**
2. Configure :
   - **Trigger Times** : `Every Hour`
   - Ou cron expression : `0 * * * *`

### Étape 3 : Ajouter Node Postgres (Récupérer leads)

1. Clique sur **"+"** après le Cron → **"Postgres"**
2. Nom : `Récupérer leads à envoyer`
3. Configuration :
   - **Operation** : `Execute Query`
   - **Credentials** : `Supabase` (créé précédemment)
   - **Query** :
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
       (
         (metadata->>'last_email_type' IS NULL OR metadata->>'last_email_type' = 'welcome_1')
         AND created_at <= NOW() - INTERVAL '3 days'
         AND created_at > NOW() - INTERVAL '4 days'
       )
       OR
       -- Email #3 : 7 jours après inscription (4 jours après email #2)
       (
         metadata->>'last_email_type' = 'welcome_2'
         AND (metadata->>'last_email_sent')::timestamp <= NOW() - INTERVAL '4 days'
         AND (metadata->>'last_email_sent')::timestamp > NOW() - INTERVAL '5 days'
       )
       OR
       -- Email #4 : 14 jours après inscription (7 jours après email #3)
       (
         metadata->>'last_email_type' = 'welcome_3'
         AND (metadata->>'last_email_sent')::timestamp <= NOW() - INTERVAL '7 days'
         AND (metadata->>'last_email_sent')::timestamp > NOW() - INTERVAL '8 days'
       )
     )
   ```

### Étape 4 : Ajouter Node Code (Déterminer type email)

1. **+** → **Code**
2. Nom : `Déterminer type email`
3. Mode : `Run Once for All Items`
4. Code :
   ```javascript
   const items = $input.all();
   const results = [];

   for (const item of items) {
     const created = new Date(item.json.created_at);
     const now = new Date();
     const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
     const lastType = item.json.metadata?.last_email_type;

     let emailType;
     if (!lastType || lastType === 'welcome_1') {
       emailType = 'welcome_2'; // 3 jours
     } else if (lastType === 'welcome_2') {
       emailType = 'welcome_3'; // 7 jours
     } else if (lastType === 'welcome_3') {
       emailType = 'welcome_4'; // 14 jours
     } else {
       continue; // Skip
     }

     results.push({
       json: {
         ...item.json,
         emailType,
         segment: item.json.metadata?.segment || 'medium',
         prenom: item.json.prenom || 'Cher trader'
       }
     });
   }

   return results;
   ```

### Étape 5 : Ajouter Node Code (Générer contenu)

1. **+** → **Code**
2. Nom : `Générer contenu email`
3. Mode : `Run Once for All Items`
4. Code : Voir le fichier `workflows/templates/email-content-generator.js` (je vais le créer)

### Étape 6 : Ajouter HTTP Request (Envoyer email)

1. **+** → **HTTP Request**
2. Nom : `Envoyer email via Resend`
3. Configuration :
   - **Method** : `POST`
   - **URL** : `https://api.resend.com/emails`
   - **Authentication** : `Resend API` (créé précédemment)
   - **Send Headers** : Oui
   - **Add Header** :
     - Name : `Content-Type`
     - Value : `application/json`
   - **Send Body** : Oui
   - **Body Content Type** : `JSON`
   - **Specify Body** : `Using Fields Below`
   - **Body Parameters** :
     ```
     from: Invest Infinity <{{$env.FROM_EMAIL}}>
     to: [{{$json.email}}]
     subject: {{$json.subject}}
     html: {{$json.html}}
     ```

### Étape 7 : Ajouter Postgres (Mettre à jour tracking)

1. **+** → **Postgres**
2. Nom : `Mettre à jour tracking`
3. Configuration :
   - **Operation** : `Execute Query`
   - **Credentials** : `Supabase`
   - **Query** :
   ```sql
   UPDATE leads
   SET metadata = jsonb_set(
     jsonb_set(
       jsonb_set(
         COALESCE(metadata, '{}'::jsonb),
         '{last_email_sent}',
         to_jsonb(NOW()::text)
       ),
       '{last_email_type}',
       to_jsonb('{{$json.emailType}}'::text)
     ),
     '{email_count}',
     to_jsonb(COALESCE((metadata->>'email_count')::int, 0) + 1)
   )
   WHERE id = '{{$json.id}}'
   ```

### Étape 8 : Connecter les nodes

Connecte-les dans l'ordre :
```
Cron → Postgres → Code (type) → Code (contenu) → HTTP Request → Postgres (update)
```

---

## 📬 WORKFLOW 2 : NEWSLETTER HEBDOMADAIRE

### Étape 1 : Créer le Workflow
1. **Workflows** → **+ Add Workflow**
2. Nom : `Newsletter - Hebdomadaire`

### Étape 2 : Ajouter le Trigger
1. **+** → **Cron**
2. Configure :
   - **Cron Expression** : `30 10 * * 2` (Mardi 10h30)
   - Ou via l'interface : Mardi, 10:30

### Étape 3 : Ajouter Postgres (Récupérer abonnés)

1. **+** → **Postgres**
2. Nom : `Récupérer abonnés actifs`
3. Query :
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
     AND created_at <= NOW() - INTERVAL '14 days'
   ```

### Étape 4-7 : Identique au Workflow 1

Ajoute les mêmes nodes (Code pour contenu, HTTP Request, Postgres update) avec le contenu hebdomadaire.

---

## ✅ ACTIVATION

1. Clique sur le toggle **"Active"** en haut à droite de chaque workflow
2. Teste avec **"Execute Workflow"** pour vérifier que ça fonctionne
3. Vérifie les logs dans **"Executions"**

---

## 🧪 TEST

Pour tester rapidement :
1. Modifie temporairement la query Postgres pour cibler un email spécifique :
   ```sql
   SELECT * FROM leads WHERE email = 'ton-email@test.com'
   ```
2. Exécute manuellement le workflow
3. Vérifie que l'email est reçu
4. Vérifie dans Supabase que `metadata` est mis à jour

---

## 📊 MONITORING

- **Executions** : Voir toutes les exécutions et leurs résultats
- **Error Workflow** : Crée un workflow qui envoie un email en cas d'erreur
- **Logs** : Vérifie les logs dans chaque node pour déboguer

---

## 🎨 PERSONNALISATION

Tu peux personnaliser :
- Les intervalles (3 jours, 7 jours, etc.)
- Les contenus des emails (dans les nodes Code)
- Les jours/heures d'envoi (dans les triggers Cron)
- La segmentation (ajouter des conditions SQL basées sur `metadata->segment`)
