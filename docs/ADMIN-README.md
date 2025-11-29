# Admin Panel - Documentation Technique

Ce document décrit l'architecture et le fonctionnement du panneau d'administration InvestInfinity.

---

## 📁 Structure des fichiers

```
src/
├── layouts/
│   └── AdminLayout.tsx          # Layout principal admin (sidebar + topbar + content)
│
├── components/admin/
│   ├── layout/
│   │   ├── AdminSidebar.tsx     # Sidebar responsive (drawer mobile, permanente desktop)
│   │   ├── AdminTopbar.tsx      # Barre supérieure (recherche, notifications, menu user)
│   │   └── AdminContent.tsx     # Wrapper du contenu principal
│   │
│   ├── videos/
│   │   ├── SecureVideoPreview.tsx  # Player vidéo avec URL signée
│   │   ├── LessonEditPanel.tsx     # Édition de leçon avec preview vidéo
│   │   └── ...
│   │
│   └── ...
│
├── pages/admin/
│   ├── DashboardPage.tsx        # Dashboard principal
│   ├── UsersPage.tsx            # Gestion utilisateurs
│   ├── FormationsPage.tsx       # Gestion formations/modules
│   ├── VideosManagement.tsx     # Gestion vidéos Bunny Stream
│   ├── PaiementsPage.tsx        # Historique paiements
│   ├── AnalyticsPage.tsx        # Statistiques
│   ├── HelpPage.tsx             # Centre d'aide et tutoriels
│   └── ...
│
├── lib/
│   └── bunny.ts                 # Module d'intégration Bunny Stream (sécurisé)
│
└── app/
    ├── routes.tsx               # Définition des routes admin
    └── router.tsx               # Router principal avec protection des routes
```

---

## 🔐 Sécurité et Rôles

### Protection des routes

Toutes les routes admin sont protégées par le composant `ProtectedRoute` :

```tsx
// src/app/router.tsx
<Route
  path="/admin/*"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLayout>...</AdminLayout>
    </ProtectedRoute>
  }
/>
```

### Rôles disponibles

| Rôle | Accès |
|------|-------|
| `admin` | Accès complet à toutes les pages admin |
| `developer` | Accès complet + fonctionnalités debug |
| `client` | Redirigé vers `/app` si tente d'accéder à `/admin` |

### Hook de vérification

```tsx
// src/hooks/useRoleGuard.ts
const { user, role, loading, isAllowed } = useRoleGuard(['admin']);
```

---

## 🎬 Vidéos Bunny Stream - Sécurité

### Architecture de sécurité

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client React  │────▶│  Edge Function   │────▶│  Bunny Stream   │
│                 │     │  (Supabase)      │     │  API            │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │
        │  Token JWT            │  API Key (secret)
        │  utilisateur          │  jamais exposée
        ▼                       ▼
   Authentifié              Génère URL signée
```

### Utilisation du module Bunny

```tsx
// src/lib/bunny.ts

// ✅ Lister les vidéos (via Edge Function)
const { items, totalItems } = await listVideos({ page: 1, itemsPerPage: 50 });

// ✅ Obtenir une URL de lecture sécurisée
const { embedUrl } = await generateSecurePlaybackUrl('video-id', { expiryHours: 2 });

// ✅ Uploader une vidéo
const result = await uploadVideo('Titre', file, (progress) => {
  console.log(`Upload: ${progress}%`);
});
```

### Edge Functions utilisées

| Fonction | Description |
|----------|-------------|
| `list-bunny-videos` | Liste les vidéos de la bibliothèque |
| `generate-bunny-token` | Génère une URL signée (expiration courte) |
| `upload-bunny-video` | Upload une nouvelle vidéo |

### Composant SecureVideoPreview

```tsx
// Affiche une vidéo avec URL signée automatique
<SecureVideoPreview videoId="abc-123" title="Ma vidéo" />
```

Ce composant :
1. Récupère automatiquement une URL signée via `generateSecurePlaybackUrl`
2. Affiche un loader pendant le chargement
3. Gère les erreurs (non authentifié, vidéo introuvable, etc.)
4. Utilise un iframe pour le player Bunny

---

## 📱 Responsive Design

### Breakpoints

| Breakpoint | Largeur | Comportement Sidebar |
|------------|---------|---------------------|
| Mobile | < 1024px | Drawer overlay (swipe to close) |
| Desktop | ≥ 1024px | Sidebar permanente |

### Classes Tailwind utilisées

```css
/* Sidebar */
lg:translate-x-0 lg:static    /* Visible sur desktop */
-translate-x-full             /* Cachée sur mobile (fermée) */
translate-x-0                 /* Visible sur mobile (ouverte) */

/* Topbar */
lg:hidden                     /* Bouton hamburger masqué sur desktop */
hidden sm:inline              /* Texte masqué sur très petit écran */
```

### Zones tactiles

Tous les boutons ont une taille minimale de 44px pour être facilement cliquables sur mobile :

```tsx
className="min-h-[44px]"
```

---

## 🧭 Navigation Admin

### Routes disponibles

| Route | Page | Section Sidebar |
|-------|------|-----------------|
| `/admin` | Dashboard | dashboard |
| `/admin/users` | Utilisateurs | users |
| `/admin/leads` | Leads | leads |
| `/admin/formations` | Formations | formations |
| `/admin/videos` | Vidéos | videos |
| `/admin/paiements` | Paiements | paiements |
| `/admin/analytiques` | Analytiques | analytiques |
| `/admin/contenu` | Pages | contenu |
| `/admin/challenges` | Défis | challenges |
| `/admin/events` | Événements | events |
| `/admin/immersion` | Immersion Élite | immersion |
| `/admin/preview` | Vue Client | preview |
| `/admin/settings` | Paramètres | settings |
| `/admin/help` | Aide & Tutoriels | help |

### Ajout d'une nouvelle route

1. Créer la page dans `src/pages/admin/`
2. Ajouter l'import lazy dans `src/app/routes.tsx`
3. Ajouter la route dans `adminRoutes` :

```tsx
// src/app/routes.tsx
const NewPage = lazy(() => import('../pages/admin/NewPage'));

export const adminRoutes: AdminRouteConfig[] = [
  // ...
  { 
    path: '/admin/new-page', 
    element: <AdminLayout activeSection="new-page"><NewPage /></AdminLayout>, 
    allowedRoles: ['admin'] 
  },
];
```

4. Ajouter l'item dans la sidebar (`AdminSidebar.tsx`) :

```tsx
// src/components/admin/layout/AdminSidebar.tsx
const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Ma Section',
    items: [
      { id: 'new-page', label: 'Nouvelle Page', icon: SomeIcon, path: '/admin/new-page' },
    ],
  },
];
```

---

## 🧪 Tests

### Exécution des tests

```bash
# Tous les tests
npm run test

# Tests spécifiques
npm run test -- src/lib/__tests__/bunny.test.ts
npm run test -- src/components/admin/layout/__tests__/AdminLayout.test.tsx
```

### Fichiers de tests

| Fichier | Couverture |
|---------|------------|
| `src/lib/__tests__/bunny.test.ts` | Module Bunny (URL signées, erreurs) |
| `src/components/admin/layout/__tests__/AdminLayout.test.tsx` | Composants layout (sidebar, topbar) |

---

## 🔧 Variables d'environnement

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# Bunny Stream (utilisé uniquement pour les miniatures publiques)
VITE_BUNNY_STREAM_LIBRARY_ID=xxx

# Edge Functions (optionnel, par défaut utilise VITE_SUPABASE_URL/functions/v1)
VITE_SUPABASE_FUNCTIONS_URL=https://xxx.supabase.co/functions/v1
```

⚠️ **Important** : Les clés API Bunny (`BUNNY_STREAM_API_KEY`, `BUNNY_SIGNING_KEY`) sont uniquement configurées côté serveur dans les secrets Supabase Edge Functions.

---

## 📝 Conventions de code

### TypeScript

- Pas de `any` - utiliser des types explicites
- Interfaces préfixées ou suffixées clairement (`AdminTopbarProps`, `BunnyVideo`)
- Types centralisés dans `src/types/`

### Commentaires

```tsx
/**
 * Description du composant/fonction
 * 
 * SÉCURITÉ : Mention si logique de sécurité
 * 
 * @example
 * <MonComposant prop="value" />
 */
```

### Nommage des fichiers

- Pages : `PascalCase.tsx` (ex: `UsersPage.tsx`)
- Composants : `PascalCase.tsx` (ex: `AdminSidebar.tsx`)
- Hooks : `camelCase.ts` (ex: `useSession.ts`)
- Services : `camelCase.ts` (ex: `bunny.ts`)
- Tests : `*.test.ts(x)` dans un dossier `__tests__/`

---

## 🚀 Déploiement

Avant de déployer, vérifier :

1. ✅ Tous les tests passent (`npm run test`)
2. ✅ Pas d'erreurs TypeScript (`npm run type-check`)
3. ✅ Build réussi (`npm run build`)
4. ✅ Variables d'environnement configurées sur Vercel
5. ✅ Secrets Supabase Edge Functions configurés

---

## 📚 Ressources

- [Bunny Stream Documentation](https://docs.bunny.net/docs/stream)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/en/main)

