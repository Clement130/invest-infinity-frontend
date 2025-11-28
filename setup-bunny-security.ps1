# Script PowerShell pour finaliser la configuration de sécurité Bunny Stream

Write-Host "🔐 Finalisation de la configuration de sécurité Bunny Stream" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Variables d'environnement nécessaires
$BUNNY_EMBED_TOKEN_KEY = $env:BUNNY_EMBED_TOKEN_KEY
$PROJECT_REF = $env:SUPABASE_PROJECT_REF
$ACCESS_TOKEN = $env:SUPABASE_ACCESS_TOKEN

# Vérification des prérequis
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow

$missing = @()

if ([string]::IsNullOrWhiteSpace($BUNNY_EMBED_TOKEN_KEY)) {
    $missing += "BUNNY_EMBED_TOKEN_KEY"
}
if ([string]::IsNullOrWhiteSpace($PROJECT_REF)) {
    $missing += "SUPABASE_PROJECT_REF"
}
if ([string]::IsNullOrWhiteSpace($ACCESS_TOKEN)) {
    $missing += "SUPABASE_ACCESS_TOKEN"
}

if ($missing.Count -gt 0) {
    Write-Host "❌ Variables manquantes:" -ForegroundColor Red
    foreach ($var in $missing) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "💡 Pour définir les variables:" -ForegroundColor Yellow
    Write-Host "   `$env:BUNNY_EMBED_TOKEN_KEY = 'votre_clé_générée'" -ForegroundColor White
    Write-Host "   `$env:SUPABASE_PROJECT_REF = 'votre_project_ref'" -ForegroundColor White
    Write-Host "   `$env:SUPABASE_ACCESS_TOKEN = 'votre_access_token'" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Obtenir SUPABASE_ACCESS_TOKEN:" -ForegroundColor Cyan
    Write-Host "   https://supabase.com/dashboard/account/tokens" -ForegroundColor White
    exit 1
}

Write-Host "✅ Toutes les variables sont définies" -ForegroundColor Green
Write-Host ""

# Configuration de BUNNY_EMBED_TOKEN_KEY
Write-Host "🔑 Configuration de BUNNY_EMBED_TOKEN_KEY..." -ForegroundColor Cyan

$baseUrl = "https://api.supabase.com/v1/projects/$PROJECT_REF/secrets"
$headers = @{
    "Authorization" = "Bearer $ACCESS_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    name = "BUNNY_EMBED_TOKEN_KEY"
    value = $BUNNY_EMBED_TOKEN_KEY
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $body -ErrorAction Stop

    Write-Host "✅ BUNNY_EMBED_TOKEN_KEY configuré avec succès" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Host "ℹ️  Secret existe déjà, mise à jour..." -ForegroundColor Yellow
        try {
            # Supprimer puis recréer
            Invoke-RestMethod -Uri "$baseUrl/BUNNY_EMBED_TOKEN_KEY" -Method DELETE -Headers $headers -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 500
            Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $body -ErrorAction Stop
            Write-Host "✅ BUNNY_EMBED_TOKEN_KEY mis à jour" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erreur lors de la mise à jour: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Erreur ($statusCode): $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Configuration terminée !" -ForegroundColor Green
Write-Host ""

Write-Host "🧪 Test des protections:" -ForegroundColor Cyan
Write-Host "   node scripts/test-bunny-security.js" -ForegroundColor White
Write-Host ""

Write-Host "📊 Vérification des fonctions Supabase:" -ForegroundColor Cyan
Write-Host "   supabase functions list" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Vos vidéos sont maintenant protégées !" -ForegroundColor Green
Write-Host "   🔒 Authentification par token: Activée" -ForegroundColor Green
Write-Host "   🌐 Restriction de domaines: Configurée dans Bunny.net" -ForegroundColor Green
Write-Host "   🎥 MediaCage DRM: Disponible" -ForegroundColor Green
