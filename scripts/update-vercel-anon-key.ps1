$VERCEL_TOKEN = "TVjEksX9UflX7TObh9iIPyEw"
$PROJECT_NAME = "invest-infinity-frontend"
$CORRECT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZXN3bG1jZ21pem1qc3JpZXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzM4NjcsImV4cCI6MjA3OTAwOTg2N30.G_9XfabnMXR23LzuvRTRLrpHMd1EFznJXrTNadOwdjY"

Write-Host "Mise a jour de la cle Supabase sur Vercel..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $VERCEL_TOKEN"
    "Content-Type" = "application/json"
}

try {
    # 1. Récupérer les variables existantes
    $envVars = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME/env" -Headers $headers
    
    # 2. Trouver et supprimer l'ancienne variable
    $oldVar = $envVars.envs | Where-Object { $_.key -eq "VITE_SUPABASE_ANON_KEY" }
    
    if ($oldVar) {
        Write-Host "Suppression de l'ancienne cle..." -ForegroundColor Yellow
        Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME/env/$($oldVar.id)" -Method DELETE -Headers $headers | Out-Null
        Write-Host "Ancienne cle supprimee" -ForegroundColor Green
    }
    
    # 3. Créer la nouvelle variable avec la bonne clé
    Write-Host "Creation de la nouvelle cle..." -ForegroundColor Yellow
    $body = @{
        key = "VITE_SUPABASE_ANON_KEY"
        value = $CORRECT_ANON_KEY
        target = @("production", "preview", "development")
        type = "encrypted"
    } | ConvertTo-Json -Depth 10
    
    $newVar = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME/env" -Method POST -Headers $headers -Body $body
    
    Write-Host ""
    Write-Host "Cle mise a jour avec succes!" -ForegroundColor Green
    Write-Host "La cle commence maintenant par: $($CORRECT_ANON_KEY.Substring(0, 3))" -ForegroundColor Green
    Write-Host ""
    Write-Host "Un nouveau deploiement sera necessaire pour appliquer les changements." -ForegroundColor Yellow
    
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    $errorDetails = $_.ErrorDetails.Message
    if ($errorDetails) {
        Write-Host "Details: $errorDetails" -ForegroundColor Red
    }
}

