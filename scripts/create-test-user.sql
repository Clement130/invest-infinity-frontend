-- Script pour créer un utilisateur de test et lui donner accès au module gratuit
-- Exécuter via Supabase Dashboard > SQL Editor
-- OU via : npx supabase db execute --file scripts/create-test-user.sql

-- NOTE IMPORTANTE :
-- Les utilisateurs doivent être créés via Supabase Auth UI (Dashboard > Authentication > Users)
-- OU via l'API Supabase Auth (signUp)
-- Ce script ne crée PAS l'utilisateur dans auth.users, il donne seulement les accès

-- ÉTAPE 1 : Donner accès au module gratuit "Les Bases du Trading" pour tous les utilisateurs existants
INSERT INTO public.training_access (user_id, module_id, access_type, granted_at)
SELECT 
  p.id as user_id,
  (SELECT id FROM public.training_modules WHERE title = 'Les Bases du Trading' LIMIT 1) as module_id,
  'full' as access_type,
  NOW() as granted_at
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.training_access ta 
  WHERE ta.user_id = p.id 
  AND ta.module_id = (SELECT id FROM public.training_modules WHERE title = 'Les Bases du Trading' LIMIT 1)
)
ON CONFLICT (user_id, module_id) DO NOTHING;

-- ÉTAPE 2 : Vérifier les accès créés
SELECT 
  p.email,
  p.role,
  tm.title as module_title,
  ta.access_type,
  ta.granted_at
FROM public.training_access ta
JOIN public.profiles p ON p.id = ta.user_id
JOIN public.training_modules tm ON tm.id = ta.module_id
WHERE tm.title = 'Les Bases du Trading'
ORDER BY ta.granted_at DESC;

-- ÉTAPE 3 : Vérifier que le module existe
SELECT 
  id,
  title,
  description,
  position,
  is_active,
  created_at
FROM public.training_modules
WHERE title = 'Les Bases du Trading';

-- ÉTAPE 4 : Vérifier les leçons du module gratuit
SELECT 
  tl.id,
  tl.title,
  tl.description,
  tl.bunny_video_id,
  tl.position,
  tl.is_preview,
  tm.title as module_title
FROM public.training_lessons tl
JOIN public.training_modules tm ON tm.id = tl.module_id
WHERE tm.title = 'Les Bases du Trading'
ORDER BY tl.position ASC;

