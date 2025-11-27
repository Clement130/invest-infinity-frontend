$testEmail = "clement.robert130@gmail.com"

Write-Output "TEST EMAIL POUR: $testEmail"
Write-Output "================================"

# Charger les variables
$envContent = Get-Content ".env.local"
$SUPABASE_URL = ($envContent | Select-String '^VITE_SUPABASE_URL=' | ForEach-Object { $_ -replace '^VITE_SUPABASE_URL=', '' }).Trim()
$SERVICE_ROLE_KEY = ($envContent | Select-String '^VITE_SUPABASE_SERVICE_ROLE_KEY=' | ForEach-Object { $_ -replace '^VITE_SUPABASE_SERVICE_ROLE_KEY=', '' }).Trim()

Write-Output "SUPABASE_URL: $SUPABASE_URL"

$headers = @{
    "apikey" = $SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

# 1. Générer le token
Write-Output ""
Write-Output "1. Generation du token de recuperation..."
$linkBody = '{"type":"recovery","email":"' + $testEmail + '"}'
try {
    $linkResp = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/admin/generate_link" -Method Post -Headers $headers -Body $linkBody -ErrorAction Stop
    $token = $linkResp.properties.hashed_token
    Write-Output "   OK - Token genere: $($token.Substring(0,25))..."
} catch {
    Write-Output "   ERREUR: $($_.Exception.Message)"
    exit 1
}

# 2. Envoyer l'email
Write-Output ""
Write-Output "2. Envoi de l'email via Resend..."
$emailJson = '{"email":"' + $testEmail + '","token":"' + $token + '","prenom":"Clement"}'
try {
    $emailResp = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/send-password-email" -Method Post -Headers $headers -Body $emailJson -ErrorAction Stop
    Write-Output "   OK - Email envoye!"
    Write-Output "   Email ID: $($emailResp.data.id)"
} catch {
    Write-Output "   ERREUR: $($_.Exception.Message)"
    Write-Output "   Details: $($_.ErrorDetails.Message)"
    exit 1
}

Write-Output ""
Write-Output "================================"
Write-Output "SUCCES! Verifie ta boite mail: $testEmail"
Write-Output "================================"

