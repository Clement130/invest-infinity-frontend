begin;

-- Mise à jour du prix Transformation de 497€ à 347€
update public.stripe_prices
set 
  amount_euros = 347.00,
  description = 'Formule Transformation - 347€',
  updated_at = now()
where plan_type = 'transformation';

commit;

