# 🚀 Étapes pour GitHub - Guide Simple

## ✅ Étape 1 : Fichiers préparés (DÉJÀ FAIT)

Les fichiers sont déjà ajoutés et commités localement.

## 📦 Étape 2 : Créer le dépôt sur GitHub

### Option A : Via le site GitHub (Recommandé)

1. **Allez sur** : https://github.com/new
2. **Remplissez** :
   - **Repository name** : `invest-infinity-frontend`
   - **Description** : `Frontend Invest Infinity - Plateforme de formation trading`
   - **Visibility** : Choisissez **Public** ou **Private**
   - ❌ **NE COCHEZ RIEN** (pas de README, pas de .gitignore, pas de license)
3. **Cliquez sur** : **"Create repository"**

### Option B : Via GitHub CLI (si installé)

```bash
gh repo create invest-infinity-frontend --public --source=. --remote=origin --push
```

## 🔗 Étape 3 : Connecter votre dépôt local à GitHub

**Après avoir créé le dépôt sur GitHub**, exécutez ces commandes :

```bash
# Remplacez VOTRE_USERNAME par votre nom d'utilisateur GitHub
git remote add origin https://github.com/VOTRE_USERNAME/invest-infinity-frontend.git

# Renommer la branche en "main" (standard GitHub)
git branch -M main

# Pousser le code sur GitHub
git push -u origin main
```

## 🔐 Étape 4 : Authentification GitHub

Si GitHub vous demande de vous authentifier :

### Option 1 : Personal Access Token (Recommandé)

1. Allez sur : https://github.com/settings/tokens
2. Cliquez sur **"Generate new token (classic)"**
3. Donnez un nom : `invest-infinity-deploy`
4. Cochez **`repo`** (accès complet aux dépôts)
5. Cliquez sur **"Generate token"**
6. **Copiez le token** (vous ne le reverrez plus !)
7. Lors du `git push`, utilisez :
   - **Username** : Votre nom d'utilisateur GitHub
   - **Password** : Le token que vous venez de copier

### Option 2 : GitHub CLI

```bash
gh auth login
```

## ✅ Vérification

1. Allez sur : `https://github.com/VOTRE_USERNAME/invest-infinity-frontend`
2. Vous devriez voir tous vos fichiers ✅
3. Le README.md devrait s'afficher en bas de la page

## 🎯 Prochaines étapes

Une fois sur GitHub, vous pourrez :
1. Connecter Vercel à ce dépôt
2. Déployer automatiquement à chaque push

---

## 📝 Commandes complètes (copier-coller)

**Remplacez `VOTRE_USERNAME` par votre nom d'utilisateur GitHub :**

```bash
git remote add origin https://github.com/VOTRE_USERNAME/invest-infinity-frontend.git
git branch -M main
git push -u origin main
```

