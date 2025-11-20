# Script de deploiement Vercel
$VERCEL_TOKEN = "TVjEksX9UflX7TObh9iIPyEw"
$PROJECT_NAME = "invest-infinity-frontend"
$GITHUB_REPO = "Clement130/invest-infinity-frontend"

Write-Host "Deploiement sur Vercel..." -ForegroundColor Cyan

# 1. Verifier si le projet existe deja
Write-Host "Verification des projets existants..." -ForegroundColor Yellow
try {
    $projects = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects" -Headers @{
        "Authorization" = "Bearer $VERCEL_TOKEN"
    }
    
    $existingProject = $projects.projects | Where-Object { $_.name -eq $PROJECT_NAME }
    
    if ($existingProject) {
        Write-Host "Projet '$PROJECT_NAME' existe deja" -ForegroundColor Green
        Write-Host "URL: https://$($existingProject.name).vercel.app" -ForegroundColor Cyan
    } else {
        Write-Host "Creation du projet sur Vercel..." -ForegroundColor Yellow
        
        $body = @{
            name = $PROJECT_NAME
            gitRepository = @{
                type = "github"
                repo = $GITHUB_REPO
            }
            framework = "vite"
        } | ConvertTo-Json -Depth 10
        
        try {
            $project = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects" -Method POST -Headers @{
                "Authorization" = "Bearer $VERCEL_TOKEN"
                "Content-Type" = "application/json"
            } -Body $body
            
            Write-Host "Projet cree avec succes!" -ForegroundColor Green
            Write-Host "Project ID: $($project.id)" -ForegroundColor Cyan
        } catch {
            Write-Host "Erreur lors de la creation du projet:" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Erreur lors de la verification des projets:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# 2. Configurer les variables d'environnement
Write-Host ""
Write-Host "Configuration des variables d'environnement..." -ForegroundColor Yellow

$envVars = @(
    @{
        key = "VITE_SUPABASE_URL"
        value = "https://vveswlmcgmizmjsriezw.supabase.co"
        target = @("production", "preview", "development")
    },
    @{
        key = "VITE_SUPABASE_ANON_KEY"
        value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZXN3bG1jZ21pem1qc3JpZXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzM4NjcsImV4cCI6MjA3OTAwOTg2N30.G_9XfabnMXR23LzuvRTRLrpHMd1EFznXXrTNadOwdjY"
        target = @("production", "preview", "development")
    },
    @{
        key = "VITE_BUNNY_EMBED_BASE_URL"
        value = "https://iframe.mediadelivery.net/embed/542258"
        target = @("production", "preview", "development")
    }
)

foreach ($envVar in $envVars) {
    Write-Host "Configuration de $($envVar.key)..." -ForegroundColor Gray
    
    $body = @{
        key = $envVar.key
        value = $envVar.value
        target = $envVar.target
        type = "encrypted"
    } | ConvertTo-Json -Depth 10
    
    try {
        Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME/env" -Method POST -Headers @{
            "Authorization" = "Bearer $VERCEL_TOKEN"
            "Content-Type" = "application/json"
        } -Body $body | Out-Null
        
        Write-Host "$($envVar.key) configure" -ForegroundColor Green
    } catch {
        Write-Host "$($envVar.key) : $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Configuration terminee!" -ForegroundColor Green
Write-Host "Verifiez votre projet sur: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host "Le deploiement se fera automatiquement au prochain push sur GitHub" -ForegroundColor Cyan
