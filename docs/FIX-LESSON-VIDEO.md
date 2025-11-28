# Guide : Résoudre le problème "Vidéo non configurée"

## Problème

Lors de l'affichage d'une leçon, vous voyez le message :
> **Vidéo non configurée**  
> Aucun identifiant vidéo n'est associé à cette leçon.

Cela signifie que la leçon n'a pas de `bunny_video_id` associé dans la base de données.

## Solution rapide

### Option 1 : Utiliser le script interactif

```bash
node scripts/check-lessons-without-video.js
```

Ce script vous affichera toutes les leçons sans vidéo et vous permettra d'associer une vidéo à une leçon spécifique.

### Option 2 : Associer une vidéo directement

Si vous connaissez l'ID de la leçon et l'ID de la vidéo Bunny Stream :

```bash
node scripts/associate-video-to-lesson.js <lesson-id> <video-id>
```

Exemple :
```bash
node scripts/associate-video-to-lesson.js abc123-def456-789 9295490a-0072-4752-996d-6f573306318b
```

### Option 3 : Mode interactif avec recherche

```bash
node scripts/associate-video-to-lesson.js
```

Le script vous guidera pour rechercher une leçon et lui associer une vidéo.

## Trouver l'ID de la leçon

### Depuis l'interface admin

1. Allez sur `/app/admin/videos`
2. Recherchez la leçon concernée
3. L'ID de la leçon est affiché dans les détails

### Depuis la console du navigateur

1. Ouvrez la page de la leçon qui affiche l'erreur
2. Ouvrez la console du navigateur (F12)
3. Cherchez les logs qui commencent par `[LessonPlayerPage]`
4. Vous verrez l'ID de la leçon dans les logs

### Depuis la base de données

```sql
SELECT id, title, bunny_video_id, module_id
FROM training_lessons
WHERE title ILIKE '%nom-de-la-leçon%';
```

## Trouver l'ID de la vidéo Bunny Stream

### Depuis l'interface admin

1. Allez sur `/app/admin/videos`
2. Cliquez sur "Bibliothèque Bunny Stream"
3. Les vidéos disponibles sont listées avec leur ID

### Depuis l'API Bunny Stream

Les vidéos sont stockées dans votre bibliothèque Bunny Stream. L'ID de la vidéo est un UUID (ex: `9295490a-0072-4752-996d-6f573306318b`).

## Vérifier toutes les leçons sans vidéo

Pour obtenir un rapport complet des leçons sans vidéo :

```bash
node scripts/check-lessons-without-video.js
```

## Correction en masse

Si vous avez plusieurs leçons à corriger, vous pouvez utiliser le script SQL généré :

```bash
node scripts/fix-video-associations.js
```

Ce script génère un fichier SQL (`supabase/sql/fix-all-video-associations.sql`) que vous pouvez exécuter dans Supabase.

## Vérification après correction

Après avoir associé une vidéo à une leçon :

1. Rafraîchissez la page de la leçon
2. La vidéo devrait maintenant s'afficher correctement
3. Si le problème persiste, vérifiez que l'ID de la vidéo est correct dans Bunny Stream

## Scripts disponibles

- `scripts/check-lessons-without-video.js` - Liste toutes les leçons sans vidéo
- `scripts/associate-video-to-lesson.js` - Associe une vidéo à une leçon
- `scripts/fix-video-associations.js` - Génère un script SQL pour corriger les associations
- `scripts/auto-upload-and-associate-videos.js` - Upload et association automatique de vidéos

## Support

Si le problème persiste après avoir suivi ces étapes :

1. Vérifiez que la variable d'environnement `VITE_BUNNY_EMBED_BASE_URL` est configurée
2. Vérifiez que l'ID de la vidéo existe bien dans votre bibliothèque Bunny Stream
3. Vérifiez les logs de la console pour plus d'informations

