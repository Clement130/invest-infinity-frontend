-- Migration de sécurisation majeure (Security Pass)
-- Objectifs :
-- 1. Empêcher l'élévation de privilèges (protection des colonnes role/license)
-- 2. Créer un journal d'audit pour les admins
-- 3. Verrouiller les tables sensibles

BEGIN;

-- ============================================================================
-- 1. PROTECTION DES PROFILS (Anti-Privilege Escalation)
-- ============================================================================

-- Fonction trigger pour empêcher la modification de champs sensibles par l'utilisateur lui-même
CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_updates()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si c'est un insert, on laisse faire (géré par le backend/webhook souvent, ou default values)
  -- Si c'est le service_role (supabase admin), on autorise tout
  IF (auth.role() = 'service_role') THEN
    RETURN NEW;
  END IF;

  -- Vérifier si l'utilisateur essaie de changer son rôle
  IF (NEW.role IS DISTINCT FROM OLD.role) THEN
    -- Seul un admin peut changer un rôle
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Vous ne pouvez pas modifier votre propre rôle.';
    END IF;
  END IF;

  -- Vérifier si l'utilisateur essaie de changer sa licence
  IF (NEW.license IS DISTINCT FROM OLD.license) THEN
    -- Seul un admin ou le webhook (service_role) peut changer une licence
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Vous ne pouvez pas modifier votre propre licence.';
    END IF;
  END IF;

  -- Vérifier si l'utilisateur essaie de changer la date de validité
  IF (NEW.license_valid_until IS DISTINCT FROM OLD.license_valid_until) THEN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Modification de validité licence interdite.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS on_profile_sensitive_update ON public.profiles;
CREATE TRIGGER on_profile_sensitive_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_sensitive_profile_updates();


-- ============================================================================
-- 2. LOGS D'ACTIVITÉ ADMIN (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,          -- ex: 'delete_video', 'refund_user'
  target_resource TEXT,          -- ex: 'training_modules'
  target_id TEXT,               -- ID de l'objet touché
  details JSONB,                -- Détails (ancien/nouvelle valeur)
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sécurisation RLS des logs
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs FORCE ROW LEVEL SECURITY;

-- Seuls les admins peuvent lire les logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_activity_logs
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Seuls les admins ou le service peuvent insérer
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_activity_logs
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR public.is_admin(auth.uid())
  );

-- Personne ne peut modifier ou supprimer des logs (Immuabilité)
-- Pas de policy UPDATE / DELETE


-- ============================================================================
-- 3. DURCISSEMENT DES POLITIQUES D'ACCÈS (Defense in Depth)
-- ============================================================================

-- S'assurer que training_access est en lecture seule pour les clients
-- (Supprimer d'anciennes politiques permissives si elles existent)
DROP POLICY IF EXISTS "users manage their own access" ON public.training_access;
DROP POLICY IF EXISTS "users can insert access" ON public.training_access;

-- Recréer la politique de lecture stricte (au cas où)
DROP POLICY IF EXISTS "users can view their access" ON public.training_access;
CREATE POLICY "users can view their access"
  ON public.training_access
  FOR SELECT
  USING (user_id = auth.uid());

-- Politique explicite : Insert/Update/Delete interdit pour les users standards sur training_access
-- (Par défaut RLS bloque tout ce qui n'est pas autorisé, donc juste s'assurer qu'il n'y a PAS de policy INSERT pour public)


COMMIT;

