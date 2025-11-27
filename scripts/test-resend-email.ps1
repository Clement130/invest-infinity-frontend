# Test d'envoi d'email via Resend

$envContent = Get-Content ".env.local"
$SUPABASE_URL = ($envContent | Select-String '^VITE_SUPABASE_URL=' | ForEach-Object { $_ -replace '^VITE_SUPABASE_URL=', '' }).Trim()
$SERVICE_ROLE_KEY = ($envContent | Select-String '^VITE_SUPABASE_SERVICE_ROLE_KEY=' | ForEach-Object { $_ -replace '^VITE_SUPABASE_SERVICE_ROLE_KEY=', '' }).Trim()

$body = @{
    email = "investinfinityfr@gmail.com"
    token = "test-token-123456"
    prenom = "Mickael"
} | ConvertTo-Json

Write-Host "`n📧 Test d'envoi d'email via Resend...`n" -ForegroundColor Cyan

$response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/send-password-email" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer $SERVICE_ROLE_KEY"
        "Content-Type" = "application/json"
    } `
    -Body $body

Write-Host "✅ Email envoyé avec succès !" -ForegroundColor Green
Write-Host "   ID: $($response.emailId)" -ForegroundColor Gray
Write-Host "`n📬 Vérifie ta boîte mail: investinfinityfr@gmail.com`n" -ForegroundColor Yellow

