-- Seed data for gamification system

-- Insert store items
INSERT INTO public.store_items (name, description, type, cost, metadata, is_active) VALUES
('Freeze Pass', 'Protège ton streak pendant 7 jours', 'consumable', 150, '{"itemId": "freeze_pass", "duration": 7}', true),
('XP Booster 2x', 'Double tes gains d''XP pendant 24h', 'consumable', 200, '{"itemId": "xp_booster", "multiplier": 2, "durationMinutes": 1440}', true),
('XP Booster 3x', 'Triple tes gains d''XP pendant 12h', 'consumable', 300, '{"itemId": "xp_booster", "multiplier": 3, "durationMinutes": 720}', true),
('Thème Aurora', 'Illumine ton interface avec des tons nordiques', 'cosmetic', 250, '{"itemId": "theme_aurora", "themeKey": "aurora"}', true),
('Thème Eclipse', 'Interface sombre élégante', 'cosmetic', 250, '{"itemId": "theme_eclipse", "themeKey": "eclipse"}', true),
('Pack Starter', '5 Freeze Pass + 1 XP Booster', 'consumable', 500, '{"itemId": "starter_pack", "contents": {"freeze_pass": 5, "xp_booster": 1}}', true);

-- Insert quest templates
INSERT INTO public.quest_templates (title, description, type, target, reward, is_active) VALUES
('Première leçon', 'Complète ta première leçon de formation', 'daily', '{"metric": "lessons_completed", "value": 1}', '{"xp": 50, "coins": 10}', true),
('Leçon du jour', 'Regarde une leçon aujourd''hui', 'daily', '{"metric": "lessons_completed", "value": 1}', '{"xp": 25, "coins": 5}', true),
('Module complet', 'Termine un module entier', 'daily', '{"metric": "modules_completed", "value": 1}', '{"xp": 200, "coins": 50}', true),
('Streak actif', 'Maintiens ton streak actif', 'daily', '{"metric": "streak_maintained", "value": 1}', '{"xp": 30, "coins": 8}', true),
('Semaine complète', '7 jours de streak consécutifs', 'weekly', '{"metric": "streak_days", "value": 7}', '{"xp": 500, "coins": 150}', true);

-- Enable RLS on all new tables
ALTER TABLE public.user_xp_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_boosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_economy_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own XP tracks" ON public.user_xp_tracks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own XP tracks" ON public.user_xp_tracks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP tracks" ON public.user_xp_tracks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Quest templates are public" ON public.quest_templates
    FOR SELECT USING (true);

CREATE POLICY "Users can view their own quests" ON public.user_quests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quests" ON public.user_quests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quests" ON public.user_quests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own items" ON public.user_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" ON public.user_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items" ON public.user_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Store items are public" ON public.store_items
    FOR SELECT USING (true);

CREATE POLICY "Users can view their own wallet" ON public.user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON public.user_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own inventory" ON public.user_inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory" ON public.user_inventory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory" ON public.user_inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own boosters" ON public.user_boosters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own boosters" ON public.user_boosters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own boosters" ON public.user_boosters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own economy events" ON public.user_economy_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own economy events" ON public.user_economy_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
