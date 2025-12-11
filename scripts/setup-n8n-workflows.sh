#!/bin/bash

# Script shell pour créer rapidement les workflows N8N
# Usage: ./scripts/setup-n8n-workflows.sh

echo "🚀 Configuration des workflows N8N pour newsletters"
echo ""

# Demander la clé API si elle n'est pas définie
if [ -z "$N8N_API_KEY" ]; then
    echo "📝 Entrez votre clé API N8N (Settings → API dans N8N):"
    read -r N8N_API_KEY
    export N8N_API_KEY
fi

# Optionnel: demander l'URL si différente
if [ -z "$N8N_URL" ]; then
    echo "📝 URL de votre instance N8N (laissez vide pour utiliser https://n8n.srv1154679.hstgr.cloud):"
    read -r N8N_URL_INPUT
    if [ -n "$N8N_URL_INPUT" ]; then
        export N8N_URL="$N8N_URL_INPUT"
    fi
fi

echo ""
echo "⏳ Création des workflows..."

# Exécuter le script Node.js
node scripts/create-n8n-workflows.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Workflows créés avec succès !"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "1. Va dans N8N → Workflows"
    echo "2. Configure les credentials (Postgres pour Supabase, HTTP Header Auth pour Resend)"
    echo "3. Configure les variables d'environnement (RESEND_API_KEY, FROM_EMAIL)"
    echo "4. Active les workflows"
else
    echo ""
    echo "❌ Erreur lors de la création des workflows"
    exit 1
fi


