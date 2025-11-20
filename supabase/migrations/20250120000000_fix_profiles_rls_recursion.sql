begin;

-- Supprimer la politique problématique
drop policy if exists "admins can see all profiles" on public.profiles;

-- Recréer la fonction is_admin avec SECURITY DEFINER pour contourner RLS
-- Cela permet à la fonction de lire profiles sans déclencher les politiques RLS
drop function if exists public.is_admin(uuid);

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role = 'admin'
  );
$$;

-- Recréer la politique admin pour profiles
-- Maintenant que is_admin utilise SECURITY DEFINER, il n'y aura plus de récursion
create policy "admins can see all profiles"
  on public.profiles
  for select
  using (public.is_admin(auth.uid()));

-- Permettre aussi aux utilisateurs de mettre à jour leur propre profil
create policy "users can update their own profile"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Permettre aux utilisateurs d'insérer leur propre profil (pour la création automatique)
create policy "users can insert their own profile"
  on public.profiles
  for insert
  with check (id = auth.uid());

commit;

