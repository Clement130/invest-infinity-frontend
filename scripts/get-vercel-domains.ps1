$VERCEL_TOKEN = "TVjEksX9UflX7TObh9iIPyEw"
$PROJECT_NAME = "invest-infinity-frontend"

Write-Host "Récupération des domaines Vercel..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $VERCEL_TOKEN"
}

try {
    $project = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME" -Headers $headers
    
    Write-Host ""
    Write-Host "Domaines du projet:" -ForegroundColor Yellow
    
    # Récupérer les domaines
    $domains = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME/domains" -Headers $headers
    
    if ($domains.domains.Count -eq 0) {
        Write-Host "  Aucun domaine personnalisé configuré" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  URL de production par défaut:" -ForegroundColor Yellow
        Write-Host "  https://$PROJECT_NAME.vercel.app" -ForegroundColor Cyan
    } else {
        foreach ($domain in $domains.domains) {
            Write-Host "  - $($domain.name)" -ForegroundColor Cyan
        }
    }
    
    # Récupérer le dernier déploiement
    Write-Host ""
    Write-Host "Dernier déploiement:" -ForegroundColor Yellow
    $deployments = Invoke-RestMethod -Uri "https://api.vercel.com/v6/deployments?projectId=$($project.id)&limit=1" -Headers $headers
    
    if ($deployments.deployments.Count -gt 0) {
        $latest = $deployments.deployments[0]
        Write-Host "  URL: https://$($latest.url)" -ForegroundColor Cyan
        Write-Host "  État: $($latest.readyState)" -ForegroundColor $(if ($latest.readyState -eq "READY") { "Green" } else { "Yellow" })
        Write-Host "  Production: $($latest.target)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

