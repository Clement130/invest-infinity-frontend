# Configuration de l'API Google Search Console

Ce guide explique comment configurer l'API Google Search Console pour soumettre automatiquement le sitemap.

## 📋 Prérequis

1. Un compte Google avec accès à Google Search Console
2. Un compte Google Cloud Platform (gratuit)
3. Node.js installé

## 🚀 Étapes de configuration

### Étape 1 : Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Cliquez sur **"Sélectionner un projet"** → **"Nouveau projet"**
3. Nommez le projet (ex: "invest-infinity-seo")
4. Cliquez sur **"Créer"**

### Étape 2 : Activer l'API Google Search Console

1. Dans le menu latéral, allez dans **"APIs & Services"** → **"Bibliothèque"**
2. Recherchez **"Google Search Console API"**
3. Cliquez sur **"Activer"**

### Étape 3 : Créer des credentials OAuth 2.0

1. Allez dans **"APIs & Services"** → **"Identifiants"**
2. Cliquez sur **"Créer des identifiants"** → **"ID client OAuth 2.0"**
3. Configurez l'écran de consentement OAuth si demandé :
   - Type d'application : **Application Web**
   - Nom : Invest Infinity SEO
   - URI de redirection autorisés : `http://localhost:3000` (ou votre URL locale)
4. Cliquez sur **"Créer"**
5. Téléchargez le fichier JSON des credentials
6. Renommez-le en `credentials.json`
7. Placez-le à la racine du projet (même niveau que `package.json`)

### Étape 4 : Installer les dépendances

```bash
npm install googleapis
```

### Étape 5 : Exécuter le script

```bash
node scripts/submit-sitemap-google.js
```

La première fois, le script vous demandera d'autoriser l'application via votre navigateur.

## 🔐 Sécurité

⚠️ **Important** : Ne commitez JAMAIS le fichier `credentials.json` ou `token.json` dans Git !

Ajoutez-les au `.gitignore` :
```
credentials.json
token.json
```

## 📝 Alternative : Soumission manuelle

Si vous préférez soumettre manuellement (plus simple) :

1. Allez sur [Google Search Console](https://search.google.com/search-console)
2. Sélectionnez votre propriété
3. Menu latéral → **"Sitemaps"**
4. Entrez : `sitemap.xml`
5. Cliquez sur **"Envoyer"**

## 🔗 Ressources

- [Documentation Google Search Console API](https://developers.google.com/webmaster-tools/search-console-api-original)
- [Guide OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

