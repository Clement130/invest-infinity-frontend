-- Script d'initialisation rapide pour la gamification
-- À exécuter dans le SQL Editor de Supabase

-- 1. Items boutique
INSERT INTO public.store_items (name, description, type, cost, metadata, is_active) VALUES
('Freeze Pass', 'Protège ton streak pendant 7 jours', 'consumable', 150, '{"itemId": "freeze_pass", "duration": 7}', true),
('XP Booster 2x', 'Double tes gains d''XP pendant 24h', 'consumable', 200, '{"itemId": "xp_booster", "multiplier": 2, "durationMinutes": 1440}', true),
('XP Booster 3x', 'Triple tes gains d''XP pendant 12h', 'consumable', 300, '{"itemId": "xp_booster", "multiplier": 3, "durationMinutes": 720}', true),
('Thème Aurora', 'Illumine ton interface avec des tons nordiques', 'cosmetic', 250, '{"itemId": "theme_aurora", "themeKey": "aurora"}', true),
('Thème Eclipse', 'Interface sombre élégante', 'cosmetic', 250, '{"itemId": "theme_eclipse", "themeKey": "eclipse"}', true);

-- 2. Templates de quêtes
INSERT INTO public.quest_templates (title, description, type, target, reward, is_active) VALUES
('Première leçon', 'Complète ta première leçon de formation', 'daily', '{"metric": "lessons_completed", "value": 1}', '{"xp": 50, "coins": 10}', true),
('Leçon du jour', 'Regarde une leçon aujourd''hui', 'daily', '{"metric": "lessons_completed", "value": 1}', '{"xp": 25, "coins": 5}', true),
('Module complet', 'Termine un module entier', 'daily', '{"metric": "modules_completed", "value": 1}', '{"xp": 200, "coins": 50}', true),
('Streak actif', 'Maintiens ton streak actif', 'daily', '{"metric": "streak_maintained", "value": 1}', '{"xp": 30, "coins": 8}', true);

-- 3. Créer quelques wallets de test (optionnel - sera créé automatiquement)
-- INSERT INTO public.user_wallets (user_id, balance, total_earned, total_spent) VALUES
-- ('user-id-here', 1000, 1000, 0);

-- 4. Vérifier les données
SELECT 'Store Items:' as section, COUNT(*) as count FROM public.store_items
UNION ALL
SELECT 'Quest Templates:', COUNT(*) FROM public.quest_templates;
