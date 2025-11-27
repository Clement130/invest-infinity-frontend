# Test de l'envoi d'email Resend en production

Write-Host "`n🧪 TEST PRODUCTION - ENVOI D'EMAIL RESEND`n" -ForegroundColor Cyan

# Charger les variables d'environnement
$envContent = Get-Content ".env.local"
$SUPABASE_URL = ($envContent | Select-String '^VITE_SUPABASE_URL=' | ForEach-Object { $_ -replace '^VITE_SUPABASE_URL=', '' }).Trim()
$SERVICE_ROLE_KEY = ($envContent | Select-String '^VITE_SUPABASE_SERVICE_ROLE_KEY=' | ForEach-Object { $_ -replace '^VITE_SUPABASE_SERVICE_ROLE_KEY=', '' }).Trim()

# Email de test unique
$timestamp = Get-Date -Format 'HHmmss'
$testEmail = "investinfinityfr@gmail.com"  # Utiliser l'email réel pour voir l'email
$testPrenom = "Test Resend"

Write-Host "📧 Email de test: $testEmail" -ForegroundColor Yellow
Write-Host "ℹ️  SUPABASE_URL: $SUPABASE_URL`n" -ForegroundColor Gray

$headers = @{
    "apikey" = $SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

# 1. Vérifier si l'utilisateur existe déjà
Write-Host "1️⃣ Vérification de l'utilisateur..." -ForegroundColor Green

try {
    $listUsersResponse = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/auth/v1/admin/users" `
        -Method Get `
        -Headers $headers

    $existingUser = $listUsersResponse.users | Where-Object { $_.email -eq $testEmail }
    
    if ($existingUser) {
        Write-Host "   ⚠️ Utilisateur existe déjà (ID: $($existingUser.id))" -ForegroundColor Yellow
        $userId = $existingUser.id
    } else {
        # Créer l'utilisateur si nécessaire
        Write-Host "   ➕ Création de l'utilisateur..." -ForegroundColor Yellow
        
        $tempPassword = [System.Guid]::NewGuid().ToString()
        $createBody = @{
            email = $testEmail
            password = $tempPassword
            email_confirm = $true
        } | ConvertTo-Json

        $createResponse = Invoke-RestMethod `
            -Uri "$SUPABASE_URL/auth/v1/admin/users" `
            -Method Post `
            -Headers $headers `
            -Body $createBody

        $userId = $createResponse.id
        Write-Host "   ✅ Utilisateur créé (ID: $userId)" -ForegroundColor Green
    }
} catch {
    Write-Error "Erreur lors de la vérification/création de l'utilisateur: $_"
    exit 1
}

# 2. Générer un token de récupération
Write-Host "`n2️⃣ Génération du token de récupération..." -ForegroundColor Green

$generateLinkBody = @{
    type = "recovery"
    email = $testEmail
} | ConvertTo-Json

try {
    $linkResponse = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/auth/v1/admin/generate_link" `
        -Method Post `
        -Headers $headers `
        -Body $generateLinkBody

    $token = $linkResponse.hashed_token
    if (-not $token) {
        throw "Token non trouvé dans la réponse"
    }
    Write-Host "   ✅ Token généré: $($token.Substring(0,30))..." -ForegroundColor Green
} catch {
    $errorDetails = $_
    Write-Host "   ❌ Erreur lors de la génération du token" -ForegroundColor Red
    Write-Host "   Détails: $errorDetails" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "   Body: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# 3. Appeler la fonction d'envoi d'email
Write-Host "`n3️⃣ Appel de la fonction send-password-email..." -ForegroundColor Green

$emailBody = @{
    email = $testEmail
    token = $token
    prenom = $testPrenom
} | ConvertTo-Json

try {
    $emailResponse = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/functions/v1/send-password-email" `
        -Method Post `
        -Headers $headers `
        -Body $emailBody

    Write-Host "   ✅ Email envoyé avec succès!" -ForegroundColor Green
    Write-Host "   📬 Email ID: $($emailResponse.id)" -ForegroundColor Cyan
    Write-Host "`n🎉 TEST RÉUSSI !`n" -ForegroundColor Green
    Write-Host "📧 Vérifie l'email: $testEmail" -ForegroundColor Yellow
    Write-Host "🔗 Lien de création de mot de passe:" -ForegroundColor Yellow
    $encodedEmail = [uri]::EscapeDataString($testEmail)
    Write-Host "   https://www.investinfinity.fr/create-password?token=$token&email=$encodedEmail`n" -ForegroundColor Cyan
    
} catch {
    $errorBody = $_.ErrorDetails.Message
    Write-Host "   ❌ Erreur lors de l'envoi de l'email" -ForegroundColor Red
    Write-Host "   Détails: $errorBody" -ForegroundColor Red
    
    # Afficher plus de détails si disponible
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   Code HTTP: $statusCode" -ForegroundColor Red
    }
    
    exit 1
}

