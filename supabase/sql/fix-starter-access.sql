-- ============================================
-- Script : Corriger l'accès Starter
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

-- Afficher l'état actuel
SELECT 
  id, 
  title, 
  required_license, 
  position 
FROM training_modules 
ORDER BY position;

-- CORRECTION : Mettre "Etape 1 - La Fondation" en 'pro' (pas 'starter')
-- Les Starter ne doivent avoir accès qu'aux tutoriels
UPDATE training_modules 
SET required_license = 'pro' 
WHERE title = 'Etape 1 - La Fondation'
  AND required_license = 'starter';

-- S'assurer que "MetaTrader & TopStepX & Apex" reste en 'starter'
UPDATE training_modules 
SET required_license = 'starter' 
WHERE title LIKE '%MetaTrader%' 
   OR title LIKE '%TopStepX%' 
   OR title LIKE '%Apex%'
   OR title = 'MetaTrader & TopStepX & Apex';

-- Vérification après correction
SELECT 
  id, 
  title, 
  required_license, 
  position,
  CASE 
    WHEN required_license = 'starter' THEN '✅ Accessible Starter'
    WHEN required_license = 'pro' THEN '🔒 Nécessite Premium'
    WHEN required_license = 'elite' THEN '👑 Nécessite Elite'
    ELSE '❓ Non défini'
  END as access_info
FROM training_modules 
ORDER BY position;

-- Récapitulatif des accès après correction:
-- ✓ Starter (147€): UNIQUEMENT MetaTrader & TopStepX & Apex
-- ✓ Premium (497€): Starter + Etape 1 + Etape 2 + Etape 3 + Trading View
-- ✓ Elite (1997€): Tout

COMMIT;

