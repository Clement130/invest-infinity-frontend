-- ============================================
-- Migration : Mettre à jour les RLS pour utiliser la licence directement
-- ============================================
-- Objectif : Remplacer les vérifications basées sur training_access
-- par des vérifications basées sur la licence de l'utilisateur
-- 
-- Les admins (role = 'admin' ou 'developer') ont accès à tout
-- Les clients n'ont accès qu'aux modules selon leur licence
-- ============================================

BEGIN;

-- Vérifier que les tables existent avant de modifier les RLS
DO $$
BEGIN
  -- Vérifier si training_modules existe
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'training_modules'
  ) THEN
    -- Supprimer les anciennes politiques basées sur training_access
    DROP POLICY IF EXISTS "clients can view their modules" ON public.training_modules;
    
    -- Créer une nouvelle politique pour training_modules basée sur la licence
    -- Les admins ont accès à tout, les clients selon leur licence
    CREATE POLICY "users can view modules by license"
      ON public.training_modules
      FOR SELECT
      USING (
        -- Les admins ont accès à tout
        public.is_admin(auth.uid())
        OR
        -- Les clients ont accès si :
        -- 1. Le module est actif
        -- 2. L'utilisateur a une licence valide
        -- 3. La licence de l'utilisateur est >= licence requise du module
        (
          is_active = true
          AND public.user_has_license_for_module(
            auth.uid(),
            required_license
          )
        )
      );
    
    -- Commenter la nouvelle politique
    COMMENT ON POLICY "users can view modules by license" ON public.training_modules IS 
    'Les admins ont accès à tous les modules. Les clients ont accès uniquement aux modules 
    dont la licence requise est <= leur licence actuelle (starter < pro < elite).';
  END IF;
  
  -- Vérifier si training_lessons existe
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'training_lessons'
  ) THEN
    -- Supprimer les anciennes politiques basées sur training_access
    DROP POLICY IF EXISTS "clients can view lessons" ON public.training_lessons;
    
    -- Créer une nouvelle politique pour training_lessons basée sur la licence
    -- Les admins ont accès à tout, les clients selon leur licence
    CREATE POLICY "users can view lessons by license"
      ON public.training_lessons
      FOR SELECT
      USING (
        -- Les admins ont accès à tout
        public.is_admin(auth.uid())
        OR
        -- Les clients ont accès si :
        -- 1. La leçon est en preview (accessible à tous)
        -- 2. OU le module parent est accessible selon la licence
        (
          is_preview = true
          OR
          EXISTS (
            SELECT 1
            FROM public.training_modules tm
            WHERE tm.id = public.training_lessons.module_id
              AND tm.is_active = true
              AND public.user_has_license_for_module(
                auth.uid(),
                tm.required_license
              )
          )
        )
      );
    
    -- Commenter la nouvelle politique
    COMMENT ON POLICY "users can view lessons by license" ON public.training_lessons IS 
    'Les admins ont accès à toutes les leçons. Les clients ont accès aux leçons en preview 
    ou aux leçons des modules auxquels ils ont accès selon leur licence.';
  END IF;
END $$;

COMMIT;

