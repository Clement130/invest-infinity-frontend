# 🔧 Configuration Stripe - Résumé des Actions

## ✅ État Actuel

- ✅ Table `stripe_prices` existe dans Supabase
- ⚠️ Price IDs Entrée et Immersion Élite sont des placeholders
- ✅ Price ID Transformation est configuré (`price_1SXfxaKaUb6KDbNFRgl7y7I5`)

## 🚨 Actions Requises IMMÉDIATEMENT

### 1. Configurer les Variables d'Environnement Supabase

**Dashboard**: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions

Ajoutez ces **secrets** (Edge Functions → Secrets) :

```
STRIPE_SECRET_KEY=sk_live_... (ou sk_test_... pour les tests)
STRIPE_WEBHOOK_SECRET=whsec_... (secret du webhook Stripe)
SITE_URL=https://www.investinfinity.fr
```

**Comment obtenir :**
- **STRIPE_SECRET_KEY** : https://dashboard.stripe.com/apikeys → Secret key
- **STRIPE_WEBHOOK_SECRET** : https://dashboard.stripe.com/webhooks → Votre endpoint → Signing secret

### 2. Créer les Price IDs dans Stripe Dashboard

#### Entrée - 147€
1. https://dashboard.stripe.com/products → Create product
2. Nom : "Entrée - Invest Infinity"
3. Prix : 147.00 EUR
4. Type : One-time payment
5. **Copiez le Price ID** (commence par `price_...`)

#### Immersion Élite - 1997€
1. https://dashboard.stripe.com/products → Create product
2. Nom : "Immersion Élite - Invest Infinity"
3. Prix : 1997.00 EUR
4. Type : One-time payment
5. **Copiez le Price ID** (commence par `price_...`)

### 3. Mettre à jour la Table `stripe_prices`

**SQL Editor**: https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/sql/new

Exécutez ce SQL (remplacez les Price IDs) :

```sql
-- Mettre à jour Entrée
UPDATE public.stripe_prices 
SET stripe_price_id = 'price_VOTRE_PRICE_ID_ENTREE',
    updated_at = now()
WHERE plan_type = 'entree';

-- Mettre à jour Immersion Élite
UPDATE public.stripe_prices 
SET stripe_price_id = 'price_VOTRE_PRICE_ID_IMMERSION',
    updated_at = now()
WHERE plan_type = 'immersion';

-- Vérifier
SELECT plan_type, plan_name, amount_euros, stripe_price_id, is_active
FROM public.stripe_prices;
```

**OU** utilisez le script interactif :
```bash
node scripts/update-stripe-price-ids.js
```

### 4. Configurer le Webhook Stripe

1. https://dashboard.stripe.com/webhooks → Add endpoint
2. URL : `https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook`
3. Événements :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. **Copiez le Signing secret** → Ajoutez comme `STRIPE_WEBHOOK_SECRET` dans Supabase

## ✅ Vérification

1. **Tester un checkout** :
   - https://www.investinfinity.fr/pricing
   - Cliquez sur "Choisir Transformation — 497€"
   - Vous devriez être redirigé vers Stripe Checkout

2. **Vérifier les logs** :
   - https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions/checkout-public/logs
   - Aucune erreur liée à `STRIPE_SECRET_KEY`

## 📝 Checklist

- [ ] `STRIPE_SECRET_KEY` configuré dans Supabase Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` configuré dans Supabase Dashboard
- [ ] `SITE_URL` configuré dans Supabase Dashboard
- [ ] Price ID Entrée créé dans Stripe et mis à jour dans `stripe_prices`
- [ ] Price ID Immersion Élite créé dans Stripe et mis à jour dans `stripe_prices`
- [ ] Webhook Stripe configuré et pointant vers l'Edge Function
- [ ] Test de checkout réussi

## 🔗 Liens Utiles

- **Dashboard Stripe** : https://dashboard.stripe.com
- **Dashboard Supabase** : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw
- **Edge Functions** : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions
- **SQL Editor** : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/sql/new
- **Secrets/Env Vars** : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions

## 📖 Documentation Complète

Voir `docs/CONFIGURATION-STRIPE.md` pour le guide détaillé.

