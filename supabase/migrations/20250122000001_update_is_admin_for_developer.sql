begin;

-- Mettre à jour la fonction is_admin pour reconnaître aussi le rôle 'developer'
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
      AND (p.role = 'admin' OR p.role = 'developer')
  );
$$;

commit;

