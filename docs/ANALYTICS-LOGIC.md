# Logique des Statistiques de Formation - Analytiques

## 🔍 Vue d'ensemble

L'onglet **Analytiques** > **Statistiques par formation** affiche les métriques de performance de chaque module de formation, basées sur l'activité réelle des **clients/utilisateurs**.

## 🔗 Lien avec les Clients

### Structure des données

Les statistiques sont calculées à partir de **3 tables principales** :

1. **`training_access`** : Liste des accès accordés aux modules
   - `user_id` : ID du client
   - `module_id` : ID du module
   - Indique qu'un client **a le droit** d'accéder à un module

2. **`training_progress`** : Suivi de progression par leçon
   - `user_id` : ID du client
   - `lesson_id` : ID de la leçon
   - `done` : Boolean indiquant si la leçon est complétée
   - `last_viewed` : Date de dernière consultation

3. **`training_lessons`** : Liste des leçons avec leur module parent
   - `module_id` : Lien vers le module parent
   - Permet de regrouper les leçons par module

### Flux de calcul

```
Client → Accès au module (training_access)
    ↓
Client consulte des leçons → Progression enregistrée (training_progress)
    ↓
Agrégation par module → Statistiques affichées
```

## 📊 Ce que l'Admin Voit

Pour chaque formation, l'admin voit **5 métriques clés** :

### 1. **Accès** (`totalAccess`)
- **Définition** : Nombre de clients ayant reçu l'accès à ce module
- **Source** : Nombre d'entrées dans `training_access` pour ce `module_id`
- **Exemple** : "3 accès" = 3 clients ont reçu l'accès

### 2. **Taux de complétion** (`completionRate`)
- **Définition** : Pourcentage de clients ayant complété **toutes les leçons** du module
- **Calcul** : `(clients ayant complété toutes les leçons / total accès) × 100`
- **Exemple** : 
  - 3 clients ont accès
  - 1 client a complété toutes les leçons
  - Taux = 33.3%

### 3. **Vues** (`totalViews`)
- **Définition** : Nombre de clients ayant consulté **au moins une leçon** du module
- **Source** : Clients ayant au moins une entrée dans `training_progress` avec `last_viewed` non null
- **Exemple** : "2 vues" = 2 clients ont ouvert au moins une leçon

### 4. **Progression moyenne** (`averageProgress`)
- **Définition** : Progression moyenne des clients ayant accès au module
- **Calcul** : 
  ```
  Pour chaque client avec accès :
    - Compter le nombre de leçons complétées
    - Calculer : (leçons complétées / total leçons du module) × 100
  - Faire la moyenne de tous les clients
  ```
- **Exemple** :
  - Module a 10 leçons
  - Client A : 5 leçons complétées = 50%
  - Client B : 2 leçons complétées = 20%
  - Client C : 0 leçon complétée = 0%
  - Progression moyenne = (50 + 20 + 0) / 3 = 23.3%

### 5. **Complétions totales** (`totalCompletions`)
- **Définition** : Nombre de clients ayant complété **toutes** les leçons du module
- **Source** : Clients dont toutes les leçons du module ont `done = true`

## 🛠️ Logique Technique Corrigée

### Problème identifié

**Avant la correction**, le code avait des erreurs :
- ❌ Utilisait `p.module_id` qui n'existe pas dans `training_progress`
- ❌ Utilisait `p.progress_percentage` qui n'existe pas (seulement `done` boolean)
- ❌ Ne joignait pas correctement les leçons avec les modules

### Solution implémentée

**Après la correction**, la logique est :

1. **Récupération des données** :
   ```typescript
   // Récupérer toutes les leçons avec leur module_id
   const lessons = await supabase.from('training_lessons').select('id, module_id');
   
   // Récupérer toutes les progressions
   const progress = await supabase.from('training_progress').select('*');
   ```

2. **Création de maps pour faciliter les recherches** :
   ```typescript
   // Map lesson_id → module_id
   const lessonToModule = new Map();
   
   // Map module_id → [liste de lesson_id]
   const lessonsByModule = new Map();
   ```

3. **Calcul par module** :
   ```typescript
   Pour chaque module :
     - Filtrer les accès (training_access) pour ce module
     - Filtrer les progressions dont la leçon appartient à ce module
     - Grouper les progressions par user_id
     - Calculer les métriques
   ```

4. **Calcul de la progression** :
   ```typescript
   Pour chaque client avec accès :
     - Compter ses leçons complétées dans ce module
     - Calculer : (complétées / total leçons) × 100
   - Moyenne de tous les clients
   ```

## 📈 Exemple Concret

### Scénario
- **Module** : "Etape 1 - La Fondation"
- **Leçons** : 10 leçons dans ce module
- **Clients avec accès** : 3 clients (A, B, C)

### Données de progression

| Client | Leçons complétées | Leçons vues | Progression |
|--------|-------------------|-------------|-------------|
| A      | 10/10            | 10          | 100%        |
| B      | 3/10             | 5           | 30%         |
| C      | 0/10             | 0           | 0%          |

### Statistiques calculées

- **Accès** : 3
- **Complétions totales** : 1 (seulement le client A)
- **Taux de complétion** : 33.3% (1/3)
- **Vues** : 2 (clients A et B ont consulté au moins une leçon)
- **Progression moyenne** : 43.3% ((100 + 30 + 0) / 3)

## ✅ Améliorations Apportées

1. **Correction de la jointure** : Utilisation correcte de `lessonToModule` map au lieu d'une jointure SQL incorrecte
2. **Utilisation des bons champs** : `done` au lieu de `progress_percentage` inexistant
3. **Calcul précis** : Progression basée sur le nombre réel de leçons complétées
4. **Performance** : Utilisation de Maps pour des recherches O(1) au lieu de filtres répétés

## 🎯 Intérêt pour l'Admin

Ces statistiques permettent à l'admin de :

1. **Identifier les formations populaires** : Modules avec beaucoup d'accès et de vues
2. **Détecter les problèmes d'engagement** : Modules avec faible taux de complétion
3. **Optimiser le contenu** : Modules avec progression moyenne faible = contenu à améliorer
4. **Suivre la performance** : Évolution des métriques dans le temps
5. **Prendre des décisions** : Quelles formations promouvoir, lesquelles améliorer

## 🔄 Mise à jour des données

Les statistiques sont calculées **à chaque chargement** de la page Analytiques :
- Utilisation de React Query pour le cache
- Rechargement automatique si les données changent
- Pas de rafraîchissement en temps réel (nécessite un rechargement manuel)

