# Guide de Déploiement - Invest Infinity

Ce guide vous explique comment déployer le site en production sur Vercel et GitHub.

## 📋 Prérequis

1. Un compte GitHub
2. Un compte Vercel (gratuit)
3. Les variables d'environnement nécessaires

## 🚀 Étape 1 : Préparer le dépôt GitHub

### 1.1 Initialiser Git (si pas déjà fait)

```bash
# Vérifier si Git est déjà initialisé
git status

# Si pas initialisé, exécuter :
git init
```

### 1.2 Vérifier le .gitignore

Assurez-vous que `.env.local` est bien dans `.gitignore` (déjà fait ✅)

### 1.3 Créer un dépôt GitHub

1. Allez sur [GitHub](https://github.com/new)
2. Créez un nouveau dépôt (ex: `invest-infinity-frontend`)
3. **Ne cochez PAS** "Initialize with README" si vous avez déjà des fichiers

### 1.4 Pousser le code sur GitHub

```bash
# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "Initial commit - Ready for production"

# Ajouter le remote GitHub (remplacez par votre URL)
git remote add origin https://github.com/VOTRE_USERNAME/invest-infinity-frontend.git

# Pousser sur GitHub
git branch -M main
git push -u origin main
```

## 🔧 Étape 2 : Configurer Vercel

### 2.1 Créer un projet sur Vercel

1. Allez sur [Vercel](https://vercel.com)
2. Cliquez sur **"Add New Project"**
3. Importez votre dépôt GitHub
4. Sélectionnez le dépôt `invest-infinity-frontend`

### 2.2 Configuration du projet

Vercel détectera automatiquement :
- **Framework Preset** : Vite
- **Build Command** : `npm run build`
- **Output Directory** : `dist`
- **Install Command** : `npm install`

✅ Ces valeurs sont déjà configurées dans `vercel.json`

### 2.3 Configurer les variables d'environnement

Dans Vercel, allez dans **Settings > Environment Variables** et ajoutez :

#### Variables OBLIGATOIRES :

```
VITE_SUPABASE_URL=https://vveswlmcgmizmjsriezw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZXN3bG1jZ21pem1qc3JpZXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzM4NjcsImV4cCI6MjA3OTAwOTg2N30.G_9XfabnMXR23LzuvRTRLrpHMd1EFznXXrTNadOwdjY
VITE_BUNNY_EMBED_BASE_URL=https://iframe.mediadelivery.net/embed/542258
VITE_BUNNY_STREAM_LIBRARY_ID=votre_library_id
```

**Note pour Bunny Stream :**
- `VITE_BUNNY_STREAM_LIBRARY_ID` : L'ID de votre bibliothèque Bunny Stream (visible dans votre dashboard Bunny.net)
- `VITE_BUNNY_EMBED_BASE_URL` : L'URL de base pour le lecteur vidéo (format: `https://iframe.mediadelivery.net/embed/{library_id}`)

#### Variables OPTIONNELLES :

```
VITE_SUPABASE_FUNCTIONS_URL=https://vveswlmcgmizmjsriezw.supabase.co/functions/v1
```

**Important :**
- Sélectionnez **Production**, **Preview**, et **Development** pour chaque variable
- Ne jamais ajouter `VITE_SUPABASE_SERVICE_ROLE_KEY` (clé secrète, jamais côté client)

### 2.4 Déployer

1. Cliquez sur **"Deploy"**
2. Vercel va :
   - Installer les dépendances
   - Builder le projet
   - Déployer sur leur CDN
3. Vous obtiendrez une URL comme : `https://invest-infinity-frontend.vercel.app`

## ✅ Étape 3 : Vérifier le déploiement

### 3.1 Tester l'application

1. Ouvrez l'URL fournie par Vercel
2. Vérifiez que :
   - ✅ La page d'accueil s'affiche
   - ✅ La connexion Supabase fonctionne
   - ✅ Les formulaires d'inscription fonctionnent
   - ✅ Les vidéos Bunny Stream s'affichent

### 3.2 Vérifier les variables d'environnement

Dans la console du navigateur (F12), vérifiez :
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
// Devrait afficher : https://vveswlmcgmizmjsriezw.supabase.co
```

## 🔄 Déploiements automatiques

Une fois configuré, Vercel déploiera automatiquement :
- **Production** : À chaque push sur `main`
- **Preview** : À chaque pull request

## 🌐 Configuration d'un domaine personnalisé (optionnel)

1. Dans Vercel, allez dans **Settings > Domains**
2. Ajoutez votre domaine (ex: `investinfinity.com`)
3. Suivez les instructions pour configurer les DNS

## 📝 Checklist de déploiement

- [ ] Code poussé sur GitHub
- [ ] Projet créé sur Vercel
- [ ] Variables d'environnement configurées
- [ ] Build réussi sur Vercel
- [ ] Application testée en production
- [ ] Domain personnalisé configuré (si nécessaire)

## 🐛 Dépannage

### Erreur : "Variables d'environnement manquantes"

**Solution :** Vérifiez que toutes les variables `VITE_*` sont bien configurées dans Vercel.

### Erreur : "Build failed"

**Solution :** 
1. Vérifiez les logs de build dans Vercel
2. Testez le build localement : `npm run build`
3. Vérifiez que toutes les dépendances sont dans `package.json`

### Erreur : "Supabase connection failed"

**Solution :**
1. Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont corrects
2. Vérifiez que les politiques RLS permettent les requêtes depuis le domaine Vercel

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Vite](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Documentation Supabase](https://supabase.com/docs)

