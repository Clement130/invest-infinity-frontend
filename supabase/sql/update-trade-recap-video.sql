-- ============================================
-- Script : Associer la vidéo "trade Recap.mp4"
-- ============================================
-- Objectif : mettre à jour la leçon "Faire des Trades Recaps"
-- avec l'ID Bunny Stream réel.
--
-- À exécuter depuis le SQL Editor Supabase ou via psql :
--   psql "<connection-string>" -f supabase/sql/update-trade-recap-video.sql
-- ============================================

begin;

-- Mettre à jour la leçon "Faire des Trades Recaps"
update public.training_lessons
set bunny_video_id = 'd2ef6154-16ca-46f4-bf56-6f47c738d143'
where title ILIKE '%Faire des Trades Recaps%' 
   OR title ILIKE '%Trades Recaps%'
   OR title ILIKE '%Trade Recap%';

-- Vérification rapide
select title, bunny_video_id, module_id
from public.training_lessons
where bunny_video_id = 'd2ef6154-16ca-46f4-bf56-6f47c738d143'
   OR title ILIKE '%Faire des Trades Recaps%'
   OR title ILIKE '%Trades Recaps%'
   OR title ILIKE '%Trade Recap%';

commit;

