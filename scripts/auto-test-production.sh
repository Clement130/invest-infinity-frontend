#!/bin/bash

# Script pour tester automatiquement en production après un push
# Ce script est appelé par le hook git post-push

echo "🚀 Test automatique en production après push"
echo "=============================================="
echo ""

# Attendre 5 minutes pour que Vercel déploie
echo "⏳ Attente du déploiement Vercel (5 minutes)..."
sleep 300

# Exécuter les tests
echo ""
echo "🧪 Exécution des tests en production..."
npm run test:production

# Vérifier le code de sortie
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Tous les tests sont passés !"
    exit 0
else
    echo ""
    echo "❌ Certains tests ont échoué. Vérifiez le rapport."
    exit 1
fi

