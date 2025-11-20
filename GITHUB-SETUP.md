# 📦 Configuration GitHub - Guide Complet

## Étape 1 : Préparer les fichiers locaux

### 1.1 Ajouter tous les fichiers au staging

```bash
git add .
```

### 1.2 Créer un commit initial

```bash
git commit -m "Initial commit - Production ready"
```

## Étape 2 : Créer un dépôt sur GitHub

### 2.1 Créer le dépôt

1. Allez sur [github.com](https://github.com) et connectez-vous
2. Cliquez sur le **"+"** en haut à droite → **"New repository"**
3. Remplissez :
   - **Repository name** : `invest-infinity-frontend` (ou le nom que vous voulez)
   - **Description** : "Frontend Invest Infinity - Plateforme de formation trading"
   - **Visibility** : 
     - ✅ **Public** (gratuit, visible par tous)
     - ⚠️ **Private** (payant, mais privé)
   - ❌ **NE COCHEZ PAS** "Add a README file" (vous en avez déjà un)
   - ❌ **NE COCHEZ PAS** "Add .gitignore" (vous en avez déjà un)
   - ❌ **NE COCHEZ PAS** "Choose a license"
4. Cliquez sur **"Create repository"**

### 2.2 Copier l'URL du dépôt

GitHub vous affichera une page avec des instructions. **Copiez l'URL HTTPS** :
- Exemple : `https://github.com/VOTRE_USERNAME/invest-infinity-frontend.git`

## Étape 3 : Connecter le dépôt local à GitHub

### 3.1 Ajouter le remote GitHub

```bash
git remote add origin https://github.com/VOTRE_USERNAME/invest-infinity-frontend.git
```

**Remplacez `VOTRE_USERNAME` par votre nom d'utilisateur GitHub !**

### 3.2 Renommer la branche en "main" (standard GitHub)

```bash
git branch -M main
```

### 3.3 Pousser le code sur GitHub

```bash
git push -u origin main
```

**Note :** Si c'est la première fois, GitHub vous demandera de vous authentifier.

## ✅ Vérification

1. Allez sur votre dépôt GitHub : `https://github.com/VOTRE_USERNAME/invest-infinity-frontend`
2. Vous devriez voir tous vos fichiers ✅

## 🔄 Commandes pour les mises à jour futures

Une fois configuré, pour mettre à jour GitHub :

```bash
# 1. Voir les changements
git status

# 2. Ajouter les fichiers modifiés
git add .

# 3. Créer un commit
git commit -m "Description de vos changements"

# 4. Pousser sur GitHub
git push origin main
```

## 🐛 Problèmes courants

### Erreur : "remote origin already exists"

**Solution :**
```bash
# Voir les remotes existants
git remote -v

# Supprimer l'ancien remote
git remote remove origin

# Ajouter le nouveau
git remote add origin https://github.com/VOTRE_USERNAME/invest-infinity-frontend.git
```

### Erreur : "Authentication failed"

**Solutions :**

**Option 1 : Utiliser un Personal Access Token**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Cochez `repo` (accès complet aux dépôts)
4. Copiez le token
5. Utilisez-le comme mot de passe lors du `git push`

**Option 2 : Utiliser GitHub CLI**
```bash
# Installer GitHub CLI puis :
gh auth login
```

### Erreur : "fatal: not a git repository"

**Solution :**
```bash
# Initialiser Git si pas déjà fait
git init
```

## 📝 Checklist

- [ ] Fichiers ajoutés avec `git add .`
- [ ] Commit créé avec `git commit -m "..."`
- [ ] Dépôt GitHub créé
- [ ] Remote ajouté avec `git remote add origin ...`
- [ ] Branche renommée en `main`
- [ ] Code poussé avec `git push -u origin main`
- [ ] Fichiers visibles sur GitHub

