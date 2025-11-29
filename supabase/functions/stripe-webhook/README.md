# Stripe Webhooks - Configuration InvestInfinity

## 📋 Vue d'ensemble

Deux fonctions Edge séparées pour gérer les webhooks Stripe :

| Fonction | Mode | URL |
|----------|------|-----|
| `stripe-webhook` | **LIVE** (Production) | `https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook` |
| `stripe-webhook-test` | **TEST** (Développement) | `https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook-test` |

---

## 🔐 Variables d'environnement requises

### Dans Supabase Dashboard > Edge Functions > Secrets :

```bash
# MODE LIVE (Production)
STRIPE_SECRET_KEY_LIVE=<votre_cle_live>
STRIPE_WEBHOOK_SECRET_LIVE=<votre_webhook_secret_live>

# MODE TEST (Développement)
STRIPE_SECRET_KEY_TEST=<votre_cle_test>
STRIPE_WEBHOOK_SECRET_TEST=<votre_webhook_secret_test>
```

### Où récupérer ces valeurs ?

| Variable | Où la trouver |
|----------|---------------|
| `STRIPE_SECRET_KEY_LIVE` | [Stripe Dashboard > API Keys](https://dashboard.stripe.com/apikeys) (mode Live) |
| `STRIPE_SECRET_KEY_TEST` | [Stripe Dashboard > API Keys](https://dashboard.stripe.com/test/apikeys) (mode Test) |
| `STRIPE_WEBHOOK_SECRET_LIVE` | [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks) > Webhook LIVE > Signing secret |
| `STRIPE_WEBHOOK_SECRET_TEST` | [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks) > Webhook TEST > Signing secret |

> ⚠️ **IMPORTANT** : Chaque endpoint webhook Stripe a son propre Signing secret !

---

## 🎯 Configuration Stripe Dashboard

### Webhook LIVE (Production)

1. Aller sur [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks) (mode Live)
2. Cliquer sur **Add endpoint**
3. URL : `https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook`
4. Sélectionner les événements :
   - ✅ `checkout.session.completed`
   - ✅ `invoice.paid`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. Copier le **Signing secret** → configurer `STRIPE_WEBHOOK_SECRET_LIVE`

### Webhook TEST (Développement)

1. Aller sur [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks) (mode Test)
2. Cliquer sur **Add endpoint**
3. URL : `https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook-test`
4. Sélectionner les mêmes événements
5. Copier le **Signing secret** → configurer `STRIPE_WEBHOOK_SECRET_TEST`

---

## 🚀 Déploiement

### Via CLI Supabase

```bash
# Déployer les deux fonctions
supabase functions deploy stripe-webhook --project-ref vveswlmcgmizmjsriezw
supabase functions deploy stripe-webhook-test --project-ref vveswlmcgmizmjsriezw

# Configurer les secrets
supabase secrets set STRIPE_SECRET_KEY_LIVE=sk_live_xxx --project-ref vveswlmcgmizmjsriezw
supabase secrets set STRIPE_WEBHOOK_SECRET_LIVE=whsec_xxx --project-ref vveswlmcgmizmjsriezw
supabase secrets set STRIPE_SECRET_KEY_TEST=sk_test_xxx --project-ref vveswlmcgmizmjsriezw
supabase secrets set STRIPE_WEBHOOK_SECRET_TEST=whsec_xxx --project-ref vveswlmcgmizmjsriezw
```

---

## 🧪 Tester avec Stripe CLI

### Installation Stripe CLI

```bash
# Windows (avec scoop)
scoop install stripe

# macOS
brew install stripe/stripe-cli/stripe

# Ou télécharger depuis https://stripe.com/docs/stripe-cli
```

### Tester en local

```bash
# 1. Se connecter à Stripe
stripe login

# 2. Écouter les webhooks et les forwarder vers la fonction TEST
stripe listen --forward-to https://vveswlmcgmizmjsriezw.supabase.co/functions/v1/stripe-webhook-test

# 3. Dans un autre terminal, déclencher un événement de test
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger payment_intent.succeeded
```

---

## 📊 Monitoring

### Logs Supabase

```bash
# Voir les logs en temps réel
supabase functions logs stripe-webhook --project-ref vveswlmcgmizmjsriezw
supabase functions logs stripe-webhook-test --project-ref vveswlmcgmizmjsriezw
```

### Dashboard Supabase

- [Edge Functions > stripe-webhook](https://supabase.com/dashboard/project/vveswlmcgmizmjsriezw/functions)

### Dashboard Stripe

- [Webhooks > Événements](https://dashboard.stripe.com/webhooks) - voir le statut de chaque événement

---

## 🔧 Troubleshooting

### Erreur 400 - Invalid signature

- Vérifier que le `STRIPE_WEBHOOK_SECRET_*` correspond au bon endpoint
- Chaque webhook a son propre signing secret !

### Erreur 500 - Server configuration error

- Vérifier que toutes les variables d'environnement sont configurées
- Voir les logs : `supabase functions logs stripe-webhook`

### Événements en échec dans Stripe

1. Vérifier les logs Supabase
2. Corriger le problème
3. Cliquer sur "Réessayer" dans le dashboard Stripe

---

## 📁 Structure des fichiers

```
supabase/functions/
├── stripe-webhook/           # MODE LIVE
│   ├── index.ts
│   └── README.md
├── stripe-webhook-test/      # MODE TEST
│   └── index.ts
└── _shared/
    ├── cors.ts
    └── security.ts
```
