-- Migration pour l'audit automatique des actions critiques
-- Cette migration ajoute des triggers sur les tables sensibles pour remplir admin_activity_logs

BEGIN;

-- Fonction générique de logging
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  action_type TEXT;
  record_id TEXT;
  details JSONB;
BEGIN
  -- Tenter de récupérer l'ID utilisateur (peut être null si triggered par système)
  current_user_id := auth.uid();
  
  -- Déterminer le type d'action
  IF (TG_OP = 'INSERT') THEN
    action_type := 'create';
    record_id := NEW.id::text;
    details := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    action_type := 'update';
    record_id := NEW.id::text;
    -- On stocke ce qui a changé
    details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF (TG_OP = 'DELETE') THEN
    action_type := 'delete';
    record_id := OLD.id::text;
    details := to_jsonb(OLD);
  END IF;

  -- On ne loggue que si l'action vient d'un admin ou développeur (ou si on veut tout tracer)
  -- Ici, on trace tout changement sur les tables critiques, peu importe qui le fait, pour la sécurité.
  -- Mais on identifie si c'est un admin.
  
  INSERT INTO public.admin_activity_logs (
    admin_id,
    action,
    target_resource,
    target_id,
    details
  ) VALUES (
    current_user_id,
    action_type,
    TG_TABLE_NAME,
    record_id,
    details
  );

  RETURN NULL; -- Trigger AFTER, le retour n'importe pas
END;
$$;

-- 1. Audit sur les MODULES
DROP TRIGGER IF EXISTS audit_training_modules ON public.training_modules;
CREATE TRIGGER audit_training_modules
  AFTER INSERT OR UPDATE OR DELETE ON public.training_modules
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

-- 2. Audit sur les LEÇONS
DROP TRIGGER IF EXISTS audit_training_lessons ON public.training_lessons;
CREATE TRIGGER audit_training_lessons
  AFTER INSERT OR UPDATE OR DELETE ON public.training_lessons
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

-- 3. Audit sur les PAIEMENTS (Modifications manuelles ou suppressions suspectes)
DROP TRIGGER IF EXISTS audit_payments ON public.payments;
CREATE TRIGGER audit_payments
  AFTER UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();
-- Note: On ne loggue pas les INSERT de payments car ils sont nombreux (webhooks) et moins critiques en audit admin,
-- sauf si on veut debugger. Pour l'instant on garde UPDATE/DELETE.

COMMIT;

