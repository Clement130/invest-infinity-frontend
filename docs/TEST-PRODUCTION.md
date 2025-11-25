# Guide de Test en Production - Correctif Session Admin

## ✅ Vérifications Automatiques Effectuées

### Tests de Base
- ✅ Application accessible (200 OK)
- ✅ Temps de réponse: 128ms
- ✅ React et Vite détectés
- ✅ Assets chargés correctement
- ✅ Route /admin accessible

## 🧪 Test Manuel du Correctif

### Prérequis
1. Navigateur avec console développeur (F12)
2. Compte admin valide
3. Au moins 10 minutes disponibles

### Étapes de Test

#### 1. Connexion Admin
```
1. Ouvrir https://invest-infinity-frontend.vercel.app
2. Cliquer sur "Connexion"
3. Saisir les identifiants admin
4. Vérifier la connexion réussie
```

#### 2. Navigation vers Dashboard Admin
```
1. Naviguer vers /admin
2. Vérifier que le dashboard s'affiche correctement
3. Noter l'URL actuelle (doit être /admin ou /admin/*)
```

#### 3. Surveillance de la Console
Ouvrir la console (F12) et surveiller les logs suivants :

**Logs attendus (normaux) :**
```
[AuthContext] Chargement du profil pour userId: ...
[AuthContext] Profil chargé: { id: ..., email: ..., role: ... }
```

**Logs à surveiller (rafraîchissement) :**
```
[AuthContext] TOKEN_REFRESHED détecté
[useRoleGuard] Utilisation du dernier rôle valide
```

**Logs d'erreur (à éviter) :**
```
[ProtectedRoute] Redirection vers /
[useRoleGuard] Attente du rôle depuis plus de 3 secondes
```

#### 4. Test de Stabilité
```
1. Rester sur la page /admin
2. Attendre au moins 10 minutes (rafraîchissement token ~1h)
3. Surveiller l'URL dans la barre d'adresse
4. Vérifier qu'elle reste sur /admin ou /admin/*
5. Vérifier qu'aucune redirection vers / ou /login ne se produit
```

#### 5. Test de Rafraîchissement Manuel
```
1. Rester sur /admin
2. Ouvrir la console (F12)
3. Dans l'onglet Application > Storage > Local Storage
4. Surveiller les changements de session Supabase
5. Vérifier que le rôle reste "admin" ou "developer"
```

## 🔍 Vérifications Spécifiques

### Vérifier le Code Déployé

Dans la console du navigateur, exécuter :

```javascript
// Vérifier que React est chargé
console.log('React:', typeof window.React !== 'undefined');

// Vérifier que Supabase est configuré
console.log('Supabase:', typeof window.supabase !== 'undefined');

// Vérifier la session actuelle
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session ? 'Active' : 'Inactive');
console.log('User ID:', session?.user?.id);
```

### Vérifier le Profil

```javascript
// Récupérer le profil
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();

console.log('Profil:', profile);
console.log('Rôle:', profile?.role);
```

### Simuler un Rafraîchissement

```javascript
// Forcer un rafraîchissement de token (pour test)
const { data, error } = await supabase.auth.refreshSession();
console.log('Rafraîchissement:', error ? error.message : 'Succès');
console.log('Nouvelle session:', data?.session ? 'Active' : 'Inactive');
```

## 📊 Critères de Succès

### ✅ Test Réussi Si :
- L'URL reste sur `/admin` ou `/admin/*` pendant toute la durée du test
- Aucune redirection vers `/` ou `/login` ne se produit
- Les logs de console ne montrent pas d'erreurs de redirection
- Le rôle reste "admin" ou "developer" dans le profil
- La session reste active

### ❌ Test Échoué Si :
- Redirection vers `/` ou `/login` après quelques minutes
- Logs d'erreur dans la console concernant le rôle
- Message "Accès refusé" ou "Session expirée"
- Le rôle devient `null` dans les logs

## 🐛 En Cas de Problème

### Si la redirection persiste :

1. **Vérifier les logs de console**
   - Copier tous les logs de la console
   - Noter l'heure exacte de la redirection
   - Vérifier les erreurs réseau (onglet Network)

2. **Vérifier la session Supabase**
   ```javascript
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Session expirée:', !session);
   console.log('Token expiré:', session?.expires_at < Date.now() / 1000);
   ```

3. **Vérifier le profil**
   ```javascript
   const { data: profile } = await supabase
     .from('profiles')
     .select('role')
     .eq('id', session.user.id)
     .single();
   console.log('Rôle:', profile?.role);
   ```

4. **Contacter le support**
   - Fournir les logs de console
   - Fournir l'heure exacte du problème
   - Fournir les résultats des vérifications ci-dessus

## 📝 Notes

- Le rafraîchissement automatique de token Supabase se produit environ toutes les heures
- Le correctif conserve le rôle en mémoire pendant le rafraîchissement
- Le profil est rechargé en arrière-plan sans interruption
- La solution est transparente pour l'utilisateur

## 🔗 Liens Utiles

- Application Production: https://invest-infinity-frontend.vercel.app
- Dashboard Admin: https://invest-infinity-frontend.vercel.app/admin
- Documentation Supabase: https://supabase.com/docs/guides/auth

