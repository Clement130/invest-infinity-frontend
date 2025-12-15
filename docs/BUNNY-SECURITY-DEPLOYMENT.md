# 🛡️ Guide de Déploiement - Protections de Sécurité Bunny Stream

Ce guide explique comment déployer et configurer les protections de sécurité complètes pour vos vidéos Bunny Stream.

## 📋 Vue d'ensemble des protections

| Protection | Statut | Description |
|------------|--------|-------------|
| 🔐 **Authentification par token d'embed** | ✅ **Implémentée** | URLs signées avec expiration |
| 🌐 **Restriction de domaines** | 🔧 **Configuration manuelle requise** | Domaines autorisés uniquement |
| 🎥 **MediaCage DRM** | 🔧 **Configuration manuelle requise** | Anti-téléchargement |
| 🔗 **Authentification CDN** | 🔧 **Configuration manuelle requise** | Protection des URLs directes |

## 🚀 Déploiement automatique

### 1. Configuration des secrets Supabase

```bash
# Exécutez le script de configuration des secrets
./scripts/configure-secrets-final.ps1
```

**Variables requises :**
- `BUNNY_EMBED_TOKEN_KEY` : Clé pour signer les embeds (générée dans Bunny.net)
- `BUNNY_STREAM_LIBRARY_ID` : ID de votre bibliothèque
- `BUNNY_STREAM_API_KEY` : Clé API pour l'upload

### 2. Déploiement des fonctions Edge

```bash
# Les nouvelles fonctions sont automatiquement déployées avec Supabase
supabase functions deploy generate-bunny-token
```

## 🛠️ Configuration manuelle dans Bunny.net

### Étape 1: Activer l'authentification par token d'embed

1. Connectez-vous à [https://dash.bunny.net](https://dash.bunny.net)
2. Allez dans **Stream** > **Votre Bibliothèque** > **Security**
3. ✅ Cochez **"Enable embed view token authentication"**
4. 🔑 Utilisez la clé `BUNNY_EMBED_TOKEN_KEY` définie dans Supabase

### Étape 2: Configurer les domaines autorisés

Dans la même page Security :
- ✅ Activez **"Allowed Domains"**
- Ajoutez vos domaines :
  - `investinfinity.com`
  - `*.vercel.app`
  - `localhost:5173` (pour le développement)

### Étape 3: Activer MediaCage DRM (Recommandé)

Dans la même page Security :
- ✅ Cochez **"Enable MediaCage DRM"**
- Cela empêche les téléchargements et enregistrements d'écran

### Étape 4: Authentification CDN (Optionnel mais recommandé)

1. Allez dans **CDN** > **Votre Pull Zone** > **Security**
2. ✅ Activez **"Token Authentication"**
3. 🔑 Utilisez une clé différente de l'embed token

## 🧪 Test des protections

### Test automatique

```bash
# Exécutez le script de test
node scripts/test-bunny-security.js
```

### Tests manuels

1. **Test URL sans token** (devrait être bloquée) :
   ```
   https://iframe.mediadelivery.net/embed/VOTRE_LIBRARY_ID/VIDEO_ID
   ```

2. **Test embedding externe** :
   - Essayez d'intégrer une vidéo sur un site tiers
   - Devrait être bloqué si les domaines sont configurés

3. **Test téléchargement** :
   - Essayez de télécharger la vidéo (clic droit > Enregistrer)
   - Devrait être bloqué avec MediaCage DRM

## 🔧 Architecture technique

### Flux de sécurisation des vidéos

```mermaid
graph TD
    A[Utilisateur demande une vidéo] --> B[BunnyPlayer.tsx]
    B --> C[getSecureEmbedUrl()]
    C --> D[Edge Function: generate-bunny-token]
    D --> E[Génération token SHA256]
    E --> F[URL signée avec expiration]
    F --> G[Retour au player]
    G --> H[Embed sécurisé dans iframe]
```

### Algorithme de génération de token

```javascript
// Formule Bunny Stream officielle
const tokenString = tokenSecurityKey + videoId + expirationTimestamp;
const token = SHA256_HEX(tokenString);

// URL finale
const secureUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expirationTimestamp}`;
```

## 📊 Monitoring et logs

### Logs Supabase

```bash
# Voir les logs des fonctions Edge
supabase functions logs generate-bunny-token
```

### Métriques Bunny.net

- **Dashboard** > **Stream** > **Analytics** : Visionnages et erreurs
- **Dashboard** > **CDN** > **Statistics** : Requêtes et cache hits

## 🛠️ Dépannage

### Problème: "Bunny Stream embed token key not configured"

**Solution:**
```bash
# Vérifiez que la variable est définie
echo $BUNNY_EMBED_TOKEN_KEY

# Reconfigurez les secrets
./scripts/configure-secrets-final.ps1
```

### Problème: "Invalid or expired token"

**Solution:**
- Vérifiez que l'heure du serveur est synchronisée
- Vérifiez que `BUNNY_EMBED_TOKEN_KEY` correspond à celle dans Bunny.net
- Testez avec le script de test

### Problème: Vidéo accessible depuis des domaines externes

**Solution:**
- Vérifiez que "Allowed Domains" est activé dans Bunny.net
- Ajoutez tous vos domaines à la liste blanche

## 🔒 Niveaux de sécurité

| Niveau | Protections activées |
|--------|---------------------|
| **Basique** | ✅ Token d'embed |
| **Standard** | ✅ Token d'embed + Domaines autorisés |
| **Élevé** | ✅ Token d'embed + Domaines + MediaCage DRM |
| **Maximum** | ✅ Tout + Authentification CDN |

## 📚 Ressources

- [Documentation Bunny Stream Security](https://docs.bunny.net/docs/stream-security)
- [Guide des tokens d'embed](https://docs.bunny.net/docs/stream-embed-token-authentication)
- [Support Bunny.net](https://support.bunny.net/hc/en-us)
- [API Reference](https://docs.bunny.net/reference/bunnynet-api-overview)

## 🎯 Checklist de déploiement

- [ ] Secrets Supabase configurés
- [ ] Fonction `generate-bunny-token` déployée
- [ ] BunnyPlayer mis à jour
- [ ] Authentification par token activée dans Bunny.net
- [ ] Domaines autorisés configurés
- [ ] MediaCage DRM activé (optionnel)
- [ ] Tests de sécurité passés
- [ ] Monitoring configuré

---

**✨ Résultat final :** Vos vidéos sont maintenant protégées contre le vol de contenu, les accès non autorisés et les téléchargements illégaux !
