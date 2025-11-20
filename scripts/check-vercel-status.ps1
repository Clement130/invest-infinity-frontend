$VERCEL_TOKEN = "TVjEksX9UflX7TObh9iIPyEw"
$PROJECT_NAME = "invest-infinity-frontend"

Write-Host "Vérification du projet Vercel..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $VERCEL_TOKEN"
}

try {
    $project = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME" -Headers $headers
    
    Write-Host "✅ Projet trouvé!" -ForegroundColor Green
    Write-Host "Nom: $($project.name)" -ForegroundColor Cyan
    Write-Host "ID: $($project.id)" -ForegroundColor Cyan
    Write-Host "Framework: $($project.framework)" -ForegroundColor Cyan
    
    if ($project.latestDeployment) {
        Write-Host ""
        Write-Host "Dernier déploiement:" -ForegroundColor Yellow
        Write-Host "URL: https://$($project.latestDeployment.url)" -ForegroundColor Green
        Write-Host "État: $($project.latestDeployment.readyState)" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "Aucun déploiement trouvé. Le premier déploiement se fera automatiquement." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

