# Script pour créer de nouveaux prix Stripe et mettre à jour la configuration
# 
# PRÉREQUIS:
# 1. Avoir la clé secrète Stripe (sk_live_... ou sk_test_...)
# 2. Avoir les Product IDs Stripe existants
#
# UTILISATION:
# .\scripts\update-stripe-prices.ps1 -StripeSecretKey "sk_test_..." -ProductIdEssentiel "prod_..." -ProductIdPremium "prod_..."

param(
    [Parameter(Mandatory=$true)]
    [string]$StripeSecretKey,
    
    [Parameter(Mandatory=$true)]
    [string]$ProductIdEssentiel,
    
    [Parameter(Mandatory=$true)]
    [string]$ProductIdPremium
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mise à jour des prix Stripe" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration des nouveaux prix
$prixEssentiel = 50.00  # 50€
$prixPremium = 249.95   # 249.95€

# Headers pour l'API Stripe
$headers = @{
    "Authorization" = "Bearer $StripeSecretKey"
    "Content-Type" = "application/x-www-form-urlencoded"
}

# Fonction pour créer un nouveau prix
function Create-StripePrice {
    param(
        [string]$ProductId,
        [decimal]$Amount,
        [string]$Currency = "eur",
        [string]$Nickname
    )
    
    $body = @{
        product = $ProductId
        unit_amount = [math]::Round($Amount * 100)  # Stripe utilise les centimes
        currency = $Currency
        nickname = $Nickname
    }
    
    $bodyString = ($body.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
    
    try {
        Write-Host "Création du prix pour $Nickname ($Amount €)..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "https://api.stripe.com/v1/prices" -Method Post -Headers $headers -Body $bodyString
        
        Write-Host "✓ Prix créé avec succès!" -ForegroundColor Green
        Write-Host "  Price ID: $($response.id)" -ForegroundColor Green
        Write-Host "  Montant: $Amount €" -ForegroundColor Green
        Write-Host ""
        
        return $response.id
    }
    catch {
        Write-Host "✗ Erreur lors de la création du prix:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
        return $null
    }
}

# Créer le prix Essentiel
Write-Host "1. Création du prix Essentiel (50€)..." -ForegroundColor Cyan
$priceIdEssentiel = Create-StripePrice -ProductId $ProductIdEssentiel -Amount $prixEssentiel -Nickname "Formation Essentiel - 50€"

# Créer le prix Premium
Write-Host "2. Création du prix Premium (249.95€)..." -ForegroundColor Cyan
$priceIdPremium = Create-StripePrice -ProductId $ProductIdPremium -Amount $prixPremium -Nickname "Formation Premium - 249.95€"

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Résumé" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($priceIdEssentiel -and $priceIdPremium) {
    Write-Host "✓ Tous les prix ont été créés avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Nouveaux Price IDs:" -ForegroundColor Yellow
    Write-Host "  Essentiel: $priceIdEssentiel" -ForegroundColor White
    Write-Host "  Premium:   $priceIdPremium" -ForegroundColor White
    Write-Host ""
    Write-Host "Mettez à jour le fichier src/config/stripe.ts avec ces nouveaux Price IDs:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "export const STRIPE_PRICE_IDS = {" -ForegroundColor Gray
    Write-Host "  essentiel: '$priceIdEssentiel', // Formation Essentiel - 50€" -ForegroundColor Gray
    Write-Host "  premium: '$priceIdPremium', // Formation Premium - 249.95€" -ForegroundColor Gray
    Write-Host "} as const;" -ForegroundColor Gray
    Write-Host ""
    
    # Proposer de mettre à jour automatiquement le fichier
    $update = Read-Host "Voulez-vous mettre à jour automatiquement le fichier src/config/stripe.ts? (O/N)"
    if ($update -eq "O" -or $update -eq "o") {
        $configFile = "src/config/stripe.ts"
        if (Test-Path $configFile) {
            $content = Get-Content $configFile -Raw
            $content = $content -replace "essentiel: 'price_[^']+', // Formation Essentiel - \d+€", "essentiel: '$priceIdEssentiel', // Formation Essentiel - 50€"
            $content = $content -replace "premium: 'price_[^']+', // Formation Premium - [\d.]+€", "premium: '$priceIdPremium', // Formation Premium - 249.95€"
            Set-Content -Path $configFile -Value $content -NoNewline
            Write-Host "✓ Fichier src/config/stripe.ts mis à jour!" -ForegroundColor Green
        } else {
            Write-Host "✗ Fichier src/config/stripe.ts introuvable" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✗ Certains prix n'ont pas pu être créés. Veuillez vérifier les erreurs ci-dessus." -ForegroundColor Red
}

Write-Host ""
Write-Host "Note: Les anciens Price IDs restent actifs dans Stripe." -ForegroundColor Yellow
Write-Host "Vous pouvez les désactiver manuellement dans le tableau de bord Stripe si nécessaire." -ForegroundColor Yellow
Write-Host ""

