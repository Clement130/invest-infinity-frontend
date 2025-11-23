# Correction du Bug de Redirection lors du Changement d'Onglet

## 🐛 Problème Identifié

Lorsqu'un utilisateur admin change d'onglet dans le navigateur et revient sur l'onglet de l'application, il est redirigé vers la page d'accueil au lieu de rester sur le dashboard admin.

## 🔍 Cause Racine

Quand l'utilisateur change d'onglet et revient :

1. **Vérification de session Supabase** : Supabase vérifie automatiquement la session quand l'onglet revient au focus
2. **Événement `onAuthStateChange`** : Cet événement se déclenche et recharge le profil
3. **Perte temporaire du profil** : Pendant le rechargement, le profil devient temporairement `null`
4. **Redirection automatique** : Le `ProtectedRoute` détecte l'absence de rôle et redirige vers la page d'accueil

## ✅ Corrections Apportées

### 1. Conservation du Profil lors des Vérifications de Session (`AuthContext.tsx`)

**Avant** : Le profil était rechargé à chaque événement `onAuthStateChange`, même lors de simples vérifications de session.

**Maintenant** : Le profil existant est conservé pendant les vérifications de session si l'utilisateur est le même :

```typescript
if (sessionUser) {
  // Si l'utilisateur est le même et qu'on a déjà un profil, on le conserve
  // pendant le rechargement pour éviter les redirections
  if (sessionUser.id === previousUser?.id && profileRef.current) {
    console.log('[AuthContext] Vérification de session - conservation du profil existant');
    // Conserver le profil pendant le rechargement
    setProfile(profileRef.current);
    // Recharger en arrière-plan
    loadProfile(sessionUser.id);
  } else {
    // Nouvel utilisateur ou pas de profil en mémoire, charger normalement
    loadProfile(sessionUser.id);
  }
}
```

### 2. Amélioration des Logs (`useRoleGuard.ts`)

Ajout de logs pour mieux comprendre le comportement :

```typescript
if (role && user) {
  setLastValidRole(role);
  console.log('[useRoleGuard] Rôle valide mémorisé:', role);
}
```

## 📋 Fichiers Modifiés

1. **`src/context/AuthContext.tsx`**
   - Conservation du profil lors des vérifications de session normales
   - Pas seulement pour `TOKEN_REFRESHED`, mais aussi pour tous les événements où l'utilisateur reste le même

2. **`src/hooks/useRoleGuard.ts`**
   - Ajout de logs pour le débogage
   - La logique existante avec `lastValidRole` fonctionne déjà correctement

## 🧪 Test

Pour tester la correction :

1. Se connecter en tant qu'admin
2. Naviguer vers `/admin`
3. Changer d'onglet (ouvrir un autre onglet)
4. Revenir sur l'onglet de l'application
5. **Vérifier** : L'utilisateur doit rester sur `/admin` et ne pas être redirigé

## 🔍 Logs à Surveiller

Dans la console du navigateur, vous devriez voir :

```
[AuthContext] Vérification de session - conservation du profil existant
[useRoleGuard] Rôle valide mémorisé: admin
```

Si ces logs apparaissent, le correctif fonctionne.

## 📝 Notes Techniques

- Le problème se produisait car Supabase vérifie la session quand l'onglet revient au focus
- La solution conserve le profil en mémoire (`profileRef`) et le réutilise pendant les rechargements
- Le profil est rechargé en arrière-plan pour rester à jour, mais l'utilisateur ne voit pas d'interruption
- La logique avec `lastValidRole` dans `useRoleGuard` assure une double protection

## ✅ Checklist de Vérification

- [ ] Code modifié et commité
- [ ] Code poussé sur GitHub
- [ ] Déploiement Vercel réussi
- [ ] Test de changement d'onglet effectué
- [ ] Aucune redirection lors du retour sur l'onglet
- [ ] Logs de console vérifiés
- [ ] Problème résolu

