-- ============================================
-- Migration : Corriger l'accès Starter aux modules
-- ============================================
-- Objectif : S'assurer que les clients Starter n'ont accès
-- qu'aux modules tutoriels (MetaTrader, TopStepX, Apex)
-- et PAS à "Etape 1 - La Fondation"
--
-- Configuration correcte :
-- - Starter : UNIQUEMENT "MetaTrader & TopStepX & Apex"
-- - Pro/Premium : Starter + "Etape 1 - La Fondation" + autres modules pro
-- - Elite : Tout
-- ============================================

BEGIN;

-- CORRECTION : Mettre "Etape 1 - La Fondation" en 'pro' (pas 'starter')
-- Les Starter ne doivent avoir accès qu'aux tutoriels
UPDATE public.training_modules 
SET required_license = 'pro' 
WHERE title = 'Etape 1 - La Fondation'
  AND required_license = 'starter';

-- S'assurer que "MetaTrader & TopStepX & Apex" reste en 'starter'
UPDATE public.training_modules 
SET required_license = 'starter' 
WHERE (title LIKE '%MetaTrader%' 
   OR title LIKE '%TopStepX%' 
   OR title LIKE '%Apex%'
   OR title = 'MetaTrader & TopStepX & Apex')
  AND required_license IS NOT NULL;

-- S'assurer que les autres modules de formation sont bien configurés
-- Modules PRO/PREMIUM (nécessite offre Premium ou supérieure)
UPDATE public.training_modules 
SET required_license = 'pro' 
WHERE title IN (
  'Etape 2 - Les Bases en ICT',
  'Etape 3 - La Stratégie ICT Mickael',
  'Trading View - Outils et Techniques'
)
AND required_license IS NOT NULL;

-- Commenter la migration
COMMENT ON COLUMN public.training_modules.required_license IS 
'Niveau de licence minimum requis pour accéder à ce module (starter, pro, elite). 
Starter: uniquement tutoriels (MetaTrader, TopStepX, Apex).
Premium: Starter + Etape 1 + Etape 2 + Etape 3 + Trading View.
Elite: Tout.';

COMMIT;

