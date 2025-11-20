$VERCEL_TOKEN = "TVjEksX9UflX7TObh9iIPyEw"
$PROJECT_NAME = "invest-infinity-frontend"

Write-Host "Vérification des variables d'environnement Vercel..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $VERCEL_TOKEN"
}

try {
    $envVars = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME/env" -Headers $headers
    
    Write-Host ""
    Write-Host "Variables d'environnement configurées:" -ForegroundColor Yellow
    Write-Host ""
    
    $requiredVars = @(
        "VITE_SUPABASE_URL",
        "VITE_SUPABASE_ANON_KEY",
        "VITE_BUNNY_EMBED_BASE_URL"
    )
    
    foreach ($var in $envVars.envs) {
        $isRequired = $requiredVars -contains $var.key
        $status = if ($isRequired) { "[OK]" } else { "[INFO]" }
        $color = if ($isRequired) { "Green" } else { "Gray" }
        
        Write-Host "$status $($var.key)" -ForegroundColor $color
        Write-Host "   Targets: $($var.target -join ', ')" -ForegroundColor Gray
        if ($var.key -eq "VITE_SUPABASE_ANON_KEY") {
            $valuePreview = if ($var.value) { $var.value.Substring(0, [Math]::Min(20, $var.value.Length)) + "..." } else { "MANQUANT" }
            Write-Host "   Value: $valuePreview" -ForegroundColor $(if ($var.value) { "Green" } else { "Red" })
        }
        Write-Host ""
    }
    
    # Vérifier les variables manquantes
    Write-Host ""
    Write-Host "Verification des variables requises..." -ForegroundColor Yellow
    $configuredKeys = $envVars.envs | ForEach-Object { $_.key }
    $missing = $requiredVars | Where-Object { $_ -notin $configuredKeys }
    
    if ($missing.Count -gt 0) {
        Write-Host "[ERREUR] Variables manquantes:" -ForegroundColor Red
        foreach ($key in $missing) {
            Write-Host "   - $key" -ForegroundColor Red
        }
    } else {
        Write-Host "[OK] Toutes les variables requises sont configurees" -ForegroundColor Green
    }
    
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

