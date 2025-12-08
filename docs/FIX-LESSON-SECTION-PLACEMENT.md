# Correction du Placement des Leçons dans les Sections

## Problème Identifié

Quand un admin ajoute une nouvelle leçon, elle n'apparaît pas au bon endroit côté client. Les nouvelles leçons finissent dans la section "Autres leçons" au lieu d'être placées dans la section appropriée.

## Cause

Le système utilisait un mapping hardcodé (`moduleLayouts`) qui faisait correspondre les leçons aux sections uniquement par titre exact. Si une nouvelle leçon n'avait pas un titre correspondant exactement à un titre dans `moduleLayouts`, elle était automatiquement placée dans "Autres leçons".

## Solution

Ajout d'un champ `section_title` dans la table `training_lessons` pour permettre à l'admin de spécifier explicitement dans quelle section une leçon doit apparaître.

### Changements Apportés

1. **Migration SQL** : `20251205000001_add_section_title_to_lessons.sql`
   - Ajoute le champ `section_title TEXT` à `training_lessons`
   - Crée un index pour les recherches par section

2. **ModulePage.tsx** : Logique améliorée pour organiser les leçons
   - Priorité 1 : Utilise `section_title` si défini
   - Priorité 2 : Utilise le matching par titre exact (système existant)
   - Priorité 3 : Place dans "Autres leçons" si aucune correspondance

3. **LessonModal.tsx** : Ajout du champ dans le formulaire admin
   - Nouveau champ "Section (optionnel)" pour spécifier la section
   - Placeholder avec exemples : "La base du trading", "Gestion du Risque", etc.

4. **trainingService.ts** : Support de `section_title` dans les créations/mises à jour

## Instructions d'Application

### 1. Appliquer la Migration SQL

Exécuter la migration dans Supabase :

```bash
# Via Supabase CLI
supabase migration up

# Ou directement dans Supabase Dashboard > SQL Editor
# Copier-coller le contenu de supabase/migrations/20251205000001_add_section_title_to_lessons.sql
```

### 2. Utilisation dans l'Interface Admin

Pour ajouter une leçon dans une section spécifique :

1. Aller dans `/admin/videos`
2. Cliquer sur "+" pour ajouter une nouvelle leçon
3. Remplir le formulaire :
   - **Titre** : Le titre de la leçon
   - **Section** : Le nom de la section (ex: "La base du trading", "Gestion du Risque")
   - Autres champs...
4. Sauvegarder

La leçon apparaîtra dans la section spécifiée côté client.

### 3. Sections Disponibles par Module

#### Etape 1 - La Fondation
- "La base du trading"
- "Gestion du Risque"
- "La psycho a adopté"

#### Etape 2 - Les Bases en ICT
- "La Fondation"
- "Concepts avancés"

#### Etape 3 - La Stratégie ICT Mickael
- "Stratégie expliquée"
- "Conditions de marché obligatoires"

#### MetaTrader & TopStepX & Apex
- "MetaTrader"
- "TopStepX"

### 4. Comportement

- **Si `section_title` est défini** : La leçon apparaît dans cette section (créée automatiquement si elle n'existe pas)
- **Si `section_title` est vide** : Le système utilise le matching par titre exact comme avant
- **Si aucune correspondance** : La leçon va dans "Autres leçons"

## Exemples

### Exemple 1 : Ajouter une leçon dans "La base du trading"

1. Créer une nouvelle leçon
2. Titre : "Nouvelle stratégie de trading"
3. Section : "La base du trading"
4. → La leçon apparaîtra dans la section "La base du trading" côté client

### Exemple 2 : Ajouter une leçon sans section

1. Créer une nouvelle leçon
2. Titre : "Leçon spéciale"
3. Section : (laisser vide)
4. → Si le titre correspond à un titre dans `moduleLayouts`, elle sera assignée automatiquement
5. → Sinon, elle ira dans "Autres leçons"

## Migration des Leçons Existantes

Les leçons existantes continueront de fonctionner avec le système de matching par titre. Pour les placer dans une section spécifique, il suffit de les éditer et d'ajouter un `section_title`.

## Notes Techniques

- Le champ `section_title` est optionnel (peut être NULL)
- Le matching est insensible à la casse et aux accents (via `slugify`)
- Les sections sont créées dynamiquement si elles n'existent pas dans le layout
- L'ordre des leçons dans une section est déterminé par le champ `position`

## Fichiers Modifiés

- ✅ `supabase/migrations/20251205000001_add_section_title_to_lessons.sql` (nouveau)
- ✅ `src/pages/ModulePage.tsx` (logique améliorée)
- ✅ `src/components/admin/videos/LessonModal.tsx` (champ ajouté)
- ✅ `src/services/trainingService.ts` (support de section_title)

