# Guide de Test - Service de Progression

Ce document décrit comment tester le service de progression et les améliorations apportées à l'espace client.

## 🧪 Tests Unitaires

### Configuration

Les tests utilisent **Vitest** comme framework de test, configuré dans `vite.config.ts`.

### Lancer les tests

```bash
# Lancer tous les tests
npm run test

# Lancer les tests en mode watch
npm run test -- --watch

# Lancer les tests avec l'interface UI
npm run test:ui

# Lancer les tests avec couverture de code
npm run test:coverage
```

### Tests disponibles

#### `src/services/__tests__/progressService.test.ts`

Tests unitaires pour le service de progression :

- ✅ Retourne un objet vide si userId est vide
- ✅ Calcule correctement la progression d'un module
- ✅ Identifie la prochaine leçon à compléter
- ✅ Identifie continueLearning avec la dernière leçon vue
- ✅ Retourne un module non complété comme continueLearning si aucune progression

### Structure des tests

Les tests mockent :
- `supabaseClient` - pour simuler les appels Supabase
- `trainingService` - pour simuler la récupération des modules

## 🔧 Test Manuel avec Supabase

### Script de test manuel

Un script Node.js permet de tester le service avec de vraies données Supabase :

```bash
npm run test:progress [userId]
```

Si `userId` n'est pas fourni, le script utilise le premier utilisateur trouvé dans la base de données.

### Prérequis

1. Créer un fichier `.env.local` à la racine du projet avec :
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Avoir au moins un utilisateur dans la base de données avec :
   - Des modules accessibles (via `training_access`)
   - Optionnellement : de la progression (via `training_progress`)

### Exemple de sortie

```
🧪 Test du service de progression

📧 Utilisation de l'utilisateur: user@example.com (John Doe)

✅ Résultats du test:

📊 Modules: 3

  📦 Module 1: Les Bases du Trading
     Progression: 2/5 leçons (40%)
     Prochaine leçon: Analyse Technique Avancée

  📦 Module 2: Stratégies Avancées
     Progression: 0/8 leçons (0%)
     Prochaine leçon: Introduction aux Stratégies

🔥 Continuer l'apprentissage:
   Module: Les Bases du Trading
   Leçon: Analyse Technique de Base
   Progression du module: 40%

✅ Leçons complétées: 2
```

## 🎨 États Vides (Empty States)

### Composant EmptyState

Un composant réutilisable `EmptyState` a été créé pour améliorer l'UX :

**Localisation :** `src/components/common/EmptyState.tsx`

**Utilisation :**

```tsx
import EmptyState from '../components/common/EmptyState';
import { BookOpen } from 'lucide-react';

<EmptyState
  icon={BookOpen}
  title="Aucun module disponible"
  description="Il n'y a pas encore de modules de formation disponibles."
  action={{
    label: 'Retour à l'accueil',
    onClick: () => navigate('/'),
  }}
/>
```

### États vides implémentés

#### ClientApp (`/app`)
- ✅ Aucun module disponible
- ✅ Erreur de chargement
- ✅ Aucun résultat de recherche
- ✅ Message de bienvenue pour nouveaux utilisateurs

#### MemberDashboard (`/app/dashboard`)
- ✅ Session expirée
- ✅ Tous les modules complétés (félicitations)

#### ProgressPage (`/app/progress`)
- ✅ Session expirée
- ✅ Aucun module disponible

## 📊 Améliorations Apportées

### 1. Système de Progression Réel

- ✅ Calcul dynamique depuis `training_progress`
- ✅ Détection de la dernière leçon vue
- ✅ Calcul du pourcentage de progression par module
- ✅ Identification de la prochaine leçon à compléter

### 2. Dashboard Personnalisé

- ✅ Widget "Continuer la leçon"
- ✅ Section "Actions rapides"
- ✅ Recommandations personnalisées basées sur la progression
- ✅ Vue "À faire cette semaine"

### 3. Recherche et Filtres

- ✅ Barre de recherche globale
- ✅ Filtres : Tous / En cours / Terminés / À démarrer
- ✅ Recherche en temps réel

## 🐛 Dépannage

### Les tests ne passent pas

1. Vérifier que les dépendances sont installées :
   ```bash
   npm install
   ```

2. Vérifier la configuration Vitest dans `vite.config.ts`

3. Vérifier que les mocks sont correctement configurés

### Le script de test manuel échoue

1. Vérifier que `.env.local` existe et contient les bonnes variables
2. Vérifier la connexion à Supabase
3. Vérifier que l'utilisateur existe dans la base de données
4. Vérifier les permissions RLS (Row Level Security)

### Les états vides ne s'affichent pas

1. Vérifier que le composant `EmptyState` est importé
2. Vérifier les conditions d'affichage dans les composants
3. Vérifier la console du navigateur pour les erreurs

## 📝 Notes

- Les tests unitaires mockent Supabase pour éviter les appels réseau
- Le script de test manuel utilise de vraies données Supabase
- Les états vides améliorent l'expérience utilisateur en guidant l'utilisateur
- Tous les calculs de progression sont maintenant dynamiques et basés sur les vraies données

