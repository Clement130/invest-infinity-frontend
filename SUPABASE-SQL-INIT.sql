-- 🚀 INITIALISATION GAMIFICATION - EXÉCUTER DANS SUPABASE SQL EDITOR
-- Copie-colle chaque section une par une dans https://supabase.com/dashboard > SQL Editor

-- ========================================
-- 1. ITEMS BOUTIQUE
-- ========================================

INSERT INTO public.store_items (name, description, type, cost, metadata, is_active) VALUES
('Freeze Pass', 'Protège ton streak pendant 7 jours', 'consumable', 150,
 '{"itemId": "freeze_pass", "duration": 7}', true);

INSERT INTO public.store_items (name, description, type, cost, metadata, is_active) VALUES
('XP Booster 2x', 'Double tes gains d''XP pendant 24h', 'consumable', 200,
 '{"itemId": "xp_booster", "multiplier": 2, "durationMinutes": 1440}', true);

INSERT INTO public.store_items (name, description, type, cost, metadata, is_active) VALUES
('XP Booster 3x', 'Triple tes gains d''XP pendant 12h', 'consumable', 300,
 '{"itemId": "xp_booster", "multiplier": 3, "durationMinutes": 720}', true);

INSERT INTO public.store_items (name, description, type, cost, metadata, is_active) VALUES
('Thème Aurora', 'Illumine ton interface avec des tons nordiques', 'cosmetic', 250,
 '{"itemId": "theme_aurora", "themeKey": "aurora"}', true);

INSERT INTO public.store_items (name, description, type, cost, metadata, is_active) VALUES
('Thème Eclipse', 'Interface sombre élégante', 'cosmetic', 250,
 '{"itemId": "theme_eclipse", "themeKey": "eclipse"}', true);

-- ========================================
-- 2. TEMPLATES DE QUÊTES
-- ========================================

INSERT INTO public.quest_templates (title, description, type, target, reward, is_active) VALUES
('Première leçon', 'Complète ta première leçon de formation', 'daily',
 '{"metric": "lessons_completed", "value": 1}', '{"xp": 50, "coins": 10}', true);

INSERT INTO public.quest_templates (title, description, type, target, reward, is_active) VALUES
('Leçon du jour', 'Regarde une leçon aujourd''hui', 'daily',
 '{"metric": "lessons_completed", "value": 1}', '{"xp": 25, "coins": 5}', true);

INSERT INTO public.quest_templates (title, description, type, target, reward, is_active) VALUES
('Module complet', 'Termine un module entier', 'daily',
 '{"metric": "modules_completed", "value": 1}', '{"xp": 200, "coins": 50}', true);

INSERT INTO public.quest_templates (title, description, type, target, reward, is_active) VALUES
('Streak actif', 'Maintiens ton streak actif', 'daily',
 '{"metric": "streak_maintained", "value": 1}', '{"xp": 30, "coins": 8}', true);

-- ========================================
-- 3. VÉRIFICATION DES DONNÉES
-- ========================================

SELECT
  (SELECT COUNT(*) FROM public.store_items) as items_boutique,
  (SELECT COUNT(*) FROM public.quest_templates) as templates_quetes;

-- Résultat attendu: items_boutique = 5, templates_quetes = 4

-- ========================================
-- 🎉 FIN - DONNÉES INITIALISÉES !
-- ========================================
