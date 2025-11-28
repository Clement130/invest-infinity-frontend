-- ============================================
-- Script : Corriger les vidéos manquantes pour "Etape 1 - La Fondation"
-- ============================================
-- Objectif : Associer des vidéos aux leçons sans vidéo du module "Etape 1 - La Fondation"
--
-- ⚠️ IMPORTANT : Remplacez 'VIDEO_ID_ICI' par les vrais IDs de vos vidéos Bunny Stream
-- avant d'exécuter ce script.
--
-- Pour trouver les IDs des vidéos :
-- 1. Allez sur /app/admin/videos
-- 2. Cliquez sur "Bibliothèque Bunny Stream"
-- 3. Copiez l'ID de la vidéo souhaitée
-- ============================================

BEGIN;

-- Leçon 1 : "Les Différents Types de Marchés"
-- ID Leçon: dd716d80-f347-482d-8501-dd0282ff6ba2
-- Position: 1
-- ⚠️ Remplacez 'VIDEO_ID_ICI' par l'ID réel de la vidéo
UPDATE training_lessons 
SET bunny_video_id = 'VIDEO_ID_ICI' 
WHERE id = 'dd716d80-f347-482d-8501-dd0282ff6ba2'
  AND (bunny_video_id IS NULL OR bunny_video_id = '');

-- Leçon 2 : "La Clé de ton succès se joue ici."
-- ID Leçon: ff5366aa-379e-4181-a508-9496f6a3c34b
-- Position: 7
-- ⚠️ Remplacez 'VIDEO_ID_ICI' par l'ID réel de la vidéo
UPDATE training_lessons 
SET bunny_video_id = 'VIDEO_ID_ICI' 
WHERE id = 'ff5366aa-379e-4181-a508-9496f6a3c34b'
  AND (bunny_video_id IS NULL OR bunny_video_id = '');

-- Vérification après mise à jour
SELECT 
  tl.id,
  tl.title,
  tl.bunny_video_id,
  tl.position,
  CASE 
    WHEN tl.bunny_video_id IS NULL OR tl.bunny_video_id = '' THEN '❌ Pas de vidéo'
    ELSE '✅ Vidéo associée'
  END as status
FROM training_lessons tl
INNER JOIN training_modules tm ON tl.module_id = tm.id
WHERE tm.title = 'Etape 1 - La Fondation'
ORDER BY tl.position;

COMMIT;

