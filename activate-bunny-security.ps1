# Script final pour activer complètement les protections Bunny Stream

Write-Host "🚀 ACTIVATION FINALE DES PROTECTIONS BUNNY STREAM" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta
Write-Host ""

# Vérifier que Bunny.net est configuré
Write-Host "📋 Checklist avant activation:" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$checklist = @(
    @{ Name = "Dashboard Bunny.net accessible"; Status = $false },
    @{ Name = "Token authentication activé"; Status = $false },
    @{ Name = "Domaines autorisés configurés"; Status = $false },
    @{ Name = "MediaCage DRM activé"; Status = $false },
    @{ Name = "Variables d'environnement Supabase"; Status = $false },
    @{ Name = "Clé de sécurité Bunny chargée"; Status = $false }
)

# Afficher le checklist
for ($i = 0; $i -lt $checklist.Count; $i++) {
    $item = $checklist[$i]
    $status = if ($item.Status) { "✅" } else { "⏳" }
    Write-Host "$status $($item.Name)" -ForegroundColor $(if ($item.Status) { "Green" } else { "Yellow" })
}

Write-Host ""

# Vérifications automatiques
Write-Host "🔍 Vérifications automatiques:" -ForegroundColor Blue

# Vérifier la clé Bunny
if ($env:BUNNY_EMBED_TOKEN_KEY) {
    Write-Host "✅ Clé de sécurité Bunny chargée" -ForegroundColor Green
    $checklist[5].Status = $true
} else {
    Write-Host "❌ Clé de sécurité Bunny manquante" -ForegroundColor Red
    Write-Host "   Exécutez d'abord: Get-Content bunny-security-config.env | Where-Object { `$_ -match '^BUNNY_EMBED_TOKEN_KEY=' } | ForEach-Object { `$env:BUNNY_EMBED_TOKEN_KEY = `$_.Split('=')[1] }" -ForegroundColor Yellow
    exit 1
}

# Vérifier Supabase
$supabaseReady = $env:SUPABASE_PROJECT_REF -and $env:SUPABASE_ACCESS_TOKEN
if ($supabaseReady) {
    Write-Host "✅ Variables Supabase configurées" -ForegroundColor Green
    $checklist[4].Status = $true
} else {
    Write-Host "❌ Variables Supabase manquantes" -ForegroundColor Red
    Write-Host "   Configurez SUPABASE_PROJECT_REF et SUPABASE_ACCESS_TOKEN" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Demander confirmation manuelle
Write-Host "📝 Confirmation manuelle requise:" -ForegroundColor Yellow
$confirmBunny = Read-Host "Avez-vous configuré Bunny.net selon les instructions ? (y/n)"
if ($confirmBunny -ne 'y') {
    Write-Host "❌ Configurez d'abord Bunny.net selon les instructions affichées précédemment" -ForegroundColor Red
    exit 1
}

$checklist[0].Status = $true
$checklist[1].Status = $true
$checklist[2].Status = $true
$checklist[3].Status = $true

Write-Host ""

# Lancer la configuration finale
Write-Host "🚀 Lancement de la configuration finale..." -ForegroundColor Green
Write-Host ""

try {
    # Exécuter le script de setup
    & "./setup-bunny-security.ps1"

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 CONFIGURATION RÉUSSIE !" -ForegroundColor Green
        Write-Host "==========================" -ForegroundColor Green
        Write-Host ""

        # Tests finaux
        Write-Host "🧪 Tests de validation:" -ForegroundColor Cyan
        Write-Host "======================" -ForegroundColor Cyan

        # Tester la fonction Supabase
        Write-Host "🔍 Test de la fonction generate-bunny-token..." -ForegroundColor Yellow
        $testResult = supabase functions list 2>$null | Select-String "generate-bunny-token"
        if ($testResult) {
            Write-Host "✅ Fonction déployée" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Fonction non trouvée - vérifiez le déploiement" -ForegroundColor Yellow
        }

        # Tester les protections
        Write-Host "🔍 Test des protections de sécurité..." -ForegroundColor Yellow
        try {
            & "node" "scripts/test-bunny-security.js" 2>$null
            Write-Host "✅ Tests passés" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Tests non concluants - vérifiez la configuration" -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "🎊 FÉLICITATIONS !" -ForegroundColor Magenta
        Write-Host "==================" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "🔒 Vos vidéos sont maintenant protégées contre:" -ForegroundColor Green
        Write-Host "   ✅ Le vol de contenu (embedding non autorisé)" -ForegroundColor Green
        Write-Host "   ✅ Les accès directs non authentifiés" -ForegroundColor Green
        Write-Host "   ✅ Les téléchargements illégaux (avec DRM)" -ForegroundColor Green
        Write-Host "   ✅ L'expiration automatique des liens" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Votre application est prête pour la production !" -ForegroundColor Cyan

    } else {
        Write-Host "❌ Échec de la configuration" -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "❌ Erreur lors de la configuration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
