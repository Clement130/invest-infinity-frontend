-- ============================================
-- Migration : Accorder le rôle admin à butcher13550@gmail.com
-- ============================================
-- Objectif : Permettre à butcher13550@gmail.com d'accéder au panel admin
-- 
-- IMPORTANT : Cette migration doit être exécutée par investinfinityfr@gmail.com
-- ou un autre admin ayant les droits sur la base de données
-- ============================================

BEGIN;

-- 1. Vérifier si l'utilisateur existe dans auth.users
-- Si l'utilisateur n'existe pas, il doit d'abord se créer un compte via l'interface

-- 2. Créer ou mettre à jour le profil avec le rôle 'admin'
INSERT INTO public.profiles (id, email, role, full_name)
SELECT 
    u.id,
    u.email,
    'admin'::text,
    'Butcher Admin'::text
FROM auth.users u
WHERE u.email = 'butcher13550@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin',
    email = EXCLUDED.email,
    updated_at = now();

-- 3. Vérification que le rôle a été assigné
SELECT 
    p.id,
    p.email,
    p.role,
    p.full_name,
    p.created_at,
    CASE 
        WHEN p.role = 'admin' THEN '✅ Rôle admin assigné'
        ELSE '❌ Problème avec le rôle'
    END as status
FROM public.profiles p
WHERE p.email = 'butcher13550@gmail.com';

-- 4. Si l'utilisateur n'existe pas dans auth.users, afficher un message
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'butcher13550@gmail.com'
    ) THEN
        RAISE NOTICE '⚠️ ATTENTION : L''utilisateur butcher13550@gmail.com n''existe pas encore dans auth.users.';
        RAISE NOTICE '   Il doit d''abord créer un compte via l''interface de connexion.';
        RAISE NOTICE '   Ensuite, réexécutez cette migration pour lui assigner le rôle admin.';
    END IF;
END $$;

COMMIT;

