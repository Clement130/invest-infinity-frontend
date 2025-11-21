# Script final pour configurer les secrets Bunny Stream
# Utilise l'API Supabase Management directement

$PROJECT_REF = "vveswlmcgmizmjsriezw"
$BUNNY_LIBRARY_ID = "542258"
$BUNNY_API_KEY = "be9a7d66-a76f-4314-88af7279bb1e-d7d8-42ca"

Write-Host "🔐 Configuration des secrets Bunny Stream" -ForegroundColor Cyan
Write-Host ""

# L'API Management nécessite un Access Token
# Obtenez-le depuis: https://supabase.com/dashboard/account/tokens
$ACCESS_TOKEN = $env:SUPABASE_ACCESS_TOKEN

if ([string]::IsNullOrWhiteSpace($ACCESS_TOKEN)) {
    Write-Host "⚠️  SUPABASE_ACCESS_TOKEN non trouvé dans les variables d'environnement" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Pour configurer les secrets automatiquement:" -ForegroundColor Cyan
    Write-Host "1. Allez sur: https://supabase.com/dashboard/account/tokens" -ForegroundColor Gray
    Write-Host "2. Créez un nouveau token (scope: projects)" -ForegroundColor Gray
    Write-Host "3. Définissez la variable: `$env:SUPABASE_ACCESS_TOKEN = 'votre_token'" -ForegroundColor Gray
    Write-Host "4. Relancez ce script" -ForegroundColor Gray
    Write-Host ""
    Write-Host "OU configurez les secrets manuellement:" -ForegroundColor Yellow
    Write-Host "1. Allez sur: https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions" -ForegroundColor Gray
    Write-Host "2. Cliquez sur 'Secrets'" -ForegroundColor Gray
    Write-Host "3. Ajoutez:" -ForegroundColor Gray
    Write-Host "   - BUNNY_STREAM_LIBRARY_ID = $BUNNY_LIBRARY_ID" -ForegroundColor White
    Write-Host "   - BUNNY_STREAM_API_KEY = $BUNNY_API_KEY" -ForegroundColor White
    exit 0
}

$baseUrl = "https://api.supabase.com/v1/projects/$PROJECT_REF/secrets"
$headers = @{
    "Authorization" = "Bearer $ACCESS_TOKEN"
    "Content-Type" = "application/json"
}

# Configurer BUNNY_STREAM_LIBRARY_ID
Write-Host "📝 Configuration de BUNNY_STREAM_LIBRARY_ID..." -ForegroundColor Cyan
$body1 = @{
    name = "BUNNY_STREAM_LIBRARY_ID"
    value = $BUNNY_LIBRARY_ID
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $body1 -ErrorAction Stop
    Write-Host "   ✅ BUNNY_STREAM_LIBRARY_ID configuré" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Host "   ℹ️  Secret existe déjà, mise à jour..." -ForegroundColor Yellow
        try {
            # Supprimer puis recréer
            Invoke-RestMethod -Uri "$baseUrl/BUNNY_STREAM_LIBRARY_ID" -Method DELETE -Headers $headers -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 500
            Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $body1 -ErrorAction Stop
            Write-Host "   ✅ BUNNY_STREAM_LIBRARY_ID mis à jour" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Erreur lors de la mise à jour: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ Erreur ($statusCode): $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Détails: $responseBody" -ForegroundColor Red
        }
    }
}

# Configurer BUNNY_STREAM_API_KEY
Write-Host "📝 Configuration de BUNNY_STREAM_API_KEY..." -ForegroundColor Cyan
$body2 = @{
    name = "BUNNY_STREAM_API_KEY"
    value = $BUNNY_API_KEY
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $body2 -ErrorAction Stop
    Write-Host "   ✅ BUNNY_STREAM_API_KEY configuré" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Host "   ℹ️  Secret existe déjà, mise à jour..." -ForegroundColor Yellow
        try {
            # Supprimer puis recréer
            Invoke-RestMethod -Uri "$baseUrl/BUNNY_STREAM_API_KEY" -Method DELETE -Headers $headers -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 500
            Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body $body2 -ErrorAction Stop
            Write-Host "   ✅ BUNNY_STREAM_API_KEY mis à jour" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Erreur lors de la mise à jour: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ Erreur ($statusCode): $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Détails: $responseBody" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "✨ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "Les secrets sont maintenant disponibles pour l'Edge Function upload-bunny-video." -ForegroundColor Cyan

