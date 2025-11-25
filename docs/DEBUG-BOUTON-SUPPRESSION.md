# 🔍 Debug - Bouton Supprimer Non Visible

## Problème
Le bouton "Supprimer" n'apparaît pas sur la page ModulePage.

## Causes Possibles

### 1. Rôle utilisateur non détecté
Le bouton n'apparaît que si `role === 'admin' || role === 'developer'`.

**Vérification :**
1. Ouvrir la console du navigateur (F12)
2. Aller sur `/app/modules/{moduleId}`
3. Vérifier les logs :
   ```
   [ModulePage] Rôle utilisateur: ...
   [ModulePage] isAdmin: ...
   [ModulePage] User: ...
   ```

**Solutions :**
- Si `role` est `null` ou `undefined` : Vérifier que l'utilisateur est bien connecté
- Si `role` n'est pas `'admin'` ou `'developer'` : L'utilisateur n'a pas les droits

### 2. Code non déployé en production

**Vérification :**
```bash
# Vérifier que les fichiers sont commités
git status

# Vérifier que les changements sont poussés
git log --oneline -5
```

**Solution :**
```bash
git add src/pages/ModulePage.tsx src/services/trainingService.ts
git commit -m "feat: ajout bouton suppression module"
git push origin main
```

### 3. Cache du navigateur

**Solution :**
- Vider le cache : Ctrl+Shift+Delete
- Recharger en forçant : Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac)
- Mode navigation privée pour tester

### 4. Erreur JavaScript

**Vérification :**
1. Ouvrir la console (F12)
2. Vérifier s'il y a des erreurs en rouge
3. Vérifier l'onglet "Network" pour les erreurs de chargement

## Test de Debug

### Test 1 : Vérifier le rôle
```javascript
// Dans la console du navigateur
console.log('Rôle:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
```

### Test 2 : Forcer l'affichage (temporaire)
Modifier temporairement le code pour forcer l'affichage :

```tsx
// Remplacer {isAdmin && ( par {true && (
{true && (
  <button
    onClick={handleDeleteModule}
    ...
  >
```

Si le bouton apparaît avec `true`, le problème vient de `isAdmin`.

### Test 3 : Vérifier useSession
```tsx
// Ajouter un log dans ModulePage
console.log('useSession result:', { user, role, isAdmin });
```

## Code Actuel

Le bouton est conditionné ainsi :
```tsx
{isAdmin ? (
  <button>Supprimer</button>
) : (
  // En dev, affiche un message
  process.env.NODE_ENV === 'development' && (
    <span>(Admin uniquement)</span>
  )
)}
```

## Checklist de Vérification

- [ ] L'utilisateur est connecté
- [ ] Le rôle est bien `'admin'` ou `'developer'`
- [ ] Les fichiers sont commités et poussés
- [ ] Le build de production est à jour
- [ ] Le cache du navigateur est vidé
- [ ] Aucune erreur JavaScript dans la console
- [ ] Le code est bien déployé sur Vercel

## Solution Rapide

Si vous êtes sûr d'être admin mais le bouton n'apparaît pas :

1. **Vérifier dans la console** :
   ```javascript
   // Dans la console du navigateur sur /app/modules/{id}
   // Vous devriez voir :
   [ModulePage] Rôle utilisateur: admin
   [ModulePage] isAdmin: true
   ```

2. **Si le rôle est null** :
   - Se déconnecter et se reconnecter
   - Vérifier le profil dans Supabase
   - Vérifier que `profiles.role` est bien défini

3. **Si tout est correct mais le bouton n'apparaît toujours pas** :
   - Vérifier que le build est bien déployé
   - Attendre quelques minutes après le push
   - Vider complètement le cache

