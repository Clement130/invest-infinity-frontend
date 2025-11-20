# Système de Défis - Documentation Complète

## 📋 Vue d'ensemble

Le système de défis permet aux clients de participer à des défis, de suivre leur progression, de soumettre des contributions et de gagner des récompenses (badges, XP).

## 🗄️ Structure de la Base de Données

### Tables créées

1. **`challenges`** : Défis disponibles
   - `id`, `title`, `description`
   - `type` : 'weekly', 'monthly', 'special'
   - `start_date`, `end_date`
   - `target_value` : Objectif à atteindre
   - `reward_description`, `reward_xp`, `reward_badge_id`
   - `is_active` : Actif ou non

2. **`challenge_participations`** : Participations des utilisateurs
   - `challenge_id`, `user_id`
   - `progress_value` : Progression actuelle
   - `completed_at` : Date de complétion
   - `reward_claimed` : Récompense réclamée ou non

3. **`challenge_submissions`** : Soumissions pour les défis
   - `participation_id`, `challenge_id`, `user_id`
   - `submission_type` : Type de soumission
   - `content` : Contenu textuel
   - `file_url` : URL de fichier (optionnel)

4. **`badges`** : Badges disponibles
   - `id`, `name`, `description`, `icon`, `rarity`

5. **`user_badges`** : Badges attribués aux utilisateurs
   - `user_id`, `badge_id`, `unlocked_at`, `source`

## 🚀 Fonctionnalités Implémentées

### Pour les Clients

1. **Voir les défis actifs**
   - Liste des défis disponibles
   - Informations : titre, description, dates, objectif, récompense
   - Nombre de participants et classement

2. **Rejoindre un défi**
   - Bouton "Rejoindre le défi"
   - Création automatique d'une participation

3. **Soumettre des contributions**
   - Modal de soumission
   - Texte libre pour décrire la contribution
   - Mise à jour automatique de la progression

4. **Suivre la progression**
   - Barre de progression visuelle
   - Affichage du rang dans le classement
   - Notification de complétion

5. **Récompenses automatiques**
   - Attribution de badges
   - Attribution d'XP (à implémenter avec table user_xp)
   - Marquage de la récompense comme réclamée

### Pour les Admins

1. **Gestion des défis** (`/admin/challenges`)
   - Créer un nouveau défi
   - Modifier un défi existant
   - Supprimer un défi
   - Activer/désactiver un défi

2. **Types de défis**
   - **Hebdomadaire** : Défis qui durent une semaine
   - **Mensuel** : Défis qui durent un mois
   - **Spécial** : Défis spéciaux avec durée personnalisée

## 📝 Utilisation

### Créer un défi (Admin)

1. Aller sur `/admin/challenges`
2. Cliquer sur "Créer un défi"
3. Remplir le formulaire :
   - **Titre** : Nom du défi
   - **Description** : Description détaillée
   - **Type** : Hebdomadaire, Mensuel ou Spécial
   - **Dates** : Date de début et de fin
   - **Objectif** : Nombre à atteindre (ex: 3 analyses)
   - **Récompense** : Description de la récompense
   - **XP** : Points d'expérience à attribuer
   - **Badge ID** : ID du badge à attribuer (optionnel)
4. Cliquer sur "Sauvegarder"

### Participer à un défi (Client)

1. Aller sur `/app/challenges`
2. Voir les défis actifs
3. Cliquer sur "Rejoindre le défi"
4. Cliquer sur "Ajouter une contribution" pour soumettre
5. Remplir le formulaire et soumettre
6. La progression se met à jour automatiquement

## 🔧 Services Disponibles

### `challengesService.ts`

- `getActiveChallenges(userId)` : Récupère les défis actifs avec progression
- `joinChallenge(challengeId, userId)` : Rejoint un défi
- `updateChallengeProgress(challengeId, userId, progressValue)` : Met à jour la progression
- `submitChallengeEntry(...)` : Soumet une contribution
- `getUserChallengeSubmissions(challengeId, userId)` : Récupère les soumissions
- `getChallengeLeaderboard(challengeId, limit)` : Récupère le classement
- `getCompletedChallenges(userId)` : Récupère les défis complétés

## 🎯 Logique de Progression

1. **Rejoindre un défi** : Crée une participation avec `progress_value = 0`
2. **Soumettre une contribution** : Incrémente `progress_value` de 1
3. **Complétion** : Quand `progress_value >= target_value` :
   - `completed_at` est défini
   - Les récompenses sont attribuées automatiquement
   - Le badge est débloqué (si `reward_badge_id` est défini)

## 📊 Classement

Le classement est calculé en temps réel :
1. Tous les participants sont triés par `progress_value` (décroissant)
2. En cas d'égalité, le plus récent `updated_at` est prioritaire
3. Le rang de l'utilisateur est calculé et affiché

## 🔐 Sécurité (RLS)

- Les utilisateurs peuvent voir les défis actifs
- Les utilisateurs peuvent voir/modifier leurs propres participations
- Les admins peuvent gérer tous les défis
- Les badges sont publics (lecture)
- Les utilisateurs peuvent voir leurs propres badges

## 🚨 Notes Importantes

1. **Migration SQL** : La migration doit être exécutée dans Supabase
   - Fichier : `supabase/migrations/20241120120000_create_challenges_tables.sql`
   - À exécuter via Supabase Dashboard > SQL Editor

2. **Badges par défaut** : 5 badges sont créés automatiquement :
   - `challenge-weekly-winner`
   - `challenge-monthly-winner`
   - `challenge-special`
   - `risk-management-master`
   - `analysis-expert`

3. **XP** : L'attribution d'XP nécessite une table `user_xp` (à créer si nécessaire)

## 🔄 Prochaines Améliorations Possibles

1. Upload de fichiers pour les soumissions
2. Système de validation des soumissions par les admins
3. Notifications lors de la complétion d'un défi
4. Graphiques de progression
5. Historique des défis complétés
6. Système de points/XP complet

