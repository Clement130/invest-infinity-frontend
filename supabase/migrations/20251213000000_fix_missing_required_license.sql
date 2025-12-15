-- ============================================
-- Migration : Corriger les modules sans required_license
-- ============================================
-- Objectif : S'assurer que TOUS les modules ont un required_license défini
-- 
-- PROBLÈME : Si un module n'a pas de required_license, le code utilise un fallback 'starter'
-- ce qui donne accès à tous les utilisateurs Starter à des modules qui ne devraient pas être accessibles
--
-- SOLUTION : Définir un required_license par défaut pour tous les modules qui n'en ont pas
-- ============================================

BEGIN;

-- 1. Identifier les modules sans required_license
SELECT 
  id, 
  title, 
  required_license,
  CASE 
    WHEN required_license IS NULL THEN '⚠️ PROBLÈME: Sans licence requise'
    ELSE '✅ OK'
  END as status
FROM public.training_modules
WHERE required_license IS NULL OR required_license = '';

-- 2. Corriger les modules sans required_license
-- Par défaut, mettre 'pro' pour éviter qu'ils soient accessibles aux Starter
UPDATE public.training_modules 
SET required_license = 'pro'
WHERE required_license IS NULL 
   OR required_license = ''
   OR required_license NOT IN ('starter', 'pro', 'elite');

-- 3. S'assurer que la contrainte CHECK est respectée
-- (déjà définie dans la migration précédente, mais on vérifie)

-- 4. Vérification finale
SELECT 
  id, 
  title, 
  required_license,
  CASE 
    WHEN required_license = 'starter' THEN '🟢 Accessible Starter'
    WHEN required_license = 'pro' THEN '🟡 Nécessite Premium'
    WHEN required_license = 'elite' THEN '🔴 Nécessite Elite'
    ELSE '❌ Problème'
  END as access_info
FROM public.training_modules
ORDER BY 
  CASE required_license
    WHEN 'starter' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'elite' THEN 3
    ELSE 4
  END,
  position;

-- 5. Ajouter une contrainte NOT NULL pour éviter le problème à l'avenir
ALTER TABLE public.training_modules
ALTER COLUMN required_license SET NOT NULL;

-- 6. Mettre à jour le commentaire
COMMENT ON COLUMN public.training_modules.required_license IS 
'Niveau de licence minimum requis pour accéder à ce module (starter, pro, elite). 
OBLIGATOIRE - Ne peut pas être NULL.
Starter: uniquement tutoriels (MetaTrader, TopStepX, Apex).
Premium: Starter + Etape 1 + Etape 2 + Etape 3 + Trading View.
Elite: Tout.';

COMMIT;

