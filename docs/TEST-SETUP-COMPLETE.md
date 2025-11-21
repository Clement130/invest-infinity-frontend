# Configuration des Tests - Complet ✅

## ✅ Étapes Complétées

### 1. Script de création d'utilisateur de test

**Fichier créé :** `scripts/create-test-user-with-progress.js`

**Commande :** `npm run create-test-user`

**Fonctionnalités :**
- ✅ Crée un utilisateur dans `auth.users`
- ✅ Crée son profil dans `public.profiles`
- ✅ Donne accès à un module actif
- ✅ Crée de la progression (1 leçon complétée, 1 en cours)

**Utilisateur créé :**
- Email: `test-progress@example.com`
- Password: `TestPassword123!`
- User ID: `8f8f3b49-d918-4a88-841f-fd347104c264`

### 2. Fichier .npmrc local

**Fichier créé :** `.npmrc`

**Objectif :** Éviter le problème d'installation des devDependencies causé par la configuration globale `omit=dev`

**Note :** Le fichier est vide car `omit=""` n'est pas valide. La simple présence du fichier peut aider, mais si le problème persiste, utilisez `npm install --include=dev`.

### 3. Script de test amélioré

**Fichier modifié :** `scripts/test-progress-service.js`

**Améliorations :**
- ✅ Support de `VITE_SUPABASE_SERVICE_ROLE_KEY` pour bypass RLS
- ✅ Fallback sur `VITE_SUPABASE_ANON_KEY` si service_role n'est pas disponible

## ✅ Problème Résolu : Table training_progress manquante

### Problème identifié

La table `training_progress` n'existait pas dans la base de données, ce qui causait l'erreur `PGRST205`.

### Solution appliquée

La table a été créée via une migration Supabase avec les politiques RLS appropriées.

**Migration appliquée :** `create_training_progress_table`

**Tables vérifiées :**
- ✅ `training_progress` - Créée avec succès
- ✅ `training_modules` - Existe (5 modules)
- ✅ `training_lessons` - Existe (39 leçons)
- ✅ `profiles` - Existe (4 profils)
- ✅ `training_access` - Existe (3 accès)

## 📋 Checklist de Vérification

Avant de lancer les tests, vérifiez :

- [ ] `.env.local` contient `VITE_SUPABASE_URL`
- [ ] `.env.local` contient `VITE_SUPABASE_SERVICE_ROLE_KEY` (recommandé) ou `VITE_SUPABASE_ANON_KEY`
- [ ] Les migrations ont été appliquées (`npm run supabase:migrate` ou via Dashboard)
- [ ] Au moins un module actif existe dans la base de données
- [ ] L'utilisateur de test a été créé (`npm run create-test-user`)

## 🧪 Commandes Disponibles

```bash
# Créer un utilisateur de test avec progression
npm run create-test-user

# Tester le service de progression (utilise le premier utilisateur trouvé)
npm run test:progress

# Tester avec un ID utilisateur spécifique
npm run test:progress <userId>

# Lancer les tests unitaires Vitest
npm run test

# Lancer les tests avec interface UI
npm run test:ui
```

## 📊 Résultats Attendus

Après avoir créé l'utilisateur de test et résolu le problème de cache, vous devriez voir :

```
🧪 Test du service de progression

📧 Utilisation de l'utilisateur: test-progress@example.com (Utilisateur Test Progression)

✅ Résultats du test:

📊 Modules: 1

  📦 Etape 1 - La Fondation
     Progression: 1/8 leçons (13%)
     Prochaine leçon: Les Différents Types de Marchés

🔥 Continuer l'apprentissage:
   Module: Etape 1 - La Fondation
   Leçon: Les Différents Types de Marchés
   Progression du module: 13%

✅ Leçons complétées: 1
```

## 🔧 Dépannage

### L'utilisateur n'est pas trouvé

Vérifiez que :
1. L'utilisateur existe dans `auth.users`
2. Le profil existe dans `public.profiles`
3. Les RLS policies permettent la lecture (ou utilisez service_role key)

### Les modules ne sont pas trouvés

Vérifiez que :
1. Des modules existent avec `is_active = true`
2. L'utilisateur a accès via `training_access`
3. Les RLS policies permettent la lecture

### Erreur de cache persistante

1. Attendez 5-10 minutes
2. Redémarrez votre projet Supabase (Settings > General > Restart)
3. Contactez le support Supabase si le problème persiste

## 📝 Notes

- Le script `create-test-user-with-progress.js` utilise `service_role` key pour bypass RLS
- Le script `test-progress-service.js` peut utiliser `anon` key mais `service_role` est recommandé
- Les tests unitaires Vitest mockent Supabase et ne nécessitent pas de connexion réelle

