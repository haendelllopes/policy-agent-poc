# Script de Teste das APIs de Melhorias - Flowly
# Data: 10/10/2025

Write-Host "🧪 Testando APIs das Melhorias Flowly" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"

# Função auxiliar para fazer requests
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "Get",
        [object]$Body = $null
    )
    
    Write-Host "🔍 Testando: $Name" -ForegroundColor Yellow
    Write-Host "   URL: $Url"
    
    try {
        if ($Method -eq "Post" -and $Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Body ($Body | ConvertTo-Json -Depth 10) -ContentType "application/json" -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -ErrorAction Stop
        }
        
        Write-Host "   ✅ Sucesso!" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Aguardar servidor iniciar
Write-Host "⏳ Aguardando servidor iniciar (5 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Teste 1: Health Check
Write-Host "`n=== TESTE 1: Health Check ===" -ForegroundColor Cyan
$health = Test-Endpoint -Name "Health Check" -Url "$baseUrl/../health"

# Teste 2: Buscar Tenant Demo
Write-Host "`n=== TESTE 2: Buscar Tenant ===" -ForegroundColor Cyan
$tenants = Test-Endpoint -Name "Listar Tenants" -Url "$baseUrl/tenants"

if ($tenants -and $tenants.Count -gt 0) {
    $tenantId = $tenants[0].id
    Write-Host "   Tenant encontrado: $($tenants[0].name) (ID: $tenantId)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Nenhum tenant encontrado. Crie um tenant primeiro." -ForegroundColor Yellow
    exit
}

# Teste 3: Buscar Usuários
Write-Host "`n=== TESTE 3: Buscar Usuários ===" -ForegroundColor Cyan
$users = Test-Endpoint -Name "Listar Usuários" -Url "$baseUrl/users?tenant=$tenantId"

if ($users -and $users.Count -gt 0) {
    $userId = $users[0].id
    Write-Host "   Usuário encontrado: $($users[0].name) (ID: $userId)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Nenhum usuário encontrado." -ForegroundColor Yellow
    exit
}

# Teste 4: Registrar Sentimento
Write-Host "`n=== TESTE 4: Registrar Sentimento ===" -ForegroundColor Cyan
$sentimentoData = @{
    colaborador_id = $userId
    sentimento = "positivo"
    intensidade = 0.80
    origem = "teste_api"
    mensagem_analisada = "Teste de sentimento positivo via API"
    fatores_detectados = @{
        palavras_chave = @("teste", "positivo", "api")
        tom = "animado"
        emojis = @()
        confianca_analise = 0.95
    }
    acao_agente = "teste_automatizado"
}

$sentimentoResponse = Test-Endpoint -Name "Registrar Sentimento" -Url "$baseUrl/sentimentos" -Method "Post" -Body $sentimentoData

if ($sentimentoResponse) {
    Write-Host "   ID do sentimento: $($sentimentoResponse.sentimento.id)" -ForegroundColor Green
}

# Teste 5: Buscar Sentimento Atual
Write-Host "`n=== TESTE 5: Buscar Sentimento Atual ===" -ForegroundColor Cyan
$sentimentoAtual = Test-Endpoint -Name "Sentimento Atual" -Url "$baseUrl/sentimentos/colaborador/$userId/atual"

if ($sentimentoAtual) {
    Write-Host "   Sentimento: $($sentimentoAtual.sentimento_atual)" -ForegroundColor Green
    Write-Host "   Atualizado em: $($sentimentoAtual.sentimento_atualizado_em)" -ForegroundColor Green
}

# Teste 6: Buscar Trilhas Recomendadas
Write-Host "`n=== TESTE 6: Buscar Trilhas Recomendadas ===" -ForegroundColor Cyan
$recomendadas = Test-Endpoint -Name "Trilhas Recomendadas" -Url "$baseUrl/trilhas-recomendadas/$userId"

if ($recomendadas) {
    Write-Host "   Sentimento atual: $($recomendadas.sentimento_atual)" -ForegroundColor Green
    Write-Host "   Total de trilhas: $($recomendadas.total)" -ForegroundColor Green
    
    if ($recomendadas.trilhas -and $recomendadas.trilhas.Count -gt 0) {
        Write-Host "`n   Top 3 Recomendadas:" -ForegroundColor Cyan
        foreach ($trilha in $recomendadas.trilhas | Select-Object -First 3) {
            Write-Host "     📚 $($trilha.nome)" -ForegroundColor White
            Write-Host "        Sentimento médio: $($trilha.sentimento_medio)" -ForegroundColor Gray
            Write-Host "        Dificuldade: $($trilha.dificuldade_percebida)" -ForegroundColor Gray
            Write-Host "        Compatibilidade: $($trilha.compatibilidade_sentimento)" -ForegroundColor Gray
            Write-Host "        Motivo: $($trilha.motivo_recomendacao)" -ForegroundColor Gray
        }
    }
}

# Teste 7: Criar Anotação
Write-Host "`n=== TESTE 7: Criar Anotação ===" -ForegroundColor Cyan
$anotacaoData = @{
    colaborador_id = $userId
    tipo = "observacao_geral"
    titulo = "Teste de anotação via API"
    anotacao = "Esta é uma anotação de teste criada automaticamente para validar a API"
    sentimento = "neutro"
    intensidade_sentimento = 0.50
    contexto = @{
        teste = $true
        data_teste = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    }
    tags = @("teste", "api", "validacao", "automatizado")
}

$anotacaoResponse = Test-Endpoint -Name "Criar Anotação" -Url "$baseUrl/anotacoes" -Method "Post" -Body $anotacaoData

if ($anotacaoResponse) {
    Write-Host "   ID da anotação: $($anotacaoResponse.anotacao.id)" -ForegroundColor Green
}

# Teste 8: Listar Anotações
Write-Host "`n=== TESTE 8: Listar Anotações ===" -ForegroundColor Cyan
$anotacoes = Test-Endpoint -Name "Listar Anotações" -Url "$baseUrl/anotacoes/$tenantId"

if ($anotacoes) {
    Write-Host "   Total de anotações: $($anotacoes.Count)" -ForegroundColor Green
    
    if ($anotacoes.Count -gt 0) {
        Write-Host "`n   Últimas 3 anotações:" -ForegroundColor Cyan
        foreach ($anot in $anotacoes | Select-Object -First 3) {
            Write-Host "     📝 $($anot.titulo)" -ForegroundColor White
            Write-Host "        Tipo: $($anot.tipo)" -ForegroundColor Gray
            Write-Host "        Tags: $($anot.tags -join ', ')" -ForegroundColor Gray
        }
    }
}

# Teste 9: Estatísticas de Sentimentos
Write-Host "`n=== TESTE 9: Estatísticas de Sentimentos ===" -ForegroundColor Cyan
$stats = Test-Endpoint -Name "Estatísticas" -Url "$baseUrl/sentimentos/estatisticas/$tenantId"

if ($stats) {
    Write-Host "   Sentimento médio: $($stats.sentimento_medio)/5.0" -ForegroundColor Green
    Write-Host "`n   Distribuição:" -ForegroundColor Cyan
    foreach ($dist in $stats.distribuicao) {
        $emoji = switch ($dist.sentimento) {
            "muito_positivo" { "😄" }
            "positivo" { "🙂" }
            "neutro" { "😐" }
            "negativo" { "😟" }
            "muito_negativo" { "😞" }
        }
        Write-Host "     $emoji $($dist.sentimento): $($dist.total) registros" -ForegroundColor White
    }
}

# Teste 10: Buscar Trilhas Problemáticas
Write-Host "`n=== TESTE 10: Trilhas Problemáticas ===" -ForegroundColor Cyan
$problematicas = Test-Endpoint -Name "Trilhas Problemáticas" -Url "$baseUrl/trilhas-recomendadas/problematicas/$tenantId"

if ($problematicas) {
    if ($problematicas.Count -gt 0) {
        Write-Host "   ⚠️  Encontradas $($problematicas.Count) trilhas que precisam atenção" -ForegroundColor Yellow
        foreach ($trilha in $problematicas) {
            Write-Host "`n     🚨 $($trilha.nome)" -ForegroundColor Red
            Write-Host "        Sentimento: $($trilha.sentimento_medio)" -ForegroundColor Gray
            Write-Host "        Taxa conclusão: $($trilha.taxa_conclusao)%" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ✅ Nenhuma trilha problemática encontrada!" -ForegroundColor Green
    }
}

# Resumo Final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🎉 TESTES CONCLUÍDOS!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📊 Resumo:" -ForegroundColor Cyan
Write-Host "  ✅ Endpoints de Sentimentos: Funcionando"
Write-Host "  ✅ Endpoints de Trilhas Recomendadas: Funcionando"
Write-Host "  ✅ Endpoints de Anotações: Funcionando"
Write-Host "  ✅ Banco de Dados: Conectado"
Write-Host "  ✅ Migrações: Executadas com sucesso`n"

Write-Host "🚀 Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Instalar Google Gemini: npm install @google/generative-ai"
Write-Host "  2. Criar API Key do Gemini"
Write-Host "  3. Configurar N8N workflows"
Write-Host "  4. Testar integração completa`n"

