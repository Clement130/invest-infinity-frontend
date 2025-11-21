# Guide de Déploiement - Fonctionnalités Admin

Ce guide vous accompagne dans la configuration et le déploiement des nouvelles fonctionnalités admin.

## 📋 Prérequis

- Supabase CLI installé (`npm install -g supabase`)
- Compte Supabase avec un projet créé
- Accès admin au projet Supabase
- Clés API Bunny Stream (Library ID et API Key)

## 🚀 Configuration Rapide

### Option 1: Script Automatique (Recommandé)

#### Sur Windows (PowerShell):
```powershell
.\scripts\setup-admin-features.ps1
```

#### Sur Linux/Mac:
```bash
chmod +x scripts/setup-admin-features.sh
./scripts/setup-admin-features.sh
```

### Option 2: Configuration Manuelle

Suivez les étapes ci-dessous une par une.

## 📝 Étapes de Configuration

### 1. Connexion à Supabase

```bash
supabase login
```

Suivez les instructions pour vous connecter à votre compte Supabase.

### 2. Lier le Projet Local au Projet Distant

```bash
supabase link --project-ref votre-project-ref
```

Vous pouvez trouver votre `project-ref` dans l'URL de votre projet Supabase :
`https://supabase.com/dashboard/project/[PROJECT_REF]`

### 3. Appliquer la Migration

```bash
supabase db push
```

Cette commande applique la migration `20250121000000_create_platform_settings.sql` qui crée :
- La table `platform_settings` pour stocker les paramètres
- Les policies RLS pour la sécurité
- Les données par défaut

**Vérification** : Vérifiez dans le Dashboard Supabase > Table Editor que la table `platform_settings` existe avec 3 entrées par défaut.

### 4. Configurer les Secrets Supabase

Les secrets sont nécessaires pour que l'Edge Function `upload-bunny-video` puisse accéder à l'API Bunny Stream.

#### Via le Dashboard Supabase :

1. Allez sur votre projet Supabase
2. Naviguez vers **Settings** > **Edge Functions** > **Secrets**
3. Cliquez sur **Add new secret**
4. Ajoutez les deux secrets suivants :

```
Name: BUNNY_STREAM_LIBRARY_ID
Value: votre_library_id_bunny_stream
```

```
Name: BUNNY_STREAM_API_KEY
Value: votre_api_key_bunny_stream
```

#### Via la CLI Supabase :

```bash
supabase secrets set BUNNY_STREAM_LIBRARY_ID=votre_library_id
supabase secrets set BUNNY_STREAM_API_KEY=votre_api_key
```

**Important** : 
- Ne partagez jamais ces clés publiquement
- Les secrets sont automatiquement disponibles dans les Edge Functions
- Vous pouvez les mettre à jour à tout moment

### 5. Déployer l'Edge Function

```bash
supabase functions deploy upload-bunny-video
```

Cette commande :
- Compile et déploie l'Edge Function
- Rend la fonction accessible via l'URL : `https://[PROJECT_REF].supabase.co/functions/v1/upload-bunny-video`

**Vérification** : 
- Allez dans **Edge Functions** dans le Dashboard Supabase
- Vous devriez voir `upload-bunny-video` dans la liste
- Le statut doit être "Active"

## ✅ Vérification

### Vérifier la Migration

```sql
-- Dans Supabase SQL Editor
SELECT * FROM platform_settings;
```

Vous devriez voir 3 lignes :
- `appearance` (paramètres d'apparence)
- `email_templates` (templates d'emails)
- `integrations` (configurations d'intégrations)

### Vérifier l'Edge Function

1. Allez dans **Edge Functions** > `upload-bunny-video`
2. Vérifiez que les secrets sont bien configurés (ils apparaissent masqués)
3. Testez avec un appel de test si nécessaire

### Tester l'Upload de Vidéo

1. Connectez-vous en tant qu'admin
2. Allez dans **Admin** > **Vidéos** (ou la page où vous avez intégré le composant)
3. Cliquez sur "Uploader une vidéo"
4. Sélectionnez un fichier vidéo et entrez un titre
5. L'upload devrait fonctionner avec progression en temps réel

## 🔧 Dépannage

### Erreur : "Migration failed"

**Solution** :
- Vérifiez que vous êtes bien connecté : `supabase login`
- Vérifiez que le projet est bien lié : `supabase projects list`
- Vérifiez les logs : `supabase db push --debug`

### Erreur : "Bunny Stream configuration missing"

**Solution** :
- Vérifiez que les secrets sont bien configurés dans le Dashboard
- Les noms doivent être exactement : `BUNNY_STREAM_LIBRARY_ID` et `BUNNY_STREAM_API_KEY`
- Redéployez l'Edge Function après avoir ajouté les secrets

### Erreur : "Unauthorized: Admin access required"

**Solution** :
- Vérifiez que votre profil a le rôle `admin` dans la table `profiles`
- Connectez-vous à nouveau si nécessaire

### L'Edge Function ne se déploie pas

**Solution** :
- Vérifiez que vous êtes connecté : `supabase login`
- Vérifiez que le projet est lié : `supabase link --project-ref [REF]`
- Vérifiez les logs : `supabase functions deploy upload-bunny-video --debug`

## 📚 Ressources

- [Documentation Supabase CLI](https://supabase.com/docs/reference/cli)
- [Documentation Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentation Bunny Stream API](https://docs.bunny.net/docs/stream-api-overview)

## 🔄 Mise à Jour

Pour mettre à jour l'Edge Function après des modifications :

```bash
supabase functions deploy upload-bunny-video
```

Pour mettre à jour les secrets :

```bash
supabase secrets set BUNNY_STREAM_LIBRARY_ID=nouvelle_valeur
supabase secrets set BUNNY_STREAM_API_KEY=nouvelle_valeur
```

Puis redéployez l'Edge Function pour que les nouveaux secrets soient pris en compte.

## 🎯 Prochaines Étapes

Une fois la configuration terminée :

1. ✅ Testez l'upload de vidéos depuis l'interface admin
2. ✅ Configurez les paramètres d'apparence dans **Admin** > **Paramètres**
3. ✅ Personnalisez les templates d'emails
4. ✅ Configurez les intégrations (Stripe, webhooks, etc.)

Tout est prêt ! 🚀

