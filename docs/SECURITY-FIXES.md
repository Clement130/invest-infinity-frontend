# Corrections de Sécurité et Performance - Supabase

Date : 31 janvier 2025

## ✅ Problèmes Corrigés

### 1. Performance RLS (254 problèmes → résolus)
- **Problème** : Les politiques RLS utilisaient `auth.uid()` directement, causant une réévaluation pour chaque ligne
- **Solution** : Remplacement par `(SELECT auth.uid())` pour une évaluation unique par requête
- **Tables optimisées** :
  - `profiles`
  - `orders`
  - `projects`
  - `project_updates`
  - `messages`
  - `files`
  - `availability_slots`
  - `blocked_dates`
  - `bookings`

### 2. Politiques Permissives Multiples (WARN → résolu)
- **Problème** : Plusieurs politiques permissives pour le même rôle/action, causant une exécution multiple
- **Solution** : Consolidation en une seule politique avec conditions OR
- **Tables consolidées** :
  - `profiles` : `users_and_admins_can_view_profiles`
  - `orders` : `users_and_admins_can_view_orders`
  - `projects` : `users_and_admins_can_view_projects`
  - `project_updates` : `users_and_admins_can_view_updates`
  - `messages` : `users_and_admins_can_view_messages`
  - `files` : `users_and_admins_can_view_files`
  - `availability_slots` : `anyone_can_read_active_or_admin_all`
  - `blocked_dates` : `anyone_can_read_blocked_dates`
  - `bookings` : `anyone_can_read_bookings` + `anyone_can_create_bookings`

### 3. Fonction current_user_id (Sécurité)
- **Problème** : `search_path` mutable, risque d'injection SQL
- **Solution** : Ajout de `SET search_path = public, pg_temp` pour sécuriser la fonction

## ⚠️ Action Manuelle Requise

### Protection des Mots de Passe Compromis
- **Problème** : La protection contre les mots de passe compromis est désactivée
- **Impact** : Les utilisateurs peuvent utiliser des mots de passe qui ont été compromis dans des fuites de données
- **Solution** : 
  1. Aller dans Supabase Dashboard → Authentication → Password Security
  2. Activer "Leaked Password Protection"
  3. Cette fonctionnalité vérifie les mots de passe contre HaveIBeenPwned.org
- **Documentation** : https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## 📊 Résultats

### ✅ Problèmes Résolus
- **Performance RLS** : ✅ **254 problèmes résolus** - Toutes les politiques RLS optimisées avec `(SELECT auth.uid())`
- **Politiques multiples** : ✅ **Tous les WARN résolus** - Politiques consolidées pour toutes les tables
- **Sécurité** : ✅ Fonction `current_user_id` sécurisée contre les injections SQL

### ⚠️ Problèmes Restants (Non-Critiques)
- **Index non utilisés** : 25 index INFO (non critique, peuvent être supprimés si nécessaire)
- **Protection mots de passe** : 1 WARN nécessitant action manuelle (voir ci-dessous)

### 📈 Impact Performance
- **Avant** : `auth.uid()` réévalué pour chaque ligne → performance dégradée
- **Après** : `(SELECT auth.uid())` évalué une seule fois par requête → **amélioration significative**
- **Politiques multiples** : Avant 2-3 politiques exécutées, après 1 seule → **réduction du temps d'exécution**

## 🔍 Index Non Utilisés (INFO)

Les index suivants n'ont pas été utilisés et peuvent être supprimés si nécessaire (non critique) :
- `deployments` : `idx_deployments_status`, `idx_deployments_created`
- `onboarding_users` : `idx_onboarding_email`, `idx_onboarding_step`
- `workflow_errors` : `idx_errors_severity`, `idx_errors_created`
- `legal_workflows` : `legal_workflows_embedding_idx`, `legal_workflows_type_idx`, `legal_workflows_category_idx`
- Et plusieurs autres...

Ces index peuvent être conservés s'ils sont prévus pour des requêtes futures, ou supprimés pour économiser de l'espace.

