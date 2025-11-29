begin;

-- Remettre le prix Transformation à 497€ (annulation de la mise à jour précédente)
update public.stripe_prices
set 
  amount_euros = 497.00,
  description = 'Formule Transformation - 497€',
  updated_at = now()
where plan_type = 'transformation';

commit;

