#!/bin/bash

# Script de configuration pour les fonctionnalités admin
# Ce script aide à configurer les paramètres et l'upload de vidéos

echo "🚀 Configuration des fonctionnalités admin InvestInfinity"
echo "=================================================="
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI n'est pas installé${NC}"
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI détecté${NC}"
echo ""

# Étape 1: Migration
echo "📦 Étape 1: Application de la migration..."
echo "Exécution de: supabase db push"
echo ""
read -p "Voulez-vous appliquer la migration maintenant? (o/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Oo]$ ]]; then
    supabase db push
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migration appliquée avec succès${NC}"
    else
        echo -e "${RED}❌ Erreur lors de l'application de la migration${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Migration ignorée. Vous pouvez l'exécuter plus tard avec: supabase db push${NC}"
fi

echo ""

# Étape 2: Configuration des secrets
echo "🔐 Étape 2: Configuration des secrets Supabase"
echo ""
echo "Vous devez configurer les secrets suivants dans le Dashboard Supabase:"
echo ""
echo "1. Allez sur: https://supabase.com/dashboard/project/[VOTRE_PROJECT_ID]/settings/functions"
echo "2. Cliquez sur 'Secrets'"
echo "3. Ajoutez les secrets suivants:"
echo ""
echo "   BUNNY_STREAM_LIBRARY_ID=votre_library_id"
echo "   BUNNY_STREAM_API_KEY=votre_api_key"
echo ""
read -p "Avez-vous configuré les secrets? (o/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${YELLOW}⚠️  N'oubliez pas de configurer les secrets avant d'utiliser l'upload de vidéos${NC}"
fi

echo ""

# Étape 3: Déploiement de l'Edge Function
echo "🚀 Étape 3: Déploiement de l'Edge Function"
echo "Exécution de: supabase functions deploy upload-bunny-video"
echo ""
read -p "Voulez-vous déployer l'Edge Function maintenant? (o/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Oo]$ ]]; then
    supabase functions deploy upload-bunny-video
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Edge Function déployée avec succès${NC}"
    else
        echo -e "${RED}❌ Erreur lors du déploiement de l'Edge Function${NC}"
        echo "Assurez-vous d'être connecté avec: supabase login"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Déploiement ignoré. Vous pouvez le faire plus tard avec: supabase functions deploy upload-bunny-video${NC}"
fi

echo ""
echo -e "${GREEN}✨ Configuration terminée!${NC}"
echo ""
echo "Prochaines étapes:"
echo "1. Configurez les secrets dans le Dashboard Supabase"
echo "2. Testez l'upload de vidéos depuis l'interface admin"
echo "3. Vérifiez les paramètres dans Admin > Paramètres"

