# 🧪 Test Automatique en Production

## 📋 Vue d'ensemble

Ce système permet de tester automatiquement l'application en production après chaque changement.

## 🚀 Utilisation

### Option 1 : Test Manuel

```bash
# Tester immédiatement (sans attendre le déploiement)
npm run test:production

# Tester après avoir attendu le déploiement (5 minutes)
npm run test:production:wait
```

### Option 2 : Test Automatique après Push

Après chaque `git push origin main`, exécutez :

```bash
npm run test:production:wait
```

Ou créez un alias Git :

```bash
# Ajouter dans votre .gitconfig ou .bashrc/.zshrc
git config --global alias.push-and-test '!f() { git push "$@" && echo "⏳ Attente 5 minutes pour le déploiement..." && sleep 300 && npm run test:production; }; f'

# Utiliser ensuite
git push-and-test origin main
```

## 📊 Résultats

Les tests génèrent :
- **Console** : Résultats en temps réel
- **Rapport JSON** : `TEST-PRODUCTION-{timestamp}.json`
- **Captures d'écran** : `.playwright-mcp/test-{timestamp}.png`

## ✅ Tests Effectués

1. **Dashboard Admin** (`/admin/dashboard`)
   - Vérification du chargement
   - Vérification des erreurs JavaScript
   - Mesure du temps de chargement

2. **Page d'Accueil** (`/`)
   - Vérification du chargement
   - Vérification des erreurs JavaScript
   - Mesure du temps de chargement

## 🔧 Configuration

Les tests sont configurés dans `scripts/test-production.js` :

```javascript
const PRODUCTION_URL = 'https://invest-infinity-frontend.vercel.app';
const TEST_TIMEOUT = 30000; // 30 secondes
const WAIT_FOR_DEPLOY = 300000; // 5 minutes
```

## 📝 Exemple de Sortie

```
🚀 Démarrage des tests en production
   URL: https://invest-infinity-frontend.vercel.app
   Date: 2025-01-22T10:30:00.000Z

🧪 Test: Test Dashboard Admin
   URL: https://invest-infinity-frontend.vercel.app/admin/dashboard
   ⏱️  Temps de chargement: 2345ms
   ✅ Texte "Dashboard" trouvé
   ✅ Aucune erreur JavaScript
   ✅ Temps de chargement OK (2345ms <= 10000ms)
   ✅ Aucune erreur dans la console
   📸 Capture d'écran: .playwright-mcp/test-1234567890.png

============================================================
📊 RÉSUMÉ DES TESTS
============================================================
Total: 2
✅ Réussis: 2
❌ Échoués: 0
============================================================
```

## 🚨 En Cas d'Échec

Si un test échoue :
1. Consultez le rapport JSON pour les détails
2. Vérifiez les captures d'écran
3. Vérifiez les logs Vercel pour les erreurs de build
4. Vérifiez la console du navigateur en production

## 🔄 Intégration Continue

Pour automatiser complètement, vous pouvez :
1. Utiliser GitHub Actions
2. Utiliser un service de CI/CD
3. Configurer un webhook Vercel

Voir `docs/AUTO-TEST-CI.md` pour plus de détails.

