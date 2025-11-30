# 📦 Mise à jour des Offres - Novembre 2025

## 🎯 Résumé des changements

Cette mise à jour modifie le tunnel de vente avec 3 nouvelles offres :

| Offre | Prix | Paiement |
|-------|------|----------|
| **Starter** | 147€ | Unique, accès à vie |
| **Premium** | 497€ | Unique (ou 3x 166€/mois) |
| **Bootcamp Élite** | 1997€ | Unique (ou 3x 666€/mois) |

---

## ✅ Fichiers modifiés

### Frontend
- `src/config/offers.ts` - Configuration des offres
- `src/config/stripe.ts` - Commentaires mis à jour
- `src/pages/ConfirmationPage.tsx` - Page "Félicitations" avec les 3 cartes
- `src/pages/PricingPage.tsx` - Page pricing cohérente

### Scripts
- `scripts/update-stripe-prices-2025.sql` - Script SQL pour mettre à jour les prix

---

## 📋 Étapes de déploiement

### 1. Configuration Stripe Dashboard

1. **Connectez-vous** à [Stripe Dashboard](https://dashboard.stripe.com)

2. **Créez 3 produits** (Products > Add product) :
   - `Invest Infinity – Starter`
   - `Invest Infinity – Premium`
   - `Invest Infinity – Bootcamp Élite`

3. **Créez les prix** pour chaque produit :
   
   | Produit | Prix | Type |
   |---------|------|------|
   | Starter | 147€ | One-time |
   | Premium | 497€ | One-time |
   | Bootcamp Élite | 1997€ | One-time |

4. **Notez les Price IDs** (format: `price_XXXXXXXXXXXXXXXX`)

5. **Activez Klarna** pour le paiement en 3x :
   - Settings > Payment methods > Klarna
   - Cela permet automatiquement le paiement en plusieurs fois

### 2. Mise à jour de la base de données

1. Ouvrez le **SQL Editor** dans Supabase Dashboard

2. Modifiez le script `scripts/update-stripe-prices-2025.sql` :
   - Remplacez `price_STARTER_147_REMPLACER` par votre Price ID Starter
   - Remplacez `price_PREMIUM_497_REMPLACER` par votre Price ID Premium
   - Remplacez `price_BOOTCAMP_1997_REMPLACER` par votre Price ID Bootcamp

3. Exécutez le script SQL

4. Vérifiez que les prix sont bien insérés :
   ```sql
   SELECT * FROM stripe_prices WHERE is_active = true;
   ```

### 3. Déploiement du frontend

```bash
# Build et test local
npm run build
npm run preview

# Déploiement sur Vercel
git add .
git commit -m "feat: mise à jour offres 2025 (Starter 147€, Premium 497€, Bootcamp 1997€)"
git push origin main
```

---

## 🧪 Tests à effectuer

### Test 1 : Page de confirmation après inscription

1. Créer un compte test sur le site
2. Vérifier la redirection vers `/confirmation`
3. Vérifier l'affichage :
   - ✅ Titre "Félicitations" avec prénom
   - ✅ 3 cartes alignées (Starter, Premium, Bootcamp Élite)
   - ✅ Prix corrects (147€, 497€, 1997€)
   - ✅ Textes des avantages corrects

### Test 2 : Boutons de paiement

1. Cliquer sur "Choisir — 147€" (Starter)
   - ✅ Redirection vers Stripe Checkout
   - ✅ Montant affiché : 147€
   - ✅ Nom du produit : "Invest Infinity – Starter"

2. Cliquer sur "Choisir — 497€" (Premium)
   - ✅ Redirection vers Stripe Checkout
   - ✅ Montant affiché : 497€
   - ✅ Option Klarna disponible

3. Cliquer sur "Planifier un rendez-vous" (Bootcamp)
   - ✅ Ouverture du modal Calendly
   - ✅ Pré-remplissage nom/email si connecté

### Test 3 : Paiement test (mode test Stripe)

1. Utiliser la carte test `4242 4242 4242 4242`
2. Vérifier l'attribution de la licence dans le profil
3. Vérifier l'accès aux modules correspondants

### Test 4 : Responsive

- ✅ Desktop : 3 cartes sur une ligne
- ✅ Tablette : 3 cartes sur une ligne (plus petites)
- ✅ Mobile : Cartes empilées verticalement, lisibles

---

## 🔧 Configuration des features par offre

### Starter (147€)
- Sessions de trading en direct
- Communauté privée Discord
- Alertes trading en temps réel
- Échanges avec les membres
- Tutoriels plateformes (TopStep, Apex, MT4/MT5)

### Premium (497€)
- **Tout Starter inclus**
- Accès à l'intégralité de la formation
- Groupe exclusif
- Accompagnement 7j/7
- 2 stratégies de trading rentables
- 1 coaching individuel de 30 min en visio
- **Garantie 14 jours**

### Bootcamp Élite (1997€)
- **Tout Premium inclus**
- Horaires de la formation : 9h–18h
- 5–8 élèves max
- Ateliers guidés pour comprendre et appliquer
- Trading en live avec Mickaël
- Analyse en direct des marchés
- Ma stratégie rentable expliquée de A à Z

---

## 🚨 Points d'attention

1. **Webhook Stripe** : Le webhook existant (`stripe-webhook`) utilise déjà le mapping dynamique depuis la table `stripe_prices`. Aucune modification nécessaire.

2. **Paiement en 3x** : Géré automatiquement par Klarna si activé dans Stripe. Le texte "ou 3x 166€/mois" est informatif.

3. **Bootcamp Élite** : Le bouton "Planifier un rendez-vous" ouvre Calendly. Le paiement se fait après l'appel découverte.

---

## 📞 Support

En cas de problème :
1. Vérifier les logs Supabase (Edge Functions)
2. Vérifier les webhooks Stripe (Developers > Webhooks)
3. Contacter le support technique

