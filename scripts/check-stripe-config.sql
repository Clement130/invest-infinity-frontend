-- Script pour vérifier la configuration Stripe
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si la table stripe_prices existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stripe_prices')
    THEN '✅ Table stripe_prices existe'
    ELSE '❌ Table stripe_prices n''existe pas - Exécutez la migration 20250129000000_create_stripe_prices_table.sql'
  END as table_status;

-- 2. Vérifier les Price IDs actuels
SELECT 
  plan_type,
  plan_name,
  amount_euros,
  stripe_price_id,
  CASE 
    WHEN stripe_price_id LIKE 'price_%PLACEHOLDER%' THEN '⚠️ Placeholder - À remplacer'
    WHEN stripe_price_id IS NULL THEN '❌ Non configuré'
    ELSE '✅ Configuré'
  END as status,
  is_active
FROM public.stripe_prices
ORDER BY 
  CASE plan_type
    WHEN 'entree' THEN 1
    WHEN 'transformation' THEN 2
    WHEN 'immersion' THEN 3
  END;

-- 3. Vérifier les variables d'environnement nécessaires
-- (Ces informations ne sont pas accessibles via SQL, vérifiez dans le Dashboard Supabase)
-- Dashboard: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions

-- Variables requises:
-- - STRIPE_SECRET_KEY
-- - STRIPE_WEBHOOK_SECRET  
-- - SITE_URL

