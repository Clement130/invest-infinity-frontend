$VERCEL_TOKEN = "TVjEksX9UflX7TObh9iIPyEw"
$PROJECT_NAME = "invest-infinity-frontend"
$GITHUB_REPO = "Clement130/invest-infinity-frontend"

Write-Host "=== CORRECTION DU DÉPLOIEMENT VERCEL ===" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $VERCEL_TOKEN"
    "Content-Type" = "application/json"
}

# 1. Obtenir les informations du projet
Write-Host "1. Récupération des infos du projet..." -ForegroundColor Yellow
$project = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME" -Headers $headers
Write-Host "   Projet ID: $($project.id)" -ForegroundColor Gray

# 2. Vérifier la connexion GitHub
Write-Host ""
Write-Host "2. Vérification de la connexion GitHub..." -ForegroundColor Yellow
if (-not $project.link -or -not $project.link.repoId) {
    Write-Host "   ⚠️  Le dépôt GitHub n'est pas correctement connecté!" -ForegroundColor Yellow
    Write-Host "   Il faut connecter le dépôt via l'interface Vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   SOLUTION:" -ForegroundColor Cyan
    Write-Host "   1. Allez sur: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "   2. Cliquez sur le projet: $PROJECT_NAME" -ForegroundColor White
    Write-Host "   3. Allez dans Settings > Git" -ForegroundColor White
    Write-Host "   4. Connectez le dépôt GitHub: $GITHUB_REPO" -ForegroundColor White
    Write-Host "   5. Vercel déploiera automatiquement" -ForegroundColor White
} else {
    Write-Host "   ✅ Dépôt connecté: $($project.link.repo)" -ForegroundColor Green
    Write-Host "   Repo ID: $($project.link.repoId)" -ForegroundColor Gray
    
    # 3. Déclencher un déploiement avec le repoId
    Write-Host ""
    Write-Host "3. Déclenchement d'un nouveau déploiement..." -ForegroundColor Yellow
    
    $deployBody = @{
        name = $PROJECT_NAME
        project = $project.id
        gitSource = @{
            type = "github"
            repoId = $project.link.repoId
            ref = "main"
            sha = ""
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $deployment = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments" -Method POST -Headers $headers -Body $deployBody
        
        Write-Host "   ✅ Déploiement déclenché!" -ForegroundColor Green
        Write-Host "   URL: https://$($deployment.url)" -ForegroundColor Cyan
        Write-Host "   ID: $($deployment.id)" -ForegroundColor Gray
        Write-Host "   État: $($deployment.readyState)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Le déploiement est en cours. Attendez 1-2 minutes." -ForegroundColor Yellow
    } catch {
        Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
        $errorResponse = $_.ErrorDetails.Message
        Write-Host "   Détails: $errorResponse" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== RECOMMANDATION ===" -ForegroundColor Cyan
Write-Host "Le moyen le plus simple est de connecter le dépôt via l'interface Vercel:" -ForegroundColor White
Write-Host "https://vercel.com/$PROJECT_NAME/settings/git" -ForegroundColor Yellow

