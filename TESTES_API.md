# 🧪 Testes de API - Endpoints das Melhorias

**Data:** 10 de outubro de 2025

---

## 📋 Pré-requisitos

1. ✅ Servidor rodando: `npm run dev`
2. ✅ Migrações executadas no Supabase
3. ✅ Ter pelo menos 1 usuário e 1 trilha no banco

---

## 🔍 Passo 1: Verificar se Servidor Está Rodando

```bash
curl http://localhost:3000/health
```

**Resultado esperado:** Status 200

---

## 🧪 Passo 2: Testar Endpoints (via PowerShell)

### Teste 1: Buscar Trilhas do Tenant Demo

```powershell
# Primeiro, vamos buscar o tenant_id demo
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/tenants" -Method Get
$tenantId = ($response | Where-Object subdomain -eq 'demo').id
Write-Host "Tenant ID: $tenantId"
```

---

### Teste 2: Buscar Usuários do Tenant

```powershell
$users = Invoke-RestMethod -Uri "http://localhost:3000/api/users?tenant=$tenantId" -Method Get
$userId = $users[0].id
Write-Host "User ID: $userId"
Write-Host "Nome: $($users[0].name)"
```

---

### Teste 3: Registrar um Sentimento

```powershell
$sentimentoData = @{
    colaborador_id = $userId
    sentimento = "positivo"
    intensidade = 0.75
    origem = "teste_api"
    mensagem_analisada = "Teste de sentimento positivo"
    fatores_detectados = @{
        palavras_chave = @("teste", "positivo")
        tom = "feliz"
        emojis = @()
    }
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/sentimentos" -Method Post -Body $sentimentoData -ContentType "application/json"

Write-Host "✅ Sentimento registrado!"
Write-Host $response | ConvertTo-Json
```

---

### Teste 4: Buscar Sentimento Atual do Colaborador

```powershell
$sentimentoAtual = Invoke-RestMethod -Uri "http://localhost:3000/api/sentimentos/colaborador/$userId/atual" -Method Get

Write-Host "😊 Sentimento Atual:"
Write-Host "  Sentimento: $($sentimentoAtual.sentimento_atual)"
Write-Host "  Atualizado em: $($sentimentoAtual.sentimento_atualizado_em)"
```

---

### Teste 5: Buscar Trilhas Recomendadas

```powershell
$recomendacoes = Invoke-RestMethod -Uri "http://localhost:3000/api/trilhas-recomendadas/$userId" -Method Get

Write-Host "`n🎯 Trilhas Recomendadas:"
Write-Host "  Sentimento atual: $($recomendacoes.sentimento_atual)"
Write-Host "  Total de trilhas: $($recomendacoes.total)"

foreach ($trilha in $recomendacoes.trilhas) {
    Write-Host "`n  📚 $($trilha.nome)"
    Write-Host "     Sentimento: $($trilha.sentimento_medio)"
    Write-Host "     Dificuldade: $($trilha.dificuldade_percebida)"
    Write-Host "     Taxa Conclusão: $($trilha.taxa_conclusao)%"
    Write-Host "     Compatibilidade: $($trilha.compatibilidade_sentimento)"
    Write-Host "     Motivo: $($trilha.motivo_recomendacao)"
}
```

---

### Teste 6: Criar uma Anotação

```powershell
$anotacaoData = @{
    colaborador_id = $userId
    tipo = "observacao_geral"
    titulo = "Teste de anotação via API"
    anotacao = "Esta é uma anotação de teste criada pela API"
    sentimento = "neutro"
    intensidade_sentimento = 0.5
    contexto = @{
        teste = $true
        momento = "primeiro_teste"
    }
    tags = @("teste", "api", "validacao")
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/anotacoes" -Method Post -Body $anotacaoData -ContentType "application/json"

Write-Host "✅ Anotação criada!"
Write-Host $response | ConvertTo-Json
```

---

### Teste 7: Listar Anotações

```powershell
$anotacoes = Invoke-RestMethod -Uri "http://localhost:3000/api/anotacoes/$tenantId" -Method Get

Write-Host "`n📝 Anotações do Tenant:"
Write-Host "  Total: $($anotacoes.Count)"

foreach ($anot in $anotacoes | Select-Object -First 3) {
    Write-Host "`n  📌 $($anot.titulo)"
    Write-Host "     Tipo: $($anot.tipo)"
    Write-Host "     Sentimento: $($anot.sentimento)"
    Write-Host "     Tags: $($anot.tags -join ', ')"
}
```

---

### Teste 8: Buscar Estatísticas de Sentimentos

```powershell
$stats = Invoke-RestMethod -Uri "http://localhost:3000/api/sentimentos/estatisticas/$tenantId" -Method Get

Write-Host "`n📊 Estatísticas de Sentimentos:"
Write-Host "  Sentimento médio: $($stats.sentimento_medio)/5.0"
Write-Host "  Período: $($stats.periodo_dias) dias"
Write-Host "`n  Distribuição:"

foreach ($dist in $stats.distribuicao) {
    Write-Host "    $($dist.sentimento): $($dist.total) registros"
}
```

---

### Teste 9: Buscar Padrões nas Anotações

```powershell
$padroes = Invoke-RestMethod -Uri "http://localhost:3000/api/anotacoes/padroes/$tenantId" -Method Get

Write-Host "`n🔍 Padrões Identificados:"
Write-Host "  Período: $($padroes.periodo_dias) dias"
Write-Host "  Mínimo de ocorrências: $($padroes.min_ocorrencias)"

foreach ($padrao in $padroes.padroes) {
    Write-Host "`n  🎯 Tag: $($padrao.tag)"
    Write-Host "     Tipo: $($padrao.tipo)"
    Write-Host "     Frequência: $($padrao.frequencia)"
    Write-Host "     Sentimento médio: $($padrao.sentimento_medio)"
}
```

---

### Teste 10: Buscar Trilhas Problemáticas

```powershell
$problematicas = Invoke-RestMethod -Uri "http://localhost:3000/api/trilhas-recomendadas/problematicas/$tenantId" -Method Get

Write-Host "`n⚠️ Trilhas que Precisam Atenção:"

foreach ($trilha in $problematicas) {
    Write-Host "`n  🚨 $($trilha.nome)"
    Write-Host "     Sentimento: $($trilha.sentimento_medio)/1.0"
    Write-Host "     Taxa conclusão: $($trilha.taxa_conclusao)%"
    Write-Host "     Nível: $($trilha.nivel_recomendacao)"
}
```

---

## ✅ Checklist de Validação

Execute os testes na ordem e marque:

- [ ] Servidor está rodando
- [ ] Teste 1: Buscar tenant ✅
- [ ] Teste 2: Buscar usuários ✅
- [ ] Teste 3: Registrar sentimento ✅
- [ ] Teste 4: Buscar sentimento atual ✅
- [ ] Teste 5: Buscar trilhas recomendadas ✅
- [ ] Teste 6: Criar anotação ✅
- [ ] Teste 7: Listar anotações ✅
- [ ] Teste 8: Estatísticas de sentimentos ✅
- [ ] Teste 9: Padrões identificados ✅
- [ ] Teste 10: Trilhas problemáticas ✅

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "Connection refused"
Servidor não está rodando:
```bash
npm run dev
```

### Erro: "relation does not exist"
Migrações não foram executadas:
- Execute as 4 migrações no Supabase SQL Editor

### Erro: "Usuário não encontrado"
Crie um usuário de teste no Supabase:
```sql
INSERT INTO users (name, email, phone, position, department, tenant_id)
VALUES ('Teste', 'teste@teste.com', '11999999999', 'Desenvolvedor', 'TI', 'tenant-uuid');
```

---

**Criado por:** Haendell Lopes + AI Assistant  
**Status:** ✅ Pronto para Testar




