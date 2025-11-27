# Test du flow de paiement complet
# Simule un utilisateur qui vient de payer

Write-Host "`n🧪 Test du flow de paiement complet`n" -ForegroundColor Cyan

# Charger les variables d'environnement
$envContent = Get-Content .env.local
$SUPABASE_URL = ($envContent | Select-String 'VITE_SUPABASE_URL=' | ForEach-Object { $_ -replace 'VITE_SUPABASE_URL=','' }).Trim()
$SERVICE_ROLE_KEY = ($envContent | Select-String 'SUPABASE_SERVICE_ROLE_KEY=' | ForEach-Object { $_ -replace 'SUPABASE_SERVICE_ROLE_KEY=','' }).Trim()

# Générer un email de test unique
$timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$testEmail = "test-$timestamp@example.com"
$tempPassword = [System.Guid]::NewGuid().ToString()

Write-Host "📧 Email de test: $testEmail`n" -ForegroundColor Yellow

# 1. Créer un utilisateur
Write-Host "1️⃣ Création d'un utilisateur de test..." -ForegroundColor Green

$createUserBody = @{
    email = $testEmail
    password = $tempPassword
    email_confirm = $true
} | ConvertTo-Json

$createResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/admin/users" `
    -Method Post `
    -Headers @{
        "apikey" = $SERVICE_ROLE_KEY
        "Authorization" = "Bearer $SERVICE_ROLE_KEY"
        "Content-Type" = "application/json"
    } `
    -Body $createUserBody

$userId = $createResponse.id
Write-Host "   ✅ Utilisateur créé: $userId`n" -ForegroundColor Green

# 2. Générer un token de récupération
Write-Host "2️⃣ Génération du token de récupération..." -ForegroundColor Green

$generateLinkBody = @{
    type = "recovery"
    email = $testEmail
} | ConvertTo-Json

$linkResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/admin/generate_link" `
    -Method Post `
    -Headers @{
        "apikey" = $SERVICE_ROLE_KEY
        "Authorization" = "Bearer $SERVICE_ROLE_KEY"
        "Content-Type" = "application/json"
    } `
    -Body $generateLinkBody

$passwordToken = $linkResponse.properties.hashed_token
Write-Host "   ✅ Token généré`n" -ForegroundColor Green

# 3. Créer le profil
Write-Host "3️⃣ Création du profil..." -ForegroundColor Green

$profileBody = @{
    id = $userId
    email = $testEmail
    role = "client"
    created_at = (Get-Date -Format "o")
} | ConvertTo-Json

$profileResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/profiles" `
    -Method Post `
    -Headers @{
        "apikey" = $SERVICE_ROLE_KEY
        "Authorization" = "Bearer $SERVICE_ROLE_KEY"
        "Content-Type" = "application/json"
        "Prefer" = "resolution=merge-duplicates"
    } `
    -Body $profileBody `
    -ErrorAction SilentlyContinue

Write-Host "   ✅ Profil créé`n" -ForegroundColor Green

# 4. Récupérer les modules
Write-Host "4️⃣ Attribution des accès aux modules..." -ForegroundColor Green

$modules = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/training_modules?select=id" `
    -Method Get `
    -Headers @{
        "apikey" = $SERVICE_ROLE_KEY
        "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    }

if ($modules.Count -gt 0) {
    $accessRecords = @()
    foreach ($module in $modules) {
        $accessRecords += @{
            user_id = $userId
            module_id = $module.id
            access_type = "full"
            granted_at = (Get-Date -Format "o")
        }
    }
    
    $accessBody = $accessRecords | ConvertTo-Json -Depth 5
    
    $accessResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/training_access" `
        -Method Post `
        -Headers @{
            "apikey" = $SERVICE_ROLE_KEY
            "Authorization" = "Bearer $SERVICE_ROLE_KEY"
            "Content-Type" = "application/json"
            "Prefer" = "resolution=merge-duplicates"
        } `
        -Body $accessBody `
        -ErrorAction SilentlyContinue
    
    Write-Host "   ✅ Accès accordé à $($modules.Count) modules`n" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Aucun module trouvé`n" -ForegroundColor Yellow
}

# Résumé
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "✅ TEST RÉUSSI - Utilisateur créé avec succès !" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`n📧 Email: $testEmail" -ForegroundColor White
Write-Host "🆔 User ID: $userId" -ForegroundColor White
Write-Host "🔑 Token: $($passwordToken.Substring(0,20))..." -ForegroundColor White

$emailEncoded = [uri]::EscapeDataString($testEmail)
$createPasswordUrl = "https://www.investinfinity.fr/create-password?token=$passwordToken`&email=$emailEncoded"
Write-Host "`n🔗 URL de création de mot de passe:" -ForegroundColor Yellow
Write-Host $createPasswordUrl -ForegroundColor Cyan

Write-Host "`n💡 Tu peux tester le flow complet en ouvrant cette URL dans ton navigateur" -ForegroundColor Yellow
Write-Host "   L'utilisateur pourra créer son mot de passe et accéder à la plateforme.`n" -ForegroundColor White

# Demander si on doit nettoyer
Write-Host "🧹 Veux-tu supprimer cet utilisateur de test ? (O/N): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -eq "O" -or $response -eq "o") {
    Write-Host "`nSuppression de l'utilisateur..." -ForegroundColor Yellow
    
    $deleteResponse = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/admin/users/$userId" `
        -Method Delete `
        -Headers @{
            "apikey" = $SERVICE_ROLE_KEY
            "Authorization" = "Bearer $SERVICE_ROLE_KEY"
        } `
        -ErrorAction SilentlyContinue
    
    Write-Host "✅ Utilisateur de test supprimé`n" -ForegroundColor Green
} else {
    Write-Host "`n💡 User ID à supprimer manuellement plus tard: $userId`n" -ForegroundColor Yellow
}

