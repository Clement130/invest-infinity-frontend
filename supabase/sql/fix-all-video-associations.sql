-- ============================================
-- Script : Correction automatique des associations vidéos-leçons
-- ============================================
-- Généré automatiquement le 2025-11-28T17:54:38.718Z
-- ============================================

BEGIN;

UPDATE training_lessons SET bunny_video_id = '9295490a-0072-4752-996d-6f573306318b' WHERE title = 'La Base du Vocabulaire en Trading';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'Les Différents Types de Marchés';
UPDATE training_lessons SET bunny_video_id = '8dcf803c-ccc6-4f6d-9d93-4f4ccdc0d908' WHERE title = 'Les Différents Profils en Trading';
UPDATE training_lessons SET bunny_video_id = 'a14be160-90fa-4ddd-a3ab-aad23a47f36b' WHERE title = 'Les Différentes Stratégies En Trading';
UPDATE training_lessons SET bunny_video_id = 'dbf2b57b-8b32-483f-89c4-ccd994e86e1d' WHERE title = 'Avoir son Money Management';
UPDATE training_lessons SET bunny_video_id = 'dbf2b57b-8b32-483f-89c4-ccd994e86e1d' WHERE title = 'Avoir un Track Record & Data';
UPDATE training_lessons SET bunny_video_id = 'd2ef6154-16ca-46f4-bf56-6f47c738d143' WHERE title = 'Faire des Trades Recaps';
UPDATE training_lessons SET bunny_video_id = 'a14be160-90fa-4ddd-a3ab-aad23a47f36b' WHERE title = 'La Structure de marché';
UPDATE training_lessons SET bunny_video_id = '8dcf803c-ccc6-4f6d-9d93-4f4ccdc0d908' WHERE title = 'Le Breaker block & Mitigation block';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'La FVG';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'L''OB.';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'La Liquidité';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'La SMT';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'BreakerAway Gap';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'La IFVG';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'OB sans Corps';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'Introduction';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'Définir mon biais';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'Définir mes zones';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'Mes confirmations pour prendre position';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'Où TP, SL et BE ?';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'Displacement + création d''une FVG';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'Si Accumulation (je ne la trade que sous condition)';
UPDATE training_lessons SET bunny_video_id = NULL WHERE title = 'Comment installer son compte MetaTrader ?';
UPDATE training_lessons SET bunny_video_id = '8254f866-0ab0-498c-b1fe-5ef2b66a2ab8' WHERE title = 'Comment prendre un Trade sur MetaTrader ?';
UPDATE training_lessons SET bunny_video_id = '9295490a-0072-4752-996d-6f573306318b' WHERE title = 'TopStepX - Comment l''utiliser ?';
UPDATE training_lessons SET bunny_video_id = '1b4b4891-d60c-4644-bfa3-7de80c950e8a' WHERE title = 'Actif - Trading View';
UPDATE training_lessons SET bunny_video_id = '3b574bdc-4c55-414a-8028-a4733e13ebc9' WHERE title = 'Faire zoom - Trading View';
UPDATE training_lessons SET bunny_video_id = '03f94cf1-205a-41d5-81a6-cca3d6d76da2' WHERE title = 'Fait 2 écran - Trading View';
UPDATE training_lessons SET bunny_video_id = '1c1129c4-df13-4973-8c4e-c7aa4c9d01b4' WHERE title = 'Fait Backtest - Trading View';
UPDATE training_lessons SET bunny_video_id = '86b787f6-7012-40cd-b98d-9bd2940b4165' WHERE title = 'Fait capture - Trading View';
UPDATE training_lessons SET bunny_video_id = '03d84e9e-f51a-45df-b2e0-96fe4107fd1c' WHERE title = 'Fait Fond - Trading View';
UPDATE training_lessons SET bunny_video_id = '99bd5c2c-8c7c-4d9d-98ee-d3f40cf0e4cd' WHERE title = 'Fait indic - Trading View';
UPDATE training_lessons SET bunny_video_id = '23fbc623-7626-4c1f-8c85-8b5c568cb7fa' WHERE title = 'Outil en fav - Trading View';
UPDATE training_lessons SET bunny_video_id = 'b1a00800-5650-4557-a3c6-31adcfc98a1e' WHERE title = 'Plan future - Trading View';
UPDATE training_lessons SET bunny_video_id = 'a65a03c6-eb43-43a4-9050-789a482ffb06' WHERE title = 'Supprimer - Trading View';
UPDATE training_lessons SET bunny_video_id = '0f4ec3c0-2437-4996-be13-81c72f528fc7' WHERE title = 'Tracer ligne - Trading View';
UPDATE training_lessons SET bunny_video_id = 'f24ac09e-5055-4d4a-ac8f-85e47a2f3b8b' WHERE title = 'UT - Trading View';

-- Vérification
SELECT 
  tl.title as lesson_title,
  tl.bunny_video_id,
  CASE 
    WHEN tl.bunny_video_id IS NULL THEN '❌ Pas de vidéo'
    ELSE '✅ Vidéo associée'
  END as status
FROM training_lessons tl
ORDER BY tl.title;

COMMIT;
