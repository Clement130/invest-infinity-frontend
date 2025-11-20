$VERCEL_TOKEN = "TVjEksX9UflX7TObh9iIPyEw"
$PROJECT_NAME = "invest-infinity-frontend"

Write-Host "Verification de la cle Supabase sur Vercel..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $VERCEL_TOKEN"
}

try {
    $envVars = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$PROJECT_NAME/env" -Headers $headers
    
    $anonKeyVar = $envVars.envs | Where-Object { $_.key -eq "VITE_SUPABASE_ANON_KEY" }
    
    if ($anonKeyVar) {
        Write-Host ""
        Write-Host "Cle VITE_SUPABASE_ANON_KEY trouvee:" -ForegroundColor Green
        Write-Host "Longueur: $($anonKeyVar.value.Length) caracteres" -ForegroundColor Gray
        Write-Host "Premiers caracteres: $($anonKeyVar.value.Substring(0, [Math]::Min(50, $anonKeyVar.value.Length)))..." -ForegroundColor Gray
        Write-Host "Derniers caracteres: ...$($anonKeyVar.value.Substring([Math]::Max(0, $anonKeyVar.value.Length - 20)))" -ForegroundColor Gray
        Write-Host ""
        Write-Host "La cle semble complete: $(if ($anonKeyVar.value.Length -gt 100) { 'OUI' } else { 'NON - PROBLEME!' })" -ForegroundColor $(if ($anonKeyVar.value.Length -gt 100) { "Green" } else { "Red" })
    } else {
        Write-Host "[ERREUR] Variable VITE_SUPABASE_ANON_KEY non trouvee!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

