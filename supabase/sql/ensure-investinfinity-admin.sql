-- ============================================
-- Script : Vérifier et Configurer le Compte Admin
-- ============================================
-- Objectif : S'assurer que investinfinityfr@gmail.com existe et est admin
-- 
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Vérifier si l'utilisateur existe dans auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'investinfinityfr@gmail.com';

-- 2. Vérifier le profil
SELECT 
  id,
  email,
  role,
  license,
  created_at
FROM profiles
WHERE email = 'investinfinityfr@gmail.com';

-- 3. Si le profil existe mais n'est pas admin, le mettre à jour
UPDATE profiles
SET role = 'admin'
WHERE email = 'investinfinityfr@gmail.com'
  AND role != 'admin'
  AND role != 'developer';

-- 4. Si le profil n'existe pas, il faut d'abord créer l'utilisateur via l'interface Supabase
--    puis exécuter cette requête pour créer le profil :
-- 
-- INSERT INTO profiles (id, email, role, license)
-- SELECT 
--   id,
--   email,
--   'admin',
--   'immersion'
-- FROM auth.users
-- WHERE email = 'investinfinityfr@gmail.com'
--   AND NOT EXISTS (
--     SELECT 1 FROM profiles WHERE email = 'investinfinityfr@gmail.com'
--   );

-- 5. Vérification finale
SELECT 
  p.id,
  p.email,
  p.role,
  p.license,
  u.email_confirmed_at,
  CASE 
    WHEN p.role IN ('admin', 'developer') THEN '✅ Admin configuré'
    ELSE '⚠️  Rôle non admin'
  END as status
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.email = 'investinfinityfr@gmail.com';

-- ============================================
-- Notes importantes :
-- ============================================
-- 1. Pour créer l'utilisateur dans auth.users, utiliser l'interface Supabase :
--    - Authentication > Users > Add User
--    - Email: investinfinityfr@gmail.com
--    - Password: Investinfinity13013.
--    - Auto Confirm: Oui
--
-- 2. Pour réinitialiser le mot de passe :
--    - Utiliser l'interface Supabase : Authentication > Users > Reset Password
--    - Ou utiliser la fonction Supabase Auth Admin API
--
-- 3. Le compte doit avoir :
--    - role = 'admin' ou 'developer' dans profiles
--    - email confirmé dans auth.users
--    - L'email est déjà dans la liste des super admins dans src/lib/auth.ts
-- ============================================

