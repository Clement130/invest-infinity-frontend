# ✅ Configuration Complète - Système de Protection Développeur

## 📋 Récapitulatif

Tous les fichiers ont été créés avec succès. Voici les étapes à suivre pour finaliser la configuration.

## 🚀 Étapes à Exécuter

### ✅ Étape 1 : Appliquer la Migration SQL

**Via Dashboard Supabase** :

1. Allez sur : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/sql/new
2. Copiez-collez le contenu du fichier : `supabase/migrations/20250122000000_create_developer_license_30days.sql`
3. Cliquez sur **Run** (ou `Ctrl+Enter`)

**Vérification** :
```sql
SELECT * FROM public.developer_license;
```
Vous devriez voir une ligne avec `is_active = true`.

---

### ✅ Étape 2 : Configurer le Rôle Développeur

**Via Dashboard Supabase** :

1. Allez sur : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/sql/new
2. Copiez-collez cette requête :

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

3. Cliquez sur **Run**

**Important** : Si l'utilisateur `butcher13550@gmail.com` n'existe pas encore :
- Créez-le d'abord via l'interface d'authentification Supabase
- Ou utilisez l'API pour créer l'utilisateur

**Vérification** :
```sql
SELECT id, email, role FROM public.profiles WHERE email = 'butcher13550@gmail.com';
```
Le rôle doit être `developer`.

---

### ✅ Étape 3 : Déployer l'Edge Function

**Option A : Via Supabase CLI** (si configuré)

```bash
supabase functions deploy check-license-daily
```

**Option B : Via Dashboard Supabase**

1. Allez sur : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions
2. Cliquez sur **Create a new function**
3. Nom : `check-license-daily`
4. Copiez le contenu de : `supabase/functions/check-license-daily/index.ts`
5. Collez-le dans l'éditeur
6. Cliquez sur **Deploy**

**Vérification** : L'Edge Function doit apparaître dans la liste avec le statut **Active**.

---

### ✅ Étape 4 : Configurer le Cron Job (Recommandé)

1. Allez sur : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions
2. Sélectionnez `check-license-daily`
3. Allez dans l'onglet **Cron Jobs** (ou **Scheduled Functions**)
4. Cliquez sur **Create Cron Job**
5. Configurez :
   - **Schedule** : `0 0 * * *` (tous les jours à minuit UTC)
   - **Function** : `check-license-daily`
   - **Method** : `POST`
6. Cliquez sur **Save**

---

### ✅ Étape 5 : Configurer le Secret (Optionnel)

1. Allez sur : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions
2. Cliquez sur **Secrets**
3. Cliquez sur **Add new secret**
4. Configurez :
   - **Name** : `LICENSE_CHECK_SECRET_KEY`
   - **Value** : Générez une clé aléatoire (ex: `dev-license-secret-2024-xyz123`)
5. Cliquez sur **Save**

**Note** : Si vous configurez un secret, vous devrez aussi l'ajouter dans les headers du cron job.

---

## 🧪 Test Final

1. **Connectez-vous** à l'application avec `butcher13550@gmail.com`
2. **Allez dans** Admin > Paramètres
3. **Vérifiez** que le widget **Protection Développeur** apparaît en haut
4. **Testez** le bouton **✅ Valider le Paiement**

Le widget doit afficher :
- ✅ Statut : ACTIF
- 📅 Dernier paiement : Date actuelle
- ⏱️ Jours restants : 30
- 👤 Statut admin client : ✅ Actif

---

## 📁 Fichiers Créés

✅ Migration SQL : `supabase/migrations/20250122000000_create_developer_license_30days.sql`
✅ Service : `src/services/licenseService.ts`
✅ Hook développeur : `src/hooks/useDeveloperRole.ts`
✅ Hook validation : `src/hooks/useLicenseValidation.ts`
✅ Widget : `src/components/admin/LicenseStatusWidget.tsx`
✅ Edge Function : `supabase/functions/check-license-daily/index.ts`
✅ Script SQL rôle : `scripts/setup-developer-role.sql`
✅ Documentation : `docs/SETUP-DEVELOPER-LICENSE.md`

---

## 🎯 Utilisation

Une fois tout configuré :

1. **Réception du virement** : Vous recevez le virement bancaire
2. **Validation** : Cliquez sur **✅ Valider le Paiement** dans Admin > Paramètres
3. **Confirmation** : Le système réactive tout pour 30 jours

Le système vérifie automatiquement chaque jour et révoque l'admin si nécessaire après 30 jours.

---

## ⚠️ Important

- Le widget est **visible uniquement** pour `butcher13550@gmail.com`
- Le client `investinfinityfr@gmail.com` **ne voit rien** de ce système
- Après 30 jours sans paiement, le rôle admin est **automatiquement révoqué**
- Vous pouvez toujours réactiver après paiement en cliquant sur le bouton

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Supabase Dashboard > Edge Functions > Logs
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que les RLS policies sont correctement appliquées

