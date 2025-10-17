# 📱 Obter QR Code - Evolution API
# Data: 17 de outubro de 2025
# Uso: Obter QR Code para conectar WhatsApp

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "https://navigator-evolution-api.onrender.com",
    
    [Parameter(Mandatory=$false)]
    [string]$InstanceName = "navigator-whatsapp"
)

Write-Host "📱 Obtendo QR Code para WhatsApp" -ForegroundColor Green
Write-Host ""

$headers = @{
    "apikey" = $ApiKey
    "Content-Type" = "application/json"
}

# Verificar se instância existe
Write-Host "1️⃣ Verificando instância '$InstanceName'..." -ForegroundColor Cyan
try {
    $statusResponse = Invoke-RestMethod -Uri "$BaseUrl/instance/connectionState/$InstanceName" -Method GET -Headers $headers -TimeoutSec 30
    Write-Host "✅ Instância encontrada: $($statusResponse.instance.state)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Instância não encontrada. Criando..." -ForegroundColor Yellow
    
    # Criar instância
    $createBody = @{
        instanceName = $InstanceName
        qrcode = $true
        integration = "WHATSAPP-BAILEYS"
        webhook = "https://hndll.app.n8n.cloud/webhook/evolution-webhook"
        webhookByEvents = $false
        events = @("MESSAGES_UPSERT", "CONNECTION_UPDATE")
    } | ConvertTo-Json

    try {
        $createResponse = Invoke-RestMethod -Uri "$BaseUrl/instance/create" -Method POST -Headers $headers -Body $createBody -TimeoutSec 30
        Write-Host "✅ Instância criada com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao criar instância: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Obter QR Code
Write-Host "`n2️⃣ Obtendo QR Code..." -ForegroundColor Cyan
try {
    $qrResponse = Invoke-RestMethod -Uri "$BaseUrl/instance/connect/$InstanceName" -Method GET -Headers $headers -TimeoutSec 30
    
    if ($qrResponse.base64) {
        Write-Host "✅ QR Code obtido com sucesso!" -ForegroundColor Green
        
        # Salvar como arquivo
        $base64String = $qrResponse.base64.Replace("data:image/png;base64,", "")
        $bytes = [Convert]::FromBase64String($base64String)
        $qrPath = "$PWD\qr-code-navigator-$(Get-Date -Format 'yyyyMMdd-HHmmss').png"
        [System.IO.File]::WriteAllBytes($qrPath, $bytes)
        
        Write-Host "`n📱 QR Code salvo em: $qrPath" -ForegroundColor Yellow
        Write-Host "🖼️ Abrindo QR Code..." -ForegroundColor Cyan
        
        # Tentar abrir a imagem
        try {
            Start-Process $qrPath
        } catch {
            Write-Host "⚠️ Não foi possível abrir automaticamente. Abra manualmente: $qrPath" -ForegroundColor Yellow
        }
        
        Write-Host "`n📲 INSTRUÇÕES:" -ForegroundColor Magenta
        Write-Host "1. Abra o WhatsApp no celular" -ForegroundColor White
        Write-Host "2. Android: Menu (⋮) → Dispositivos conectados → Conectar um dispositivo" -ForegroundColor White
        Write-Host "3. iPhone: Configurações → Dispositivos conectados → Conectar um dispositivo" -ForegroundColor White
        Write-Host "4. Escaneie o QR Code que abriu" -ForegroundColor White
        Write-Host "5. Aguarde a conexão (~10 segundos)" -ForegroundColor White
        
        Write-Host "`n🔍 Verificar conexão:" -ForegroundColor Cyan
        Write-Host "   .\Test-EvolutionAPI.ps1 -ApiKey '$ApiKey'" -ForegroundColor Gray
        
    } else {
        Write-Host "❌ QR Code não encontrado na resposta" -ForegroundColor Red
        Write-Host "Resposta: $($qrResponse | ConvertTo-Json -Depth 10)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Erro ao obter QR Code: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Próximos passos:" -ForegroundColor Green
Write-Host "1. Escanear QR Code no WhatsApp" -ForegroundColor White
Write-Host "2. Executar: .\test-evolution-api.ps1 -ApiKey '$ApiKey'" -ForegroundColor White
Write-Host "3. Configurar N8N com a API Key" -ForegroundColor White
