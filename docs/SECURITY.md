# Documentation de Sécurité - InvestInfinity

Dernière mise à jour : 29/01/2025

Ce document résume les mesures de sécurité mises en place pour protéger l'application, les données utilisateurs et les contenus payants.

## 1. Architecture de Sécurité (Global)

L'application suit le principe de "Defense in Depth" (Défense en profondeur) :
1.  **Frontend** : Headers sécurisés, nettoyage des inputs.
2.  **API Gateway (Edge Functions)** : Vérification stricte de l'authentification et des licences avant tout traitement.
3.  **Base de Données (RLS)** : Row Level Security pour garantir que personne ne peut accéder aux données d'autrui, même en cas de faille API.

---

## 2. Row Level Security (RLS) & Base de Données

### Tables Critiques
*   **`profiles`** :
    *   Lecture : Uniquement soi-même (et admins).
    *   Écriture : Trigger de sécurité (`prevent_sensitive_profile_updates`) empêche la modification des colonnes `role`, `license` et `license_valid_until` par l'utilisateur lui-même.
*   **`training_modules` / `training_lessons`** :
    *   Lecture : Conditionnée par la présence d'une entrée dans `training_access` OU si la leçon est `is_preview`.
*   **`admin_activity_logs`** :
    *   Table d'audit immuable (lecture seule pour admins, insert via trigger/système).

### Audit Automatique
Des triggers SQL sont en place sur `training_modules`, `training_lessons` et `payments`.
Toute modification (INSERT/UPDATE/DELETE) est automatiquement logguée dans `admin_activity_logs` avec l'ID de l'auteur et les détails du changement.

---

## 3. Protection des Vidéos (Bunny Stream)

L'accès aux vidéos est le point le plus critique de la plateforme.

*   **Mécanisme** : Les vidéos sont privées sur Bunny Stream.
*   **Edge Function `generate-bunny-token`** :
    *   C'est le SEUL point d'entrée pour obtenir une URL de lecture.
    *   La fonction vérifie :
        1.  Que l'utilisateur est connecté.
        2.  Que la vidéo demandée correspond à une leçon existante.
        3.  Que l'utilisateur a bien le droit d'accès à ce module (vérification base de données).
*   **Sécurité** : Impossible de générer un token pour une vidéo "Elite" avec un compte "Starter".

---

## 4. Protection Chatbot (OpenAI)

*   **Accès** : Réservé aux utilisateurs ayant une licence valide (non 'none') ou admins.
*   **Rate Limiting** : Limite de 10 requêtes / minute par IP pour éviter le spam.
*   **Filtre** : Rejet automatique des messages trop longs (>1000 cars) ou contenant des motifs toxiques/injections.

---

## 5. Frontend & Headers

Le fichier `vercel.json` applique les headers de sécurité suivants :
*   `Content-Security-Policy` : Limite les sources de scripts/images autorisées (Stripe, Supabase, Bunny).
*   `X-Frame-Options: DENY` : Empêche l'intégration du site dans une iframe (anti-clickjacking).
*   `X-Content-Type-Options: nosniff` : Empêche le sniffing de type MIME.
*   `Strict-Transport-Security` : Force le HTTPS.

---

## 6. Check-list pour les développeurs

Lors de l'ajout d'une nouvelle fonctionnalité :

1.  **Nouvelle Table ?**
    *   TOUJOURS activer RLS (`alter table ... enable row level security`).
    *   Ajouter une policy "select" pour l'owner.
    *   Ajouter une policy "all" pour l'admin.

2.  **Nouvelle Edge Function ?**
    *   Toujours vérifier le token Auth en début de fonction.
    *   Si la fonction renvoie des données sensibles, vérifier les droits (ex: `profile.license`).

3.  **Logs**
    *   Ne jamais logguer de données personnelles (email, nom) en clair dans `console.log`. Utiliser des IDs.

---

## 7. Incidents & Audit

Pour voir les actions des administrateurs :
```sql
select * from admin_activity_logs order by created_at desc;
```

