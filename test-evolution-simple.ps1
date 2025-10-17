# Teste simples Evolution API
$API_KEY = "rnd_n6czdZkDhZIqk2h0IgO66mmofhMk"
$API_URL = "https://navigator-evolution-api.onrender.com"  # Substituir pela URL correta

Write-Host "🚀 Testando Evolution API..." -ForegroundColor Blue
Write-Host "API URL: $API_URL" -ForegroundColor Yellow
Write-Host "API Key: $API_KEY" -ForegroundColor Yellow
Write-Host ""

# Teste 1: Health endpoint
Write-Host "🔍 Teste 1: Health endpoint" -ForegroundColor Blue
try {
    $health = Invoke-RestMethod -Uri "$API_URL/manager/health" -Method GET
    Write-Host "✅ Health OK: $($health | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro Health: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Teste 2: Criar instância
Write-Host "🔍 Teste 2: Criar instância WhatsApp" -ForegroundColor Blue
try {
    $body = @{
        instanceName = "navigator-whatsapp"
        qrcode = $true
        integration = "WHATSAPP-BAILEYS"
        webhook = "https://hndll.app.n8n.cloud/webhook/evolution-webhook"
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
        "apikey" = $API_KEY
    }

    $instance = Invoke-RestMethod -Uri "$API_URL/instance/create" -Method POST -Headers $headers -Body $body
    Write-Host "✅ Instância criada: $($instance | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro criar instância: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Se o health funcionou, a URL está correta" -ForegroundColor White
Write-Host "2. Se deu erro 404, verificar URL no dashboard Render" -ForegroundColor White
Write-Host "3. Após criar instância, obter QR Code para conectar WhatsApp" -ForegroundColor White

