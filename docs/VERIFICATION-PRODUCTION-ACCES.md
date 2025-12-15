# Vérification des Accès Clients en Production

**Date :** 2025-01-XX  
**Objectif :** Vérifier qu'aucun client n'a des accès qu'il ne devrait pas avoir

---

## 🔍 Script de Vérification

Un script a été créé pour vérifier automatiquement les accès en production :

```bash
node scripts/verify-production-client-access.js
```

### Prérequis

1. **Variables d'environnement** dans `.env.local` :
   ```env
   VITE_SUPABASE_URL=https://vveswlmcgmizmjsriezw.supabase.co
   VITE_SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
   ```

2. **Clé Service Role** :
   - Récupérable depuis Supabase Dashboard > Settings > API
   - ⚠️ **NE JAMAIS** commiter cette clé dans Git
   - Utilisée uniquement pour les vérifications backend

---

## 📋 Ce que le Script Vérifie

### 1. Licences Invalides
- Vérifie que tous les clients ont des licences valides (`entree`, `transformation`, `immersion`, ou `none`)
- Détecte les licences invalides (`starter`, `pro`, `elite` dans profiles)

### 2. Accès Incorrects
- Vérifie que chaque client n'a accès qu'aux modules correspondant à sa licence
- Détecte les clients Starter qui ont accès à des modules Pro/Elite
- Détecte les clients Premium qui ont accès à des modules Elite

### 3. Accès Manquants
- Vérifie que les clients ont bien les accès qu'ils devraient avoir
- Détecte les clients avec licence mais sans accès dans `training_access`
- (Note : Normal si les RLS policies gèrent l'accès directement)

---

## 🔧 Utilisation

### Exécution Locale

```bash
# S'assurer que .env.local contient les bonnes variables
cat .env.local | grep SUPABASE

# Exécuter le script
node scripts/verify-production-client-access.js
```

### Résultat Attendu

```
🔍 VÉRIFICATION DES ACCÈS CLIENTS EN PRODUCTION
================================================================================
📡 Connexion à : https://vveswlmcgmizmjsriezw.supabase.co

📊 Étape 1 : Récupération des clients...
✅ 15 client(s) trouvé(s)

🔍 Étape 2 : Vérification des licences...
✅ Toutes les licences sont valides

📚 Étape 3 : Récupération des modules...
✅ 5 module(s) actif(s) trouvé(s)

🔐 Étape 4 : Vérification des accès aux modules...
📋 42 accès trouvé(s)
✅ Tous les accès sont corrects

📊 RÉSUMÉ DE LA VÉRIFICATION
================================================================================
   Total de clients : 15
   Clients avec licence valide : 15
   Clients avec licence invalide : 0
   Modules actifs : 5

✅ Vérification terminée
```

---

## ⚠️ Problèmes Détectés

### Problème 1 : Licences Invalides

Si le script détecte des licences invalides :

```
❌ PROBLÈME : 2 client(s) avec des licences invalides

   👤 client1@example.com
      Licence actuelle : "starter" (INVALIDE)
      Licences valides : none, entree, transformation, immersion
```

**Solution :**
1. Identifier pourquoi ces licences ont été assignées (webhook Stripe ?)
2. Corriger manuellement via Supabase Dashboard :
   ```sql
   UPDATE profiles 
   SET license = 'entree' 
   WHERE email = 'client1@example.com' AND license = 'starter';
   ```

### Problème 2 : Accès Incorrects

Si le script détecte des accès incorrects :

```
❌ PROBLÈME : 3 accès incorrect(s) détecté(s)

   👤 client2@example.com
      Licence : Starter (147€)
      Module : Etape 1 - La Fondation
      Licence requise : pro
      Accès accordé le : 2025-01-15T10:30:00Z
      ❌ Ce client ne devrait PAS avoir accès à ce module
```

**Solution :**
1. Supprimer les accès incorrects :
   ```sql
   DELETE FROM training_access ta
   USING profiles p, training_modules tm
   WHERE ta.user_id = p.id
     AND ta.module_id = tm.id
     AND p.email = 'client2@example.com'
     AND tm.title = 'Etape 1 - La Fondation';
   ```

2. Vérifier pourquoi ces accès ont été créés (bug dans le webhook ?)

### Problème 3 : Accès Manquants

Si le script détecte des accès manquants :

```
⚠️  5 accès manquant(s) détecté(s)

   👤 client3@example.com (Premium (497€))
      Module manquant : Etape 1 - La Fondation
```

**Note :** Cela peut être normal si les RLS policies gèrent l'accès directement sans utiliser `training_access`.

**Solution (si nécessaire) :**
1. Créer les accès manquants via le webhook Stripe (ré-exécuter le webhook)
2. Ou créer manuellement :
   ```sql
   INSERT INTO training_access (user_id, module_id, access_type, granted_at)
   SELECT 
     p.id,
     tm.id,
     'full',
     NOW()
   FROM profiles p
   CROSS JOIN training_modules tm
   WHERE p.email = 'client3@example.com'
     AND tm.title = 'Etape 1 - La Fondation'
     AND NOT EXISTS (
       SELECT 1 FROM training_access ta
       WHERE ta.user_id = p.id AND ta.module_id = tm.id
     );
   ```

---

## 🔄 Vérification Régulière

### Automatisation (Recommandé)

Créer un cron job ou un workflow GitHub Actions pour exécuter ce script régulièrement :

```yaml
# .github/workflows/verify-access.yml
name: Verify Client Access
on:
  schedule:
    - cron: '0 2 * * *' # Tous les jours à 2h du matin
  workflow_dispatch: # Exécution manuelle

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: node scripts/verify-production-client-access.js
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

## 📊 Rapports

Le script génère un rapport détaillé qui peut être :
- Envoyé par email (si intégré)
- Sauvegardé dans un fichier
- Envoyé à un canal Slack/Discord

---

## ✅ Checklist de Vérification

- [ ] Exécuter le script de vérification
- [ ] Vérifier qu'aucune licence invalide n'est détectée
- [ ] Vérifier qu'aucun accès incorrect n'est détecté
- [ ] Corriger les problèmes détectés
- [ ] Documenter les corrections dans ce fichier
- [ ] Planifier une vérification régulière

---

## 🔐 Sécurité

⚠️ **IMPORTANT :**
- Ne jamais commiter `VITE_SUPABASE_SERVICE_ROLE_KEY` dans Git
- Utiliser uniquement pour les vérifications backend
- Ne jamais exposer cette clé côté frontend
- Limiter l'accès au script aux administrateurs uniquement

