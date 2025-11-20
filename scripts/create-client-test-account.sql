-- ============================================
-- SCRIPT : Créer un compte client de test
-- ============================================
-- Ce script montre comment créer un compte via Supabase Dashboard
-- et lui donner accès au module gratuit "Les Bases du Trading"
-- ============================================

-- ============================================
-- ÉTAPE 1 : Créer l'utilisateur via Supabase Dashboard
-- ============================================
-- Les comptes doivent être créés via l'interface Auth de Supabase
-- car ils nécessitent un hash de mot de passe sécurisé

-- INSTRUCTIONS :
-- 1. Aller sur https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw
-- 2. Menu "Authentication" > "Users"
-- 3. Cliquer "Add user" > "Create new user"
-- 4. Email : test-client@investinfinity.com
-- 5. Password : TestClient123!
-- 6. Cliquer "Create user"
-- 7. Une fois créé, noter l'ID de l'utilisateur (UUID)

-- ============================================
-- ÉTAPE 2 : Vérifier que le profil existe
-- ============================================
-- Le profil devrait être créé automatiquement via le trigger
-- Si ce n'est pas le cas, créer le profil manuellement :

INSERT INTO public.profiles (id, email, role, created_at)
SELECT 
  u.id,
  u.email,
  'client',
  NOW()
FROM auth.users u
WHERE u.email = 'test-client@investinfinity.com'
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ÉTAPE 3 : Donner accès au module gratuit
-- ============================================
-- Une fois le user créé, donner accès au module gratuit "Les Bases du Trading"

INSERT INTO public.training_access (user_id, module_id, access_type, granted_at)
SELECT 
  p.id,
  tm.id,
  'full',
  NOW()
FROM public.profiles p
CROSS JOIN public.training_modules tm
WHERE p.email = 'test-client@investinfinity.com'
  AND tm.title = 'Les Bases du Trading'
ON CONFLICT (user_id, module_id) DO NOTHING;

-- ============================================
-- ÉTAPE 4 : Vérification
-- ============================================
-- Vérifier que tout est bien configuré :

SELECT 
  p.email,
  p.role,
  tm.title as module_title,
  ta.access_type,
  ta.granted_at
FROM public.profiles p
LEFT JOIN public.training_access ta ON ta.user_id = p.id
LEFT JOIN public.training_modules tm ON tm.id = ta.module_id
WHERE p.email = 'test-client@investinfinity.com';

-- ============================================
-- INFORMATIONS DE CONNEXION
-- ============================================
-- Email : test-client@investinfinity.com
-- Password : TestClient123!
-- ============================================


