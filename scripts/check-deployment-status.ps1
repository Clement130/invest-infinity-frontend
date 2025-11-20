$VERCEL_TOKEN = "TVjEksX9UflX7TObh9iIPyEw"
$PROJECT_NAME = "invest-infinity-frontend"
$DEPLOYMENT_ID = "dpl_5MDAvrKQ6Eb6TnfqXXSHKu4GBdfH"

Write-Host "Vérification du déploiement..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $VERCEL_TOKEN"
}

# Vérifier le déploiement spécifique
try {
    $deployment = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments/$DEPLOYMENT_ID" -Headers $headers
    
    Write-Host ""
    Write-Host "État du déploiement:" -ForegroundColor Yellow
    Write-Host "  URL: https://$($deployment.url)" -ForegroundColor Cyan
    Write-Host "  État: $($deployment.readyState)" -ForegroundColor $(if ($deployment.readyState -eq "READY") { "Green" } else { "Yellow" })
    Write-Host "  Créé: $($deployment.createdAt)" -ForegroundColor Gray
    
    if ($deployment.readyState -eq "READY") {
        Write-Host ""
        Write-Host "✅ Déploiement réussi!" -ForegroundColor Green
        Write-Host "Votre site est en ligne: https://$($deployment.url)" -ForegroundColor Cyan
    } elseif ($deployment.readyState -eq "ERROR") {
        Write-Host ""
        Write-Host "❌ Erreur lors du déploiement" -ForegroundColor Red
        Write-Host "Vérifiez les logs sur: https://vercel.com/$PROJECT_NAME" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "⏳ Déploiement en cours..." -ForegroundColor Yellow
        Write-Host "Attendez encore quelques instants" -ForegroundColor Gray
    }
    
    # Vérifier les builds
    if ($deployment.builds) {
        Write-Host ""
        Write-Host "Builds:" -ForegroundColor Yellow
        foreach ($build in $deployment.builds) {
            Write-Host "  - $($build.use): $($build.status)" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# Vérifier tous les déploiements du projet
Write-Host ""
Write-Host "Tous les déploiements du projet:" -ForegroundColor Yellow
try {
    $project = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME" -Headers $headers
    $deployments = Invoke-RestMethod -Uri "https://api.vercel.com/v6/deployments?projectId=$($project.id)&limit=5" -Headers $headers
    
    foreach ($dep in $deployments.deployments) {
        Write-Host "  - https://$($dep.url) [$($dep.readyState)]" -ForegroundColor $(if ($dep.readyState -eq "READY") { "Green" } else { "Yellow" })
    }
} catch {
    Write-Host "  Erreur lors de la récupération des déploiements" -ForegroundColor Red
}

