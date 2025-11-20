$VERCEL_TOKEN = "TVjEksX9UflX7TObh9iIPyEw"
$PROJECT_NAME = "invest-infinity-frontend"

Write-Host "Déclenchement du déploiement Vercel..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $VERCEL_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    name = $PROJECT_NAME
    gitSource = @{
        type = "github"
        repo = "Clement130/invest-infinity-frontend"
        ref = "main"
    }
} | ConvertTo-Json -Depth 10

try {
    $deployment = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments?project=$PROJECT_NAME" -Method POST -Headers $headers -Body $body
    
    Write-Host "✅ Déploiement déclenché!" -ForegroundColor Green
    Write-Host "URL: https://$($deployment.url)" -ForegroundColor Cyan
    Write-Host "Status: $($deployment.readyState)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Suivez le déploiement sur: https://vercel.com/dashboard" -ForegroundColor Yellow
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Le déploiement se fera automatiquement au prochain push sur GitHub" -ForegroundColor Yellow
}

