# Script PowerShell pour configurer les secrets Bunny Stream dans Supabase
# Utilise l'API Supabase Management

# ⚠️ SÉCURITÉ: Ne jamais hardcoder les clés API dans le code source
# Utilisez des variables d'environnement ou un fichier .env.local
$PROJECT_REF = $env:SUPABASE_PROJECT_REF
$BUNNY_LIBRARY_ID = $env:BUNNY_STREAM_LIBRARY_ID
$BUNNY_API_KEY = $env:BUNNY_STREAM_API_KEY

# Vérifier que les variables sont définies
if ([string]::IsNullOrWhiteSpace($PROJECT_REF)) {
    Write-Host "❌ Erreur: SUPABASE_PROJECT_REF doit être défini dans les variables d'environnement" -ForegroundColor Red
    Write-Host "   Définissez: `$env:SUPABASE_PROJECT_REF = 'votre_project_ref'" -ForegroundColor Yellow
    exit 1
}

if ([string]::IsNullOrWhiteSpace($BUNNY_LIBRARY_ID)) {
    Write-Host "❌ Erreur: BUNNY_STREAM_LIBRARY_ID doit être défini dans les variables d'environnement" -ForegroundColor Red
    Write-Host "   Définissez: `$env:BUNNY_STREAM_LIBRARY_ID = 'votre_library_id'" -ForegroundColor Yellow
    exit 1
}

if ([string]::IsNullOrWhiteSpace($BUNNY_API_KEY)) {
    Write-Host "❌ Erreur: BUNNY_STREAM_API_KEY doit être défini dans les variables d'environnement" -ForegroundColor Red
    Write-Host "   Définissez: `$env:BUNNY_STREAM_API_KEY = 'votre_api_key'" -ForegroundColor Yellow
    Write-Host "   ⚠️  Ne partagez JAMAIS cette clé publiquement!" -ForegroundColor Red
    exit 1
}

Write-Host "🔐 Configuration des secrets Bunny Stream dans Supabase..." -ForegroundColor Cyan
Write-Host ""

# Note: Ce script nécessite un access token Supabase
# Obtenez-le depuis: https://supabase.com/dashboard/account/tokens
$SUPABASE_ACCESS_TOKEN = Read-Host "Entrez votre Supabase Access Token (ou laissez vide pour utiliser la CLI)"

if ([string]::IsNullOrWhiteSpace($SUPABASE_ACCESS_TOKEN)) {
    Write-Host "⚠️  Utilisation de la CLI Supabase..." -ForegroundColor Yellow
    
    # Essayer avec la CLI Supabase
    Write-Host "📝 Configuration de BUNNY_STREAM_LIBRARY_ID..." -ForegroundColor Cyan
    $result1 = supabase secrets set "BUNNY_STREAM_LIBRARY_ID=$BUNNY_LIBRARY_ID" --project-ref $PROJECT_REF 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ BUNNY_STREAM_LIBRARY_ID configuré" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Erreur CLI, essayons l'API..." -ForegroundColor Yellow
        Write-Host "   $result1" -ForegroundColor Red
    }
    
    Write-Host "📝 Configuration de BUNNY_STREAM_API_KEY..." -ForegroundColor Cyan
    $result2 = supabase secrets set "BUNNY_STREAM_API_KEY=$BUNNY_API_KEY" --project-ref $PROJECT_REF 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ BUNNY_STREAM_API_KEY configuré" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Erreur CLI, essayons l'API..." -ForegroundColor Yellow
        Write-Host "   $result2" -ForegroundColor Red
    }
} else {
    Write-Host "📝 Utilisation de l'API Supabase Management..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $SUPABASE_ACCESS_TOKEN"
        "Content-Type" = "application/json"
    }
    
    $baseUrl = "https://api.supabase.com/v1/projects/$PROJECT_REF/secrets"
    
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
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "   ℹ️  Secret existe déjà, mise à jour..." -ForegroundColor Yellow
            # Mettre à jour
            $updateUrl = "$baseUrl/BUNNY_STREAM_LIBRARY_ID"
            $updateBody = @{ value = $BUNNY_LIBRARY_ID } | ConvertTo-Json
            try {
                Invoke-RestMethod -Uri $updateUrl -Method PATCH -Headers $headers -Body $updateBody -ErrorAction Stop
                Write-Host "   ✅ BUNNY_STREAM_LIBRARY_ID mis à jour" -ForegroundColor Green
            } catch {
                Write-Host "   ❌ Erreur lors de la mise à jour: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
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
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "   ℹ️  Secret existe déjà, mise à jour..." -ForegroundColor Yellow
            # Mettre à jour
            $updateUrl = "$baseUrl/BUNNY_STREAM_API_KEY"
            $updateBody = @{ value = $BUNNY_API_KEY } | ConvertTo-Json
            try {
                Invoke-RestMethod -Uri $updateUrl -Method PATCH -Headers $headers -Body $updateBody -ErrorAction Stop
                Write-Host "   ✅ BUNNY_STREAM_API_KEY mis à jour" -ForegroundColor Green
            } catch {
                Write-Host "   ❌ Erreur lors de la mise à jour: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "✨ Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "Les secrets sont maintenant disponibles pour l'Edge Function upload-bunny-video." -ForegroundColor Cyan

