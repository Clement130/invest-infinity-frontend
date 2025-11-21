# Script pour réinitialiser le mot de passe du développeur
# Utilise l'API Supabase Management

$PROJECT_REF = "vveswlmcgmizmjsriezw"
$DEVELOPER_EMAIL = "butcher13550@gmail.com"

Write-Host "🔐 Réinitialisation du mot de passe développeur" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Demander le nouveau mot de passe
$newPassword = Read-Host "Entrez le nouveau mot de passe (minimum 6 caractères)" -AsSecureString
$passwordPlainText = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($newPassword)
)

if ($passwordPlainText.Length -lt 6) {
    Write-Host "❌ Le mot de passe doit contenir au moins 6 caractères" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚠️  Pour réinitialiser le mot de passe, vous devez utiliser le Dashboard Supabase:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Allez sur: https://supabase.com/dashboard/project/$PROJECT_REF/auth/users" -ForegroundColor Gray
Write-Host "2. Recherchez: $DEVELOPER_EMAIL" -ForegroundColor Gray
Write-Host "3. Cliquez sur l'utilisateur" -ForegroundColor Gray
Write-Host "4. Cliquez sur 'Reset Password' ou 'Send password reset email'" -ForegroundColor Gray
Write-Host ""
Write-Host "OU utilisez la fonctionnalité 'Mot de passe oublié' sur votre application." -ForegroundColor Gray
Write-Host ""

