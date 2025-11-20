-- Script pour donner accès au module gratuit "Les Bases du Trading" à TOUS les utilisateurs
-- Exécuter via Supabase Dashboard > SQL Editor

-- Donner accès au module gratuit pour TOUS les utilisateurs existants
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

-- Vérification : Afficher les accès créés
SELECT 
  p.email,
  p.full_name,
  tm.title as module_title,
  ta.access_type,
  ta.granted_at
FROM public.training_access ta
JOIN public.profiles p ON p.id = ta.user_id
JOIN public.training_modules tm ON tm.id = ta.module_id
WHERE tm.title = 'Les Bases du Trading'
ORDER BY ta.granted_at DESC;

