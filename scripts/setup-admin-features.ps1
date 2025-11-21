# Script PowerShell de configuration pour les fonctionnalités admin
# Ce script aide à configurer les paramètres et l'upload de vidéos

Write-Host "🚀 Configuration des fonctionnalités admin InvestInfinity" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Supabase CLI est installé
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI détecté: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI n'est pas installé" -ForegroundColor Red
    Write-Host "Installez-le avec: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Étape 1: Migration
Write-Host "📦 Étape 1: Application de la migration..." -ForegroundColor Cyan
Write-Host "Exécution de: supabase db push" -ForegroundColor Gray
Write-Host ""
$applyMigration = Read-Host "Voulez-vous appliquer la migration maintenant? (o/n)"
if ($applyMigration -eq "o" -or $applyMigration -eq "O") {
    supabase db push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration appliquée avec succès" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors de l'application de la migration" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⏭️  Migration ignorée. Vous pouvez l'exécuter plus tard avec: supabase db push" -ForegroundColor Yellow
}

Write-Host ""

# Étape 2: Configuration des secrets
Write-Host "🔐 Étape 2: Configuration des secrets Supabase" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vous devez configurer les secrets suivants dans le Dashboard Supabase:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Allez sur: https://supabase.com/dashboard/project/[VOTRE_PROJECT_ID]/settings/functions" -ForegroundColor Gray
Write-Host "2. Cliquez sur 'Secrets'" -ForegroundColor Gray
Write-Host "3. Ajoutez les secrets suivants:" -ForegroundColor Gray
Write-Host ""
Write-Host "   BUNNY_STREAM_LIBRARY_ID=votre_library_id" -ForegroundColor White
Write-Host "   BUNNY_STREAM_API_KEY=votre_api_key" -ForegroundColor White
Write-Host ""
$secretsConfigured = Read-Host "Avez-vous configuré les secrets? (o/n)"
if ($secretsConfigured -ne "o" -and $secretsConfigured -ne "O") {
    Write-Host "⚠️  N'oubliez pas de configurer les secrets avant d'utiliser l'upload de vidéos" -ForegroundColor Yellow
}

Write-Host ""

# Étape 3: Déploiement de l'Edge Function
Write-Host "🚀 Étape 3: Déploiement de l'Edge Function" -ForegroundColor Cyan
Write-Host "Exécution de: supabase functions deploy upload-bunny-video" -ForegroundColor Gray
Write-Host ""
$deployFunction = Read-Host "Voulez-vous déployer l'Edge Function maintenant? (o/n)"
if ($deployFunction -eq "o" -or $deployFunction -eq "O") {
    supabase functions deploy upload-bunny-video
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Edge Function déployée avec succès" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors du déploiement de l'Edge Function" -ForegroundColor Red
        Write-Host "Assurez-vous d'être connecté avec: supabase login" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "⏭️  Déploiement ignoré. Vous pouvez le faire plus tard avec: supabase functions deploy upload-bunny-video" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Configurez les secrets dans le Dashboard Supabase" -ForegroundColor Gray
Write-Host "2. Testez l'upload de vidéos depuis l'interface admin" -ForegroundColor Gray
Write-Host "3. Vérifiez les paramètres dans Admin > Paramètres" -ForegroundColor Gray

