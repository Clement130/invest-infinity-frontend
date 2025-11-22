begin;

-- Mettre à jour la fonction is_developer pour ne vérifier QUE l'email
-- investinfinityfr@gmail.com ne doit pas savoir que ce système existe
create or replace function public.is_developer(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.email = 'butcher13550@gmail.com'
  );
$$;

commit;

