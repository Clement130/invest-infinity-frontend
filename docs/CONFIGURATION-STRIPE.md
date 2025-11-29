# Configuration Stripe - Guide Complet

## 🔴 Problème Actuel

L'erreur "Erreur lors de la création du paiement" indique que Stripe n'est pas correctement configuré.

## ✅ Étapes de Configuration

### 1. Variables d'Environnement Supabase

Les Edge Functions Supabase nécessitent ces variables d'environnement :

#### Dans le Dashboard Supabase :
1. Allez sur : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/settings/functions
2. Ajoutez les secrets suivants :

```
STRIPE_SECRET_KEY=sk_live_... (ou sk_test_... pour les tests)
STRIPE_WEBHOOK_SECRET=whsec_... (secret du webhook Stripe)
SITE_URL=https://www.investinfinity.fr
```

**Comment obtenir les clés Stripe :**
- **STRIPE_SECRET_KEY** : Dashboard Stripe → Developers → API keys → Secret key
- **STRIPE_WEBHOOK_SECRET** : Dashboard Stripe → Developers → Webhooks → Sélectionnez votre endpoint → Signing secret

### 2. Créer les Price IDs dans Stripe Dashboard

#### Pour chaque formule, créez un Price dans Stripe :

1. **Entrée - 147€**
   - Dashboard Stripe → Products → Create product
   - Nom : "Entrée - Invest Infinity"
   - Prix : 147.00 EUR
   - Type : One-time payment
   - Copiez le Price ID (commence par `price_...`)

2. **Transformation - 497€**
   - Déjà configuré : `price_1SXfxaKaUb6KDbNFRgl7y7I5`
   - Vérifiez qu'il est toujours actif dans Stripe

3. **Immersion Élite - 1997€**
   - Dashboard Stripe → Products → Create product
   - Nom : "Immersion Élite - Invest Infinity"
   - Prix : 1997.00 EUR
   - Type : One-time payment
   - Copiez le Price ID (commence par `price_...`)

### 3. Mettre à jour la Table `stripe_prices` dans Supabase

Une fois les Price IDs créés, mettez à jour la table dans Supabase :

```sql
-- Mettre à jour le Price ID pour Entrée
UPDATE public.stripe_prices 
SET stripe_price_id = 'price_VOTRE_PRICE_ID_ENTREE'
WHERE plan_type = 'entree';

-- Mettre à jour le Price ID pour Immersion Élite
UPDATE public.stripe_prices 
SET stripe_price_id = 'price_VOTRE_PRICE_ID_IMMERSION'
WHERE plan_type = 'immersion';

-- Vérifier les Price IDs
SELECT plan_type, plan_name, amount_euros, stripe_price_id, is_active
FROM public.stripe_prices;
```

### 4. Configurer le Webhook Stripe

1. Dashboard Stripe → Developers → Webhooks → Add endpoint
2. URL : `https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook`
3. Événements à écouter :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copiez le **Signing secret** et ajoutez-le comme `STRIPE_WEBHOOK_SECRET` dans Supabase

### 5. Vérification

#### Tester la configuration :

1. **Vérifier les variables d'environnement** :
   ```bash
   # Via Supabase CLI (si installé)
   supabase secrets list --project-ref vveswlmcgmizmjsriezw
   ```

2. **Tester un checkout** :
   - Allez sur https://www.investinfinity.fr/pricing
   - Cliquez sur "Choisir Transformation — 497€"
   - Vous devriez être redirigé vers Stripe Checkout

3. **Vérifier les logs** :
   - Dashboard Supabase → Edge Functions → checkout-public → Logs
   - Vérifiez qu'il n'y a pas d'erreurs liées à `STRIPE_SECRET_KEY`

## 🔍 Dépannage

### Erreur : "Unable to create payment session"
- ✅ Vérifiez que `STRIPE_SECRET_KEY` est configuré dans Supabase
- ✅ Vérifiez que la clé commence par `sk_live_` ou `sk_test_`
- ✅ Vérifiez que la clé n'est pas expirée

### Erreur : "Invalid price selection"
- ✅ Vérifiez que les Price IDs dans `stripe_prices` sont valides
- ✅ Vérifiez que les Price IDs existent dans Stripe Dashboard
- ✅ Vérifiez que les Price IDs ne sont pas des placeholders (`price_ENTREE_PLACEHOLDER`)

### Erreur : "Webhook signature verification failed"
- ✅ Vérifiez que `STRIPE_WEBHOOK_SECRET` est configuré
- ✅ Vérifiez que l'URL du webhook dans Stripe correspond à votre Edge Function

## 📝 Checklist de Configuration

- [ ] `STRIPE_SECRET_KEY` configuré dans Supabase
- [ ] `STRIPE_WEBHOOK_SECRET` configuré dans Supabase
- [ ] `SITE_URL` configuré dans Supabase
- [ ] Price ID Entrée créé dans Stripe et mis à jour dans `stripe_prices`
- [ ] Price ID Immersion Élite créé dans Stripe et mis à jour dans `stripe_prices`
- [ ] Webhook Stripe configuré et pointant vers l'Edge Function
- [ ] Test de checkout réussi

## 🔗 Liens Utiles

- Dashboard Stripe : https://dashboard.stripe.com
- Dashboard Supabase : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw
- Edge Functions : https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions

