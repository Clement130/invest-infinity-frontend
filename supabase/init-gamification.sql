-- Script d'initialisation rapide pour la gamification
-- À exécuter dans le SQL Editor de Supabase

-- 1. Templates de quêtes
INSERT INTO public.quest_templates (title, description, type, target, reward, is_active) VALUES
('Première leçon', 'Complète ta première leçon de formation', 'daily', '{"metric": "lessons_completed", "value": 1}', '{"xp": 50}', true),
('Leçon du jour', 'Regarde une leçon aujourd''hui', 'daily', '{"metric": "lessons_completed", "value": 1}', '{"xp": 25}', true),
('Module complet', 'Termine un module entier', 'daily', '{"metric": "modules_completed", "value": 1}', '{"xp": 200}', true),
('Streak actif', 'Maintiens ton streak actif', 'daily', '{"metric": "streak_maintained", "value": 1}', '{"xp": 30}', true);

-- 2. Vérifier les données
SELECT 'Quest Templates:' as section, COUNT(*) as count FROM public.quest_templates;
