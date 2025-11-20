# Instructions de test - InvestInfinity LMS

## Prérequis

1. ✅ Le dev server doit être lancé : `npm run dev`
2. ✅ Les données de test doivent être dans Supabase (3 modules, 6 leçons)
3. ✅ Un utilisateur doit avoir accès au module gratuit

## Étape 1 : Donner accès aux modules

### Option A : Via Supabase Dashboard (RECOMMANDÉ)

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet : `vveswlmcgmizmjsriezw`
3. Va dans **SQL Editor**
4. Ouvre le fichier `scripts/grant-access.sql`
5. Copie-colle le contenu dans l'éditeur SQL
6. Clique sur **Run** (ou `Ctrl+Enter`)

### Option B : Via le script automatique (à venir)

Un script Node.js pourra être créé pour automatiser cette étape.

## Étape 2 : Accéder à l'application

1. Ouvre ton navigateur
2. Va sur : **http://localhost:5173**
3. Tu devrais voir la page d'accueil

## Étape 3 : Se connecter

1. Clique sur le lien de connexion ou va directement sur : **http://localhost:5173/login**
2. Utilise tes identifiants Supabase :
   - **Email** : ton email Supabase
   - **Mot de passe** : ton mot de passe Supabase
3. Clique sur **Se connecter**

> 💡 **Note** : Si tu n'as pas encore de compte, crée-en un via Supabase Dashboard > Authentication > Users > Add user

## Étape 4 : Accéder à l'espace formation (/app)

1. Après connexion, tu seras automatiquement redirigé vers `/app`
2. Tu devrais voir :
   - **Header** : "Espace formation" avec un bouton de déconnexion
   - **Section "Continuer là où tu t'es arrêté"** : Le premier module disponible
   - **Section "Tes modules"** : La liste de tous les modules auxquels tu as accès

## Étape 5 : Voir les modules

Dans la section **"Tes modules"**, tu devrais voir :
- Les modules auxquels tu as accès (au minimum "Les Bases du Trading" si tu as exécuté grant-access.sql)
- Chaque module affiche :
  - Un badge "Module débloqué"
  - Le titre du module
  - La description
  - Une barre de progression (40% par défaut pour la V1)

## Étape 6 : Cliquer sur un module

1. Clique sur une carte de module
2. Tu seras redirigé vers : `/app/modules/:moduleId`
3. Tu devrais voir :
   - **Bouton retour** : "Retour aux modules"
   - **En-tête du module** : Titre, badge actif/inactif, nombre de leçons
   - **Description** : Si disponible
   - **Liste des leçons** : Toutes les leçons du module avec :
     - Numéro de leçon
     - Titre
     - Badge "Preview" si c'est une leçon preview
     - Description (si disponible)
     - Icône play

## Étape 7 : Lancer une leçon

1. Dans la liste des leçons, clique sur une leçon
2. Tu seras redirigé vers : `/app/modules/:moduleId/lessons/:lessonId`
3. Tu devrais voir :
   - **Fil d'Ariane** : Retour au module
   - **Lecteur vidéo Bunny Stream** : 
     - Si `bunny_video_id` est configuré : Le lecteur vidéo s'affiche
     - Si `bunny_video_id` est manquant : Message d'erreur "Vidéo non configurée"
   - **Informations de la leçon** : Titre et description
   - **Navigation** : Boutons "Leçon précédente" et "Leçon suivante"

## Points à vérifier

### ✅ Fonctionnalités à tester

- [ ] La connexion fonctionne
- [ ] La redirection vers `/app` après connexion
- [ ] L'affichage des modules dans ClientApp
- [ ] Le clic sur un module redirige vers ModulePage
- [ ] L'affichage des leçons dans ModulePage
- [ ] Le clic sur une leçon redirige vers LessonPlayerPage
- [ ] Le lecteur vidéo s'affiche (ou le message d'erreur si pas de video_id)
- [ ] La navigation entre leçons fonctionne

### ⚠️ Problèmes potentiels

1. **Aucun module affiché** :
   - Vérifie que l'utilisateur a bien un accès dans `training_access`
   - Vérifie que les modules sont `is_active = true`
   - Vérifie la console du navigateur pour les erreurs

2. **Erreur de chargement** :
   - Vérifie que les variables d'environnement sont correctes dans `.env.local`
   - Vérifie la console du navigateur
   - Vérifie la console du serveur (terminal où tourne `npm run dev`)

3. **Lecteur vidéo ne s'affiche pas** :
   - Vérifie que `VITE_BUNNY_EMBED_BASE_URL` est défini dans `.env.local`
   - Vérifie que `bunny_video_id` est présent dans la leçon

## URLs de test

- **Accueil** : http://localhost:5173/
- **Login** : http://localhost:5173/login
- **Espace formation** : http://localhost:5173/app
- **Module** : http://localhost:5173/app/modules/:moduleId
- **Leçon** : http://localhost:5173/app/modules/:moduleId/lessons/:lessonId

## Commandes utiles

```bash
# Lancer le dev server
npm run dev

# Vérifier les données dans Supabase
node scripts/verify-seed.js

# Voir les logs du serveur
# (dans le terminal où tourne npm run dev)
```

