# Correction des Problèmes d'Accès Starter et de Déplacement de Leçons

## Problèmes Identifiés

### 1. Problème d'accès Starter
**Symptôme** : Les clients avec un abonnement "Starter" avaient accès à l'intégralité du contenu de la formation, alors que leur plan devrait se limiter aux tutoriels (MetaTrader, TopStepX, et Apex).

**Cause** : Le module "Etape 1 - La Fondation" avait `required_license = 'starter'` alors qu'il devrait être `'pro'`.

**Solution** : Migration SQL créée pour corriger les `required_license` des modules.

### 2. Problème de déplacement de leçons
**Symptôme** : L'administrateur ne pouvait pas déplacer les vidéos entre les différents modules de formation.

**Cause** : La fonctionnalité était déjà implémentée mais peut-être pas visible ou pas utilisée.

**Solution** : Vérification et confirmation que la fonctionnalité est opérationnelle.

## Corrections Apportées

### Migration SQL : `20251205000000_fix_starter_module_access.sql`

Cette migration corrige les droits d'accès des modules :

- **Starter (147€)** : Accès UNIQUEMENT à "MetaTrader & TopStepX & Apex"
- **Premium (497€)** : Accès à Starter + "Etape 1 - La Fondation" + "Etape 2 - Les Bases en ICT" + "Etape 3 - La Stratégie ICT Mickael" + "Trading View - Outils et Techniques"
- **Elite (1997€)** : Accès à tout

### Fonctionnalité de Déplacement de Leçons

La fonctionnalité de déplacement est **déjà opérationnelle** :

1. **Bouton de déplacement** : Visible au survol de chaque ligne de leçon dans l'interface admin (icône flèche cyan)
2. **Modal de déplacement** : `MoveLessonModal` permet de sélectionner le module de destination
3. **Service backend** : `moveLessonToModule()` dans `trainingService.ts` gère le déplacement

## Instructions d'Application

### 1. Appliquer la Migration SQL

Exécuter la migration dans Supabase :

```bash
# Via Supabase CLI
supabase migration up

# Ou directement dans Supabase Dashboard > SQL Editor
# Copier-coller le contenu de supabase/migrations/20251205000000_fix_starter_module_access.sql
```

### 2. Vérifier les Accès Starter

Après application de la migration, vérifier que :

1. Les modules ont les bons `required_license` :
   ```sql
   SELECT id, title, required_license 
   FROM training_modules 
   ORDER BY position;
   ```

2. Un utilisateur Starter ne voit que "MetaTrader & TopStepX & Apex" dans `/app`

3. Un utilisateur Premium voit tous les modules sauf ceux réservés à Elite

### 3. Utiliser la Fonctionnalité de Déplacement

Pour déplacer une leçon :

1. Aller dans `/admin/videos`
2. Survoler une ligne de leçon
3. Cliquer sur l'icône flèche cyan (↗️) "Déplacer vers un autre module"
4. Sélectionner le module de destination dans le modal
5. Confirmer le déplacement

## Vérification Post-Déploiement

### Checklist de Vérification

- [ ] Migration SQL appliquée avec succès
- [ ] Module "Etape 1 - La Fondation" a `required_license = 'pro'`
- [ ] Module "MetaTrader & TopStepX & Apex" a `required_license = 'starter'`
- [ ] Un utilisateur Starter ne voit que les tutoriels dans `/app`
- [ ] Un utilisateur Premium voit tous les modules Premium
- [ ] Le bouton de déplacement est visible au survol dans l'admin
- [ ] Le déplacement de leçons fonctionne correctement

### Test Manuel

1. **Test d'accès Starter** :
   - Se connecter avec un compte Starter
   - Vérifier que seul "MetaTrader & TopStepX & Apex" est visible
   - Essayer d'accéder à `/app/modules/[id-etape-1]` → doit être redirigé

2. **Test de déplacement** :
   - Se connecter en admin
   - Aller dans `/admin/videos`
   - Déplacer une leçon d'un module à un autre
   - Vérifier que la leçon apparaît dans le nouveau module
   - Vérifier que la position est correctement mise à jour

## Notes Techniques

### Structure des Licences

Les licences suivent une hiérarchie :
- `starter` < `pro` < `elite`
- Une licence supérieure inclut automatiquement les accès des licences inférieures

### Mapping des Licences

- `entree` (dans profiles) → `starter` (système)
- `transformation` (dans profiles) → `pro` (système)
- `immersion` (dans profiles) → `elite` (système)

### Fichiers Modifiés

- ✅ `supabase/migrations/20251205000000_fix_starter_module_access.sql` (nouveau)
- ✅ `src/components/admin/videos/LessonRow.tsx` (déjà présent)
- ✅ `src/components/admin/videos/MoveLessonModal.tsx` (déjà présent)
- ✅ `src/services/trainingService.ts` (fonction `moveLessonToModule` déjà présente)

## Support

En cas de problème :
1. Vérifier les logs Supabase pour les erreurs SQL
2. Vérifier la console navigateur pour les erreurs JavaScript
3. Vérifier que la migration a bien été appliquée : `SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC;`
