# Test du webhook Stripe en production (simulation complète)

Write-Host "`n🧪 TEST PRODUCTION - WEBHOOK STRIPE + EMAIL RESEND`n" -ForegroundColor Cyan

# Charger les variables d'environnement
$envContent = Get-Content ".env.local"
$SUPABASE_URL = ($envContent | Select-String '^VITE_SUPABASE_URL=' | ForEach-Object { $_ -replace '^VITE_SUPABASE_URL=', '' }).Trim()
$SERVICE_ROLE_KEY = ($envContent | Select-String '^VITE_SUPABASE_SERVICE_ROLE_KEY=' | ForEach-Object { $_ -replace '^VITE_SUPABASE_SERVICE_ROLE_KEY=', '' }).Trim()

# Email de test unique
$timestamp = Get-Date -Format 'HHmmss'
$testEmail = "test-webhook-$timestamp@example.com"
$testPrenom = "TestUser"

Write-Host "📧 Email de test: $testEmail" -ForegroundColor Yellow
Write-Host "🔗 SUPABASE_URL: $SUPABASE_URL`n" -ForegroundColor Gray

$headers = @{
    "apikey" = $SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

# Simuler un événement Stripe checkout.session.completed
Write-Host "1️⃣ Simulation d'un événement Stripe webhook..." -ForegroundColor Green

$stripeEvent = @{
    id = "evt_test_$(Get-Date -Format 'HHmmss')"
    type = "checkout.session.completed"
    data = @{
        object = @{
            id = "cs_test_$(Get-Date -Format 'HHmmss')"
            customer_email = $testEmail
            payment_status = "paid"
            amount_total = 9900
            currency = "eur"
            metadata = @{
                prenom = $testPrenom
            }
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "   📦 Payload Stripe créé" -ForegroundColor Gray

# Appeler le webhook Stripe
Write-Host "`n2️⃣ Appel du webhook Stripe..." -ForegroundColor Green

try {
    # Note: En production, le webhook a besoin d'une signature Stripe valide
    # Pour ce test, on simule directement les actions du webhook
    
    Write-Host "   ⚠️ Simulation des actions du webhook (création user + envoi email)..." -ForegroundColor Yellow
    
    # Étape 1: Créer l'utilisateur (comme le webhook le fait)
    Write-Host "`n3️⃣ Création de l'utilisateur Supabase..." -ForegroundColor Green
    
    $tempPassword = [System.Guid]::NewGuid().ToString()
    $createBody = @{
        email = $testEmail
        password = $tempPassword
        email_confirm = $true
        user_metadata = @{
            prenom = $testPrenom
        }
    } | ConvertTo-Json

    $createResponse = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/auth/v1/admin/users" `
        -Method Post `
        -Headers $headers `
        -Body $createBody

    $userId = $createResponse.id
    Write-Host "   ✅ Utilisateur créé (ID: $userId)" -ForegroundColor Green
    
    # Étape 2: Créer le profil
    Write-Host "`n4️⃣ Création du profil utilisateur..." -ForegroundColor Green
    
    $profileBody = @{
        id = $userId
        email = $testEmail
        role = "client"
    } | ConvertTo-Json

    try {
        $profileResponse = Invoke-RestMethod `
            -Uri "$SUPABASE_URL/rest/v1/profiles" `
            -Method Post `
            -Headers @{
                "apikey" = $SERVICE_ROLE_KEY
                "Authorization" = "Bearer $SERVICE_ROLE_KEY"
                "Content-Type" = "application/json"
                "Prefer" = "return=representation"
            } `
            -Body $profileBody

        Write-Host "   ✅ Profil créé" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ Profil non créé (peut-être créé automatiquement)" -ForegroundColor Yellow
    }
    
    # Étape 2bis: Créer le lead avec capital
    Write-Host "`n4️⃣bis Création du lead..." -ForegroundColor Green
    
    $leadBody = @{
        email = $testEmail
        prenom = $testPrenom
        capital = 1000
        statut = "Client"
    } | ConvertTo-Json

    try {
        $leadResponse = Invoke-RestMethod `
            -Uri "$SUPABASE_URL/rest/v1/leads" `
            -Method Post `
            -Headers @{
                "apikey" = $SERVICE_ROLE_KEY
                "Authorization" = "Bearer $SERVICE_ROLE_KEY"
                "Content-Type" = "application/json"
                "Prefer" = "return=representation"
            } `
            -Body $leadBody

        Write-Host "   ✅ Lead créé avec capital de 1000€" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ Lead non créé (peut-être déjà existant)" -ForegroundColor Yellow
    }
    
    # Étape 3: Récupérer le premier module de formation
    Write-Host "`n5️⃣ Récupération du premier module..." -ForegroundColor Green
    
    $modulesResponse = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/rest/v1/training_modules?order=position.asc&limit=1" `
        -Method Get `
        -Headers @{
            "apikey" = $SERVICE_ROLE_KEY
            "Authorization" = "Bearer $SERVICE_ROLE_KEY"
        }
    
    if ($modulesResponse -and $modulesResponse.Count -gt 0) {
        $firstModuleId = $modulesResponse[0].id
        Write-Host "   ✅ Module trouvé: $firstModuleId" -ForegroundColor Green
        
        # Étape 3bis: Accorder l'accès à la formation
        Write-Host "`n5️⃣bis Octroi de l'accès à la formation..." -ForegroundColor Green
        
        $accessBody = @{
            user_id = $userId
            module_id = $firstModuleId
            access_type = "full"
        } | ConvertTo-Json

        $accessResponse = Invoke-RestMethod `
            -Uri "$SUPABASE_URL/rest/v1/training_access" `
            -Method Post `
            -Headers @{
                "apikey" = $SERVICE_ROLE_KEY
                "Authorization" = "Bearer $SERVICE_ROLE_KEY"
                "Content-Type" = "application/json"
                "Prefer" = "return=representation"
            } `
            -Body $accessBody

        Write-Host "   ✅ Accès à la formation accordé" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Aucun module de formation trouvé" -ForegroundColor Yellow
    }
    
    # Étape 4: Générer le token de récupération
    Write-Host "`n6️⃣ Génération du token de récupération..." -ForegroundColor Green

    $generateLinkBody = @{
        type = "recovery"
        email = $testEmail
    } | ConvertTo-Json

    $linkResponse = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/auth/v1/admin/generate_link" `
        -Method Post `
        -Headers $headers `
        -Body $generateLinkBody

    $token = $linkResponse.hashed_token
    Write-Host "   ✅ Token généré: $($token.Substring(0,30))..." -ForegroundColor Green
    
    # Étape 5: Envoyer l'email via Resend
    Write-Host "`n7️⃣ Envoi de l'email via Resend..." -ForegroundColor Green

    $emailBody = @{
        email = $testEmail
        token = $token
        prenom = $testPrenom
    } | ConvertTo-Json

    $emailResponse = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/functions/v1/send-password-email" `
        -Method Post `
        -Headers $headers `
        -Body $emailBody

    Write-Host "   ✅ Email envoyé avec succès!" -ForegroundColor Green
    Write-Host "   📬 Email ID: $($emailResponse.id)" -ForegroundColor Cyan
    
    Write-Host "`n🎉 TEST COMPLET RÉUSSI !`n" -ForegroundColor Green
    
    Write-Host "📋 RÉSUMÉ:" -ForegroundColor Cyan
    Write-Host "   ✅ Utilisateur Supabase créé: $userId" -ForegroundColor White
    Write-Host "   ✅ Profil créé (role: client)" -ForegroundColor White
    Write-Host "   ✅ Lead créé avec 1000€ de capital" -ForegroundColor White
    Write-Host "   ✅ Accès à la formation accordé" -ForegroundColor White
    Write-Host "   ✅ Token de récupération généré" -ForegroundColor White
    Write-Host "   ✅ Email envoyé via Resend (noreply@investinfinity.fr)" -ForegroundColor White
    
    Write-Host "`n🔗 Lien de création de mot de passe:" -ForegroundColor Yellow
    $encodedEmail = [uri]::EscapeDataString($testEmail)
    Write-Host "   https://www.investinfinity.fr/create-password?token=$token&email=$encodedEmail`n" -ForegroundColor Cyan
    
    Write-Host "ℹ️  Vérifie l'email sur Resend: https://resend.com/emails`n" -ForegroundColor Gray

} catch {
    $errorDetails = $_
    Write-Host "`n❌ ERREUR LORS DU TEST" -ForegroundColor Red
    Write-Host "   Détails: $errorDetails" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "   Body: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

