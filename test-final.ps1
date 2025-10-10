# Script de Teste Final do Flowly

Write-Host "`n🧪 TESTE FINAL - FLOWLY" -ForegroundColor Cyan
Write-Host "=" -NoNewline
1..50 | ForEach-Object { Write-Host "=" -NoNewline }
Write-Host ""

Start-Sleep -Seconds 5

# Teste 1: Health Check
Write-Host "`n1️⃣  Testando Health Check..." -ForegroundColor Yellow
try {
    $health = (Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing).Content | ConvertFrom-Json
    Write-Host "✅ Health OK" -ForegroundColor Green
    Write-Host "   PostgreSQL: $($health.postgres)" -ForegroundColor Cyan
    Write-Host "   Database Status: $($health.database.status)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Health Check falhou: $_" -ForegroundColor Red
}

# Teste 2: Análise de Sentimento
Write-Host "`n2️⃣  Testando Análise de Sentimento..." -ForegroundColor Yellow
try {
    $body = @{
        message = "Estou adorando o onboarding! Muito legal! 😊"
        userId = "test-user-123"
        context = "Teste final de funcionamento"
        tenantId = "test-tenant"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/analise-sentimento" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.success) {
        Write-Host "✅ Análise de Sentimento OK" -ForegroundColor Green
        Write-Host "   Sentimento: $($result.sentiment.sentimento)" -ForegroundColor Cyan
        Write-Host "   Intensidade: $($result.sentiment.intensidade)" -ForegroundColor Cyan
        Write-Host "   Tom: $($result.sentiment.fatores_detectados.tom)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Análise falhou (sem success)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Análise de Sentimento falhou: $_" -ForegroundColor Red
}

# Teste 3: Conexão com Banco
Write-Host "`n3️⃣  Testando Conexão com Banco..." -ForegroundColor Yellow
try {
    $dbTest = node test-db-connection.js 2>&1 | Select-String "CONEXÃO OK"
    if ($dbTest) {
        Write-Host "✅ Banco de Dados conectado" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Verifique a conexão do banco" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Teste de banco não executado" -ForegroundColor Yellow
}

Write-Host "`n" + ("=" * 50)
Write-Host "`n🎉 TESTES CONCLUÍDOS!`n" -ForegroundColor Cyan

