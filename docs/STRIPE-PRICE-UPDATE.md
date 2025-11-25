# Guide de mise à jour des prix Stripe

Ce guide vous explique comment mettre à jour les prix de vos formules dans Stripe pour qu'ils correspondent aux nouveaux montants (50€ et 249.95€).

## 📋 Méthode 1 : Via le tableau de bord Stripe (Recommandé)

### Étape 1 : Accéder à Stripe Dashboard
1. Connectez-vous à [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Assurez-vous d'être en mode **Test** ou **Live** selon votre environnement

### Étape 2 : Trouver vos produits existants
1. Allez dans **Produits** dans le menu de gauche
2. Trouvez vos produits :
   - **Formation Essentiel** (actuellement 47€)
   - **Formation Premium** (actuellement 197€)

### Étape 3 : Créer de nouveaux prix
Pour chaque produit :

1. Cliquez sur le produit
2. Dans la section **Prix**, cliquez sur **Ajouter un autre prix**
3. Configurez le nouveau prix :
   - **Montant** : 
     - Essentiel : `50.00` €
     - Premium : `249.95` €
   - **Type de facturation** : Paiement unique
   - **Devise** : EUR (€)
4. Cliquez sur **Ajouter le prix**

### Étape 4 : Récupérer les nouveaux Price IDs
1. Une fois le prix créé, vous verrez un **Price ID** (commence par `price_`)
2. Copiez ce Price ID

### Étape 5 : Mettre à jour le code
Mettez à jour le fichier `src/config/stripe.ts` avec les nouveaux Price IDs :

```typescript
export const STRIPE_PRICE_IDS = {
  essentiel: 'price_VOTRE_NOUVEAU_ID_ESSENTIEL', // Formation Essentiel - 50€
  premium: 'price_VOTRE_NOUVEAU_ID_PREMIUM', // Formation Premium - 249.95€
} as const;
```

### Étape 6 : Désactiver les anciens prix (Optionnel)
1. Dans le produit, trouvez l'ancien prix
2. Cliquez sur les trois points (⋯) à côté du prix
3. Sélectionnez **Désactiver**

---

## 🤖 Méthode 2 : Via le script PowerShell (Automatisé)

### Prérequis
- PowerShell installé
- Clé secrète Stripe (sk_test_... ou sk_live_...)
- Product IDs de vos produits Stripe

### Étape 1 : Récupérer vos Product IDs
1. Dans Stripe Dashboard, allez dans **Produits**
2. Cliquez sur chaque produit
3. Copiez le **Product ID** (commence par `prod_`)

### Étape 2 : Exécuter le script
```powershell
.\scripts\update-stripe-prices.ps1 `
  -StripeSecretKey "sk_test_VOTRE_CLE_SECRETE" `
  -ProductIdEssentiel "prod_VOTRE_PRODUIT_ESSENTIEL" `
  -ProductIdPremium "prod_VOTRE_PRODUIT_PREMIUM"
```

### Étape 3 : Suivre les instructions
Le script va :
1. Créer automatiquement les nouveaux prix dans Stripe
2. Afficher les nouveaux Price IDs
3. Proposer de mettre à jour automatiquement `src/config/stripe.ts`

---

## ⚠️ Points importants

### Environnements Stripe
- **Mode Test** : Utilisez `sk_test_...` pour tester sans frais réels
- **Mode Live** : Utilisez `sk_live_...` pour la production (⚠️ attention aux frais réels)

### Anciens prix
- Les anciens Price IDs restent actifs dans Stripe
- Vous pouvez les désactiver manuellement si vous ne voulez plus les utiliser
- Les clients ayant déjà acheté avec les anciens prix ne seront pas affectés

### Vérification
Après la mise à jour, testez le processus de paiement :
1. Allez sur la page `/pricing`
2. Cliquez sur "Acheter maintenant" pour un plan
3. Vérifiez que le montant affiché dans Stripe Checkout correspond bien au nouveau prix

---

## 🔍 Trouver vos Product IDs et Price IDs

### Product IDs
1. Stripe Dashboard → **Produits**
2. Cliquez sur un produit
3. Le Product ID est visible en haut de la page (format : `prod_xxxxxxxxxxxxx`)

### Price IDs actuels
Les Price IDs actuels sont dans `src/config/stripe.ts` :
- Essentiel : `price_1SVKI9KaUb6KDbNFbj44oi6m`
- Premium : `price_1SVKd4KaUb6KDbNFdjwiTGIl`

### Nouveaux Price IDs
Après création, les nouveaux Price IDs seront visibles dans :
- Le tableau de bord Stripe (section Prix du produit)
- La sortie du script PowerShell
- Le fichier `src/config/stripe.ts` après mise à jour

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que votre clé API Stripe est correcte
2. Vérifiez que vous êtes dans le bon environnement (Test/Live)
3. Consultez la [documentation Stripe](https://stripe.com/docs/api/prices/create)

