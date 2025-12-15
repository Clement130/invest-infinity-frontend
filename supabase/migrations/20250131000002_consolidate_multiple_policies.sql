-- ============================================
-- Migration : Consolidation des politiques permissives multiples
-- ============================================
-- Objectif : Consolider les politiques RLS multiples en une seule
-- pour améliorer les performances (éviter l'exécution de plusieurs politiques)
-- ============================================

BEGIN;

-- ============================================
-- 1. Consolider les politiques pour profiles
-- ============================================
-- Remplacer les deux politiques SELECT par une seule
DROP POLICY IF EXISTS "admins can see all profiles" ON public.profiles;
DROP POLICY IF EXISTS "users can see their own profile" ON public.profiles;

CREATE POLICY "users_and_admins_can_view_profiles"
  ON public.profiles
  FOR SELECT
  USING (
    id = (SELECT auth.uid())
    OR (SELECT public.is_admin((SELECT auth.uid())))
  );

-- ============================================
-- 2. Consolider les politiques pour orders
-- ============================================
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

CREATE POLICY "users_and_admins_can_view_orders"
  ON public.orders
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin((SELECT auth.uid())))
  );

-- ============================================
-- 3. Consolider les politiques pour projects
-- ============================================
-- Supprimer les politiques SELECT redondantes
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
-- Garder "Admins can manage projects" qui couvre déjà tout pour les admins

CREATE POLICY "users_and_admins_can_view_projects"
  ON public.projects
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin((SELECT auth.uid())))
  );

-- La politique "Admins can manage projects" reste pour INSERT/UPDATE/DELETE

-- ============================================
-- 4. Consolider les politiques pour project_updates
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all updates" ON public.project_updates;
DROP POLICY IF EXISTS "Users can view updates for own projects" ON public.project_updates;

CREATE POLICY "users_and_admins_can_view_updates"
  ON public.project_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_updates.project_id
      AND p.user_id = (SELECT auth.uid())
    )
    OR (SELECT public.is_admin((SELECT auth.uid())))
  );

CREATE POLICY "admins_can_manage_updates"
  ON public.project_updates
  FOR ALL
  USING ((SELECT public.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

-- ============================================
-- 5. Consolider les politiques pour messages
-- ============================================
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;

CREATE POLICY "users_and_admins_can_view_messages"
  ON public.messages
  FOR SELECT
  USING (
    sender_id = (SELECT auth.uid())
    OR receiver_id = (SELECT auth.uid())
    OR (SELECT public.is_admin((SELECT auth.uid())))
  );

-- ============================================
-- 6. Consolider les politiques pour files
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all files" ON public.files;
DROP POLICY IF EXISTS "Users can view files for own projects" ON public.files;

CREATE POLICY "users_and_admins_can_view_files"
  ON public.files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = files.project_id
      AND p.user_id = (SELECT auth.uid())
    )
    OR (SELECT public.is_admin((SELECT auth.uid())))
  );

CREATE POLICY "admins_can_manage_files"
  ON public.files
  FOR INSERT
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

CREATE POLICY "admins_can_update_files"
  ON public.files
  FOR UPDATE
  USING ((SELECT public.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

CREATE POLICY "admins_can_delete_files"
  ON public.files
  FOR DELETE
  USING ((SELECT public.is_admin((SELECT auth.uid()))));

-- ============================================
-- 7. Consolider les politiques pour availability_slots
-- ============================================
-- Supprimer la politique publique "Anyone can read active availability_slots"
-- et la remplacer par une politique consolidée
DROP POLICY IF EXISTS "Anyone can read active availability_slots" ON public.availability_slots;
DROP POLICY IF EXISTS "Authenticated admin can manage availability_slots" ON public.availability_slots;

-- Politique SELECT : tout le monde peut lire les slots actifs OU admin peut tout voir
CREATE POLICY "anyone_can_read_active_or_admin_all"
  ON public.availability_slots
  FOR SELECT
  USING (
    is_active = true
    OR (SELECT public.is_admin((SELECT auth.uid())))
  );

-- Politique pour INSERT/UPDATE/DELETE : admin uniquement
CREATE POLICY "admins_can_manage_availability_slots"
  ON public.availability_slots
  FOR INSERT
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

CREATE POLICY "admins_can_update_availability_slots"
  ON public.availability_slots
  FOR UPDATE
  USING ((SELECT public.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

CREATE POLICY "admins_can_delete_availability_slots"
  ON public.availability_slots
  FOR DELETE
  USING ((SELECT public.is_admin((SELECT auth.uid()))));

-- ============================================
-- 8. Consolider les politiques pour blocked_dates
-- ============================================
DROP POLICY IF EXISTS "Anyone can read blocked_dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Authenticated admin can manage blocked_dates" ON public.blocked_dates;

CREATE POLICY "anyone_can_read_or_admin_all"
  ON public.blocked_dates
  FOR SELECT
  USING (true OR (SELECT public.is_admin((SELECT auth.uid()))));

CREATE POLICY "admins_can_manage_blocked_dates"
  ON public.blocked_dates
  FOR ALL
  USING ((SELECT public.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

-- ============================================
-- 9. Consolider les politiques pour bookings
-- ============================================
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated admin can manage bookings" ON public.bookings;

-- Politique SELECT : tout le monde peut lire OU admin peut tout voir
CREATE POLICY "anyone_can_read_or_admin_all"
  ON public.bookings
  FOR SELECT
  USING (true OR (SELECT public.is_admin((SELECT auth.uid()))));

-- Politique INSERT : tout le monde peut créer OU admin peut tout faire
CREATE POLICY "anyone_can_create_or_admin_all"
  ON public.bookings
  FOR INSERT
  WITH CHECK (true OR (SELECT public.is_admin((SELECT auth.uid()))));

-- Politique UPDATE/DELETE : admin uniquement
CREATE POLICY "admins_can_update_bookings"
  ON public.bookings
  FOR UPDATE
  USING ((SELECT public.is_admin((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.is_admin((SELECT auth.uid()))));

CREATE POLICY "admins_can_delete_bookings"
  ON public.bookings
  FOR DELETE
  USING ((SELECT public.is_admin((SELECT auth.uid()))));

COMMIT;

