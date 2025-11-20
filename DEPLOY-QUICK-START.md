# 🚀 Déploiement Rapide - Guide Express

## Étape 1 : Préparer GitHub

```bash
# 1. Ajouter tous les fichiers
git add .

# 2. Créer un commit
git commit -m "Ready for production deployment"

# 3. Créer un dépôt sur GitHub (si pas déjà fait)
# Allez sur https://github.com/new
# Créez un nouveau dépôt (ex: invest-infinity-frontend)

# 4. Ajouter le remote et pousser
git remote add origin https://github.com/VOTRE_USERNAME/invest-infinity-frontend.git
git branch -M main
git push -u origin main
```

## Étape 2 : Déployer sur Vercel

### 2.1 Créer le projet

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur **"Add New Project"**
3. Importez votre dépôt GitHub `invest-infinity-frontend`
4. Vercel détectera automatiquement **Vite** ✅

### 2.2 Configurer les variables d'environnement

Dans **Settings > Environment Variables**, ajoutez ces 3 variables :

```
VITE_SUPABASE_URL = https://vveswlmcgmizmjsriezw.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZXN3bG1jZ21pem1qc3JpZXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzM4NjcsImV4cCI6MjA3OTAwOTg2N30.G_9XfabnMXR23LzuvRTRLrpHMd1EFznXXrTNadOwdjY
VITE_BUNNY_EMBED_BASE_URL = https://iframe.mediadelivery.net/embed/542258
```

**Important :**
- Sélectionnez **Production**, **Preview**, et **Development** pour chaque variable
- Cliquez sur **Save** après chaque variable

### 2.3 Déployer

1. Cliquez sur **"Deploy"**
2. Attendez 1-2 minutes
3. Votre site sera disponible sur : `https://invest-infinity-frontend.vercel.app`

## ✅ C'est tout !

Vercel déploiera automatiquement à chaque push sur `main`.

## 🔄 Déploiements futurs

```bash
git add .
git commit -m "Votre message"
git push origin main
# Vercel déploiera automatiquement !
```

## 📝 Checklist

- [ ] Code poussé sur GitHub
- [ ] Projet créé sur Vercel
- [ ] 3 variables d'environnement configurées
- [ ] Build réussi
- [ ] Site accessible et fonctionnel

## 🐛 Problème ?

Si le build échoue :
1. Vérifiez les logs dans Vercel
2. Vérifiez que toutes les variables sont bien configurées
3. Testez le build localement : `npm run build`

