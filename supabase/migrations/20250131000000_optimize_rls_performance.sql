-- ============================================
-- Migration : Optimisation des performances RLS
-- ============================================
-- Objectif : Corriger les problèmes de performance des politiques RLS
-- en utilisant (select auth.uid()) au lieu de auth.uid() pour éviter
-- la réévaluation pour chaque ligne
-- ============================================

BEGIN;

-- ============================================
-- 1. Corriger la fonction current_user_id (problème de sécurité)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'current_user_id'
  ) THEN
    -- Recréer la fonction avec search_path fixe pour la sécurité
    DROP FUNCTION IF EXISTS public.current_user_id() CASCADE;
    
    CREATE OR REPLACE FUNCTION public.current_user_id()
    RETURNS uuid
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
      SELECT auth.uid();
    $$;
  END IF;
END $$;

-- ============================================
-- 2. Optimiser les politiques RLS pour profiles
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    -- Optimiser "Users can view own profile"
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "users can see their own profile" ON public.profiles;
    CREATE POLICY "users can see their own profile"
      ON public.profiles
      FOR SELECT
      USING (id = (SELECT auth.uid()));
    
    -- Optimiser "Users can update own profile"
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "users can update their own profile" ON public.profiles;
    CREATE POLICY "users can update their own profile"
      ON public.profiles
      FOR UPDATE
      USING (id = (SELECT auth.uid()))
      WITH CHECK (id = (SELECT auth.uid()));
    
    -- Optimiser "Admins can view all profiles"
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "admins can see all profiles" ON public.profiles;
    CREATE POLICY "admins can see all profiles"
      ON public.profiles
      FOR SELECT
      USING ((SELECT public.is_admin((SELECT auth.uid()))));
  END IF;
END $$;

-- ============================================
-- 3. Optimiser les politiques RLS pour orders
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) THEN
    -- Optimiser "Users can view own orders"
    DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
    CREATE POLICY "Users can view own orders"
      ON public.orders
      FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    -- Optimiser "Admins can view all orders"
    DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
    CREATE POLICY "Admins can view all orders"
      ON public.orders
      FOR SELECT
      USING ((SELECT public.is_admin((SELECT auth.uid()))));
    
    -- Optimiser "Admins can insert orders"
    DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
    CREATE POLICY "Admins can insert orders"
      ON public.orders
      FOR INSERT
      WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));
    
    -- Optimiser "Admins can update orders"
    DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
    CREATE POLICY "Admins can update orders"
      ON public.orders
      FOR UPDATE
      USING ((SELECT public.is_admin((SELECT auth.uid()))))
      WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));
  END IF;
END $$;

-- ============================================
-- 4. Optimiser les politiques RLS pour projects
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'projects'
  ) THEN
    -- Optimiser "Users can view own projects"
    DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
    CREATE POLICY "Users can view own projects"
      ON public.projects
      FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    -- Optimiser "Admins can view all projects"
    DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
    CREATE POLICY "Admins can view all projects"
      ON public.projects
      FOR SELECT
      USING ((SELECT public.is_admin((SELECT auth.uid()))));
    
    -- Optimiser "Admins can manage projects"
    DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
    CREATE POLICY "Admins can manage projects"
      ON public.projects
      FOR ALL
      USING ((SELECT public.is_admin((SELECT auth.uid()))))
      WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));
  END IF;
END $$;

-- ============================================
-- 5. Optimiser les politiques RLS pour project_updates
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'project_updates'
  ) THEN
    -- Optimiser "Users can view updates for own projects"
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
    
    -- Optimiser "Admins can manage all updates"
    DROP POLICY IF EXISTS "Admins can manage all updates" ON public.project_updates;
    CREATE POLICY "Admins can manage all updates"
      ON public.project_updates
      FOR ALL
      USING ((SELECT public.is_admin((SELECT auth.uid()))))
      WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));
  END IF;
END $$;

-- ============================================
-- 6. Optimiser les politiques RLS pour messages
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    -- Optimiser "Users can view own messages"
    DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
    CREATE POLICY "Users can view own messages"
      ON public.messages
      FOR SELECT
      USING (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()));
    
    -- Optimiser "Users can send messages"
    DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
    CREATE POLICY "Users can send messages"
      ON public.messages
      FOR INSERT
      WITH CHECK (sender_id = (SELECT auth.uid()));
    
    -- Optimiser "Users can update own messages read status"
    DROP POLICY IF EXISTS "Users can update own messages read status" ON public.messages;
    CREATE POLICY "Users can update own messages read status"
      ON public.messages
      FOR UPDATE
      USING (receiver_id = (SELECT auth.uid()))
      WITH CHECK (receiver_id = (SELECT auth.uid()));
    
    -- Optimiser "Admins can view all messages"
    DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
    CREATE POLICY "Admins can view all messages"
      ON public.messages
      FOR SELECT
      USING ((SELECT public.is_admin((SELECT auth.uid()))));
  END IF;
END $$;

-- ============================================
-- 7. Optimiser les politiques RLS pour files
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'files'
  ) THEN
    -- Optimiser "Users can view files for own projects"
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
    
    -- Optimiser "Admins can manage all files"
    DROP POLICY IF EXISTS "Admins can manage all files" ON public.files;
    CREATE POLICY "Admins can manage all files"
      ON public.files
      FOR ALL
      USING ((SELECT public.is_admin((SELECT auth.uid()))))
      WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));
  END IF;
END $$;

-- ============================================
-- 8. Optimiser les politiques RLS pour availability_slots
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'availability_slots'
  ) THEN
    -- Optimiser "Authenticated admin can manage availability_slots"
    DROP POLICY IF EXISTS "Authenticated admin can manage availability_slots" ON public.availability_slots;
    CREATE POLICY "Authenticated admin can manage availability_slots"
      ON public.availability_slots
      FOR ALL
      USING ((SELECT public.is_admin((SELECT auth.uid()))))
      WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));
  END IF;
END $$;

-- ============================================
-- 9. Optimiser les politiques RLS pour blocked_dates
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'blocked_dates'
  ) THEN
    -- Optimiser "Authenticated admin can manage blocked_dates"
    DROP POLICY IF EXISTS "Authenticated admin can manage blocked_dates" ON public.blocked_dates;
    CREATE POLICY "Authenticated admin can manage blocked_dates"
      ON public.blocked_dates
      FOR ALL
      USING ((SELECT public.is_admin((SELECT auth.uid()))))
      WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));
  END IF;
END $$;

-- ============================================
-- 10. Optimiser les politiques RLS pour bookings
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) THEN
    -- Optimiser "Authenticated admin can manage bookings"
    DROP POLICY IF EXISTS "Authenticated admin can manage bookings" ON public.bookings;
    CREATE POLICY "Authenticated admin can manage bookings"
      ON public.bookings
      FOR ALL
      USING ((SELECT public.is_admin((SELECT auth.uid()))))
      WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));
  END IF;
END $$;

COMMIT;

