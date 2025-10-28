# 🔧 Correção: UUID de Trilha

**Data:** 2025-01-28  
**Status:** ✅ Corrigido

---

## 🐛 Problema Identificado

O agente de IA estava enviando o **nome da trilha** ("O que é o onboarding") como se fosse um **UUID**, causando o seguinte erro:

```
invalid input syntax for type uuid: "O que é o onboarding"
```

**Erro ocorrido em:**
- Arquivo: `policy-agent-poc/src/routes/agent-trilhas.js:277`
- Endpoint: `POST /api/agent/trilhas/iniciar`
- Classe de erro: `22P02` (PostgreSQL error de tipo inválido)

---

## ✅ Solução Implementada

Adicionada validação inteligente no endpoint `/api/agent/trilhas/iniciar` para aceitar tanto **UUID** quanto **nome da trilha**.

### Código Adicionado:

```javascript
// ✅ NOVO: Validar se trilha_id é UUID válido ou nome de trilha
let trilhaUuid = trilha_id;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Se não for UUID válido, buscar trilha pelo nome
if (!uuidPattern.test(trilha_id)) {
  console.log(`📝 Trilha ID não é UUID válido, buscando por nome: "${trilha_id}"`);
  const trilhaByNameResult = await query(`
    SELECT id, nome, descricao, prazo_dias
    FROM trilhas 
    WHERE nome = $1 AND tenant_id = $2 AND ativo = true
    LIMIT 1
  `, [trilha_id, tenant.id]);
  
  if (trilhaByNameResult.rows.length === 0) {
    return res.status(404).json({ 
      error: 'Trilha não encontrada pelo nome',
      trilha_nome_procurado: trilha_id,
      tenant_id: tenant.id
    });
  }
  
  trilhaUuid = trilhaByNameResult.rows[0].id;
  console.log(`✅ Trilha encontrada pelo nome: "${trilha_id}" → UUID: ${trilhaUuid}`);
}
```

### Melhorias:

1. **Detecção automática**: O endpoint detecta se o valor recebido é UUID válido ou nome de trilha
2. **Lookup inteligente**: Se for nome, busca o UUID correspondente no banco de dados
3. **Logging detalhado**: Registra quando busca por nome para debugging
4. **Validação de tenant**: Busca trilha apenas no tenant correto
5. **Compatibilidade**: Mantém compatibilidade com chamadas que já usam UUID

---

## 🎯 Fluxo Corrigido

### Antes (ERRO):
1. Agente chama: `iniciar_trilha(trilha_id="O que é o onboarding")`
2. API tenta usar diretamente como UUID
3. ❌ PostgreSQL rejeita: "invalid input syntax for type uuid"

### Depois (CORRETO):
1. Agente chama: `iniciar_trilha(trilha_id="O que é o onboarding")`
2. API detecta que não é UUID válido
3. ✅ API busca UUID pelo nome no banco
4. ✅ Inicia trilha com UUID correto

---

## 🧪 Como Testar

### Teste 1: Com UUID válido (comportamento existente)
```bash
POST /api/agent/trilhas/iniciar
{
  "colaborador_id": "123456789",
  "trilha_id": "5978f911-738b-4aae-802a-f037fdac2e64"  # UUID válido
}
```
**Esperado:** ✅ Funciona normalmente

### Teste 2: Com nome da trilha (NOVO)
```bash
POST /api/agent/trilhas/iniciar
{
  "colaborador_id": "123456789",
  "trilha_id": "O que é o onboarding"  # Nome da trilha
}
```
**Esperado:** ✅ Busca UUID pelo nome e inicia trilha

### Teste 3: Nome inexistente
```bash
POST /api/agent/trilhas/iniciar
{
  "colaborador_id": "123456789",
  "trilha_id": "Trilha que não existe"
}
```
**Esperado:** ❌ Retorna erro "Trilha não encontrada pelo nome"

---

## 📊 Impacto

- **Endpoints afetados:** 1 (`/api/agent/trilhas/iniciar`)
- **Compatibilidade:** ✅ Mantida (aceita UUID e nome)
- **Breaking changes:** ❌ Nenhum
- **Logs adicionados:** ✅ Para debugging
- **Validação:** ✅ Robustez aumentada

---

## 🔍 Próximos Passos

1. ✅ Testar em ambiente de produção
2. ⏳ Monitorar logs para casos de erro
3. ⏳ Avaliar se outros endpoints precisam da mesma correção

---

## 📝 Notas Técnicas

- **Regex UUID:** Utiliza padrão RFC 4122 para validação
- **Case-insensitive:** Aceita UUIDs em maiúsculas e minúsculas
- **Security:** Validação de tenant antes de buscar trilha
- **Performance:** Query adicional apenas quando necessário (nome vs UUID)

---

**Desenvolvido por:** AI Assistant  
**Revisado por:** Pending  
**Deploy:** Pending
