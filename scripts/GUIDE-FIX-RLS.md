# 🔧 Guide : Correction de la récursion RLS

## Problème identifié

L'erreur `infinite recursion detected in policy for relation "profiles"` se produit car :

1. La politique RLS "admins can see all profiles" utilise `is_admin(auth.uid())`
2. La fonction `is_admin()` lit dans la table `profiles` pour vérifier le rôle
3. Cette lecture déclenche à nouveau la politique RLS → récursion infinie

## Solution

Modifier la fonction `is_admin()` pour utiliser `SECURITY DEFINER`, ce qui permet de contourner RLS et éviter la récursion.

## Application de la correction

### Option 1 : Via Supabase Dashboard (Recommandé)

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. Va dans **SQL Editor**
4. Copie-colle le contenu du fichier `supabase/migrations/20250120000000_fix_profiles_rls_recursion.sql`
5. Clique sur **Run**

### Option 2 : Via Supabase CLI

Si tu as le projet lié localement :

```bash
supabase db push
```

### Option 3 : Via le script Node.js

```bash
node scripts/fix-rls-recursion.js
```

⚠️ **Note** : Le script Node.js affichera le SQL à exécuter manuellement car Supabase ne permet pas d'exécuter du SQL arbitraire via l'API REST.

## Vérification

Après avoir appliqué la correction :

1. Recharge la page de l'application
2. Connecte-toi à nouveau
3. Vérifie la console du navigateur (F12)
4. Tu ne devrais plus voir l'erreur `infinite recursion`

## Contenu de la migration

La migration :
- Supprime la politique RLS problématique
- Recrée `is_admin()` avec `SECURITY DEFINER`
- Recrée la politique admin (sans récursion maintenant)
- Ajoute des politiques pour UPDATE et INSERT sur profiles

