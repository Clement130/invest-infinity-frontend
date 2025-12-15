# Accès par Licence - Guide Complet

**Date :** 2025-01-XX  
**Source :** `src/config/offers.ts` et migrations Supabase

---

## 📋 Vue d'Ensemble

| Licence | Nom Affiché | Prix | Licence Système | Modules Accessibles |
|---------|-------------|------|-----------------|---------------------|
| `entree` | **Starter** | 147€ | `starter` | Modules avec `required_license = 'starter'` |
| `transformation` | **Premium** | 497€ | `pro` | Modules avec `required_license <= 'pro'` |
| `immersion` | **Bootcamp Élite** | 1997€ | `elite` | **Tous les modules** |

**Principe hiérarchique :** Une licence supérieure inclut automatiquement les accès des licences inférieures.

---

## 🌱 STARTER (entree → starter) - 147€

### Modules Accessibles
✅ **UNIQUEMENT** les modules avec `required_license = 'starter'` :
- **MetaTrader & TopStepX & Apex** (tutoriels plateformes)

❌ **NON ACCESSIBLE** :
- Etape 1 - La Fondation (`required_license = 'pro'`)
- Etape 2 - Les Bases en ICT (`required_license = 'pro'`)
- Etape 3 - La Stratégie ICT Mickael (`required_license = 'pro'`)
- Trading View - Outils et Techniques (`required_license = 'pro'`)
- Tout module avec `required_license = 'elite'`

### Features Incluses
✅ **Inclus :**
- 💬 Communauté Discord
- 📺 Sessions de trading en direct (lives)
- 🔔 Alertes trading en temps réel
- 💬 Support par chat
- 📚 Tutoriels plateformes (TopStep, Apex, MT4/MT5)

❌ **Non inclus :**
- 🚫 Zone Premium
- 🚫 Coaching individuel
- 🚫 Replays illimités
- 🚫 Certificat de complétion
- 🚫 Accès VIP Discord
- 🚫 Semaine d'immersion présentielle

---

## 🚀 PREMIUM (transformation → pro) - 497€

### Modules Accessibles
✅ **Tous les modules Starter** (`required_license = 'starter'`) :
- MetaTrader & TopStepX & Apex

✅ **PLUS tous les modules Pro** (`required_license = 'pro'`) :
- **Etape 1 - La Fondation**
- **Etape 2 - Les Bases en ICT**
- **Etape 3 - La Stratégie ICT Mickael**
- **Trading View - Outils et Techniques**

❌ **NON ACCESSIBLE** :
- Tout module avec `required_license = 'elite'`

### Features Incluses
✅ **Tout Starter inclus** :
- 💬 Communauté Discord
- 📺 Sessions de trading en direct
- 🔔 Alertes trading en temps réel
- 💬 Support par chat
- 📚 Tutoriels plateformes

✅ **PLUS Premium :**
- ⭐ **Zone Premium** (accès exclusif)
- 👨‍🏫 **Coaching individuel** (accompagnement 7j/7)
- 📹 **Replays illimités** (accès aux replays des lives)
- 🛡️ **Garantie 14 jours** (satisfait ou remboursé)

❌ **Non inclus :**
- 🚫 Certificat de complétion
- 🚫 Accès VIP Discord
- 🚫 Semaine d'immersion présentielle

---

## 👑 BOOTCAMP ÉLITE (immersion → elite) - 1997€

### Modules Accessibles
✅ **TOUS LES MODULES** (tous les `required_license`) :
- Tous les modules Starter
- Tous les modules Pro
- Tous les modules Elite (s'il y en a)

### Features Incluses
✅ **Tout Premium inclus** :
- Toutes les features Starter
- Toutes les features Premium

✅ **PLUS Elite :**
- 🏆 **Semaine d'immersion présentielle** (Marseille, 5-8 élèves max)
- 📜 **Certificat de complétion**
- 👑 **Accès VIP Discord**
- 🎯 **Trading en live avec Mickaël**
- 📊 **Analyse en direct des marchés**
- 📚 **Stratégie rentable expliquée de A à Z**

**Horaires Bootcamp :** Lundi au vendredi, 9h-18h

---

## 🔐 ADMIN / DEVELOPER

### Accès
✅ **ACCÈS TOTAL À TOUT** :
- Tous les modules (peu importe `required_license`)
- Toutes les features
- Toutes les vidéos
- Tous les contenus

**Note :** Les admins sont traités comme ayant une licence `elite` pour les vérifications d'accès.

---

## 📊 Tableau Récapitulatif des Features

| Feature | Starter | Premium | Bootcamp Élite |
|---------|---------|---------|----------------|
| 💬 Discord | ✅ | ✅ | ✅ |
| 📺 Lives Trading | ✅ | ✅ | ✅ |
| 🔔 Alertes | ✅ | ✅ | ✅ |
| 💬 Support | ✅ | ✅ | ✅ |
| 📚 Tutoriels Plateformes | ✅ | ✅ | ✅ |
| ⭐ Zone Premium | ❌ | ✅ | ✅ |
| 👨‍🏫 Coaching Individuel | ❌ | ✅ | ✅ |
| 📹 Replays Illimités | ❌ | ✅ | ✅ |
| 🛡️ Garantie 14 jours | ❌ | ✅ | ✅ |
| 🏆 Immersion Présentielle | ❌ | ❌ | ✅ |
| 📜 Certificat | ❌ | ❌ | ✅ |
| 👑 VIP Discord | ❌ | ❌ | ✅ |

---

## 📚 Modules par Niveau

### Modules STARTER (`required_license = 'starter'`)
- MetaTrader & TopStepX & Apex

### Modules PRO (`required_license = 'pro'`)
- Etape 1 - La Fondation
- Etape 2 - Les Bases en ICT
- Etape 3 - La Stratégie ICT Mickael
- Trading View - Outils et Techniques

### Modules ELITE (`required_license = 'elite'`)
- Aucun module spécifique actuellement (tous les modules sont `starter` ou `pro`)
- Les modules Elite seraient accessibles uniquement avec Bootcamp Élite

---

## 🔄 Hiérarchie des Accès

```
Bootcamp Élite (elite)
    ↓ (inclut tout)
Premium (pro)
    ↓ (inclut Starter)
Starter (starter)
    ↓
Aucun accès (none)
```

**Règle :** Une licence supérieure a automatiquement accès à tous les contenus des licences inférieures.

---

## ✅ Vérification des Accès

### Dans le Code
- **Frontend** : `useEntitlements()` filtre les modules selon `required_license`
- **Backend (RLS)** : Les policies vérifient `user_has_license_for_module()`
- **Edge Functions** : `generate-bunny-token` vérifie la licence avant de générer un token vidéo

### Fonction de Vérification
```typescript
hasLicenseAccess(userLicense, requiredLicense)
// Retourne true si userLicense >= requiredLicense
// Exemple: hasLicenseAccess('pro', 'starter') → true
//          hasLicenseAccess('starter', 'pro') → false
```

---

## 📝 Notes Importantes

1. **Les profiles utilisent** : `entree`, `transformation`, `immersion`
2. **Les modules utilisent** : `starter`, `pro`, `elite` dans `required_license`
3. **Le mapping est automatique** : `entree` → `starter`, `transformation` → `pro`, `immersion` → `elite`
4. **Les admins ont accès à tout** : Traités comme `elite` pour les vérifications

---

## 🔍 Pour Vérifier les Accès d'un Utilisateur

```sql
-- Vérifier la licence d'un utilisateur
SELECT id, email, license 
FROM public.profiles 
WHERE email = 'user@example.com';

-- Vérifier les modules accessibles
SELECT 
  tm.title,
  tm.required_license,
  CASE 
    WHEN public.user_has_license_for_module('USER_ID', tm.required_license) 
    THEN '✅ Accessible'
    ELSE '❌ Non accessible'
  END as access_status
FROM public.training_modules tm
WHERE tm.is_active = true
ORDER BY tm.position;
```

---

## 🎯 Résumé Rapide

| Licence | Modules | Features Principales |
|---------|---------|---------------------|
| **Starter** | Tutoriels uniquement | Lives + Discord + Alertes |
| **Premium** | Starter + Formation complète | + Replays + Coaching + Zone Premium |
| **Bootcamp Élite** | Tout | + Immersion présentielle + Certificat + VIP |

