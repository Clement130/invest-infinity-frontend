param(
    [Parameter(Mandatory = $true)]
    [string]$Email
)

Write-Host "`n🔐 Génération d'un lien de création de mot de passe pour $Email`n" -ForegroundColor Cyan

# Charger les variables d'environnement depuis le .env.local
$envContent = Get-Content ".env.local"
$SUPABASE_URL = ($envContent | Select-String '^VITE_SUPABASE_URL=' | ForEach-Object { $_ -replace '^VITE_SUPABASE_URL=', '' }).Trim()
$SERVICE_ROLE_KEY = ($envContent | Select-String '^VITE_SUPABASE_SERVICE_ROLE_KEY=' | ForEach-Object { $_ -replace '^VITE_SUPABASE_SERVICE_ROLE_KEY=', '' }).Trim()

if (-not $SUPABASE_URL -or -not $SERVICE_ROLE_KEY) {
    Write-Error "Impossible de lire VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY depuis .env.local"
    exit 1
}

Write-Host "ℹ️  SUPABASE_URL=$SUPABASE_URL" -ForegroundColor Gray
Write-Host "ℹ️  Clé service chargée (${($SERVICE_ROLE_KEY).Length} caractères)" -ForegroundColor Gray

$headers = @{
    "apikey" = $SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

Write-Host "ℹ️  Création (ou vérification) de l'utilisateur..." -ForegroundColor Green
try {
    $tempPassword = [System.Guid]::NewGuid().ToString()
    $createBody = @{
        email = $Email
        password = $tempPassword
        email_confirm = $true
    } | ConvertTo-Json

    $createResponse = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/auth/v1/admin/users" `
        -Method Post `
        -Headers $headers `
        -Body $createBody

    Write-Host "   ✅ Utilisateur créé : $($createResponse.id)" -ForegroundColor Green
} catch {
    $ex = $_.Exception
    $body = ''
    if ($ex.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($ex.Response.GetResponseStream())
            $body = $reader.ReadToEnd()
            $reader.Close()
        } catch {
            $body = $ex.Message
        }
    }

    $statusCode = ''
    if ($ex.Response -and $ex.Response.StatusCode) {
        $statusCode = $ex.Response.StatusCode.Value__
    }

    if ($statusCode -eq 422 -or $body -match 'already registered' -or $body -match 'email already exists' -or $body -match 'duplicate') {
        Write-Host "   ⚠️ L'utilisateur existe déjà, on continue." -ForegroundColor Yellow
    } else {
        Write-Error "Erreur lors de la création de l'utilisateur : $body"
        exit 1
    }
}

Write-Host "`n🧾 Génération du token de récupération..." -ForegroundColor Green
Start-Sleep -Seconds 2

$body = @{
    type = "recovery"
    email = $Email
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/auth/v1/admin/generate_link" `
        -Method Post `
        -Headers $headers `
        -Body $body
} catch {
    $ex = $_.Exception
    $bodyText = ''
    if ($ex.Response) {
        $reader = New-Object System.IO.StreamReader($ex.Response.GetResponseStream())
        $bodyText = $reader.ReadToEnd()
        $reader.Close()
    } else {
        $bodyText = $ex.Message
    }
    Write-Host "   ⚠️ generate_link failed: $bodyText" -ForegroundColor Yellow
    Write-Error "Impossible de récupérer le token de récupération."
    exit 1
}

$token = $null
if ($response.properties -and $response.properties.hashed_token) {
    $token = $response.properties.hashed_token
} elseif ($response.hashed_token) {
    $token = $response.hashed_token
}

if (-not $token) {
    Write-Host "   ⚠️ Response payload: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Yellow
    Write-Error "Impossible de récupérer le token de récupération."
    exit 1
}

$encodedEmail = [uri]::EscapeDataString($Email)
$createPasswordUrl = "https://www.investinfinity.fr/create-password?token=$token&email=$encodedEmail"

Write-Host "`n🔗 Lien de création de mot de passe :`n$createPasswordUrl`n" -ForegroundColor Yellow
Write-Host "ℹ️  Ce lien expire automatiquement selon la configuration Supabase (en général 1h)."

