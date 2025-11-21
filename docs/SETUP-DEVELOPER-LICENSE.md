# Guide de Configuration - Système de Protection Développeur

Ce guide vous accompagne dans la configuration complète du système de protection développeur avec validation en 1 clic.

## 📋 Prérequis

- Accès au Dashboard Supabase
- Compte développeur : `butcher13550@gmail.com` doit exister dans Supabase Auth
- Supabase CLI installé (optionnel, pour le déploiement automatique)

## 🚀 Étapes de Configuration

### Étape 1 : Appliquer la Migration SQL

1. Connectez-vous au Dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**
5. Copiez-collez le contenu du fichier : `supabase/migrations/20250122000000_create_developer_license_30days.sql`
6. Cliquez sur **Run** (ou `Ctrl+Enter`)

**Vérification** : Vérifiez que la table `developer_license` existe dans **Table Editor** avec une ligne par défaut.

### Étape 2 : Configurer le Rôle Développeur

1. Dans le **SQL Editor**, créez une nouvelle requête
2. Copiez-collez le contenu du fichier : `scripts/setup-developer-role.sql`
3. Cliquez sur **Run**

**Alternative** : Si vous préférez, exécutez cette requête SQL :

```sql
-- Mettre à jour ou créer le profil développeur
INSERT INTO public.profiles (id, email, role)
SELECT 
    u.id,
    u.email,
    'developer'::text
FROM auth.users u
WHERE u.email = 'butcher13550@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'developer',
    email = EXCLUDED.email;
```

**Important** : Si l'utilisateur `butcher13550@gmail.com` n'existe pas encore dans `auth.users`, vous devez d'abord :
- Soit créer un compte via l'interface d'authentification
- Soit utiliser l'API Supabase pour créer l'utilisateur

**Vérification** : Vérifiez dans **Table Editor** > `profiles` que votre email a le rôle `developer`.

### Étape 3 : Déployer l'Edge Function

#### Option A : Via Supabase CLI (Recommandé)

```bash
# Se connecter à Supabase (si pas déjà fait)
supabase login

# Lier le projet (si pas déjà fait)
supabase link --project-ref vveswlmcgmizmjsriezw

# Déployer l'Edge Function
supabase functions deploy check-license-daily
```

#### Option B : Via Dashboard Supabase

1. Allez sur : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions
2. Cliquez sur **Create a new function**
3. Nom : `check-license-daily`
4. Copiez-collez le contenu de : `supabase/functions/check-license-daily/index.ts`
5. Cliquez sur **Deploy**

**Vérification** : Vérifiez que l'Edge Function apparaît dans la liste avec le statut **Active**.

### Étape 4 : Configurer le Cron Job (Optionnel mais Recommandé)

Pour que la vérification se fasse automatiquement chaque jour :

1. Allez sur : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions
2. Sélectionnez `check-license-daily`
3. Allez dans l'onglet **Cron Jobs** (ou **Scheduled Functions**)
4. Cliquez sur **Create Cron Job**
5. Configurez :
   - **Schedule** : `0 0 * * *` (tous les jours à minuit UTC)
   - **Function** : `check-license-daily`
   - **Method** : `POST`
6. Cliquez sur **Save**

**Note** : Si vous avez configuré un secret (étape 5), ajoutez-le dans les headers du cron job :
- Header : `x-secret-key`
- Value : [votre secret]

### Étape 5 : Configurer le Secret (Optionnel mais Recommandé)

Pour sécuriser l'Edge Function contre les appels non autorisés :

1. Allez sur : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions
2. Cliquez sur **Secrets**
3. Cliquez sur **Add new secret**
4. Configurez :
   - **Name** : `LICENSE_CHECK_SECRET_KEY`
   - **Value** : Générez une clé secrète aléatoire (ex: utilisez un générateur de mot de passe)
5. Cliquez sur **Save**

**Note** : Si vous configurez un secret, mettez à jour l'Edge Function pour l'utiliser, ou laissez-le vide pour désactiver la vérification.

## ✅ Vérification Finale

### 1. Vérifier la Table

Dans **Table Editor** > `developer_license`, vous devriez voir :
- Une ligne avec `is_active = true`
- `last_payment_date` = date actuelle
- `admin_revocation_days = 30`

### 2. Vérifier le Rôle Développeur

Dans **Table Editor** > `profiles`, filtrez par email `butcher13550@gmail.com` :
- Le rôle doit être `developer`

### 3. Tester le Widget

1. Connectez-vous à l'application avec `butcher13550@gmail.com`
2. Allez dans **Admin** > **Paramètres**
3. Vous devriez voir le widget **Protection Développeur** en haut de la page
4. Le widget doit afficher :
   - Statut : ✅ ACTIF
   - Dernier paiement : Date actuelle
   - Jours restants : 30
   - Statut admin client : ✅ Actif

### 4. Tester la Validation

1. Cliquez sur le bouton **✅ Valider le Paiement**
2. Vous devriez voir un toast de confirmation
3. Le widget devrait se rafraîchir avec la nouvelle date de paiement

## 🔧 Dépannage

### Le widget n'apparaît pas

- Vérifiez que vous êtes connecté avec `butcher13550@gmail.com`
- Vérifiez que le rôle est bien `developer` dans la table `profiles`
- Vérifiez la console du navigateur pour les erreurs

### Erreur "Permission denied" lors de la validation

- Vérifiez que les RLS policies sont correctement appliquées
- Vérifiez que votre email correspond exactement à `butcher13550@gmail.com`
- Vérifiez que le rôle est bien `developer`

### L'Edge Function ne s'exécute pas

- Vérifiez que l'Edge Function est déployée et active
- Vérifiez les logs dans **Edge Functions** > `check-license-daily` > **Logs**
- Vérifiez que le cron job est configuré correctement

## 📝 Notes Importantes

- **Période de protection** : 30 jours
- **Email développeur** : `butcher13550@gmail.com` (seul à voir/utiliser le système)
- **Email client** : `investinfinityfr@gmail.com` (admin révocable après 30 jours)
- **Automatisation** : Le système vérifie automatiquement chaque jour si la licence est expirée
- **Révocation** : Après 30 jours sans paiement, le rôle admin du client est automatiquement révoqué

## 🎯 Utilisation

Une fois configuré, le système fonctionne automatiquement :

1. **Réception du virement** : Vous recevez le virement bancaire
2. **Validation** : Cliquez sur **✅ Valider le Paiement** dans le widget
3. **Confirmation** : Le système réactive tout automatiquement pour 30 jours

Le système vérifie automatiquement chaque jour et révoque l'admin si nécessaire.

