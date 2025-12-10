# 🔧 Correction du Problème de Lecture Bunny Stream

## 🐛 Problème Identifié

L'erreur "Access denied to this content" était causée par une **formule de token incorrecte** dans la fonction Edge `generate-bunny-token`.

### ❌ Ancienne Formule (Incorrecte)
```typescript
const tokenString = bunnyEmbedTokenKey + videoId + expires;
```

### ✅ Nouvelle Formule (Corrigée)
```typescript
const path = `/${bunnyLibraryId}/${videoId}`;
const tokenString = bunnyEmbedTokenKey + path + expires;
```

**Explication :** Bunny Stream exige que le token soit calculé avec le **chemin complet** (`/{libraryId}/{videoId}`) et non seulement l'ID de la vidéo.

---

## ✅ Corrections Appliquées

### 1. Fonction Edge `generate-bunny-token`
- ✅ Formule de token corrigée pour inclure le path
- ✅ URL d'embed construite correctement
- ✅ Vérification des droits d'accès maintenue

**Fichier modifié :**
```176:191:supabase/functions/generate-bunny-token/index.ts
// Calculer l'expiration (timestamp UNIX)
const expires = Math.floor(Date.now() / 1000) + (expiryHours * 3600);

// Générer le token selon la formule Bunny Stream :
// SHA256_HEX(token_security_key + path + expiration)
// où path = /{libraryId}/{videoId}
const path = `/${bunnyLibraryId}/${videoId}`;
const tokenString = bunnyEmbedTokenKey + path + expires;
const token = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tokenString));
const tokenHex = Array.from(new Uint8Array(token))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

// Construire l'URL sécurisée avec library ID
const secureEmbedUrl = `${BUNNY_EMBED_BASE_URL}${path}?token=${tokenHex}&expires=${expires}`;
```

### 2. Scripts de Test Mis à Jour
- ✅ `scripts/test-bunny-security.js` : Utilise maintenant la nouvelle formule
- ✅ `scripts/verify-bunny-stream-config.js` : Nouveau script de vérification complète

---

## 🚀 Déploiement

### Étape 1 : Redéployer la Fonction Edge

```bash
# Via Supabase CLI
supabase functions deploy generate-bunny-token

# OU via le Dashboard Supabase
# 1. Allez sur: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions
# 2. Sélectionnez "generate-bunny-token"
# 3. Copiez le code mis à jour depuis supabase/functions/generate-bunny-token/index.ts
# 4. Sauvegardez
```

### Étape 2 : Vérifier les Secrets Supabase

Assurez-vous que les secrets suivants sont configurés dans Supabase :

```bash
# Vérifier les secrets
supabase secrets list

# Si nécessaire, configurer les secrets
supabase secrets set BUNNY_EMBED_TOKEN_KEY=cdaab1ec-9e16-46d8-9765-28f6a26fbb48
supabase secrets set BUNNY_STREAM_LIBRARY_ID=542258
supabase secrets set BUNNY_STREAM_API_KEY=votre_api_key
```

**Dashboard Supabase :**
- Allez sur : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions
- Vérifiez que les secrets sont présents

### Étape 3 : Vérifier la Configuration Bunny.net

**⚠️ IMPORTANT :** Vérifiez que la configuration Bunny.net est synchronisée :

1. **Token Authentication** : ✅ ACTIVÉ
   - Clé de sécurité : `cdaab1ec-9e16-46d8-9765-28f6a26fbb48`
   - Doit être **identique** à `BUNNY_EMBED_TOKEN_KEY` dans Supabase

2. **Allowed Domains** : ✅ CONFIGURÉ
   - `investinfinity.fr`
   - `www.investinfinity.fr`
   - `investinfinity.com`
   - `*.vercel.app`
   - `localhost:5173` (dev)

3. **MediaCage DRM** : ✅ ACTIVÉ (optionnel mais recommandé)

**Dashboard Bunny.net :**
- Allez sur : https://bunny.net/dashboard/stream
- Vérifiez les paramètres de sécurité

---

## 🧪 Tests de Validation

### Test 1 : Vérifier la Configuration Locale

```bash
# Exécuter le script de vérification
node scripts/verify-bunny-stream-config.js
```

### Test 2 : Tester la Génération de Token

```bash
# Tester la sécurité
node scripts/test-bunny-security.js
```

### Test 3 : Tester en Production

1. Connectez-vous à l'application
2. Accédez à une leçon avec vidéo
3. Vérifiez que la vidéo se charge sans erreur "Access denied"

### Test 4 : Vérifier les Logs Supabase

```bash
# Voir les logs de la fonction Edge
supabase functions logs generate-bunny-token
```

---

## 📋 Checklist de Vérification

### Côté Code ✅
- [x] Formule de token corrigée (avec path)
- [x] URL d'embed construite correctement
- [x] Scripts de test mis à jour

### Côté Supabase 🔧
- [ ] Fonction Edge `generate-bunny-token` redéployée
- [ ] Secret `BUNNY_EMBED_TOKEN_KEY` configuré
- [ ] Secret `BUNNY_STREAM_LIBRARY_ID` configuré
- [ ] Secret `BUNNY_STREAM_API_KEY` configuré

### Côté Bunny.net 🔧
- [ ] Token Authentication activé
- [ ] Clé de sécurité synchronisée avec Supabase
- [ ] Domaines autorisés configurés
- [ ] MediaCage DRM activé (optionnel)

### Tests ✅
- [ ] Script de vérification exécuté sans erreur
- [ ] Vidéo testée en production
- [ ] Aucune erreur "Access denied" observée

---

## 🔍 Diagnostic en Cas de Problème

### Erreur "Access denied" Persiste

1. **Vérifier les logs Supabase :**
   ```bash
   supabase functions logs generate-bunny-token --tail
   ```

2. **Vérifier la clé de sécurité :**
   - Dans Supabase : `BUNNY_EMBED_TOKEN_KEY`
   - Dans Bunny.net : Dashboard > Stream > Security > Embed View Token
   - Doivent être **identiques**

3. **Vérifier le format de l'URL :**
   - Doit être : `https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}?token=...&expires=...`
   - Le path doit inclure le library ID

4. **Tester manuellement la génération :**
   ```javascript
   // Dans la console du navigateur (sur une page avec vidéo)
   const response = await fetch('/functions/v1/generate-bunny-token', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${supabaseToken}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       videoId: '25190d8d-6d1f-44f0-888c-c6cdaf494c34',
       expiryHours: 4
     })
   });
   const data = await response.json();
   console.log(data);
   ```

### Erreur "Video not found or access denied"

- Vérifier que la vidéo existe dans `training_lessons` avec le bon `bunny_video_id`
- Vérifier que l'utilisateur a les droits d'accès (preview, admin, ou training_access)

---

## 📚 Ressources

- [Documentation Bunny Stream Security](https://docs.bunny.net/docs/stream-security)
- [Documentation Embed Token Authentication](https://docs.bunny.net/docs/stream-embed-token-authentication)
- [Dashboard Bunny.net](https://bunny.net/dashboard/stream)
- [Dashboard Supabase Functions](https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions)

---

## ✨ Résumé

**Problème :** Formule de token incorrecte (sans le path)
**Solution :** Inclusion du path `/{libraryId}/{videoId}` dans le calcul du hash
**Statut :** ✅ Code corrigé, déploiement requis

**Prochaines étapes :**
1. Redéployer la fonction Edge `generate-bunny-token`
2. Vérifier les secrets Supabase
3. Vérifier la configuration Bunny.net
4. Tester en production

