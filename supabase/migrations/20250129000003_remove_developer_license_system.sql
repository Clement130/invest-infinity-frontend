begin;

-- Migration pour supprimer complètement le système de protection développeur
-- Le client a payé, le système n'est plus nécessaire

-- 1. Supprimer les policies RLS sur developer_license
drop policy if exists "Developer can read license" on public.developer_license;
drop policy if exists "Developer can update license" on public.developer_license;
drop policy if exists "Developer can insert license" on public.developer_license;

-- 2. Supprimer le trigger
drop trigger if exists developer_license_set_timestamp on public.developer_license;

-- 3. Supprimer les fonctions spécifiques au système de licence
drop function if exists public.should_revoke_admin();
drop function if exists public.revoke_admin_role();
drop function if exists public.update_developer_license_timestamp();

-- 4. Supprimer la table developer_license
drop table if exists public.developer_license cascade;

-- Note: La fonction is_developer() est conservée car elle peut être utilisée ailleurs
-- Si vous souhaitez la supprimer aussi, décommentez la ligne suivante :
-- drop function if exists public.is_developer(uuid);

commit;

