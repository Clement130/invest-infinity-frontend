# Script pour redémarrer le serveur de développement Vite
# Cela permet de recharger les variables d'environnement depuis .env.local

Write-Host "🔄 Redémarrage du serveur de développement Vite..." -ForegroundColor Cyan
Write-Host ""

# Chercher les processus Node.js qui pourraient être le serveur Vite
$viteProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*node*" -and 
    (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)" | Select-Object -ExpandProperty CommandLine) -like "*vite*"
}

if ($viteProcesses) {
    Write-Host "⏹️  Arrêt des processus Vite existants..." -ForegroundColor Yellow
    $viteProcesses | ForEach-Object {
        Write-Host "   Arrêt du processus PID $($_.Id)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# Vérifier que les variables sont présentes
Write-Host "📋 Vérification des variables d'environnement..." -ForegroundColor Cyan
$envFile = ".env.local"
if (Test-Path $envFile) {
    $bunnyVars = Get-Content $envFile | Select-String "VITE_BUNNY"
    if ($bunnyVars) {
        Write-Host "   ✅ Variables Bunny Stream trouvées:" -ForegroundColor Green
        $bunnyVars | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    } else {
        Write-Host "   ⚠️  Aucune variable VITE_BUNNY trouvée dans .env.local" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Fichier .env.local non trouvé" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Démarrage du serveur de développement..." -ForegroundColor Green
Write-Host "   Le serveur va démarrer dans une nouvelle fenêtre PowerShell" -ForegroundColor Gray
Write-Host "   URL: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

# Démarrer le serveur dans une nouvelle fenêtre
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🚀 Serveur de développement Vite' -ForegroundColor Green; Write-Host '📋 Variables d''environnement chargées depuis .env.local' -ForegroundColor Cyan; Write-Host ''; npm run dev"

Write-Host "✅ Serveur démarré!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Astuce: Ouvrez http://localhost:5173/admin/videos pour vérifier" -ForegroundColor Yellow
Write-Host "   Le composant EnvDebug affichera les variables chargées" -ForegroundColor Yellow

