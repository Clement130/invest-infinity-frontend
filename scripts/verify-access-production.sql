-- ============================================
-- Script de Vérification des Accès Clients en Production
-- ============================================
-- À exécuter dans Supabase Dashboard > SQL Editor
-- 
-- Ce script vérifie :
-- 1. Les clients avec des licences invalides
-- 2. Les clients avec des accès qu'ils ne devraient pas avoir
-- 3. Les statistiques par licence
-- ============================================

-- ============================================
-- 1. STATISTIQUES DES CLIENTS PAR LICENCE
-- ============================================
SELECT 
  COALESCE(license, 'none') as license,
  COUNT(*) as client_count,
  CASE 
    WHEN license = 'entree' THEN 'Starter (147€)'
    WHEN license = 'transformation' THEN 'Premium (497€)'
    WHEN license = 'immersion' THEN 'Bootcamp Élite (1997€)'
    WHEN license IS NULL OR license = 'none' THEN 'Aucune licence'
    ELSE '⚠️ LICENCE INVALIDE'
  END as license_label
FROM public.profiles
WHERE role = 'client'
GROUP BY license
ORDER BY 
  CASE license
    WHEN 'none' THEN 0
    WHEN 'entree' THEN 1
    WHEN 'transformation' THEN 2
    WHEN 'immersion' THEN 3
    ELSE 4
  END;

-- ============================================
-- 2. CLIENTS AVEC LICENCES INVALIDES
-- ============================================
SELECT 
  id,
  email,
  license,
  created_at,
  '❌ LICENCE INVALIDE' as status
FROM public.profiles
WHERE role = 'client'
  AND license IS NOT NULL
  AND license NOT IN ('none', 'entree', 'transformation', 'immersion')
ORDER BY created_at DESC;

-- ============================================
-- 3. VÉRIFICATION DES ACCÈS AUX MODULES
-- ============================================
-- Trouve les accès incorrects (clients avec accès à des modules supérieurs à leur licence)

WITH license_levels AS (
  SELECT 'starter' as license, 1 as level
  UNION ALL SELECT 'pro', 2
  UNION ALL SELECT 'elite', 3
),
client_licenses AS (
  SELECT 
    p.id,
    p.email,
    p.license as profile_license,
    CASE 
      WHEN p.license = 'entree' THEN 'starter'
      WHEN p.license = 'transformation' THEN 'pro'
      WHEN p.license = 'immersion' THEN 'elite'
      ELSE 'none'
    END as system_license
  FROM public.profiles p
  WHERE p.role = 'client'
    AND p.license IS NOT NULL
    AND p.license != 'none'
)
SELECT 
  cl.email,
  cl.profile_license as user_profile_license,
  cl.system_license as user_system_license,
  tm.title as module_title,
  tm.required_license as module_required_license,
  ll_user.level as user_level,
  ll_module.level as required_level,
  ta.granted_at,
  '❌ ACCÈS INCORRECT' as status,
  CASE 
    WHEN cl.profile_license = 'entree' THEN 'Starter (147€)'
    WHEN cl.profile_license = 'transformation' THEN 'Premium (497€)'
    WHEN cl.profile_license = 'immersion' THEN 'Bootcamp Élite (1997€)'
    ELSE cl.profile_license
  END as license_label
FROM client_licenses cl
JOIN public.training_access ta ON ta.user_id = cl.id
JOIN public.training_modules tm ON tm.id = ta.module_id
JOIN license_levels ll_user ON ll_user.license = cl.system_license
JOIN license_levels ll_module ON ll_module.license = tm.required_license
WHERE ll_user.level < ll_module.level
  AND tm.is_active = true
ORDER BY cl.email, tm.title;

-- ============================================
-- 4. RÉCAPITULATIF DES ACCÈS PAR CLIENT
-- ============================================
SELECT 
  p.email,
  p.license as user_license,
  CASE 
    WHEN p.license = 'entree' THEN 'Starter (147€)'
    WHEN p.license = 'transformation' THEN 'Premium (497€)'
    WHEN p.license = 'immersion' THEN 'Bootcamp Élite (1997€)'
    WHEN p.license IS NULL OR p.license = 'none' THEN 'Aucune licence'
    ELSE p.license
  END as license_label,
  COUNT(ta.id) as total_access_count,
  COUNT(CASE WHEN tm.required_license = 'starter' THEN 1 END) as starter_modules,
  COUNT(CASE WHEN tm.required_license = 'pro' THEN 1 END) as pro_modules,
  COUNT(CASE WHEN tm.required_license = 'elite' THEN 1 END) as elite_modules
FROM public.profiles p
LEFT JOIN public.training_access ta ON ta.user_id = p.id
LEFT JOIN public.training_modules tm ON tm.id = ta.module_id AND tm.is_active = true
WHERE p.role = 'client'
  AND p.license IS NOT NULL
  AND p.license != 'none'
GROUP BY p.id, p.email, p.license
ORDER BY 
  CASE p.license
    WHEN 'entree' THEN 1
    WHEN 'transformation' THEN 2
    WHEN 'immersion' THEN 3
    ELSE 4
  END,
  p.email;

-- ============================================
-- 5. CLIENTS SANS ACCÈS (mais avec licence)
-- ============================================
SELECT 
  p.id,
  p.email,
  p.license,
  CASE 
    WHEN p.license = 'entree' THEN 'Starter (147€)'
    WHEN p.license = 'transformation' THEN 'Premium (497€)'
    WHEN p.license = 'immersion' THEN 'Bootcamp Élite (1997€)'
    ELSE p.license
  END as license_label,
  p.created_at,
  '⚠️ PAS D''ACCÈS DANS training_access' as status
FROM public.profiles p
LEFT JOIN public.training_access ta ON ta.user_id = p.id
WHERE p.role = 'client'
  AND p.license IS NOT NULL
  AND p.license != 'none'
  AND ta.id IS NULL
ORDER BY p.created_at DESC;

-- ============================================
-- 6. MODULES PAR NIVEAU DE LICENCE
-- ============================================
SELECT 
  required_license,
  COUNT(*) as module_count,
  STRING_AGG(title, ', ' ORDER BY position) as module_titles
FROM public.training_modules
WHERE is_active = true
GROUP BY required_license
ORDER BY 
  CASE required_license
    WHEN 'starter' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'elite' THEN 3
    ELSE 4
  END;

