# 🧪 Script de Teste - Evolution API
# Data: 17 de outubro de 2025
# Uso: Testar Evolution API após deploy no Render

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "https://navigator-evolution-api.onrender.com",
    
    [Parameter(Mandatory=$false)]
    [string]$TestPhone = "5562999940476"
)

Write-Host "🚀 Testando Evolution API Navigator" -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "API Key: $($ApiKey.Substring(0, 10))..." -ForegroundColor Yellow
Write-Host ""

# Headers padrão
$headers = @{
    "apikey" = $ApiKey
    "Content-Type" = "application/json"
}

# Teste 1: Health Check
Write-Host "1️⃣ Testando Health Check..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "$BaseUrl/manager/health" -Method GET -TimeoutSec 30
    Write-Host "✅ Health Check OK: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Teste 2: Verificar Status da Instância
Write-Host "`n2️⃣ Verificando status da instância..." -ForegroundColor Cyan
try {
    $statusResponse = Invoke-RestMethod -Uri "$BaseUrl/instance/connectionState/navigator-whatsapp" -Method GET -Headers $headers -TimeoutSec 30
    $state = $statusResponse.instance.state
    if ($state -eq "open") {
        Write-Host "✅ WhatsApp conectado: $state" -ForegroundColor Green
    } else {
        Write-Host "⚠️ WhatsApp status: $state" -ForegroundColor Yellow
        Write-Host "   Execute: Get-QRCode -ApiKey '$ApiKey'" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro ao verificar status: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 3: Enviar Mensagem de Teste
Write-Host "`n3️⃣ Enviando mensagem de teste..." -ForegroundColor Cyan
try {
    $messageBody = @{
        number = $TestPhone
        text = "🧪 Teste Evolution API - Navigator funcionando! `n`n✅ Deploy realizado com sucesso`n✅ WhatsApp conectado`n✅ API respondendo`n`n🚀 Sistema pronto para uso!"
    } | ConvertTo-Json

    $sendResponse = Invoke-RestMethod -Uri "$BaseUrl/message/sendText/navigator-whatsapp" -Method POST -Headers $headers -Body $messageBody -TimeoutSec 30
    
    Write-Host "✅ Mensagem enviada com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $($sendResponse.key.id)" -ForegroundColor Gray
    Write-Host "   Aguarde a mensagem no WhatsApp..." -ForegroundColor Yellow
} catch {
    Write-Host "❌ Erro ao enviar mensagem: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 4: Verificar Instâncias
Write-Host "`n4️⃣ Verificando instâncias..." -ForegroundColor Cyan
try {
    $instancesResponse = Invoke-RestMethod -Uri "$BaseUrl/instance/fetchInstances" -Method GET -Headers $headers -TimeoutSec 30
    Write-Host "✅ Instâncias encontradas: $($instancesResponse.length)" -ForegroundColor Green
    
    foreach ($instance in $instancesResponse) {
        Write-Host "   - $($instance.instanceName): $($instance.state)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erro ao listar instâncias: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Testes concluídos!" -ForegroundColor Green
Write-Host "📱 Verifique se recebeu a mensagem no WhatsApp" -ForegroundColor Yellow
Write-Host "🔗 Dashboard: $BaseUrl/manager" -ForegroundColor Blue
