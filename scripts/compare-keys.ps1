$VERCEL_TOKEN = "TVjEksX9UflX7TObh9iIPyEw"
$PROJECT_NAME = "invest-infinity-frontend"

Write-Host "Recuperation de la cle depuis Vercel..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $VERCEL_TOKEN"
}

try {
    $envVars = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME/env" -Headers $headers
    $vercelKey = ($envVars.envs | Where-Object { $_.key -eq "VITE_SUPABASE_ANON_KEY" }).value
    
    Write-Host ""
    Write-Host "Cle Vercel (premiers 50 caracteres):" -ForegroundColor Yellow
    Write-Host $vercelKey.Substring(0, [Math]::Min(50, $vercelKey.Length)) -ForegroundColor Gray
    Write-Host ""
    Write-Host "Longueur: $($vercelKey.Length)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "La cle devrait commencer par: eyJ" -ForegroundColor Cyan
    Write-Host "Commence par: $($vercelKey.Substring(0, 3))" -ForegroundColor $(if ($vercelKey.StartsWith("eyJ")) { "Green" } else { "Red" })
    
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

