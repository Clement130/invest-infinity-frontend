# Configuration Trustpilot - Guide Complet

## ✅ Ce qui est déjà fait

1. **Composant TrustpilotWidget** créé et intégré dans la page d'accueil
2. **Fichier de configuration** créé : `src/config/trustpilot.ts`
3. **Script d'extraction automatique** créé : `scripts/configure-trustpilot.js`
4. **Suppression des témoignages factices** effectuée

## 🔧 Configuration finale

### Option 1 : Configuration automatique (Recommandé)

1. **Connectez-vous sur Trustpilot Business**
   - URL: https://businessapp.b2b.trustpilot.com/features/trustbox-widgets
   - Connectez-vous avec vos identifiants

2. **Récupérez le code TrustBox**
   - Cliquez sur "Get code" ou "Obtenir le code"
   - Sélectionnez le type de widget souhaité (ex: "Carousel", "Micro Star Rating", etc.)
   - Copiez le code HTML complet fourni

3. **Exécutez le script d'extraction**
   ```bash
   node scripts/configure-trustpilot.js "<code HTML TrustBox>"
   ```
   
   Exemple:
   ```bash
   node scripts/configure-trustpilot.js '<div class="trustpilot-widget" data-template-id="539adbd6dec7e10109cdf8c9" data-businessunit-id="5a1b2c3d4e5f6g7h8i9j0k1"><a href="https://fr.trustpilot.com/review/invest-infinity.com">Trustpilot</a></div>'
   ```

4. **Vérifiez la configuration**
   - Ouvrez `src/config/trustpilot.ts`
   - Vérifiez que les valeurs ont été remplacées

### Option 2 : Configuration manuelle

1. **Ouvrez le fichier de configuration**
   ```bash
   src/config/trustpilot.ts
   ```

2. **Récupérez les informations depuis Trustpilot**
   - Connectez-vous sur: https://businessapp.b2b.trustpilot.com/features/trustbox-widgets
   - Cliquez sur "Get code"
   - Notez les valeurs suivantes:
     - `data-template-id` → `templateId`
     - `data-businessunit-id` → `businessUnitId`
     - Domaine dans l'URL (ex: `invest-infinity.com`) → `domain`

3. **Remplacez les valeurs dans `trustpilot.ts`**
   ```typescript
   export const trustpilotConfig = {
     templateId: "VOTRE_TEMPLATE_ID",        // Remplacez ici
     businessUnitId: "VOTRE_BUSINESSUNIT_ID", // Remplacez ici
     domain: "VOTRE_DOMAINE",                // Remplacez ici
     // ... reste inchangé
   };
   ```

## 📋 Informations à récupérer

Dans le code TrustBox fourni par Trustpilot, vous trouverez:

```html
<div 
  class="trustpilot-widget"
  data-template-id="539adbd6dec7e10109cdf8c9"        ← Template ID
  data-businessunit-id="5a1b2c3d4e5f6g7h8i9j0k1"     ← Business Unit ID
  ...
>
  <a href="https://fr.trustpilot.com/review/invest-infinity.com">
    Trustpilot
  </a>                                               ← Domaine: invest-infinity.com
</div>
```

## 🚀 Déploiement

Une fois la configuration complétée:

1. **Testez en local**
   ```bash
   npm run dev
   ```
   - Vérifiez que le widget Trustpilot s'affiche correctement
   - Vérifiez qu'il n'y a plus de message d'avertissement

2. **Commitez et poussez**
   ```bash
   git add src/config/trustpilot.ts
   git commit -m "feat: Configuration Trustpilot complétée"
   git push origin main
   ```

3. **Vérifiez en production**
   - Attendez le déploiement Vercel (3-5 minutes)
   - Visitez: https://invest-infinity-frontend.vercel.app
   - Vérifiez que le widget s'affiche entre "JoinSteps" et "FAQ"

## ✅ Vérification

Le widget est correctement configuré si:
- ✅ La section "Avis clients" s'affiche
- ✅ Le widget Trustpilot est visible (pas de message d'avertissement)
- ✅ Les avis s'affichent correctement
- ✅ Le lien vers Trustpilot fonctionne

## 🆘 Dépannage

### Le widget ne s'affiche pas
- Vérifiez que les IDs sont corrects dans `trustpilot.ts`
- Vérifiez la console du navigateur pour les erreurs
- Vérifiez que le script Trustpilot se charge (onglet Network)

### Message "Configuration Trustpilot requise"
- Les valeurs dans `trustpilot.ts` sont encore des placeholders
- Remplacez-les par les vraies valeurs depuis Trustpilot

### Le widget s'affiche mais sans avis
- Vérifiez que votre compte Trustpilot a des avis
- Vérifiez que le domaine correspond à celui configuré dans Trustpilot

## 📚 Ressources

- Dashboard Trustpilot: https://businessapp.b2b.trustpilot.com
- Documentation TrustBox: https://businessapp.b2b.trustpilot.com/features/trustbox-widgets
- Support Trustpilot: https://support.trustpilot.com

