-- ============================================
-- Script : Associer la vidéo topstepex.mp4
-- ============================================
-- Objectif : mettre à jour la leçon "Introduction au Trading"
-- avec l'ID Bunny Stream réel.
--
-- À exécuter depuis le SQL Editor Supabase ou via psql :
--   psql "<connection-string>" -f supabase/sql/update-intro-lesson-video.sql
-- ============================================

begin;

update public.training_lessons
set bunny_video_id = '9295490a-0072-4752-996d-6f573306318b'
where title = 'Introduction au Trading';

-- Vérification rapide
select title, bunny_video_id
from public.training_lessons
where title = 'Introduction au Trading';

commit;


