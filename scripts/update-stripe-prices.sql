-- Script SQL pour mettre à jour les Price IDs Stripe
-- À exécuter dans Supabase SQL Editor après avoir créé les Price IDs dans Stripe Dashboard

-- 1. Vérifier l'état actuel
SELECT 
  plan_type,
  plan_name,
  amount_euros,
  stripe_price_id,
  CASE 
    WHEN stripe_price_id LIKE '%PLACEHOLDER%' THEN '⚠️ Placeholder - À remplacer'
    WHEN stripe_price_id IS NULL THEN '❌ Non configuré'
    ELSE '✅ Configuré'
  END as status
FROM public.stripe_prices
ORDER BY 
  CASE plan_type
    WHEN 'entree' THEN 1
    WHEN 'transformation' THEN 2
    WHEN 'immersion' THEN 3
  END;

-- 2. Mettre à jour le Price ID pour Entrée (147€)
-- Remplacez 'price_VOTRE_PRICE_ID_ENTREE' par le vrai Price ID depuis Stripe Dashboard
-- UPDATE public.stripe_prices 
-- SET stripe_price_id = 'price_VOTRE_PRICE_ID_ENTREE',
--     updated_at = now()
-- WHERE plan_type = 'entree';

-- 3. Mettre à jour le Price ID pour Immersion Élite (1997€)
-- Remplacez 'price_VOTRE_PRICE_ID_IMMERSION' par le vrai Price ID depuis Stripe Dashboard
-- UPDATE public.stripe_prices 
-- SET stripe_price_id = 'price_VOTRE_PRICE_ID_IMMERSION',
--     updated_at = now()
-- WHERE plan_type = 'immersion';

-- 4. Vérifier après mise à jour
-- SELECT plan_type, plan_name, amount_euros, stripe_price_id, is_active
-- FROM public.stripe_prices
-- ORDER BY plan_type;

