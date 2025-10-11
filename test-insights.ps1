# Script de Teste - Dashboard de Insights
# Data: 11/10/2025

Write-Host "`n🧪 Testando Dashboard de Insights" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$apiUrl = "$baseUrl/api"
$tenantId = "5978f911-738b-4aae-802a-f037fdac2e64"

# Função auxiliar
function Test-API {
    param([string]$Name, [string]$Url)
    
    Write-Host "🔍 $Name" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri $Url -ErrorAction Stop
        Write-Host "   ✅ OK" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "   ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Teste 1: Servidor rodando
Write-Host "`n=== TESTE 1: Servidor ===" -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "$baseUrl/dashboard.html" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Servidor rodando (HTTP $($health.StatusCode))" -ForegroundColor Green
    
    # Verificar se tem o menu Insights
    $content = $health.Content
    if ($content -like "*Insights*") {
        Write-Host "✅ Menu Insights encontrado no HTML" -ForegroundColor Green
    } else {
        Write-Host "❌ Menu Insights NÃO encontrado no HTML" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Servidor não está rodando!" -ForegroundColor Red
    Write-Host "`nExecute: npm start" -ForegroundColor Yellow
    exit
}

# Teste 2: API de Anotações
Write-Host "`n=== TESTE 2: API de Anotações ===" -ForegroundColor Cyan
$anotacoes = Test-API -Name "Listar Anotações" -Url "$apiUrl/agente/anotacoes/$tenantId?days=30"

if ($anotacoes) {
    Write-Host "   📊 Total: $($anotacoes.total)" -ForegroundColor White
    Write-Host "   📝 Anotações: $($anotacoes.anotacoes.Count)" -ForegroundColor White
}

# Teste 3: API de Padrões
Write-Host "`n=== TESTE 3: API de Padrões ===" -ForegroundColor Cyan
$padroes = Test-API -Name "Padrões Identificados" -Url "$apiUrl/agente/anotacoes/padroes/$tenantId?days=30"

if ($padroes) {
    Write-Host "   🔍 Padrões por tipo: $($padroes.padroes_por_tipo.Count)" -ForegroundColor White
    Write-Host "   🏷️  Tags frequentes: $($padroes.tags_frequentes.Count)" -ForegroundColor White
}

# Teste 4: API de Estatísticas (NOVA)
Write-Host "`n=== TESTE 4: API de Estatísticas (NOVA) ===" -ForegroundColor Cyan
$stats = Test-API -Name "Estatísticas de Sentimentos" -Url "$apiUrl/analise-sentimento/estatisticas/$tenantId"

if ($stats) {
    Write-Host "   📊 Total análises: $($stats.total_analises)" -ForegroundColor White
    Write-Host "   😊 Sentimento médio: $($stats.sentimento_medio_numerico)/5" -ForegroundColor White
    Write-Host "   📈 Período: $($stats.periodo_dias) dias" -ForegroundColor White
}

# Resumo
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📊 RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($health -and $anotacoes -and $padroes -and $stats) {
    Write-Host "`n✅ TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "`n🌐 Acesse o Dashboard:" -ForegroundColor Cyan
    Write-Host "   $baseUrl/dashboard.html" -ForegroundColor Yellow
    Write-Host "`n💡 Clique em 'Insights' no menu lateral" -ForegroundColor Cyan
    Write-Host "`n🔄 Se não aparecer, pressione Ctrl+Shift+R" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️  ALGUNS TESTES FALHARAM" -ForegroundColor Yellow
    Write-Host "`nVerifique se:" -ForegroundColor White
    Write-Host "  1. Servidor está rodando (npm start)" -ForegroundColor White
    Write-Host "  2. Porta 3000 está disponível" -ForegroundColor White
    Write-Host "  3. Banco de dados está conectado" -ForegroundColor White
}

Write-Host "`n"

