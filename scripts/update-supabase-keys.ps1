# Script pour mettre a jour les cles Supabase dans .env.local
$envFile = '.env.local'

if (-not (Test-Path $envFile)) {
    Write-Host "Le fichier .env.local n'existe pas" -ForegroundColor Red
    exit 1
}

Write-Host "Mise a jour des cles Supabase dans .env.local..." -ForegroundColor Cyan

# Lire le contenu
$content = Get-Content $envFile -Raw

# Mettre a jour VITE_SUPABASE_ANON_KEY
$newAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZXN3bG1jZ21pem1qc3JpZXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzM4NjcsImV4cCI6MjA3OTAwOTg2N30.G_9XfabnMXR23LzuvRTRLrpHMd1EFznJXrTNadOwdjY'
if ($content -match 'VITE_SUPABASE_ANON_KEY=') {
    $content = $content -replace 'VITE_SUPABASE_ANON_KEY=.*', "VITE_SUPABASE_ANON_KEY=$newAnonKey"
    Write-Host "VITE_SUPABASE_ANON_KEY mise a jour" -ForegroundColor Green
} else {
    $content += "`nVITE_SUPABASE_ANON_KEY=$newAnonKey"
    Write-Host "VITE_SUPABASE_ANON_KEY ajoutee" -ForegroundColor Green
}

# Mettre a jour SUPABASE_SERVICE_ROLE_KEY
$newServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZXN3bG1jZ21pem1qc3JpZXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQzMzg2NywiZXhwIjoyMDc5MDA5ODY3fQ.a5Wr6M28RDRyJCX93FAPCUnRX-GUWrL-4zCFd4Q-yto'
if ($content -match 'SUPABASE_SERVICE_ROLE_KEY=') {
    $content = $content -replace 'SUPABASE_SERVICE_ROLE_KEY=.*', "SUPABASE_SERVICE_ROLE_KEY=$newServiceKey"
    Write-Host "SUPABASE_SERVICE_ROLE_KEY mise a jour" -ForegroundColor Green
} else {
    $content += "`nSUPABASE_SERVICE_ROLE_KEY=$newServiceKey"
    Write-Host "SUPABASE_SERVICE_ROLE_KEY ajoutee" -ForegroundColor Green
}

# Sauvegarder
Set-Content -Path $envFile -Value $content -NoNewline

Write-Host ""
Write-Host "Toutes les cles Supabase ont ete mises a jour" -ForegroundColor Green

