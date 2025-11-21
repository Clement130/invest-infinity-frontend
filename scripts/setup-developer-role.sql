-- Script SQL pour configurer le rôle développeur
-- À exécuter dans Supabase Dashboard > SQL Editor

-- Mettre à jour ou créer le profil développeur pour butcher13550@gmail.com
-- Cette requête trouve l'utilisateur par email et lui assigne le rôle 'developer'

INSERT INTO public.profiles (id, email, role)
SELECT 
    u.id,
    u.email,
    'developer'::text
FROM auth.users u
WHERE u.email = 'butcher13550@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'developer',
    email = EXCLUDED.email;

-- Vérifier que le rôle a été assigné
SELECT 
    p.id,
    p.email,
    p.role,
    p.created_at
FROM public.profiles p
WHERE p.email = 'butcher13550@gmail.com';

-- Si l'utilisateur n'existe pas encore dans auth.users, vous devrez d'abord le créer
-- via l'interface d'authentification Supabase ou via l'API

