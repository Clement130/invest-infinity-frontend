# Scripts de Correction des IDs de Vidéos

Ce dossier contient plusieurs scripts pour identifier et corriger les IDs de vidéos de test dans les leçons.

## Problème

Certaines leçons utilisent des IDs de test (comme `test-video-2`, `test-video-3`, etc.) qui ne correspondent pas à de vraies vidéos sur Bunny Stream, ce qui cause des erreurs 404 lors de la lecture.

## Scripts Disponibles

### 1. `check-lessons-videos.js`
**Usage:** `node scripts/check-lessons-videos.js`

Affiche toutes les leçons et indique lesquelles ont des IDs de vidéos configurés ou manquants.

### 2. `list-test-video-ids.js`
**Usage:** `node scripts/list-test-video-ids.js`

Liste uniquement les leçons qui utilisent des IDs de test.

### 3. `update-test-video-ids.js`
**Usage:** `node scripts/update-test-video-ids.js`

Script complet qui :
- Récupère les leçons avec IDs de test
- Récupère toutes les vidéos disponibles sur Bunny Stream
- Crée un fichier `video-mapping.json` avec toutes les informations
- Aide à identifier les correspondances possibles

### 4. `fix-test-video-ids.js`
**Usage:** `node scripts/fix-test-video-ids.js`

Script simple pour appliquer les corrections. **Vous devez modifier le mapping dans le code avant de l'exécuter.**

## Comment Corriger les IDs de Test

### Méthode 1 : Via l'Interface Admin (Recommandé)

1. Allez sur `/admin/contenu`
2. Développez chaque module concerné
3. Cliquez sur "Modifier" pour chaque leçon avec un ID de test
4. Remplacez l'ID de test par le vrai ID de la vidéo Bunny Stream

### Méthode 2 : Via le Script `fix-test-video-ids.js`

1. Exécutez d'abord `update-test-video-ids.js` pour voir toutes les vidéos disponibles :
   ```bash
   node scripts/update-test-video-ids.js
   ```

2. Ouvrez `scripts/fix-test-video-ids.js` et modifiez le mapping `LESSON_TO_VIDEO_MAPPING` :
   ```javascript
   const LESSON_TO_VIDEO_MAPPING = {
     'Analyse Technique de Base': 'votre-video-id-ici',
     'Scalping et Trading Intraday': 'autre-video-id-ici',
     // etc.
   };
   ```

3. Exécutez le script :
   ```bash
   node scripts/fix-test-video-ids.js
   ```

## Exemple de Mapping

```javascript
const LESSON_TO_VIDEO_MAPPING = {
  'Analyse Technique de Base': '8dcf803c-ccc6-4f6d-9d93-4f4ccdc0d908',
  'Scalping et Trading Intraday': '8254f866-0ab0-498c-b1fe-5ef2b66a2ab8',
  'Swing Trading et Analyse Fondamentale': 'd2ef6154-16ca-46f4-bf56-6f47c738d143',
  'Introduction au Trading Algorithmique': '9295490a-0072-4752-996d-6f573306318b',
  'Création et Backtesting de Stratégies': '1c1129c4-df13-4973-8c4e-c7aa4c9d01b4',
};
```

## Fichiers Générés

- `scripts/video-mapping.json` : Fichier JSON contenant toutes les leçons et vidéos pour référence
- `scripts/bunny-videos.json` : Liste de toutes les vidéos disponibles sur Bunny Stream

## Notes

- Les IDs de vidéos Bunny Stream sont généralement des UUIDs (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- Vous pouvez trouver les IDs des vidéos en exécutant `list-bunny-videos.js` ou en regardant le fichier `video-mapping.json`
- Assurez-vous que les IDs correspondent bien aux vidéos que vous voulez utiliser

