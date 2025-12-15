# Vérification des Accès Clients - Rapport Complet

**Date :** 2025-01-XX  
**Objectif :** Vérifier que chaque client actuel et futur a les bons accès selon sa licence

---

## ✅ 1. Vérification des Clients Actuels

### Structure de la Base de Données

**Table `profiles` :**
- Colonne `license` : `'none' | 'entree' | 'transformation' | 'immersion'`
- Contrainte CHECK garantit que seules ces valeurs sont acceptées
- Les valeurs `starter`, `pro`, `elite` sont **rejetées** par la base de données

**Table `training_modules` :**
- Colonne `required_license` : `'starter' | 'pro' | 'elite'`
- Contrainte CHECK garantit que seules ces valeurs sont acceptées

**Mapping :**
- `entree` (profile) → `starter` (système)
- `transformation` (profile) → `pro` (système)
- `immersion` (profile) → `elite` (système)

---

## ✅ 2. Système d'Attribution pour les Futurs Clients

### Webhook Stripe (`stripe-webhook/index.ts`)

**Processus d'attribution :**

1. **Récupération du mapping Price → License** (ligne 297)
   ```typescript
   const priceToLicense = await getPriceToLicenseMapping();
   const license = priceToLicense[priceId || ''] || 'entree';
   ```
   - Récupère `plan_type` depuis `stripe_prices` (entree, transformation, immersion)
   - Fallback vers `FALLBACK_PRICE_TO_LICENSE` si la table n'existe pas

2. **Attribution de la licence au profil** (lignes 303-340)
   ```typescript
   await supabaseAdmin.from('profiles').upsert({
     license: license, // 'entree', 'transformation', ou 'immersion'
     ...
   });
   ```
   - ✅ Utilise les **bons noms** : `entree`, `transformation`, `immersion`
   - ✅ Vérification après attribution (lignes 343-370)
   - ✅ Correction automatique si la licence ne correspond pas

3. **Attribution des accès aux modules** (lignes 372-409)
   ```typescript
   const userSystemLicense = PROFILE_TO_SYSTEM_LICENSE[license] || 'starter';
   const userLicenseLevel = SYSTEM_LICENSE_HIERARCHY[userSystemLicense] || 1;
   
   const accessibleModules = modules.filter(m => {
     const requiredLevel = SYSTEM_LICENSE_HIERARCHY[m.required_license] || 1;
     return userLicenseLevel >= requiredLevel;
   });
   ```
   - ✅ Convertit correctement `entree` → `starter`, etc.
   - ✅ Compare avec `required_license` (starter, pro, elite)
   - ✅ Crée les entrées dans `training_access`

**Correction appliquée :**
- ✅ Le webhook utilise maintenant `PROFILE_TO_SYSTEM_LICENSE` pour convertir
- ✅ Compare correctement les niveaux avec `SYSTEM_LICENSE_HIERARCHY`

---

## ✅ 3. Vérification Frontend

### Hook `useEntitlements`

**Fonctionnement :**
1. Récupère `profile.license` (entree, transformation, immersion)
2. Convertit en licence système via `normalizeToSystemLicense()`
3. Filtre les modules selon `required_license` (starter, pro, elite)

**Code :**
```typescript
const systemLicense = normalizeToSystemLicense(profile?.license);
// entree → starter, transformation → pro, immersion → elite

const checkModuleAccess = (module: TrainingModule): boolean => {
  return hasLicenseAccess(systemLicense, module.required_license);
};
```

✅ **Correct** : Le mapping est bien fait côté frontend

---

## ✅ 4. Vérification Backend (RLS)

### RLS Policies

**Politique pour `training_modules` :**
```sql
CREATE POLICY "users can view modules by license"
  USING (
    public.is_admin(auth.uid())
    OR
    (
      is_active = true
      AND public.user_has_license_for_module(
        auth.uid(),
        required_license
      )
    )
  );
```

**Fonction `user_has_license_for_module` :**
- Récupère `license` depuis `profiles` (entree, transformation, immersion)
- Compare avec `module_required_license` (starter, pro, elite)
- ⚠️ **PROBLÈME** : La fonction compare directement sans conversion !

**Correction nécessaire :**
La fonction SQL doit convertir `entree` → `starter` avant de comparer.

---

## ⚠️ 5. Problèmes Identifiés

### Problème 1 : Fonction SQL `user_has_license_for_module`

**Code actuel :**
```sql
user_level := array_position(license_hierarchy, user_license);
-- license_hierarchy = ['starter', 'pro', 'elite']
-- user_license = 'entree' → retourne NULL !
```

**Solution :** Convertir `entree` → `starter` dans la fonction SQL

### Problème 2 : Webhook Stripe (CORRIGÉ ✅)

**Avant :**
```typescript
const requiredLevel = LICENSE_HIERARCHY[requiredLicense] || 1;
// LICENSE_HIERARCHY['starter'] → undefined !
```

**Après :**
```typescript
const userSystemLicense = PROFILE_TO_SYSTEM_LICENSE[license] || 'starter';
const requiredLevel = SYSTEM_LICENSE_HIERARCHY[requiredLicense] || 1;
// Compare correctement starter/pro/elite
```

---

## 🔧 Corrections à Appliquer

### 1. Corriger la fonction SQL `user_has_license_for_module`

```sql
CREATE OR REPLACE FUNCTION public.user_has_license_for_module(
  user_id UUID,
  module_required_license TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  user_license TEXT;
  user_system_license TEXT;
  license_hierarchy TEXT[] := ARRAY['starter', 'pro', 'elite'];
  user_level INT;
  required_level INT;
BEGIN
  -- Récupérer la licence de l'utilisateur (format profile)
  SELECT license INTO user_license
  FROM public.profiles
  WHERE id = user_id;
  
  -- Si pas de licence, refuser
  IF user_license IS NULL OR user_license = 'none' THEN
    RETURN FALSE;
  END IF;
  
  -- Convertir licence profile → licence système
  CASE user_license
    WHEN 'entree' THEN user_system_license := 'starter';
    WHEN 'transformation' THEN user_system_license := 'pro';
    WHEN 'immersion' THEN user_system_license := 'elite';
    ELSE user_system_license := user_license; -- Déjà au format système
  END CASE;
  
  -- Trouver les niveaux
  user_level := array_position(license_hierarchy, user_system_license);
  required_level := array_position(license_hierarchy, module_required_license);
  
  -- Si niveau non trouvé, refuser
  IF user_level IS NULL THEN user_level := 0; END IF;
  IF required_level IS NULL THEN required_level := 1; END IF;
  
  -- L'utilisateur a accès si son niveau >= niveau requis
  RETURN user_level >= required_level;
END;
$$;
```

---

## ✅ 6. Vérification pour les Futurs Clients

### Processus d'Attribution

1. **Client achète sur Stripe** → Webhook reçoit `checkout.session.completed`
2. **Webhook récupère `priceId`** → Cherche dans `stripe_prices.plan_type`
3. **Attribution de la licence** → `profiles.license = 'entree' | 'transformation' | 'immersion'`
4. **Conversion pour les modules** → `entree` → `starter`, etc.
5. **Création des accès** → Entrées dans `training_access` pour les modules accessibles
6. **Vérification** → Le webhook vérifie que la licence a bien été assignée

**Garanties :**
- ✅ Les contraintes CHECK empêchent les valeurs invalides
- ✅ Le webhook utilise les bons noms (`entree`, `transformation`, `immersion`)
- ✅ La conversion est faite avant la comparaison
- ✅ Les RLS policies filtrent selon la licence

---

## 📊 Tableau de Vérification

| Élément | Format Profile | Format Système | Statut |
|---------|----------------|----------------|--------|
| **profiles.license** | `entree`, `transformation`, `immersion` | - | ✅ Correct |
| **modules.required_license** | - | `starter`, `pro`, `elite` | ✅ Correct |
| **Webhook attribution** | `entree`, `transformation`, `immersion` | - | ✅ Correct |
| **Webhook comparaison** | Convertit → | `starter`, `pro`, `elite` | ✅ Corrigé |
| **Frontend filtrage** | Convertit → | `starter`, `pro`, `elite` | ✅ Correct |
| **RLS function** | `entree`, etc. | Doit convertir | ⚠️ À corriger |

---

## 🎯 Actions Requises

### Priorité HAUTE
1. ✅ **Webhook Stripe** : Corrigé pour utiliser le bon mapping
2. ⚠️ **Fonction SQL `user_has_license_for_module`** : Doit convertir `entree` → `starter`

### Priorité MOYENNE
3. ✅ **Types TypeScript** : Corrigés pour utiliser les bons noms
4. ✅ **Frontend** : Utilise correctement le mapping

---

## ✅ Résumé

**Pour les clients actuels :**
- ✅ Les licences sont stockées avec les bons noms (`entree`, `transformation`, `immersion`)
- ✅ Le frontend filtre correctement selon la licence
- ⚠️ Les RLS policies doivent être corrigées pour convertir avant de comparer

**Pour les futurs clients :**
- ✅ Le webhook Stripe attribue les bonnes licences
- ✅ Le webhook convertit correctement pour comparer avec `required_license`
- ✅ Les accès sont créés automatiquement dans `training_access`
- ✅ Les contraintes CHECK garantissent l'intégrité des données

**Correction nécessaire :**
- ⚠️ La fonction SQL `user_has_license_for_module` doit convertir `entree` → `starter` avant de comparer

