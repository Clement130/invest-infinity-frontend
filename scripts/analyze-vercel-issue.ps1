$VERCEL_TOKEN = "TVjEksX9UflX7TObh9iIPyEw"
$PROJECT_NAME = "invest-infinity-frontend"

Write-Host "=== ANALYSE DU PROBLÈME VERCEL ===" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $VERCEL_TOKEN"
}

# 1. Vérifier le projet
Write-Host "1. Vérification du projet..." -ForegroundColor Yellow
try {
    $project = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME" -Headers $headers
    Write-Host "   ✅ Projet trouvé: $($project.name)" -ForegroundColor Green
    Write-Host "   ID: $($project.id)" -ForegroundColor Gray
    Write-Host "   Framework: $($project.framework)" -ForegroundColor Gray
    Write-Host "   Git Repository: $($project.link.type)/$($project.link.repo)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host ""

# 2. Vérifier les déploiements
Write-Host "2. Vérification des déploiements..." -ForegroundColor Yellow
try {
    $deployments = Invoke-RestMethod -Uri "https://api.vercel.com/v6/deployments?projectId=$($project.id)&limit=5" -Headers $headers
    Write-Host "   Nombre de déploiements: $($deployments.deployments.Count)" -ForegroundColor Gray
    
    if ($deployments.deployments.Count -eq 0) {
        Write-Host "   ⚠️  Aucun déploiement trouvé!" -ForegroundColor Yellow
    } else {
        foreach ($deployment in $deployments.deployments) {
            Write-Host "   Déploiement:" -ForegroundColor Cyan
            Write-Host "     URL: https://$($deployment.url)" -ForegroundColor Gray
            Write-Host "     État: $($deployment.readyState)" -ForegroundColor Gray
            Write-Host "     Créé: $($deployment.createdAt)" -ForegroundColor Gray
            if ($deployment.readyState -ne "READY") {
                Write-Host "     ⚠️  Déploiement non terminé!" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. Vérifier les variables d'environnement
Write-Host "3. Vérification des variables d'environnement..." -ForegroundColor Yellow
try {
    $envVars = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME/env" -Headers $headers
    Write-Host "   Variables configurées: $($envVars.envs.Count)" -ForegroundColor Gray
    foreach ($env in $envVars.envs) {
        Write-Host "     ✅ $($env.key) (targets: $($env.target -join ', '))" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 4. Vérifier la configuration Git
Write-Host "4. Vérification de la configuration Git..." -ForegroundColor Yellow
Write-Host "   Repository: $($project.link.repo)" -ForegroundColor Gray
Write-Host "   Type: $($project.link.type)" -ForegroundColor Gray

Write-Host ""

# 5. Tentative de déclencher un nouveau déploiement
Write-Host "5. Tentative de déclencher un nouveau déploiement..." -ForegroundColor Yellow
try {
    $deployBody = @{
        name = $PROJECT_NAME
        gitSource = @{
            type = "github"
            repo = $project.link.repo
            ref = "main"
        }
    } | ConvertTo-Json -Depth 10
    
    $newDeployment = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments" -Method POST -Headers @{
        "Authorization" = "Bearer $VERCEL_TOKEN"
        "Content-Type" = "application/json"
    } -Body $deployBody
    
    Write-Host "   ✅ Nouveau déploiement déclenché!" -ForegroundColor Green
    Write-Host "   URL: https://$($newDeployment.url)" -ForegroundColor Cyan
    Write-Host "   ID: $($newDeployment.id)" -ForegroundColor Gray
    Write-Host "   État: $($newDeployment.readyState)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Suivez le déploiement sur: https://vercel.com/$PROJECT_NAME" -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Erreur lors du déploiement:" -ForegroundColor Red
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   Message: $($errorDetails.error.message)" -ForegroundColor Red
    if ($errorDetails.error) {
        Write-Host "   Code: $($errorDetails.error.code)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== FIN DE L'ANALYSE ===" -ForegroundColor Cyan

