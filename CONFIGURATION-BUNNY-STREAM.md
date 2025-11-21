# 🔧 Configuration Bunny Stream

## 📋 Variables à Configurer

Pour activer la gestion vidéo complète, vous devez configurer ces variables :

- `VITE_BUNNY_STREAM_LIBRARY_ID` - ID de votre bibliothèque Bunny Stream
- `VITE_BUNNY_STREAM_API_KEY` - Clé API Bunny Stream

---

## 🏠 Développement Local

### 1. Créer le fichier `.env.local`

À la racine du projet, créez un fichier `.env.local` :

```env
# Variables Supabase
VITE_SUPABASE_URL=https://vveswlmcgmizmjsriezw.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase

# Variables Bunny Stream
VITE_BUNNY_STREAM_LIBRARY_ID=votre_library_id
VITE_BUNNY_STREAM_API_KEY=votre_api_key_bunny_stream
VITE_BUNNY_EMBED_BASE_URL=https://iframe.mediadelivery.net/embed/votre_library_id
```

### 2. Redémarrer le serveur de développement

Après avoir créé/modifié `.env.local`, redémarrez le serveur :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

---

## 🌐 Production (Vercel)

### 1. Accéder aux paramètres Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet `invest-infinity-frontend`
3. Allez dans **Settings** > **Environment Variables**

### 2. Ajouter les variables

Cliquez sur **Add New** et ajoutez chaque variable :

#### Variable 1 : `VITE_BUNNY_STREAM_LIBRARY_ID`
- **Value** : Votre Library ID (ex: `542258`)
- **Environments** : ✅ Production, ✅ Preview, ✅ Development

#### Variable 2 : `VITE_BUNNY_STREAM_API_KEY`
- **Value** : Votre API Key (ex: `abc123-def456-...`)
- **Environments** : ✅ Production, ✅ Preview, ✅ Development

#### Variable 3 : `VITE_BUNNY_EMBED_BASE_URL` (optionnel mais recommandé)
- **Value** : `https://iframe.mediadelivery.net/embed/{VOTRE_LIBRARY_ID}`
- **Environments** : ✅ Production, ✅ Preview, ✅ Development

### 3. Redéployer

Après avoir ajouté les variables, Vercel redéploiera automatiquement. Sinon, allez dans **Deployments** et cliquez sur **Redeploy**.

---

## 🔑 Où Trouver les Valeurs

### VITE_BUNNY_STREAM_LIBRARY_ID

1. Connectez-vous à [bunny.net](https://bunny.net)
2. Allez dans **Stream** > **Libraries**
3. Sélectionnez votre bibliothèque
4. L'ID se trouve :
   - Dans l'URL : `https://bunny.net/stream/library/{ID}`
   - Dans les paramètres de la bibliothèque
   - Format : Un nombre (ex: `542258`)

### VITE_BUNNY_STREAM_API_KEY

1. Dans [bunny.net](https://bunny.net), allez dans **Account** > **API Keys**
2. Cliquez sur **Add API Key** ou utilisez une existante
3. **Important** : La clé n'est affichée qu'une seule fois lors de la création
4. Format : Une chaîne alphanumérique avec tirets (ex: `abc123-def456-ghi789-...`)

### VITE_BUNNY_EMBED_BASE_URL

Format : `https://iframe.mediadelivery.net/embed/{VOTRE_LIBRARY_ID}`

Exemple si votre Library ID est `542258` :
```
https://iframe.mediadelivery.net/embed/542258
```

---

## ✅ Vérification

### En développement local

1. Ouvrez la console du navigateur (F12)
2. Tapez :
```javascript
console.log('Library ID:', import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID);
console.log('API Key:', import.meta.env.VITE_BUNNY_STREAM_API_KEY ? '✅ Configuré' : '❌ Manquant');
```

### En production

1. Allez sur votre site Vercel
2. Ouvrez la console (F12)
3. Vérifiez que les variables sont présentes (elles ne seront pas affichées pour des raisons de sécurité, mais l'interface devrait fonctionner)

### Dans l'interface

- ✅ Si les variables sont configurées : L'avertissement disparaît et la bibliothèque se charge
- ⚠️ Si les variables manquent : Un message d'avertissement s'affiche en haut de la page

---

## 🚨 Sécurité

### ⚠️ Important

- **Ne jamais** commiter `.env.local` dans Git (déjà dans `.gitignore`)
- **Ne jamais** partager vos clés API publiquement
- Les variables `VITE_*` sont exposées côté client (c'est normal pour Vite)
- Utilisez des clés API avec des permissions limitées si possible

---

## 🐛 Dépannage

### "Variables d'environnement manquantes" s'affiche toujours

1. Vérifiez que le fichier s'appelle bien `.env.local` (pas `.env` ou `.env.local.txt`)
2. Redémarrez le serveur de développement
3. Vérifiez qu'il n'y a pas d'espaces dans les noms de variables
4. Vérifiez que les valeurs ne sont pas entre guillemets (sauf si nécessaire)

### La bibliothèque ne charge pas les vidéos

1. Vérifiez que les clés API sont correctes
2. Vérifiez que la Library ID correspond à votre bibliothèque
3. Vérifiez les permissions de votre clé API dans Bunny.net
4. Consultez la console du navigateur pour les erreurs

### Erreur 401 (Unauthorized)

- Votre API Key est incorrecte ou expirée
- Régénérez une nouvelle clé API dans Bunny.net

### Erreur 404 (Not Found)

- Votre Library ID est incorrect
- Vérifiez l'ID dans l'URL de votre bibliothèque Bunny Stream

---

## 📞 Support

Si vous avez des problèmes :
1. Vérifiez la [documentation Bunny Stream](https://docs.bunny.net/docs/stream)
2. Vérifiez les logs dans la console du navigateur
3. Vérifiez les logs de build dans Vercel

