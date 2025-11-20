begin;

-- ÉTAPE 1 : Supprimer TOUTES les politiques qui dépendent de is_admin() ou qui causent la récursion
-- Il faut les supprimer AVANT de supprimer la fonction
DROP POLICY IF EXISTS "Profiles: admins manage everything" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: owners can read" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: owners can update themselves" ON public.profiles;
DROP POLICY IF EXISTS "admins can see all profiles" ON public.profiles;
DROP POLICY IF EXISTS "users can see their own profile" ON public.profiles;
DROP POLICY IF EXISTS "users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "users can insert their own profile" ON public.profiles;

-- ÉTAPE 2 : Maintenant on peut supprimer la fonction is_admin
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = uid
      AND p.role = 'admin'
  );
$$;

-- Recréer uniquement les politiques correctes
-- Politique pour que les utilisateurs voient leur propre profil
DROP POLICY IF EXISTS "users can see their own profile" ON public.profiles;
CREATE POLICY "users can see their own profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Politique pour que les admins voient tous les profils (utilise is_admin avec SECURITY DEFINER)
DROP POLICY IF EXISTS "admins can see all profiles" ON public.profiles;
CREATE POLICY "admins can see all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Politique pour que les utilisateurs mettent à jour leur propre profil
DROP POLICY IF EXISTS "users can update their own profile" ON public.profiles;
CREATE POLICY "users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Politique pour que les utilisateurs insèrent leur propre profil
DROP POLICY IF EXISTS "users can insert their own profile" ON public.profiles;
CREATE POLICY "users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

commit;

