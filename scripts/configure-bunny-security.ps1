# Script pour configurer automatiquement les protections de sécurité Bunny Stream
# ⚠️ Ce script nécessite un compte Bunny.net actif et payant

Write-Host "🔐 Configuration des protections de sécurité Bunny Stream" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier les variables d'environnement
$BUNNY_EMBED_TOKEN_KEY = $env:BUNNY_EMBED_TOKEN_KEY
$BUNNY_LIBRARY_ID = $env:BUNNY_STREAM_LIBRARY_ID
$BUNNY_API_KEY = $env:BUNNY_STREAM_API_KEY

Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow

$missingVars = @()

if ([string]::IsNullOrWhiteSpace($BUNNY_EMBED_TOKEN_KEY)) {
    $missingVars += "BUNNY_EMBED_TOKEN_KEY"
}
if ([string]::IsNullOrWhiteSpace($BUNNY_LIBRARY_ID)) {
    $missingVars += "BUNNY_STREAM_LIBRARY_ID"
}
if ([string]::IsNullOrWhiteSpace($BUNNY_API_KEY)) {
    $missingVars += "BUNNY_STREAM_API_KEY"
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Variables d'environnement manquantes:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "📖 Comment les définir:" -ForegroundColor Yellow
    Write-Host "   `$env:BUNNY_EMBED_TOKEN_KEY = 'votre_clé_embed_token'" -ForegroundColor Gray
    Write-Host "   `$env:BUNNY_STREAM_LIBRARY_ID = 'votre_library_id'" -ForegroundColor Gray
    Write-Host "   `$env:BUNNY_STREAM_API_KEY = 'votre_api_key'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔑 Où trouver ces informations dans Bunny.net:" -ForegroundColor Cyan
    Write-Host "1. Connectez-vous à https://dash.bunny.net" -ForegroundColor Gray
    Write-Host "2. Allez dans Stream > Votre Bibliothèque > Security" -ForegroundColor Gray
    Write-Host "3. BUNNY_EMBED_TOKEN_KEY = clé pour 'Embed view token authentication'" -ForegroundColor Gray
    Write-Host "4. BUNNY_STREAM_LIBRARY_ID = ID de votre bibliothèque Stream" -ForegroundColor Gray
    Write-Host "5. BUNNY_STREAM_API_KEY = clé API dans Account > API" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Toutes les variables d'environnement sont définies" -ForegroundColor Green
Write-Host ""

# Instructions manuelles pour la configuration Bunny.net
Write-Host "🛠️  CONFIGURATION MANUELLE REQUISE DANS BUNNY.NET" -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "1️⃣ ACTIVER L'AUTHENTIFICATION PAR TOKEN D'EMBED:" -ForegroundColor Yellow
Write-Host "   📍 Dashboard Bunny.net > Stream > Votre Bibliothèque > Security" -ForegroundColor Gray
Write-Host "   ✅ Cochez 'Enable embed view token authentication'" -ForegroundColor Green
Write-Host "   🔑 Utilisez cette clé: $BUNNY_EMBED_TOKEN_KEY" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣ CONFIGURER LES DOMAINES AUTORISÉS:" -ForegroundColor Yellow
Write-Host "   📍 Même page Security > 'Allowed Domains'" -ForegroundColor Gray
Write-Host "   ✅ Ajoutez vos domaines:" -ForegroundColor Green
Write-Host "      - investinfinity.com" -ForegroundColor White
Write-Host "      - *.vercel.app" -ForegroundColor White
Write-Host "      - localhost:5173 (pour le développement)" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣ ACTIVER MEDIACAGE DRM (OPTIONNEL MAIS RECOMMANDÉ):" -ForegroundColor Yellow
Write-Host "   📍 Même page Security > 'MediaCage DRM'" -ForegroundColor Gray
Write-Host "   ✅ Cochez 'Enable MediaCage DRM'" -ForegroundColor Green
Write-Host "   ℹ️  Cela empêche les téléchargements et enregistrements d'écran" -ForegroundColor Cyan
Write-Host ""

Write-Host "4️⃣ ACTIVER L'AUTHENTIFICATION CDN (POUR LES URL DIRECTES):" -ForegroundColor Yellow
Write-Host "   📍 Dashboard > CDN > Votre Pull Zone > Security" -ForegroundColor Gray
Write-Host "   ✅ Activez 'Token Authentication'" -ForegroundColor Green
Write-Host "   🔑 Utilisez une clé différente de l'embed token" -ForegroundColor White
Write-Host ""

Write-Host "🔍 VÉRIFICATION DE LA CONFIGURATION:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testez vos protections avec ces URLs:" -ForegroundColor Yellow
Write-Host "1. URL sans token (devrait être bloquée):" -ForegroundColor Gray
Write-Host "   https://iframe.mediadelivery.net/embed/$BUNNY_LIBRARY_ID/VIDEO_ID" -ForegroundColor White
Write-Host ""
Write-Host "2. Essayez d'intégrer la vidéo sur un site externe" -ForegroundColor Gray
Write-Host "   (devrait être bloqué si les domaines sont configurés)" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 RESSOURCES UTILES:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Documentation officielle:" -ForegroundColor Gray
Write-Host "   https://docs.bunny.net/docs/stream-security" -ForegroundColor White
Write-Host "   https://docs.bunny.net/docs/stream-embed-token-authentication" -ForegroundColor White
Write-Host ""
Write-Host "🆘 Support Bunny.net:" -ForegroundColor Gray
Write-Host "   https://support.bunny.net/hc/en-us" -ForegroundColor White
Write-Host ""

Write-Host "✨ UNE FOIS CONFIGURÉ, VOS VIDÉOS SERONT PROTÉGÉES!" -ForegroundColor Green
Write-Host ""
Write-Host "🔒 Protections activées:" -ForegroundColor Green
Write-Host "   ✅ Authentification par token d'embed" -ForegroundColor Green
Write-Host "   ✅ Restriction de domaines" -ForegroundColor Green
Write-Host "   ✅ MediaCage DRM (si activé)" -ForegroundColor Green
Write-Host "   ✅ Authentification CDN (si configurée)" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 PROCHAINES ÉTAPES:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configurez manuellement dans Bunny.net (voir instructions ci-dessus)" -ForegroundColor Yellow
Write-Host "2. Testez les protections avec les URLs fournies" -ForegroundColor Yellow
Write-Host "3. Déployez votre application avec les nouvelles protections" -ForegroundColor Yellow
Write-Host "4. Surveillez les logs pour détecter toute tentative d'accès non autorisé" -ForegroundColor Yellow
