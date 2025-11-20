# Guide de Test - InvestInfinity LMS

## 🧪 Scénarios de Test

### Test 1 : Connexion Client

1. Ouvrir http://localhost:5173
2. Cliquer sur "Espace Client" (bouton rose/violet dans le header)
3. Se connecter avec un compte client (email + mot de passe)
4. Vérifier redirection vers `/app`
5. Vérifier que les modules s'affichent (hub Netflix)
6. Vérifier que "Les Bases du Trading" est accessible (pas de cadenas 🔒)

**Résultat attendu :**
- ✅ Redirection vers `/app` après connexion
- ✅ Hub de modules affiché avec style Netflix
- ✅ Module "Les Bases du Trading" visible et cliquable

---

### Test 2 : Navigation Module → Leçons

1. Sur `/app`, cliquer sur "Les Bases du Trading"
2. Vérifier redirection vers `/app/modules/[id]`
3. Vérifier que les 2 leçons s'affichent :
   - "Introduction au Trading" (preview)
   - "Analyse Technique de Base"
4. Noter les titres et descriptions des leçons

**Résultat attendu :**
- ✅ Page de module affichée avec toutes les leçons
- ✅ Leçons ordonnées par position
- ✅ Badge "Preview" sur la première leçon si `is_preview = true`

---

### Test 3 : Lecteur Vidéo

1. Cliquer sur la première leçon "Introduction au Trading"
2. Vérifier redirection vers `/app/modules/[id]/lessons/[lessonId]`
3. Vérifier que le player Bunny Stream s'affiche
4. Vérifier les boutons "Précédent" / "Suivant"
5. Vérifier que la progression est trackée (dans `training_progress`)

**Résultat attendu :**
- ✅ Player Bunny Stream intégré et fonctionnel
- ✅ Vidéo se charge avec le `bunny_video_id`
- ✅ Navigation entre leçons fonctionne
- ✅ Progression sauvegardée dans la base de données

---

### Test 4 : Modules Payants (Lock)

1. Retour sur `/app` (clic sur logo ou navigation)
2. Vérifier que "Stratégies Avancées" et "Trading Algorithmique" sont verrouillés (🔒)
3. Cliquer dessus → message "Module payant" ou redirection Stripe

**Résultat attendu :**
- ✅ Modules payants affichés avec icône de cadenas
- ✅ Message d'information ou redirection vers Stripe
- ✅ Impossible d'accéder au contenu sans achat

---

### Test 5 : Connexion Admin

1. Déconnexion (si connecté)
2. Cliquer sur "Admin" (bouton discret en haut à droite du header)
3. Se connecter avec un compte admin (email + mot de passe)
4. Vérifier redirection vers `/admin`
5. Vérifier le dashboard admin (gestion des modules, utilisateurs, etc.)

**Résultat attendu :**
- ✅ Modal de connexion s'ouvre avec titre "Connexion Admin"
- ✅ Après connexion admin → redirection vers `/admin`
- ✅ Dashboard admin accessible et fonctionnel

---

### Test 6 : Protection des Routes

**Test 6.1 : Client tente d'accéder à /admin**
1. Connecté en CLIENT, tenter d'aller sur `/admin` (taper dans l'URL)
2. Vérifier redirection automatique vers `/app`

**Test 6.2 : Non authentifié tente d'accéder à /app**
1. Déconnexion
2. Tenter d'accéder à `/app` (taper dans l'URL)
3. Vérifier redirection vers `/login`

**Test 6.3 : Non-admin tente de se connecter via bouton Admin**
1. Déconnexion
2. Cliquer sur "Admin"
3. Se connecter avec un compte CLIENT (pas admin)
4. Vérifier message "Accès réservé aux administrateurs"
5. Vérifier redirection vers `/` (page d'accueil)

**Résultat attendu :**
- ✅ Routes protégées fonctionnent correctement
- ✅ Redirections automatiques selon le rôle
- ✅ Messages d'erreur clairs pour les accès non autorisés

---

### Test 7 : Vérification Base de Données

**Via Supabase Dashboard > SQL Editor :**

```sql
-- Vérifier les profils
SELECT id, email, role, created_at FROM public.profiles;

-- Vérifier les accès aux modules
SELECT 
  p.email,
  tm.title as module,
  ta.granted_at
FROM public.training_access ta
JOIN public.profiles p ON p.id = ta.user_id
JOIN public.training_modules tm ON tm.id = ta.module_id
ORDER BY ta.granted_at DESC;

-- Vérifier la progression
SELECT 
  p.email,
  tl.title as lesson,
  tp.done,
  tp.last_viewed
FROM public.training_progress tp
JOIN public.profiles p ON p.id = tp.user_id
JOIN public.training_lessons tl ON tl.id = tp.lesson_id
ORDER BY tp.last_viewed DESC;
```

---

## ✅ Checklist de Test

### Authentification
- [ ] Connexion client fonctionne (bouton "Espace Client")
- [ ] Connexion admin fonctionne (bouton "Admin")
- [ ] Déconnexion fonctionne
- [ ] Redirections après connexion correctes

### Interface Client (/app)
- [ ] Hub de modules s'affiche (style Netflix)
- [ ] Module gratuit "Les Bases du Trading" accessible
- [ ] Modules payants verrouillés (🔒)
- [ ] Navigation vers page module fonctionne

### Module et Leçons
- [ ] Page module affiche toutes les leçons
- [ ] Leçons ordonnées par position
- [ ] Badge "Preview" affiché si applicable
- [ ] Navigation vers leçon fonctionne

### Lecteur Vidéo
- [ ] Player Bunny Stream s'affiche
- [ ] Vidéo se charge avec le bon ID
- [ ] Boutons Précédent/Suivant fonctionnent
- [ ] Progression trackée dans la base de données

### Interface Admin (/admin)
- [ ] Dashboard admin accessible (admin only)
- [ ] Gestion des modules fonctionne
- [ ] Gestion des utilisateurs fonctionne

### Sécurité et Routes
- [ ] Route `/app` protégée (redirige vers `/login` si non authentifié)
- [ ] Route `/admin` protégée (admin only)
- [ ] Client ne peut pas accéder à `/admin` (redirection vers `/app`)
- [ ] Non-admin ne peut pas se connecter via bouton Admin (message d'erreur)

### Base de Données
- [ ] Accès aux modules créés dans `training_access`
- [ ] Progression sauvegardée dans `training_progress`
- [ ] Fonction `is_admin()` fonctionne correctement

---

## 🐛 Problèmes Connus / À Vérifier

1. **Chargement du profil** : Si le profil ne se charge pas après connexion, vérifier :
   - Que le profil existe dans `profiles` avec le bon `user_id`
   - Que les politiques RLS sont correctement configurées
   - Console du navigateur pour les erreurs

2. **Modules non affichés** : Si les modules ne s'affichent pas sur `/app` :
   - Vérifier que `training_access` contient des entrées pour l'utilisateur
   - Vérifier que les modules sont `is_active = true`
   - Vérifier les erreurs dans la console

3. **Player vidéo ne charge pas** : Si Bunny Stream ne fonctionne pas :
   - Vérifier que `bunny_video_id` est correct dans `training_lessons`
   - Vérifier la configuration de l'API Bunny Stream
   - Vérifier les erreurs réseau dans la console

---

## 📝 Notes de Test

**Comptes de test recommandés :**
- Client : `client@test.com` (rôle: `client`)
- Admin : `admin@test.com` (rôle: `admin`)

**URLs importantes :**
- Dev server : http://localhost:5173
- Page client : http://localhost:5173/app
- Page admin : http://localhost:5173/admin
- Page login : http://localhost:5173/login

**Commandes utiles :**
```bash
# Lancer le dev server
npm run dev

# Vérifier les types TypeScript
npm run type-check

# Linter
npm run lint
```

