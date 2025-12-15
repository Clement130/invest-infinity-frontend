# Correction des Noms de Licences

**Date :** 2025-01-XX  
**Problème :** Incohérence entre les noms de licences dans les types TypeScript et la base de données

---

## 🔴 Problème Identifié

Les types TypeScript utilisaient les mauvais noms de licences pour les profiles :
- ❌ **Avant** : `'none' | 'starter' | 'pro' | 'elite'`
- ✅ **Après** : `'none' | 'entree' | 'transformation' | 'immersion'`

---

## ✅ Corrections Appliquées

### 1. Types Supabase (`src/types/supabase.ts`)

**Profiles :**
```typescript
// ❌ AVANT
license: 'none' | 'starter' | 'pro' | 'elite'

// ✅ APRÈS
license: 'none' | 'entree' | 'transformation' | 'immersion'
```

**Payments :**
```typescript
// ❌ AVANT
license_type: 'starter' | 'pro' | 'elite' | null

// ✅ APRÈS
license_type: 'entree' | 'transformation' | 'immersion' | null
```

### 2. AuthContext (`src/context/AuthContext.tsx`)

```typescript
// ❌ AVANT
type LicenseType = 'none' | 'starter' | 'pro' | 'elite';

// ✅ APRÈS
type LicenseType = 'none' | 'entree' | 'transformation' | 'immersion';
```

### 3. Commentaires (`src/hooks/useEntitlements.ts`)

Mise à jour des commentaires pour clarifier le mapping :
- `profiles.license` : `'none' | 'entree' | 'transformation' | 'immersion'`
- `training_modules.required_license` : `'starter' | 'pro' | 'elite'`

---

## 📋 Mapping des Licences

### Dans les Profiles (Base de Données)
- `entree` → **Starter** (147€)
- `transformation` → **Premium** (497€)
- `immersion` → **Bootcamp Élite** (1997€)

### Dans les Modules (required_license)
- `starter` → Accessible avec licence **Starter** ou supérieure
- `pro` → Accessible avec licence **Premium** ou supérieure
- `elite` → Accessible uniquement avec licence **Bootcamp Élite**

### Conversion Profile → Système
```typescript
entree → starter
transformation → pro
immersion → elite
```

---

## ✅ Ce qui est Correct

1. **Modules** : Utilisent `starter`, `pro`, `elite` dans `required_license` ✅
2. **Webhook Stripe** : Retourne `entree`, `transformation`, `immersion` ✅
3. **Base de données** : Contraintes CHECK utilisent `entree`, `transformation`, `immersion` ✅
4. **Fonctions de conversion** : `profileToSystemLicense()` convertit correctement ✅

---

## ⚠️ Points d'Attention

1. **Ne jamais assigner directement** `starter`, `pro`, `elite` aux profiles
2. **Toujours utiliser** `entree`, `transformation`, `immersion` pour les profiles
3. **Les modules** continuent d'utiliser `starter`, `pro`, `elite` dans `required_license`

---

## 🔍 Vérifications

Pour vérifier que tout est correct :

```sql
-- Vérifier les valeurs de licence dans les profiles
SELECT DISTINCT license FROM public.profiles WHERE license IS NOT NULL;
-- Doit retourner : entree, transformation, immersion (pas starter, pro, elite)

-- Vérifier les valeurs de required_license dans les modules
SELECT DISTINCT required_license FROM public.training_modules WHERE required_license IS NOT NULL;
-- Doit retourner : starter, pro, elite (pas entree, transformation, immersion)
```

---

## 📝 Fichiers Modifiés

1. ✅ `src/types/supabase.ts` - Types pour profiles et payments
2. ✅ `src/context/AuthContext.tsx` - Type LicenseType
3. ✅ `src/hooks/useEntitlements.ts` - Commentaires mis à jour

---

## ✅ Résultat

Les types TypeScript correspondent maintenant à la réalité de la base de données :
- **Profiles** : `entree`, `transformation`, `immersion`
- **Modules** : `starter`, `pro`, `elite`
- **Mapping** : Conversion automatique via `profileToSystemLicense()`

