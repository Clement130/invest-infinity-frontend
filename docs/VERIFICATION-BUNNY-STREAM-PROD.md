# ✅ Vérification Bunny Stream en Production

## 🎯 Statut du Déploiement

**Date:** 09/12/2025  
**Fonction Edge:** `generate-bunny-token`  
**Version déployée:** Version 17 (avec formule corrigée)

### ✅ Corrections Appliquées

1. **Formule de token corrigée** ✅
   - Ancienne: `token_key + videoId + expires`
   - Nouvelle: `token_key + /{libraryId}/{videoId} + expires`
   - Le path est maintenant inclus dans le calcul du hash

2. **Déploiement réussi** ✅
   - Fonction déployée via CLI Supabase
   - Code en production contient la correction

### 📋 Informations de la Leçon Problématique

- **Leçon ID:** `39b0f250-88b4-4a5d-94c5-8dbac60994b2`
- **Titre:** "Comment prendre un Trade sur MetaTrader ?"
- **Video ID (Bunny):** `8254f866-0ab0-498c-b1fe-5ef2b66a2ab8`
- **Module ID:** `3dafab41-dc43-429a-bdd7-6bee2c432d0e`
- **Module:** "MetaTrader & TopStepX & Apex"
- **is_preview:** `false`
- **Utilisateurs avec accès:** 9

---

## 🔍 Diagnostic de l'Erreur 403

L'erreur 403 peut provenir de **deux sources** :

### 1. Fonction Edge (Notre Code) - 403 "Vous n'avez pas accès à ce contenu"

**Causes possibles :**
- ❌ L'utilisateur n'a pas de `training_access` pour le module
- ❌ L'utilisateur n'est pas admin/developer
- ❌ La leçon n'est pas en preview

**Vérification :**
```sql
-- Vérifier si un utilisateur a accès au module
SELECT * FROM training_access 
WHERE module_id = '3dafab41-dc43-429a-bdd7-6bee2c432d0e'
  AND user_id = 'USER_ID_HERE';
```

### 2. Bunny Stream (CDN) - 403 "Access denied"

**Causes possibles :**
- ❌ Token invalide (formule incorrecte)
- ❌ Token expiré
- ❌ Clé de sécurité non synchronisée entre Supabase et Bunny.net
- ❌ Domaine non autorisé dans Bunny.net

**Vérification :**
1. Vérifier que `BUNNY_EMBED_TOKEN_KEY` dans Supabase = Clé dans Bunny.net Dashboard
2. Vérifier que les domaines autorisés incluent `investinfinity.fr` et `www.investinfinity.fr`
3. Vérifier que Token Authentication est activé dans Bunny.net

---

## ✅ Checklist de Vérification

### Côté Supabase
- [x] Fonction Edge déployée avec formule corrigée
- [ ] Secret `BUNNY_EMBED_TOKEN_KEY` configuré et valide
- [ ] Secret `BUNNY_STREAM_LIBRARY_ID` configuré (542258)
- [ ] Secret `BUNNY_STREAM_API_KEY` configuré

### Côté Bunny.net
- [ ] Token Authentication activé
- [ ] Clé de sécurité = `cdaab1ec-9e16-46d8-9765-28f6a26fbb48`
- [ ] Domaines autorisés configurés :
  - [ ] `investinfinity.fr`
  - [ ] `www.investinfinity.fr`
  - [ ] `investinfinity.com`
  - [ ] `*.vercel.app`
  - [ ] `localhost:5173` (dev)

### Côté Utilisateur
- [ ] L'utilisateur est connecté
- [ ] L'utilisateur a un `training_access` pour le module `3dafab41-dc43-429a-bdd7-6bee2c432d0e`
- [ ] OU l'utilisateur est admin/developer
- [ ] OU la leçon est en preview

---

## 🧪 Tests à Effectuer

### Test 1: Vérifier les Secrets Supabase

```bash
# Via Dashboard Supabase
https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions

# Vérifier que ces secrets existent :
# - BUNNY_EMBED_TOKEN_KEY = cdaab1ec-9e16-46d8-9765-28f6a26fbb48
# - BUNNY_STREAM_LIBRARY_ID = 542258
# - BUNNY_STREAM_API_KEY = (votre clé API)
```

### Test 2: Vérifier la Configuration Bunny.net

1. Aller sur : https://bunny.net/dashboard/stream
2. Sélectionner la bibliothèque (ID: 542258)
3. Aller dans "Security" ou "Settings"
4. Vérifier :
   - ✅ Embed View Token Authentication : **ACTIVÉ**
   - ✅ Security Key : `cdaab1ec-9e16-46d8-9765-28f6a26fbb48`
   - ✅ Allowed Domains : Liste complète configurée

### Test 3: Tester la Génération de Token

1. Se connecter sur https://investinfinity.fr
2. Ouvrir la console du navigateur (F12)
3. Aller sur la leçon problématique
4. Vérifier les erreurs dans la console
5. Vérifier les appels réseau vers `/functions/v1/generate-bunny-token`

**Erreurs possibles :**
- `401` : Utilisateur non authentifié
- `403` : Pas de droits d'accès OU token invalide
- `404` : Vidéo non trouvée dans `training_lessons`
- `500` : Erreur serveur (secrets manquants, etc.)

### Test 4: Vérifier les Logs Supabase

```bash
# Via Dashboard
https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/logs/edge-functions

# Filtrer par fonction: generate-bunny-token
# Vérifier les erreurs récentes
```

---

## 🔧 Actions Correctives

### Si l'erreur vient de la fonction Edge (403 "Vous n'avez pas accès")

1. **Vérifier les droits d'accès :**
   ```sql
   -- Donner accès à un utilisateur
   INSERT INTO training_access (user_id, module_id)
   VALUES ('USER_ID', '3dafab41-dc43-429a-bdd7-6bee2c432d0e')
   ON CONFLICT DO NOTHING;
   ```

2. **OU rendre la leçon en preview :**
   ```sql
   UPDATE training_lessons
   SET is_preview = true
   WHERE id = '39b0f250-88b4-4a5d-94c5-8dbac60994b2';
   ```

### Si l'erreur vient de Bunny Stream (403 "Access denied")

1. **Vérifier la synchronisation des clés :**
   - Supabase Secret `BUNNY_EMBED_TOKEN_KEY` = Clé dans Bunny.net
   - Doivent être **identiques**

2. **Vérifier les domaines autorisés :**
   - Ajouter `investinfinity.fr` et `www.investinfinity.fr` si manquants

3. **Vérifier que Token Authentication est activé :**
   - Dans Bunny.net Dashboard > Stream > Security

---

## 📝 Prochaines Étapes

1. ✅ **Déploiement effectué** - Fonction corrigée en production
2. ⏳ **Vérification Bunny.net** - S'assurer que la configuration est synchronisée
3. ⏳ **Test utilisateur** - Tester avec un compte ayant les droits d'accès
4. ⏳ **Vérification logs** - Surveiller les erreurs dans les logs Supabase

---

## 🎯 Résultat Attendu

Après correction, la vidéo devrait :
- ✅ Se charger sans erreur 403
- ✅ Afficher le lecteur Bunny Stream
- ✅ Permettre la lecture de la vidéo

Si l'erreur persiste, vérifier :
1. Les logs Supabase pour voir le message d'erreur exact
2. La console du navigateur pour les erreurs JavaScript
3. Les droits d'accès de l'utilisateur dans la base de données

