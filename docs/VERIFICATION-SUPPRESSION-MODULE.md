# Vérification de la fonctionnalité de suppression de module en production

Ce guide vous explique comment vérifier que la fonctionnalité de suppression de module fonctionne correctement en production.

## ✅ Checklist de vérification

### 1. Vérifier que les fichiers sont déployés

Les fichiers suivants doivent être présents dans le build de production :

- ✅ `src/components/admin/videos/ModuleSection.tsx` - Contient le bouton de suppression
- ✅ `src/components/admin/videos/FormationTreeView.tsx` - Passe le handler de suppression
- ✅ `src/pages/admin/VideosManagement.tsx` - Contient la logique de suppression
- ✅ `src/components/admin/videos/ConfirmDeleteModal.tsx` - Modal de confirmation

### 2. Vérification manuelle en production

#### Étape 1 : Accéder à la page de gestion des vidéos

1. Connectez-vous à l'application en production
2. Allez sur `/admin/videos`
3. Vérifiez que la page se charge sans erreur

#### Étape 2 : Localiser le bouton de suppression

Pour chaque module affiché, vous devriez voir :

1. **Bouton d'ajout de leçon** (icône + verte) - À gauche
2. **Bouton d'édition** (icône crayon bleue) - Au milieu
3. **Bouton de suppression** (icône corbeille rouge) - À droite ⭐ **NOUVEAU**

Le bouton de suppression devrait être visible à côté du bouton d'édition dans l'en-tête de chaque module.

#### Étape 3 : Tester la suppression

1. Cliquez sur l'icône de corbeille rouge du module que vous souhaitez supprimer
2. Un modal de confirmation devrait s'afficher avec :
   - Le titre du module
   - Le nombre de leçons qui seront supprimées
   - Un avertissement sur l'irréversibilité
3. Cliquez sur "Supprimer" pour confirmer
4. Le module et toutes ses leçons devraient être supprimés

### 3. Vérification dans la console du navigateur

Ouvrez la console (F12) et vérifiez :

1. **Aucune erreur JavaScript** lors du chargement de la page
2. **Aucune erreur** lors du clic sur le bouton de suppression
3. **Requête API réussie** lors de la confirmation de suppression

### 4. Vérification du code source

Pour vérifier que le code est bien déployé :

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet "Sources" ou "Network"
3. Vérifiez que les fichiers JavaScript contiennent :
   - Le composant `ConfirmDeleteModal`
   - Le handler `handleDeleteModule`
   - Le bouton avec l'icône `Trash2`

### 5. Test de régression

Vérifiez que les autres fonctionnalités fonctionnent toujours :

- ✅ Création de module
- ✅ Édition de module
- ✅ Ajout de leçon
- ✅ Édition de leçon
- ✅ Suppression de leçon

## 🔍 Dépannage

### Le bouton de suppression n'apparaît pas

**Causes possibles :**

1. **Cache du navigateur** : Videz le cache (Ctrl+Shift+R ou Cmd+Shift+R)
2. **Déploiement non terminé** : Attendez quelques minutes après le push
3. **Build échoué** : Vérifiez les logs de déploiement sur Vercel
4. **Erreur JavaScript** : Vérifiez la console pour les erreurs

**Solutions :**

```bash
# Vider le cache du navigateur
# Chrome/Edge: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete

# Ou forcer le rechargement
# Windows: Ctrl+F5
# Mac: Cmd+Shift+R
```

### Le modal de confirmation ne s'affiche pas

**Vérifications :**

1. Vérifiez que `ConfirmDeleteModal.tsx` est bien dans le build
2. Vérifiez la console pour les erreurs
3. Vérifiez que `deleteModuleConfirm` est bien défini dans l'état

### La suppression ne fonctionne pas

**Vérifications :**

1. Vérifiez les permissions RLS dans Supabase
2. Vérifiez que l'utilisateur a les droits admin
3. Vérifiez les logs de la mutation dans la console
4. Vérifiez que `deleteModule` est bien appelé dans `trainingService.ts`

## 📝 Commandes utiles

```bash
# Vérifier le build localement
npm run build

# Tester en local
npm run dev

# Vérifier les types TypeScript
npm run lint
```

## 🚀 Déploiement

Pour déployer les changements :

1. **Commit et push sur GitHub :**
   ```bash
   git add .
   git commit -m "feat: ajout de la fonctionnalité de suppression de module"
   git push origin main
   ```

2. **Vercel déploiera automatiquement** (si configuré)

3. **Attendre 3-5 minutes** pour le déploiement

4. **Vérifier le déploiement** sur Vercel Dashboard

## ✅ Résultat attendu

Après vérification, vous devriez pouvoir :

- ✅ Voir le bouton de suppression (icône corbeille rouge) à côté du bouton d'édition
- ✅ Cliquer sur le bouton et voir le modal de confirmation
- ✅ Confirmer la suppression et voir le module disparaître
- ✅ Recevoir un message de succès via toast

## 📞 Support

Si le problème persiste :

1. Vérifiez les logs de déploiement sur Vercel
2. Vérifiez les erreurs dans la console du navigateur
3. Vérifiez que tous les fichiers sont bien commités et poussés
4. Vérifiez que le build Vercel est réussi

