-- ============================================
-- Migration : Optimisation des performances RLS (Version finale)
-- ============================================
-- Objectif : Corriger les problèmes de performance des politiques RLS
-- en utilisant (select auth.uid()) au lieu de auth.uid() pour éviter
-- la réévaluation pour chaque ligne
-- ============================================

BEGIN;

-- ============================================
-- 1. S'assurer que is_admin(uid uuid) existe
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = uid
      AND (p.role = 'admin' OR p.role = 'developer')
  );
$$;

-- ============================================
-- 2. Corriger la fonction current_user_id (problème de sécurité)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'current_user_id'
  ) THEN
    DROP FUNCTION IF EXISTS public.current_user_id() CASCADE;
    
    CREATE OR REPLACE FUNCTION public.current_user_id()
    RETURNS uuid
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $func$
      SELECT auth.uid();
    $func$;
  END IF;
END $$;

-- ============================================
-- 3. Optimiser les politiques RLS pour profiles
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "users can see their own profile" ON public.profiles;
CREATE POLICY "users can see their own profile"
  ON public.profiles
  FOR SELECT
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "users can update their own profile" ON public.profiles;
CREATE POLICY "users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins can see all profiles" ON public.profiles;
CREATE POLICY "admins can see all profiles"
  ON public.profiles
  FOR SELECT
  USING ((SELECT public.is_admin((SELECT auth.uid()))));

-- ============================================
-- 4. Optimiser les politiques RLS pour orders
-- ============================================
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  USING ((SELECT public.is_admin((SELECT auth.uid()))));

DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
CREATE POLICY "Admins can insert orders"
  ON public.orders
  FOR INSERT
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  USING ((SELECT public.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

-- ============================================
-- 5. Optimiser les politiques RLS pour projects
-- ============================================
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own projects"
  ON public.projects
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
CREATE POLICY "Admins can view all projects"
  ON public.projects
  FOR SELECT
  USING ((SELECT public.is_admin((SELECT auth.uid()))));

DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
CREATE POLICY "Admins can manage projects"
  ON public.projects
  FOR ALL
  USING ((SELECT public.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

-- ============================================
-- 6. Optimiser les politiques RLS pour project_updates
-- ============================================
DROP POLICY IF EXISTS "Users can view updates for own projects" ON public.project_updates;
CREATE POLICY "Users can view updates for own projects"
  ON public.project_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_updates.project_id
      AND p.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage all updates" ON public.project_updates;
CREATE POLICY "Admins can manage all updates"
  ON public.project_updates
  FOR ALL
  USING ((SELECT public.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

-- ============================================
-- 7. Optimiser les politiques RLS pour messages
-- ============================================
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages"
  ON public.messages
  FOR SELECT
  USING (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own messages read status" ON public.messages;
CREATE POLICY "Users can update own messages read status"
  ON public.messages
  FOR UPDATE
  USING (receiver_id = (SELECT auth.uid()))
  WITH CHECK (receiver_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages"
  ON public.messages
  FOR SELECT
  USING ((SELECT public.is_admin((SELECT auth.uid()))));

-- ============================================
-- 8. Optimiser les politiques RLS pour files
-- ============================================
DROP POLICY IF EXISTS "Users can view files for own projects" ON public.files;
CREATE POLICY "Users can view files for own projects"
  ON public.files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = files.project_id
      AND p.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage all files" ON public.files;
CREATE POLICY "Admins can manage all files"
  ON public.files
  FOR ALL
  USING ((SELECT public.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

-- ============================================
-- 9. Optimiser les politiques RLS pour availability_slots
-- ============================================
DROP POLICY IF EXISTS "Authenticated admin can manage availability_slots" ON public.availability_slots;
CREATE POLICY "Authenticated admin can manage availability_slots"
  ON public.availability_slots
  FOR ALL
  USING ((SELECT public.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

-- ============================================
-- 10. Optimiser les politiques RLS pour blocked_dates
-- ============================================
DROP POLICY IF EXISTS "Authenticated admin can manage blocked_dates" ON public.blocked_dates;
CREATE POLICY "Authenticated admin can manage blocked_dates"
  ON public.blocked_dates
  FOR ALL
  USING ((SELECT public.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

-- ============================================
-- 11. Optimiser les politiques RLS pour bookings
-- ============================================
DROP POLICY IF EXISTS "Authenticated admin can manage bookings" ON public.bookings;
CREATE POLICY "Authenticated admin can manage bookings"
  ON public.bookings
  FOR ALL
  USING ((SELECT public.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

COMMIT;

