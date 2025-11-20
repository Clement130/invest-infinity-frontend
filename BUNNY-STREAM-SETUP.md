# Guide de Configuration Bunny Stream

## 📋 Prérequis

- Un compte Bunny Stream actif
- L'ID de votre bibliothèque (Library ID) Bunny Stream

## 🔧 Configuration

### Étape 1 : Obtenir votre Library ID

1. Connectez-vous à votre [tableau de bord Bunny Stream](https://bunny.net/stream/)
2. Accédez à la section **Libraries**
3. Sélectionnez votre bibliothèque ou créez-en une nouvelle
4. Copiez l'**Library ID** (exemple : `123456`)

### Étape 2 : Configurer la variable d'environnement

1. Ouvrez le fichier `.env.local` à la racine du projet
2. Remplacez `[LIBRARY_ID]` par votre Library ID réel :

```env
VITE_BUNNY_EMBED_BASE_URL=https://iframe.mediadelivery.net/embed/123456
```

**Exemple concret :**
Si votre Library ID est `987654`, la ligne doit être :
```env
VITE_BUNNY_EMBED_BASE_URL=https://iframe.mediadelivery.net/embed/987654
```

### Étape 3 : Redémarrer le serveur de développement

Après avoir modifié `.env.local`, vous devez redémarrer votre serveur de développement :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez-le
npm run dev
```

## ✅ Vérification

### Test 1 : Vérifier la variable d'environnement

1. Ouvrez la console du navigateur (F12)
2. Dans la console, tapez :
```javascript
console.log(import.meta.env.VITE_BUNNY_EMBED_BASE_URL)
```
3. Vous devriez voir l'URL complète avec votre Library ID

### Test 2 : Tester le composant BunnyPlayer

1. Naviguez vers une page contenant une leçon avec une vidéo
2. Le lecteur vidéo devrait s'afficher correctement
3. Si la variable est manquante, vous verrez un message d'erreur rouge :
   - "Bunny Stream n'est pas configuré"
   - "La variable d'environnement VITE_BUNNY_EMBED_BASE_URL est manquante."

### Test 3 : Vérifier l'URL d'embed

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet **Network** (Réseau)
3. Rechargez la page avec la vidéo
4. Recherchez une requête vers `iframe.mediadelivery.net`
5. L'URL devrait être : `https://iframe.mediadelivery.net/embed/[VOTRE_LIBRARY_ID]/[VIDEO_ID]`

## 🐛 Dépannage

### Problème : Le message d'erreur "Bunny Stream n'est pas configuré" s'affiche

**Solutions :**
1. Vérifiez que le fichier `.env.local` existe à la racine du projet
2. Vérifiez que la variable `VITE_BUNNY_EMBED_BASE_URL` est bien définie
3. Vérifiez que vous avez remplacé `[LIBRARY_ID]` par votre ID réel
4. Redémarrez le serveur de développement après modification

### Problème : La vidéo ne se charge pas

**Solutions :**
1. Vérifiez que votre Library ID est correct
2. Vérifiez que la vidéo existe dans votre bibliothèque Bunny Stream
3. Vérifiez que le `videoId` dans la base de données correspond à l'ID de la vidéo dans Bunny Stream
4. Vérifiez les permissions de votre bibliothèque Bunny Stream (doit être publique ou accessible)

### Problème : L'iframe est vide

**Solutions :**
1. Vérifiez la console du navigateur pour les erreurs CORS
2. Vérifiez que votre bibliothèque Bunny Stream autorise les embeds
3. Vérifiez que le domaine de votre application est autorisé dans les paramètres Bunny Stream

## 📝 Notes importantes

- Le fichier `.env.local` est ignoré par Git (déjà configuré dans `.gitignore`)
- Ne commitez jamais votre `.env.local` avec votre Library ID réel
- Pour la production, configurez cette variable dans votre plateforme de déploiement (Vercel, Netlify, etc.)

## 🔗 Ressources

- [Documentation Bunny Stream](https://docs.bunny.net/docs/stream)
- [Guide d'intégration iframe](https://docs.bunny.net/docs/stream-embed)

