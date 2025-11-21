# Script de configuration du système de protection développeur
# Ce script configure automatiquement la licence développeur, le rôle et l'Edge Function

Write-Host "🔐 Configuration du Système de Protection Développeur" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_REF = "vveswlmcgmizmjsriezw"
$DEVELOPER_EMAIL = "butcher13550@gmail.com"

# Vérifier si Supabase CLI est installé
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "✅ Supabase CLI détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI n'est pas installé" -ForegroundColor Red
    Write-Host "Installez-le avec: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Étape 1: Appliquer la migration
Write-Host "📦 Étape 1: Application de la migration..." -ForegroundColor Cyan
Write-Host "Exécution de: supabase db push" -ForegroundColor Gray
Write-Host ""

try {
    supabase db push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration appliquée avec succès" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors de l'application de la migration" -ForegroundColor Red
        Write-Host "Vous pouvez l'appliquer manuellement via le Dashboard Supabase > SQL Editor" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Impossible d'appliquer la migration automatiquement" -ForegroundColor Yellow
    Write-Host "Appliquez-la manuellement via le Dashboard Supabase > SQL Editor" -ForegroundColor Yellow
    Write-Host "Fichier: supabase/migrations/20250122000000_create_developer_license_30days.sql" -ForegroundColor Gray
}

Write-Host ""

# Étape 2: Configurer le rôle développeur
Write-Host "👤 Étape 2: Configuration du rôle développeur..." -ForegroundColor Cyan
Write-Host "Email développeur: $DEVELOPER_EMAIL" -ForegroundColor Gray
Write-Host ""

Write-Host "Pour configurer le rôle développeur, exécutez cette requête SQL dans le Dashboard Supabase > SQL Editor:" -ForegroundColor Yellow
Write-Host ""
Write-Host "-- Mettre à jour ou créer le profil développeur" -ForegroundColor Gray
Write-Host "INSERT INTO public.profiles (id, email, role)" -ForegroundColor White
Write-Host "SELECT id, email, 'developer'" -ForegroundColor White
Write-Host "FROM auth.users" -ForegroundColor White
Write-Host "WHERE email = '$DEVELOPER_EMAIL'" -ForegroundColor White
Write-Host "ON CONFLICT (id) DO UPDATE SET role = 'developer';" -ForegroundColor White
Write-Host ""

$configureRole = Read-Host "Avez-vous configuré le rôle développeur? (o/n)"
if ($configureRole -ne "o" -and $configureRole -ne "O") {
    Write-Host "⚠️  N'oubliez pas de configurer le rôle développeur avant d'utiliser le système" -ForegroundColor Yellow
}

Write-Host ""

# Étape 3: Déployer l'Edge Function
Write-Host "🚀 Étape 3: Déploiement de l'Edge Function check-license-daily..." -ForegroundColor Cyan
Write-Host ""

try {
    supabase functions deploy check-license-daily
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Edge Function déployée avec succès" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors du déploiement de l'Edge Function" -ForegroundColor Red
        Write-Host "Vous pouvez la déployer manuellement via: supabase functions deploy check-license-daily" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Impossible de déployer l'Edge Function automatiquement" -ForegroundColor Yellow
    Write-Host "Déployez-la manuellement via: supabase functions deploy check-license-daily" -ForegroundColor Yellow
}

Write-Host ""

# Étape 4: Configurer le cron job (optionnel)
Write-Host "⏰ Étape 4: Configuration du cron job (optionnel)..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour configurer le cron job automatique:" -ForegroundColor Yellow
Write-Host "1. Allez sur: https://supabase.com/dashboard/project/$PROJECT_REF/functions" -ForegroundColor Gray
Write-Host "2. Sélectionnez 'check-license-daily'" -ForegroundColor Gray
Write-Host "3. Allez dans l'onglet 'Cron Jobs'" -ForegroundColor Gray
Write-Host "4. Ajoutez un cron job avec la fréquence: 0 0 * * * (tous les jours à minuit UTC)" -ForegroundColor Gray
Write-Host ""

# Étape 5: Configurer le secret (optionnel)
Write-Host "🔑 Étape 5: Configuration du secret (optionnel)..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour sécuriser l'Edge Function avec un secret:" -ForegroundColor Yellow
Write-Host "1. Allez sur: https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions" -ForegroundColor Gray
Write-Host "2. Cliquez sur 'Secrets'" -ForegroundColor Gray
Write-Host "3. Ajoutez le secret suivant (optionnel):" -ForegroundColor Gray
Write-Host "   Name: LICENSE_CHECK_SECRET_KEY" -ForegroundColor White
Write-Host "   Value: [générez une clé secrète aléatoire]" -ForegroundColor White
Write-Host ""

Write-Host "✅ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Récapitulatif:" -ForegroundColor Cyan
Write-Host "- Migration SQL: Appliquée (ou à appliquer manuellement)" -ForegroundColor Gray
Write-Host "- Rôle développeur: À configurer pour $DEVELOPER_EMAIL" -ForegroundColor Gray
Write-Host "- Edge Function: Déployée (ou à déployer manuellement)" -ForegroundColor Gray
Write-Host "- Cron job: À configurer dans le Dashboard (optionnel)" -ForegroundColor Gray
Write-Host "- Secret: À configurer dans le Dashboard (optionnel)" -ForegroundColor Gray
Write-Host ""

