# Script pour mettre a jour les cles dans .env.local
$envFile = '.env.local'

if (-not (Test-Path $envFile)) {
    Write-Host "Le fichier .env.local n'existe pas"
    exit 1
}

Write-Host "Mise a jour des cles dans .env.local..." -ForegroundColor Cyan

# Lire le contenu actuel
$content = Get-Content $envFile -Raw

# Mettre a jour ou ajouter OPENAI_API_KEY
# NOTE: Remplacez YOUR_OPENAI_API_KEY par votre vraie clé API
$openaiKey = $env:OPENAI_API_KEY
if (-not $openaiKey) {
    Write-Host "⚠️  OPENAI_API_KEY non défini dans l'environnement" -ForegroundColor Yellow
    Write-Host "   Définissez-la avec: `$env:OPENAI_API_KEY='votre-cle-api'" -ForegroundColor Yellow
    exit 1
}

if ($content -match 'OPENAI_API_KEY=') {
    $content = $content -replace 'OPENAI_API_KEY=.*', "OPENAI_API_KEY=$openaiKey"
    Write-Host "OPENAI_API_KEY mise a jour" -ForegroundColor Green
} else {
    $content += "`nOPENAI_API_KEY=$openaiKey"
    Write-Host "OPENAI_API_KEY ajoutee" -ForegroundColor Green
}

# Mettre a jour ou ajouter RESEND_API_KEY
if ($content -match 'RESEND_API_KEY=') {
    $content = $content -replace 'RESEND_API_KEY=.*', 'RESEND_API_KEY=re_PCaPCV3a_DuaHKtz8iBSf795Svzcs8ErK'
    Write-Host "RESEND_API_KEY mise a jour" -ForegroundColor Green
} else {
    $content += "`nRESEND_API_KEY=re_PCaPCV3a_DuaHKtz8iBSf795Svzcs8ErK"
    Write-Host "RESEND_API_KEY ajoutee" -ForegroundColor Green
}

# Ajouter SUPABASE_JWT_SECRET si pas present
if ($content -notmatch 'SUPABASE_JWT_SECRET=') {
    $content += "`n`n# SUPABASE JWT SECRET`nSUPABASE_JWT_SECRET=Us9AgEQyI9cpUMoxndBlVCYLMk/sKhjpsAK3gAJAk0Y+7ms3E5XbforxCk9PgnbkG5FacwSRXM1jW3RiRYICYQ=="
    Write-Host "SUPABASE_JWT_SECRET ajoutee" -ForegroundColor Green
} else {
    $content = $content -replace 'SUPABASE_JWT_SECRET=.*', 'SUPABASE_JWT_SECRET=Us9AgEQyI9cpUMoxndBlVCYLMk/sKhjpsAK3gAJAk0Y+7ms3E5XbforxCk9PgnbkG5FacwSRXM1jW3RiRYICYQ=='
    Write-Host "SUPABASE_JWT_SECRET mise a jour" -ForegroundColor Green
}

# Sauvegarder
Set-Content -Path $envFile -Value $content -NoNewline

Write-Host ""
Write-Host "Toutes les cles ont ete mises a jour dans .env.local" -ForegroundColor Green
