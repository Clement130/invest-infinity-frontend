$VERCEL_TOKEN = "TVjEksX9UflX7TObh9iIPyEw"
$PROJECT_NAME = "invest-infinity-frontend"

Write-Host "Vérification de la protection Vercel..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $VERCEL_TOKEN"
}

try {
    # Vérifier les paramètres de protection
    $project = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME" -Headers $headers
    
    Write-Host ""
    Write-Host "Paramètres du projet:" -ForegroundColor Yellow
    Write-Host "  Password Protection: $($project.passwordProtection)" -ForegroundColor Gray
    Write-Host "  Public: $($project.public)" -ForegroundColor Gray
    
    # Vérifier les déploiements
    $deployments = Invoke-RestMethod -Uri "https://api.vercel.com/v6/deployments?projectId=$($project.id)&limit=1" -Headers $headers
    
    if ($deployments.deployments.Count -gt 0) {
        $latest = $deployments.deployments[0]
        Write-Host ""
        Write-Host "Dernier déploiement:" -ForegroundColor Yellow
        Write-Host "  URL: https://$($latest.url)" -ForegroundColor Cyan
        Write-Host "  Protection: $($latest.protectionBypass)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "SOLUTION:" -ForegroundColor Cyan
    Write-Host "1. Allez sur: https://vercel.com/$PROJECT_NAME/settings/deployment-protection" -ForegroundColor White
    Write-Host "2. Désactivez la 'Password Protection' si elle est activée" -ForegroundColor White
    Write-Host "3. Vérifiez que 'Vercel Authentication' n'est pas activé" -ForegroundColor White
    Write-Host ""
    Write-Host "OU utilisez l'API pour désactiver:" -ForegroundColor Yellow
    
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

