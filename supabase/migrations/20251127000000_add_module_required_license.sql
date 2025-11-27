-- Migration pour ajouter required_license aux modules de formation
-- Permet de différencier l'accès selon la formule (starter, pro, elite)

BEGIN;

-- Ajouter le champ required_license aux modules
ALTER TABLE public.training_modules
ADD COLUMN IF NOT EXISTS required_license TEXT DEFAULT 'starter' 
CHECK (required_license IN ('starter', 'pro', 'elite'));

-- Créer un index pour les recherches par licence
CREATE INDEX IF NOT EXISTS training_modules_required_license_idx 
ON public.training_modules(required_license);

-- Fonction pour vérifier si un utilisateur a accès à un module selon sa licence
CREATE OR REPLACE FUNCTION public.user_has_license_for_module(
  user_id UUID,
  module_required_license TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_license TEXT;
  license_hierarchy TEXT[] := ARRAY['starter', 'pro', 'elite'];
  user_level INT;
  required_level INT;
BEGIN
  -- Récupérer la licence de l'utilisateur
  SELECT license INTO user_license
  FROM public.profiles
  WHERE id = user_id;
  
  -- Si pas de licence, refuser
  IF user_license IS NULL OR user_license = 'none' THEN
    RETURN FALSE;
  END IF;
  
  -- Trouver les niveaux
  user_level := array_position(license_hierarchy, user_license);
  required_level := array_position(license_hierarchy, module_required_license);
  
  -- Si niveau non trouvé, utiliser le minimum
  IF user_level IS NULL THEN user_level := 0; END IF;
  IF required_level IS NULL THEN required_level := 1; END IF;
  
  -- L'utilisateur a accès si son niveau >= niveau requis
  RETURN user_level >= required_level;
END;
$$;

-- Commenter les colonnes pour la documentation
COMMENT ON COLUMN public.training_modules.required_license IS 
'Niveau de licence minimum requis pour accéder à ce module (starter, pro, elite)';

COMMIT;

