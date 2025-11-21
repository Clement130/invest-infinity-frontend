# 🧪 Test Production - Instructions

## ✅ Système de Test Automatique Créé

J'ai créé un système de test automatique en production qui :

1. **Teste automatiquement** l'application après chaque changement
2. **Génère des rapports** détaillés avec captures d'écran
3. **Vérifie** les erreurs JavaScript, temps de chargement, etc.

## 🚀 Comment Utiliser

### Test Immédiat (sans attendre le déploiement)

```bash
npm run test:production
```

### Test avec Attente du Déploiement (5 minutes)

```bash
npm run test:production:wait
```

## 📋 Ce qui est Testé

1. **Dashboard Admin** (`/admin/dashboard`)
   - Chargement de la page
   - Absence d'erreurs JavaScript
   - Temps de chargement < 10s

2. **Page d'Accueil** (`/`)
   - Chargement de la page
   - Absence d'erreurs JavaScript
   - Temps de chargement < 10s

## 📊 Résultats

Les tests génèrent :
- ✅ Rapport dans la console
- 📄 Rapport JSON : `TEST-PRODUCTION-{timestamp}.json`
- 📸 Captures d'écran : `.playwright-mcp/test-{timestamp}.png`

## 🔧 Installation Requise

Si Playwright n'est pas installé :

```bash
npm install
npx playwright install chromium
```

## 📝 Prochaines Étapes

1. **Installer Playwright** (si nécessaire) :
   ```bash
   npm install
   npx playwright install chromium
   ```

2. **Tester maintenant** :
   ```bash
   npm run test:production:wait
   ```

3. **Après chaque push**, exécutez :
   ```bash
   npm run test:production:wait
   ```

## 🎯 Automatisation Complète

Pour automatiser complètement, vous pouvez :
- Créer un alias Git : `git push-and-test`
- Utiliser GitHub Actions
- Configurer un webhook Vercel

Voir `AUTO-TEST-PRODUCTION.md` pour plus de détails.

