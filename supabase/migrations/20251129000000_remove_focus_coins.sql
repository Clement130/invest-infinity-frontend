-- Migration pour supprimer complètement le système de Focus Coins
-- À exécuter après avoir retiré toutes les références dans le code

-- Supprimer les tables liées à l'économie (dans l'ordre inverse des dépendances)
DROP TABLE IF EXISTS public.user_economy_events CASCADE;
DROP TABLE IF EXISTS public.user_inventory CASCADE;
DROP TABLE IF EXISTS public.user_boosters CASCADE;
DROP TABLE IF EXISTS public.store_items CASCADE;
DROP TABLE IF EXISTS public.user_wallets CASCADE;
DROP TABLE IF EXISTS public.user_rewards CASCADE;

-- Supprimer les types liés à l'économie
DROP TYPE IF EXISTS public.store_item_type CASCADE;

-- Supprimer les fonctions liées à l'économie
DROP FUNCTION IF EXISTS public.adjust_focus_coins(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS public.purchase_store_item(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.activate_booster(uuid, uuid, numeric, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_active_booster_multiplier(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.log_economy_event(uuid, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.ensure_user_wallet(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.set_active_theme(uuid, uuid, text) CASCADE;

-- Nettoyer les politiques RLS qui ne sont plus nécessaires
-- (Les politiques sur les tables supprimées seront automatiquement supprimées)

-- Note: Les tables user_xp_tracks, user_quests, quest_templates et user_items sont conservées
-- car elles font partie du système de gamification de base sans économie
