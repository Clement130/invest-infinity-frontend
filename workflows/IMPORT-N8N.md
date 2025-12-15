# Guide d'Import des Workflows N8N

## 📥 Import Rapide

### Étape 1 : Accéder à N8N
1. Ouvre ton instance N8N (ex: `https://n8n.srv11546...` ou autre)
2. Va dans le menu **"Workflows"**
3. Clique sur **"Import from File"** ou **"+"** puis **"Import from File"**

### Étape 2 : Importer les workflows

#### Workflow 1 : Séquence de Bienvenue
- Fichier : `workflows/n8n-newsletter-welcome.json`
- Nom : "Newsletter - Séquence de Bienvenue"
- Fréquence : Toutes les heures

#### Workflow 2 : Newsletter Hebdomadaire
- Fichier : `workflows/n8n-newsletter-weekly.json`
- Nom : "Newsletter - Hebdomadaire (Mardi 10h30)"
- Fréquence : Tous les mardis à 10h30

## ⚙️ Configuration Requise

### 1. Credentials Supabase
Dans N8N, crée une credential **Postgres** avec :
- **Host** : `db.[ton-projet].supabase.co`
- **Port** : `5432`
- **Database** : `postgres`
- **User** : `postgres`
- **Password** : Ton mot de passe Supabase (trouvable dans Dashboard → Settings → Database)
- **SSL** : Enabled (Required)

### 2. Variables d'Environnement N8N
Dans Settings → Environment Variables, ajoute :
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@investinfinity.fr
SUPABASE_URL=https://[ton-projet].supabase.co
```

### 3. HTTP Request Credentials
Pour les nodes HTTP Request vers Resend :
- Type : **Header Auth**
- Name : `Authorization`
- Value : `Bearer {{$env.RESEND_API_KEY}}`

## 🔧 Après Import

1. **Configurer les Credentials** : Remplace `supabase-connection` dans les nodes Postgres
2. **Vérifier les Variables** : Assure-toi que `$env.RESEND_API_KEY` et `$env.FROM_EMAIL` sont définis
3. **Activer les Workflows** : Active-les avec le toggle en haut à droite
4. **Tester** : Clique sur "Execute Workflow" pour tester une exécution manuelle

## 📊 Structure des Workflows

### Workflow Bienvenue
1. **Cron Trigger** → Vérifie toutes les heures
2. **Supabase Query** → Récupère les leads à envoyer
3. **Code Node** → Détermine le type d'email (welcome_2, welcome_3, welcome_4)
4. **Code Node** → Génère le HTML et subject
5. **HTTP Request** → Envoie via Resend
6. **Supabase Update** → Met à jour le tracking

### Workflow Hebdomadaire
1. **Cron Trigger** → Mardi 10h30
2. **Supabase Query** → Récupère les abonnés actifs (14+ jours après inscription)
3. **Code Node** → Génère le contenu hebdomadaire (rotation)
4. **HTTP Request** → Envoie via Resend
5. **Supabase Update** → Met à jour le tracking

## ✅ Vérification

Après import et activation :
1. Exécute manuellement le workflow "Bienvenue"
2. Vérifie les logs N8N pour les erreurs
3. Vérifie dans Supabase que `metadata->last_email_sent` est mis à jour
4. Vérifie dans Resend que l'email est bien envoyé

## 🐛 Dépannage

**Erreur de connexion Supabase** :
- Vérifie que l'IP de ton serveur N8N est dans les "Allowed IPs" de Supabase
- Ou désactive temporairement la restriction IP pour tester

**Erreur Resend** :
- Vérifie que `RESEND_API_KEY` est correct
- Vérifie que le domaine `investinfinity.fr` est vérifié dans Resend

**Aucun email envoyé** :
- Vérifie les conditions SQL dans les queries
- Teste avec un email spécifique en modifiant la query temporairement








