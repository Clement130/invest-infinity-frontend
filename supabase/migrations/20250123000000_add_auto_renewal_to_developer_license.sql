begin;

-- Ajouter le champ auto_renewal_enabled à la table developer_license
-- Ce champ indique qu'on a déjà cliqué une fois sur "Valider le Paiement"
-- Une fois activé, le bouton disparaît et on n'a plus besoin de cliquer
alter table public.developer_license
add column if not exists auto_renewal_enabled boolean not null default false;

commit;

