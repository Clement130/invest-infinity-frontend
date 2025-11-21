# 🚀 Configuration des Fonctionnalités Admin

Ce fichier contient toutes les commandes nécessaires pour configurer les nouvelles fonctionnalités admin.

## ⚡ Configuration Rapide

### 1️⃣ Connexion à Supabase

```bash
supabase login
```

Suivez les instructions dans le navigateur pour vous authentifier.

### 2️⃣ Lier le Projet (si pas déjà fait)

```bash
supabase link --project-ref VOTRE_PROJECT_REF
```

**Trouver votre PROJECT_REF** :
- Allez sur https://supabase.com/dashboard
- Sélectionnez votre projet
- L'URL sera : `https://supabase.com/dashboard/project/[PROJECT_REF]`
- Copiez le `PROJECT_REF` de l'URL

### 3️⃣ Appliquer la Migration

```bash
supabase db push
```

Cette commande crée la table `platform_settings` avec les paramètres par défaut.

**Vérification** :
- Allez dans Supabase Dashboard > Table Editor
- Vérifiez que la table `platform_settings` existe avec 3 entrées

### 4️⃣ Configurer les Secrets

#### Option A : Via le Dashboard (Recommandé)

1. Allez sur : `https://supabase.com/dashboard/project/[PROJECT_REF]/settings/functions`
2. Cliquez sur l'onglet **Secrets**
3. Cliquez sur **Add new secret**
4. Ajoutez les deux secrets suivants :

```
Nom: BUNNY_STREAM_LIBRARY_ID
Valeur: votre_library_id_bunny_stream
```

```
Nom: BUNNY_STREAM_API_KEY
Valeur: votre_api_key_bunny_stream
```

#### Option B : Via la CLI

```bash
supabase secrets set BUNNY_STREAM_LIBRARY_ID=votre_library_id
supabase secrets set BUNNY_STREAM_API_KEY=votre_api_key
```

**Où trouver vos clés Bunny Stream** :
- Connectez-vous sur https://bunny.net
- Allez dans **Stream** > **Libraries**
- Sélectionnez votre bibliothèque
- Copiez le **Library ID** et l'**API Key**

### 5️⃣ Déployer l'Edge Function

```bash
supabase functions deploy upload-bunny-video
```

**Vérification** :
- Allez dans Supabase Dashboard > Edge Functions
- Vous devriez voir `upload-bunny-video` dans la liste
- Le statut doit être "Active"

## ✅ Vérification Finale

### Tester la Migration

Exécutez cette requête SQL dans Supabase SQL Editor :

```sql
SELECT key, category, updated_at 
FROM platform_settings 
ORDER BY category;
```

Vous devriez voir 3 lignes :
- `appearance` (catégorie: appearance)
- `email_templates` (catégorie: emails)
- `integrations` (catégorie: integrations)

### Tester l'Upload de Vidéo

1. Connectez-vous en tant qu'admin sur votre application
2. Allez dans **Admin** > **Paramètres** > **Intégrations**
3. Vérifiez que vous pouvez voir les champs Bunny Stream
4. Testez l'upload depuis la page Vidéos (si intégré)

## 🐛 Dépannage

### Erreur : "Invalid access token"

**Solution** :
```bash
supabase logout
supabase login
```

### Erreur : "Project not linked"

**Solution** :
```bash
supabase link --project-ref VOTRE_PROJECT_REF
```

### Erreur : "Bunny Stream configuration missing"

**Vérifiez** :
1. Les secrets sont bien configurés dans le Dashboard
2. Les noms sont exactement : `BUNNY_STREAM_LIBRARY_ID` et `BUNNY_STREAM_API_KEY`
3. Redéployez l'Edge Function après avoir ajouté les secrets :
   ```bash
   supabase functions deploy upload-bunny-video
   ```

### Erreur lors du déploiement de l'Edge Function

**Vérifiez** :
1. Vous êtes connecté : `supabase login`
2. Le projet est lié : `supabase link --project-ref [REF]`
3. Les fichiers de l'Edge Function existent : `supabase/functions/upload-bunny-video/index.ts`

## 📚 Documentation Complète

Pour plus de détails, consultez :
- `docs/DEPLOYMENT-GUIDE.md` - Guide complet de déploiement
- `docs/ADMIN-SETTINGS-AND-UPLOAD.md` - Documentation des fonctionnalités

## 🎯 Commandes Résumées

```bash
# 1. Connexion
supabase login

# 2. Lier le projet (si nécessaire)
supabase link --project-ref VOTRE_PROJECT_REF

# 3. Migration
supabase db push

# 4. Secrets (via Dashboard recommandé)
# Allez sur: Dashboard > Settings > Edge Functions > Secrets

# 5. Déploiement Edge Function
supabase functions deploy upload-bunny-video
```

## ✨ C'est tout !

Une fois ces étapes terminées, vous pouvez :
- ✅ Configurer les paramètres dans **Admin** > **Paramètres**
- ✅ Uploader des vidéos via l'interface admin
- ✅ Personnaliser l'apparence de la plateforme
- ✅ Configurer les templates d'emails

