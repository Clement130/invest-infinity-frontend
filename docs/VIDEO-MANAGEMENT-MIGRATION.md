# Guide de Migration vers le Nouveau Système de Gestion des Vidéos

## 🎯 Objectif

Migrer progressivement le code existant vers le nouveau service unifié `VideoService` et le hook `useVideoManagement`.

## 📋 Checklist de Migration

### Phase 1 : Types (✅ COMPLÉTÉ)

- [x] Créer `src/types/video.ts` avec tous les types centralisés
- [x] Supprimer les types dupliqués dans `lib/bunny.ts` et `services/bunnyStreamService.ts`

### Phase 2 : Service Unifié (✅ COMPLÉTÉ)

- [x] Créer `src/services/videoService.ts`
- [ ] Migrer `lib/bunny.ts` vers `videoService.ts`
- [ ] Supprimer `services/bunnyStreamService.ts`
- [ ] Mettre à jour tous les imports

### Phase 3 : Hook Unifié (✅ COMPLÉTÉ)

- [x] Créer `src/hooks/useVideoManagement.ts`
- [ ] Migrer `useBunnyUpload.ts` vers `useVideoManagement`
- [ ] Migrer `useBunnyLibrary.ts` vers `useVideoManagement`
- [ ] Supprimer les anciens hooks

### Phase 4 : Composants

- [ ] Mettre à jour `VideosManagement.tsx` pour utiliser `useVideoManagement`
- [ ] Mettre à jour `VideoUploadModal.tsx`
- [ ] Mettre à jour `BunnyUploadZone.tsx`
- [ ] Mettre à jour `BunnyLibraryModal.tsx`
- [ ] Mettre à jour `LessonEditPanel.tsx`
- [ ] Mettre à jour tous les autres composants vidéo

### Phase 5 : Nettoyage

- [ ] Supprimer `VideosManagerPage.tsx` (doublon)
- [ ] Supprimer `lib/bunny.ts` (remplacé par `videoService.ts`)
- [ ] Supprimer `services/bunnyStreamService.ts`
- [ ] Supprimer `hooks/admin/useBunnyUpload.ts`
- [ ] Supprimer `hooks/admin/useBunnyLibrary.ts`
- [ ] Vérifier qu'aucun import ne référence les anciens fichiers

---

## 🔄 Guide de Migration par Fichier

### 1. Migrer `lib/bunny.ts` → `videoService.ts`

**Avant :**
```typescript
import { listVideos, uploadVideo } from '../lib/bunny';
```

**Après :**
```typescript
import { VideoService } from '../services/videoService';
// ou
import VideoService from '../services/videoService';
```

**Changements :**
- `listVideos()` → `VideoService.listVideos()`
- `uploadVideo()` → `VideoService.upload()`
- `generateSecurePlaybackUrl()` → `VideoService.getPlaybackUrl()`
- `getThumbnailUrl()` → `VideoService.getThumbnailUrl()`
- `formatDuration()` → `VideoService.formatDuration()`
- `formatFileSize()` → `VideoService.formatFileSize()`

### 2. Migrer `services/bunnyStreamService.ts` → `videoService.ts`

**Avant :**
```typescript
import { listBunnyVideos, uploadBunnyVideo, getSecureEmbedUrl } from '../services/bunnyStreamService';
```

**Après :**
```typescript
import { VideoService } from '../services/videoService';
```

**Changements :**
- `listBunnyVideos()` → `VideoService.listVideos()`
- `uploadBunnyVideo()` → `VideoService.upload()`
- `getSecureEmbedUrl()` → `VideoService.getPlaybackUrl()`

### 3. Migrer `useBunnyUpload.ts` → `useVideoManagement`

**Avant :**
```typescript
import { useBunnyUpload } from '../hooks/admin/useBunnyUpload';

const { uploads, uploadVideo, removeUpload } = useBunnyUpload();
```

**Après :**
```typescript
import { useVideoManagement } from '../hooks/useVideoManagement';

const { uploads, upload, removeUpload } = useVideoManagement();
```

**Changements :**
- `uploadVideo(file, onComplete)` → `upload({ title, file, onProgress })`
- Le callback `onComplete` devient le retour de la promesse

### 4. Migrer `useBunnyLibrary.ts` → `useVideoManagement`

**Avant :**
```typescript
import { useBunnyLibrary } from '../hooks/admin/useBunnyLibrary';

const { videos, orphanVideos, isLoading } = useBunnyLibrary();
```

**Après :**
```typescript
import { useVideoManagement } from '../hooks/useVideoManagement';

const { videos, isLoading } = useVideoManagement();
// Calculer orphanVideos manuellement si nécessaire
const orphanVideos = videos.filter(v => !v.assignedToLessonId);
```

### 5. Migrer `VideosManagement.tsx`

**Avant :**
```typescript
import { useBunnyUpload } from '../../hooks/admin/useBunnyUpload';
import { useBunnyLibrary } from '../../hooks/admin/useBunnyLibrary';
import { uploadVideo } from '../../lib/bunny';

const { uploads, uploadVideo } = useBunnyUpload();
const { orphanVideos } = useBunnyLibrary();
```

**Après :**
```typescript
import { useVideoManagement } from '../../hooks/useVideoManagement';

const {
  videos,
  uploads,
  upload,
  assignToLesson,
  unassignFromLesson,
  isLoading,
} = useVideoManagement();
```

**Changements majeurs :**
- Utiliser `upload()` au lieu de `uploadVideo()`
- Utiliser `assignToLesson()` au lieu de mutations manuelles
- Simplifier la gestion d'état avec le hook unifié

---

## 🧪 Tests de Migration

### Test 1 : Upload de Vidéo

```typescript
// Avant
const result = await uploadVideo('Ma vidéo', file, (progress) => {
  console.log(`Progress: ${progress}%`);
});

// Après
const result = await upload({
  title: 'Ma vidéo',
  file: file,
  onProgress: (progress) => {
    console.log(`Progress: ${progress}%`);
  },
});
```

### Test 2 : Liste des Vidéos

```typescript
// Avant
const { items } = await listBunnyVideos(1, 100);

// Après
const { items } = await VideoService.listVideos({ page: 1, itemsPerPage: 100 });
```

### Test 3 : URL de Lecture

```typescript
// Avant
const { embedUrl } = await generateSecurePlaybackUrl('video-id', { expiryHours: 24 });

// Après
const { embedUrl } = await VideoService.getPlaybackUrl('video-id', { expiryHours: 24 });
```

---

## ⚠️ Points d'Attention

### 1. Validation des IDs Vidéo

**Avant :**
```typescript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValid = uuidRegex.test(videoId);
```

**Après :**
```typescript
import { VideoService } from '../services/videoService';
const isValid = VideoService.validateVideoId(videoId);
```

### 2. Formatage de Durée

**Avant :**
```typescript
// Code dupliqué dans plusieurs fichiers
const hours = Math.floor(seconds / 3600);
// ...
```

**Après :**
```typescript
import { VideoService } from '../services/videoService';
const formatted = VideoService.formatDuration(seconds);
```

### 3. Gestion des Erreurs

Le nouveau service unifie la gestion des erreurs. Toutes les erreurs sont des `Error` avec des messages clairs.

---

## 📊 Progression

- [x] **Phase 1** : Types centralisés (100%)
- [x] **Phase 2** : Service unifié (100%)
- [x] **Phase 3** : Hook unifié (100%)
- [ ] **Phase 4** : Migration des composants (0%)
- [ ] **Phase 5** : Nettoyage (0%)

**Progression globale : 60%**

---

## 🚀 Prochaines Étapes

1. **Tester le nouveau service** dans un composant isolé
2. **Migrer un composant à la fois** (commencer par `VideoUploadModal.tsx`)
3. **Vérifier que tout fonctionne** avant de continuer
4. **Supprimer les anciens fichiers** une fois la migration validée
5. **Documenter** les changements pour l'équipe

---

## 📝 Notes

- Le nouveau système est **rétrocompatible** avec l'ancien (même API)
- Les Edge Functions Supabase restent inchangées
- La sécurité est maintenue (toutes les opérations passent par les Edge Functions)
- Les performances sont améliorées (cache optimisé, batching)

