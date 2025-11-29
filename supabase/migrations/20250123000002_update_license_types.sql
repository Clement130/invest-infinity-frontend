-- Migration pour mettre à jour les types de licences
-- Remplace starter/pro/elite par entree/transformation/immersion

begin;

-- Supprimer les anciennes contraintes CHECK
alter table public.profiles 
  drop constraint if exists profiles_license_check;

alter table public.payments 
  drop constraint if exists payments_license_type_check;

-- Ajouter les nouvelles contraintes avec les nouveaux types
alter table public.profiles 
  add constraint profiles_license_check 
  check (license in ('none', 'entree', 'transformation', 'immersion'));

alter table public.payments 
  add constraint payments_license_type_check 
  check (license_type in ('entree', 'transformation', 'immersion'));

-- Migrer les données existantes (si nécessaire)
-- starter -> entree
update public.profiles set license = 'entree' where license = 'starter';
update public.payments set license_type = 'entree' where license_type = 'starter';

-- pro -> transformation
update public.profiles set license = 'transformation' where license = 'pro';
update public.payments set license_type = 'transformation' where license_type = 'pro';

-- elite -> immersion
update public.profiles set license = 'immersion' where license = 'elite';
update public.payments set license_type = 'immersion' where license_type = 'elite';

commit;

