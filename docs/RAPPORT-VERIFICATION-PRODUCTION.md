# Rapport de Vérification des Accès en Production

**Date :** 2025-01-XX  
**Méthode :** Script SQL à exécuter dans Supabase Dashboard

---

## 📋 Instructions

### Étape 1 : Accéder à Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet : `vveswlmcgmizmjsriezw`
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**

### Étape 2 : Exécuter le Script

1. Ouvrez le fichier `scripts/verify-access-production.sql`
2. Copiez-collez le contenu dans l'éditeur SQL
3. Cliquez sur **Run** (ou `Ctrl+Enter`)

### Étape 3 : Analyser les Résultats

Le script génère 6 rapports :

1. **Statistiques des clients par licence** : Vue d'ensemble
2. **Clients avec licences invalides** : Problèmes à corriger
3. **Vérification des accès aux modules** : Accès incorrects
4. **Récapitulatif des accès par client** : Détail par client
5. **Clients sans accès** : Clients avec licence mais sans accès
6. **Modules par niveau de licence** : Vue des modules disponibles

---

## 🔍 Ce que Vérifier

### ✅ Résultats Normaux

1. **Statistiques** : Tous les clients ont des licences valides (`entree`, `transformation`, `immersion`, ou `none`)
2. **Licences invalides** : Aucun résultat (0 lignes)
3. **Accès incorrects** : Aucun résultat (0 lignes)
4. **Clients sans accès** : Peut être normal si les RLS policies gèrent l'accès directement

### ❌ Problèmes à Corriger

#### Problème 1 : Licences Invalides

Si la requête #2 retourne des résultats :

```sql
-- Exemple de résultat
email: client@example.com
license: starter  ❌ INVALIDE
```

**Solution :**
```sql
-- Corriger la licence
UPDATE public.profiles 
SET license = 'entree' 
WHERE email = 'client@example.com' 
  AND license = 'starter';
```

#### Problème 2 : Accès Incorrects

Si la requête #3 retourne des résultats :

```sql
-- Exemple de résultat
email: client@example.com
user_profile_license: entree (Starter)
module_title: Etape 1 - La Fondation
module_required_license: pro
status: ❌ ACCÈS INCORRECT
```

**Solution :**
```sql
-- Supprimer l'accès incorrect
DELETE FROM public.training_access ta
USING public.profiles p, public.training_modules tm
WHERE ta.user_id = p.id
  AND ta.module_id = tm.id
  AND p.email = 'client@example.com'
  AND tm.title = 'Etape 1 - La Fondation';
```

---

## 📊 Exemple de Résultats

### Statistiques Normales

```
license          | client_count | license_label
-----------------|--------------|------------------
none             | 5            | Aucune licence
entree           | 10           | Starter (147€)
transformation   | 8            | Premium (497€)
immersion        | 2            | Bootcamp Élite (1997€)
```

### Problème Détecté

```
email                    | user_profile_license | module_title              | status
-------------------------|---------------------|---------------------------|------------------
client@example.com       | entree              | Etape 1 - La Fondation    | ❌ ACCÈS INCORRECT
```

---

## 🔧 Actions Correctives

### Si des Problèmes sont Détectés

1. **Documenter** : Noter les problèmes dans ce fichier
2. **Corriger** : Utiliser les requêtes SQL de correction ci-dessus
3. **Vérifier** : Ré-exécuter le script pour confirmer les corrections
4. **Investiger** : Comprendre pourquoi le problème est survenu (bug webhook ?)

---

## 📝 Notes

- Les RLS policies peuvent gérer l'accès directement sans utiliser `training_access`
- Si un client a une licence mais pas d'entrée dans `training_access`, cela peut être normal
- Les accès incorrects doivent toujours être corrigés immédiatement

---

## ✅ Checklist

- [ ] Exécuter le script SQL dans Supabase Dashboard
- [ ] Vérifier qu'aucune licence invalide n'est détectée
- [ ] Vérifier qu'aucun accès incorrect n'est détecté
- [ ] Corriger les problèmes détectés
- [ ] Documenter les corrections
- [ ] Planifier une vérification régulière

