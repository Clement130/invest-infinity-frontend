# Correction du Bug de Redirection Admin

## 🐛 Problème identifié

Les utilisateurs admin étaient redirigés vers la page d'accueil après un certain temps passé dans le dashboard admin. Ce bug était causé par le rafraîchissement automatique de la session Supabase.

## 🔍 Cause racine

1. **Rafraîchissement automatique de session** : Supabase rafraîchit automatiquement les tokens d'authentification toutes les heures environ
2. **Événement TOKEN_REFRESHED** : Cet événement déclenchait un rechargement du profil utilisateur
3. **Perte temporaire du rôle** : Pendant le rechargement, le rôle devenait temporairement `null`
4. **Redirection automatique** : Le `ProtectedRoute` détectait l'absence de rôle et redirigeait vers la page d'accueil

## ✅ Corrections apportées

### 1. Gestion du rafraîchissement de token (`AuthContext.tsx`)

- **Détection de l'événement `TOKEN_REFRESHED`** : Le système détecte maintenant spécifiquement les rafraîchissements de token
- **Conservation du profil** : Le profil existant est conservé pendant le rafraîchissement
- **Rechargement en arrière-plan** : Le profil est rechargé de manière asynchrone sans bloquer l'interface
- **Correction de la dépendance** : Utilisation de `setUser` avec fonction callback pour éviter les problèmes de dépendances

```typescript
if (event === 'TOKEN_REFRESHED' && sessionUser?.id === previousUser?.id) {
  setIsRefreshing(true);
  // On garde le profil existant pendant le rafraîchissement
  loadProfile(sessionUser.id).finally(() => {
    setIsRefreshing(false);
  });
  return sessionUser;
}
```

### 2. Mémorisation du dernier rôle valide (`useRoleGuard.ts`)

- **État `lastValidRole`** : Conservation en mémoire du dernier rôle valide
- **Utilisation du rôle en cache** : Si le rôle actuel est `null` pendant un rafraîchissement, on utilise le dernier rôle valide
- **Réinitialisation propre** : Le rôle en cache est réinitialisé lors de la déconnexion

```typescript
const [lastValidRole, setLastValidRole] = useState<UserRole | null>(null);

// Utiliser le rôle actuel ou le dernier rôle valide si on est en train de recharger
const currentRole = role ?? lastValidRole;
```

### 3. Amélioration de la logique `awaitingRole`

- **Pas d'attente si rôle en cache** : Si un rôle valide est en mémoire, on n'attend pas
- **Réinitialisation du timer** : Le timer est réinitialisé uniquement lors d'une nouvelle attente réelle

## 🧪 Tests

### Test manuel

1. Se connecter en tant qu'admin
2. Naviguer vers `/admin`
3. Rester sur la page pendant au moins 10 minutes
4. Vérifier qu'aucune redirection ne se produit

### Test automatisé

Un script de test a été créé : `scripts/test-admin-session-redirect.js`

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=password node scripts/test-admin-session-redirect.js
```

Ce script :
- Se connecte en tant qu'admin
- Navigue vers le dashboard admin
- Surveille les redirections pendant 10 secondes
- Génère des captures d'écran en cas d'échec

## 📋 Fichiers modifiés

1. `src/context/AuthContext.tsx`
   - Gestion de l'événement `TOKEN_REFRESHED`
   - Conservation du profil pendant le rafraîchissement
   - Correction des dépendances du `useEffect`

2. `src/hooks/useRoleGuard.ts`
   - Ajout de `lastValidRole` pour mémoriser le dernier rôle valide
   - Utilisation du rôle en cache pendant les rafraîchissements
   - Amélioration de la logique `awaitingRole`

## 🚀 Déploiement

Les modifications sont prêtes pour la production. Aucune migration de base de données n'est nécessaire.

### Checklist de déploiement

- [x] Code vérifié et testé localement
- [x] Aucune erreur de linter
- [x] Script de test créé
- [ ] Tests en production effectués
- [ ] Monitoring mis en place

## 🔍 Monitoring

Pour surveiller le comportement en production, vérifier dans la console du navigateur :

- `[AuthContext]` : Logs de chargement de profil
- `[useRoleGuard]` : Logs de vérification de rôle
- `[ProtectedRoute]` : Logs de protection des routes

## 📝 Notes

- Le rafraîchissement de token Supabase se produit automatiquement toutes les heures
- Le profil est maintenant rechargé en arrière-plan sans interruption
- Le dernier rôle valide est conservé en mémoire pour éviter les redirections
- La solution est transparente pour l'utilisateur

