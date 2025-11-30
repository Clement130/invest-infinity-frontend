-- ============================================================================
-- MISE À JOUR DES PRIX STRIPE - Novembre 2025
-- ============================================================================
-- 
-- Ce script met à jour la table stripe_prices avec les nouveaux tarifs :
-- - Starter (entree) : 147€
-- - Premium (transformation) : 497€
-- - Bootcamp Élite (immersion) : 1997€
--
-- IMPORTANT: Avant d'exécuter ce script, assurez-vous d'avoir créé les 
-- produits et prix correspondants dans Stripe Dashboard !
--
-- ============================================================================

-- 1. Désactiver les anciens prix (au lieu de les supprimer pour garder l'historique)
UPDATE stripe_prices 
SET is_active = false, 
    updated_at = NOW()
WHERE is_active = true;

-- 2. Insérer les nouveaux prix
-- REMPLACEZ les price_XXXXXX par vos vrais Price IDs Stripe !

-- Starter - 147€ (paiement unique)
INSERT INTO stripe_prices (
    plan_name, 
    plan_type, 
    stripe_price_id, 
    amount_cents, 
    currency, 
    is_active, 
    description,
    created_at,
    updated_at
) VALUES (
    'Invest Infinity – Starter',
    'entree',
    'price_STARTER_147_REMPLACER',  -- ⚠️ REMPLACER par le vrai Price ID
    14700,
    'EUR',
    true,
    'Starter - 147€ paiement unique - Accès à vie',
    NOW(),
    NOW()
)
ON CONFLICT (plan_type) 
DO UPDATE SET 
    plan_name = EXCLUDED.plan_name,
    stripe_price_id = EXCLUDED.stripe_price_id,
    amount_cents = EXCLUDED.amount_cents,
    description = EXCLUDED.description,
    is_active = true,
    updated_at = NOW();

-- Premium - 497€ (paiement unique, option 3x via Klarna)
INSERT INTO stripe_prices (
    plan_name, 
    plan_type, 
    stripe_price_id, 
    amount_cents, 
    currency, 
    is_active, 
    description,
    created_at,
    updated_at
) VALUES (
    'Invest Infinity – Premium',
    'transformation',
    'price_PREMIUM_497_REMPLACER',  -- ⚠️ REMPLACER par le vrai Price ID
    49700,
    'EUR',
    true,
    'Premium - 497€ (ou 3x 166€/mois) - Accès à vie - Garantie 14 jours',
    NOW(),
    NOW()
)
ON CONFLICT (plan_type) 
DO UPDATE SET 
    plan_name = EXCLUDED.plan_name,
    stripe_price_id = EXCLUDED.stripe_price_id,
    amount_cents = EXCLUDED.amount_cents,
    description = EXCLUDED.description,
    is_active = true,
    updated_at = NOW();

-- Bootcamp Élite - 1997€ (paiement unique, option 3x via Klarna)
INSERT INTO stripe_prices (
    plan_name, 
    plan_type, 
    stripe_price_id, 
    amount_cents, 
    currency, 
    is_active, 
    description,
    created_at,
    updated_at
) VALUES (
    'Invest Infinity – Bootcamp Élite',
    'immersion',
    'price_BOOTCAMP_1997_REMPLACER',  -- ⚠️ REMPLACER par le vrai Price ID
    199700,
    'EUR',
    true,
    'Bootcamp Élite - 1997€ (ou 3x 666€/mois) - 1 semaine intensive présentielle',
    NOW(),
    NOW()
)
ON CONFLICT (plan_type) 
DO UPDATE SET 
    plan_name = EXCLUDED.plan_name,
    stripe_price_id = EXCLUDED.stripe_price_id,
    amount_cents = EXCLUDED.amount_cents,
    description = EXCLUDED.description,
    is_active = true,
    updated_at = NOW();

-- 3. Vérification des prix insérés
SELECT 
    plan_name,
    plan_type,
    stripe_price_id,
    amount_cents / 100 as price_euros,
    currency,
    is_active,
    description
FROM stripe_prices 
WHERE is_active = true
ORDER BY amount_cents;

-- ============================================================================
-- INSTRUCTIONS STRIPE DASHBOARD
-- ============================================================================
-- 
-- 1. Connectez-vous à https://dashboard.stripe.com
-- 
-- 2. Créez 3 PRODUITS (Products > Add product) :
--    - "Invest Infinity – Starter"
--    - "Invest Infinity – Premium"  
--    - "Invest Infinity – Bootcamp Élite"
--
-- 3. Pour chaque produit, créez un PRIX (Price) :
--    - Starter : 147€ (One-time)
--    - Premium : 497€ (One-time)
--    - Bootcamp Élite : 1997€ (One-time)
--
-- 4. Copiez les Price IDs (format: price_XXXXXXXXXXXXXXXX)
--
-- 5. Remplacez les placeholders dans ce script :
--    - price_STARTER_147_REMPLACER → votre Price ID Starter
--    - price_PREMIUM_497_REMPLACER → votre Price ID Premium
--    - price_BOOTCAMP_1997_REMPLACER → votre Price ID Bootcamp
--
-- 6. Exécutez ce script SQL dans Supabase SQL Editor
--
-- 7. Pour le paiement en 3x sans frais :
--    - Activez Klarna dans Stripe Dashboard (Settings > Payment methods)
--    - Klarna gérera automatiquement l'échelonnement
--    - OU créez des Payment Links avec l'option "Installments" activée
--
-- ============================================================================

