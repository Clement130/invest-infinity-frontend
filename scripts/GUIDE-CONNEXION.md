# Guide de connexion - InvestInfinity LMS

## 🔑 Mot de passe Supabase

Le **mot de passe Supabase** est le mot de passe de l'utilisateur créé dans **Supabase Authentication**.

### Comment trouver/réinitialiser ton mot de passe

1. **Va sur** https://supabase.com/dashboard
2. **Sélectionne ton projet** : `vveswlmcgmizmjsriezw`
3. **Va dans** Authentication > Users
4. **Trouve l'utilisateur** : `butcher13550@gmail.com`
5. **Deux options** :

   **Option A : Voir le mot de passe (si tu l'as défini)**
   - Clique sur l'utilisateur
   - Le mot de passe n'est pas visible (sécurité)
   - Si tu ne te souviens plus, utilise l'Option B

   **Option B : Réinitialiser le mot de passe**
   - Clique sur l'utilisateur
   - Clique sur "Reset password" ou "Send password reset email"
   - OU clique sur "..." (menu) > "Reset password"
   - Un email sera envoyé à `butcher13550@gmail.com` avec un lien de réinitialisation

   **Option C : Définir un nouveau mot de passe directement**
   - Clique sur l'utilisateur
   - Dans "User Management", tu peux définir un nouveau mot de passe
   - Clique sur "Update user" ou "Save"

## 🔐 Comment se connecter

1. **Ouvre ton navigateur**
2. **Va sur** : http://localhost:5173/login
   - (Assure-toi que le dev server tourne : `npm run dev`)
3. **Remplis le formulaire** :
   - **Email** : `butcher13550@gmail.com` (déjà pré-rempli)
   - **Mot de passe** : Ton mot de passe Supabase
4. **Clique sur "Se connecter"**

## 👤 Rôle Admin - Ce que ça permet

Le rôle **admin** te donne accès à :

### 1. **Interface Admin** (`/admin`)
   - **URL** : http://localhost:5173/admin
   - **Accès** : Réservé aux utilisateurs avec `role = 'admin'` dans la table `profiles`
   - **Fonctionnalités** :
     - Voir tous les profils (clients et admins)
     - Voir tous les modules de formation (actifs et inactifs)
     - Voir tous les accès attribués
     - Voir tous les achats Stripe
     - Statistiques globales

### 2. **Espace Client** (`/app`)
   - **URL** : http://localhost:5173/app
   - **Accès** : Tous les utilisateurs connectés (clients et admins)
   - **Fonctionnalités** :
     - Voir les modules auxquels tu as accès
     - Accéder aux leçons
     - Voir ta progression

### 3. **Permissions dans la base de données**
   - Les **RLS (Row Level Security)** permettent aux admins de :
     - Voir tous les profils (pas seulement le leur)
     - Gérer tous les modules (créer, modifier, supprimer)
     - Gérer tous les accès (attribuer, révoquer)
     - Voir tous les achats

## 🚀 Test rapide

1. **Lance le dev server** (si pas déjà fait) :
   ```bash
   npm run dev
   ```

2. **Ouvre** : http://localhost:5173/login

3. **Connecte-toi** avec :
   - Email : `butcher13550@gmail.com`
   - Mot de passe : (ton mot de passe Supabase)

4. **Après connexion**, tu seras redirigé vers `/app`

5. **Pour accéder à l'admin**, va sur : http://localhost:5173/admin

## ⚠️ Si tu ne te souviens plus du mot de passe

1. Va dans Supabase Dashboard > Authentication > Users
2. Clique sur l'utilisateur `butcher13550@gmail.com`
3. Clique sur "Reset password" ou définis un nouveau mot de passe
4. Utilise ce nouveau mot de passe pour te connecter

## 📝 Note importante

- Le mot de passe est stocké de manière sécurisée dans Supabase (hashé)
- Tu ne peux pas voir le mot de passe actuel, seulement le réinitialiser
- Si tu définis un nouveau mot de passe, utilise-le immédiatement pour te connecter

