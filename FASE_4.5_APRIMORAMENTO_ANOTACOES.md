# 📝 FASE 4.5: Aprimoramento de Anotações com GPT-4o

**Tempo estimado:** 6-8 horas  
**Status:** 🚧 Em andamento  
**Versão do Workflow:** 4.5.0

---

## 🎯 OBJETIVO

Transformar o sistema de anotações de **básico (regex)** para **inteligente (GPT-4o)**, adicionando:
1. **Categorização semântica** (não apenas palavras-chave)
2. **Detecção de urgência** automática
3. **Análise de padrões** diária com GPT-4o
4. **Anotações proativas** auto-geradas

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### **ATUAL (Fase 3 - Regex):**
```javascript
Mensagem: "A trilha é longa mas está ok"

Detectar feedback (regex):
  palavras = ['trilha', 'longa']
  tem_feedback = true

Salvar Anotação:
  tipo: "observacao_geral"
  titulo: "Feedback: A trilha é longa mas está ok"
  tags: ["feedback", "automatico"]
  ❌ Sem urgência
  ❌ Sem categoria específica
  ❌ Tags genéricas
```

### **NOVO (Fase 4.5 - GPT-4o):**
```javascript
Mensagem: "A trilha é longa mas está ok"

Analisar Feedback com GPT-4o:
  tipo: "sugestao_colaborador"
  urgencia: "baixa"
  categoria: "conteudo"
  subcategoria: "duracao_trilha"
  tags: ["trilha-longa", "feedback-construtivo", "nao-bloqueante", "sugestao-melhoria"]
  sentimento_contexto: "positivo_com_ressalva"
  acao_sugerida: "Revisar duração da trilha sem urgência"
  
Salvar Anotação (enriquecida):
  tipo: "sugestao_colaborador"
  titulo: "Sugestão: Trilha longa mas aceitável"
  anotacao: "Colaborador considera trilha longa, mas não vê como problema bloqueante"
  tags: ["trilha-longa", "feedback-construtivo", "nao-bloqueante", "sugestao-melhoria"]
  urgencia: "baixa"
  categoria: "conteudo"
  ✅ Ação sugerida: "Revisar duração sem urgência"
```

---

## 🔧 IMPLEMENTAÇÃO

---

## **4.5.1. Categorização Inteligente de Feedback** (3-4h)

### **Objetivo:**
Substituir regex por análise semântica com GPT-4o-mini para categorizar feedback de forma inteligente.

### **Arquitetura:**

```
Merge (mensagem do usuário)
    ↓
Detectar feedback (Code Node - MANTER para pré-filtro)
    ↓
Tem feedback? (IF)
    ├─ FALSE → Code responder (sem mudanças)
    ↓
    TRUE → **NOVO: Analisar Feedback com GPT-4o** (Code Node)
    ↓
💾 Salvar Anotação (HTTP Request - ATUALIZADO)
```

### **Passo 1: Criar Code Node "Analisar Feedback com GPT-4o"**

**Localização no N8N:**
- Adicionar APÓS: `Tem feedback?` (TRUE branch)
- Adicionar ANTES: `💾 Salvar Anotação`

**Código do Node:**

```javascript
// Analisar Feedback com GPT-4o
const axios = require('axios');

try {
  // Dados de entrada
  const mensagem = $('Merge').first().json.messageText || '';
  const sentimento = $('Process Sentiment Data').first().json.sentimento || 'neutro';
  const intensidade = $('Process Sentiment Data').first().json.intensidade || 0.5;
  const from = $('Merge').first().json.from || '';
  const tenantId = $('Merge').first().json.tenantId || '';
  
  // Credenciais OpenAI
  const openaiApiKey = 'sk-proj-...'; // TROCAR pela sua chave
  
  // Prompt para GPT-4o-mini
  const prompt = `Você é um especialista em análise de feedback corporativo em português brasileiro.

Analise a seguinte mensagem de um colaborador em onboarding e extraia informações estruturadas:

MENSAGEM: "${mensagem}"

CONTEXTO:
- Sentimento detectado: ${sentimento}
- Intensidade: ${(intensidade * 100).toFixed(0)}%

Retorne APENAS um JSON válido com esta estrutura:

{
  "tipo": "sentimento_trilha|sentimento_empresa|dificuldade_conteudo|sugestao_colaborador|padrao_identificado|observacao_geral|problema_tecnico",
  "urgencia": "critica|alta|media|baixa",
  "categoria": "conteudo|interface|fluxo|performance|engajamento|acessibilidade|tecnico|rh|outros",
  "subcategoria": "string (específica, ex: 'duracao_trilha', 'acesso_sistema', 'entendimento_conceito')",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "sentimento_contexto": "muito_positivo|positivo|positivo_com_ressalva|neutro|negativo_com_ressalva|negativo|muito_negativo",
  "acao_sugerida": "string (ação clara e específica)",
  "impacto_estimado": "muito_alto|alto|medio|baixo",
  "titulo_sugerido": "string (título descritivo em 50 chars)"
}

DIRETRIZES:
1. **Tipo:** Classifique conforme a intenção principal
2. **Urgência:** 
   - CRÍTICA: Impede trabalho (ex: "não consigo acessar há 3 dias")
   - ALTA: Problema sério mas contornável
   - MÉDIA: Dificuldade ou sugestão importante
   - BAIXA: Observação ou melhoria não urgente
3. **Categoria:** Área afetada
4. **Subcategoria:** Seja específico (ex: "duracao_trilha" em vez de genérico "trilha")
5. **Tags:** 5 tags MUITO específicas (ex: "trilha-compliance-longa" em vez de "trilha")
6. **Sentimento contexto:** Nuances (ex: "positivo_com_ressalva" para "está bom mas...")
7. **Ação sugerida:** Clara e acionável
8. **Impacto:** Quantos colaboradores afeta (use intuição)

RETORNE APENAS O JSON, SEM EXPLICAÇÕES.`;

  // Chamar OpenAI
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um analisador de feedback especializado. Retorne APENAS JSON válido, sem markdown ou explicações.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    },
    {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Extrair resposta
  let analise;
  try {
    const content = response.data.choices[0].message.content.trim();
    // Remover markdown se presente
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    analise = JSON.parse(jsonStr);
  } catch (parseError) {
    console.error('Erro ao fazer parse do JSON:', parseError);
    // Fallback: análise básica
    analise = {
      tipo: 'observacao_geral',
      urgencia: 'baixa',
      categoria: 'outros',
      subcategoria: 'indefinido',
      tags: ['feedback', 'automatico', 'erro-parse'],
      sentimento_contexto: sentimento,
      acao_sugerida: 'Revisar manualmente',
      impacto_estimado: 'baixo',
      titulo_sugerido: mensagem.substring(0, 50)
    };
  }
  
  // Retornar análise enriquecida
  return [{
    json: {
      // Dados originais
      mensagem: mensagem,
      from: from,
      tenantId: tenantId,
      sentimento: sentimento,
      intensidade: intensidade,
      
      // Análise GPT-4o
      ...analise,
      
      // Metadata
      analisado_em: new Date().toISOString(),
      modelo_usado: 'gpt-4o-mini',
      versao_analise: '1.0'
    }
  }];
  
} catch (error) {
  console.error('Erro no Analisar Feedback com GPT-4o:', error);
  
  // Fallback em caso de erro
  return [{
    json: {
      mensagem: $('Merge').first().json.messageText || '',
      from: $('Merge').first().json.from || '',
      tenantId: $('Merge').first().json.tenantId || '',
      tipo: 'observacao_geral',
      urgencia: 'baixa',
      categoria: 'outros',
      subcategoria: 'erro_analise',
      tags: ['feedback', 'automatico', 'erro'],
      sentimento_contexto: 'neutro',
      acao_sugerida: 'Revisar manualmente',
      impacto_estimado: 'baixo',
      titulo_sugerido: 'Erro na análise automática',
      erro: error.message
    }
  }];
}
```

### **Passo 2: Atualizar "💾 Salvar Anotação"**

**Configuração HTTP Request:**

**URL:** `https://navigator-gules.vercel.app/api/agente/anotacoes`  
**Method:** POST  
**Body (JSON):**

```json
{
  "tipo": "{{ $json.tipo }}",
  "titulo": "{{ $json.titulo_sugerido }}",
  "anotacao": "{{ $json.mensagem }}",
  "tags": {{ JSON.stringify($json.tags) }},
  "urgencia": "{{ $json.urgencia }}",
  "categoria": "{{ $json.categoria }}",
  "subcategoria": "{{ $json.subcategoria }}",
  "sentimento_contexto": "{{ $json.sentimento_contexto }}",
  "acao_sugerida": "{{ $json.acao_sugerida }}",
  "impacto_estimado": "{{ $json.impacto_estimado }}",
  "metadata": {
    "from": "{{ $json.from }}",
    "sentimento": "{{ $json.sentimento }}",
    "intensidade": {{ $json.intensidade }},
    "modelo_usado": "{{ $json.modelo_usado }}",
    "versao_analise": "{{ $json.versao_analise }}"
  }
}
```

### **Passo 3: Atualizar Backend (se necessário)**

**Arquivo:** `src/routes/agente-anotacoes.js`

Se o backend não aceitar os novos campos, adicionar:

```javascript
// POST /api/agente/anotacoes
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      tipo, 
      titulo, 
      anotacao, 
      tags = [], 
      sentimento,
      colaborador_id,
      trilha_id,
      tenant_id,
      urgencia = 'baixa',           // NOVO
      categoria = 'outros',          // NOVO
      subcategoria = null,           // NOVO
      sentimento_contexto = null,    // NOVO
      acao_sugerida = null,          // NOVO
      impacto_estimado = 'baixo',    // NOVO
      metadata = {}                  // NOVO
    } = req.body;
    
    // Validações...
    
    const result = await query(
      `INSERT INTO agente_anotacoes (
        tenant_id, colaborador_id, trilha_id, tipo, titulo, anotacao, 
        tags, sentimento, urgencia, contexto
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        tenantId, colaborador_id, trilha_id, tipo, titulo, anotacao, 
        tags, sentimento || sentimento_contexto, urgencia,
        JSON.stringify({
          categoria,
          subcategoria,
          acao_sugerida,
          impacto_estimado,
          ...metadata
        })
      ]
    );
    
    res.status(201).json({ success: true, anotacao: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar anotação:', error);
    res.status(500).json({ error: 'Erro ao criar anotação' });
  }
});
```

### **Testes para 4.5.1:**

**Teste 1: Feedback Construtivo**
```
Mensagem: "A trilha é longa mas está ok"

Esperado:
✅ tipo: "sugestao_colaborador"
✅ urgencia: "baixa"
✅ categoria: "conteudo"
✅ subcategoria: "duracao_trilha"
✅ tags: ["trilha-longa", "feedback-construtivo", "nao-bloqueante", ...]
✅ sentimento_contexto: "positivo_com_ressalva"
```

**Teste 2: Problema Urgente**
```
Mensagem: "Não consigo acessar o sistema há 3 dias!"

Esperado:
✅ tipo: "problema_tecnico"
✅ urgencia: "critica"
✅ categoria: "tecnico"
✅ subcategoria: "acesso_sistema"
✅ tags: ["acesso-bloqueado", "sistema-indisponivel", "urgente", ...]
✅ acao_sugerida: "Escalar para TI imediatamente"
```

**Teste 3: Elogio**
```
Mensagem: "Adorei a trilha de boas-vindas! Muito dinâmica 🎉"

Esperado:
✅ tipo: "sentimento_trilha"
✅ urgencia: "baixa"
✅ categoria: "conteudo"
✅ subcategoria: "experiencia_positiva"
✅ tags: ["elogio", "trilha-dinamica", "engajamento-alto", ...]
✅ sentimento_contexto: "muito_positivo"
```

---

## **4.5.2. Detecção de Urgência Automática** (2-3h)

### **Objetivo:**
Criar fluxo que detecta urgência e toma ações automáticas (notificar admin, escalar para TI/RH).

### **Arquitetura:**

```
💾 Salvar Anotação
    ↓
🚨 Analisar Urgência (IF Node)
    ├─ urgencia == "critica" → Notificar Admin + Criar Ticket
    ├─ urgencia == "alta" → Notificar Admin
    ├─ urgencia == "media" → Salvar em fila de revisão
    └─ urgencia == "baixa" → Code responder (continua normal)
```

### **Passo 1: Adicionar IF Node "🚨 Analisar Urgência"**

**Localização:** APÓS `💾 Salvar Anotação`

**Condições:**

```javascript
// Condição 1: Urgência CRÍTICA
{{ $('💾 Salvar Anotação').item.json.urgencia }} == "critica"

// Condição 2: Urgência ALTA
{{ $('💾 Salvar Anotação').item.json.urgencia }} == "alta"

// Condição 3: Urgência MÉDIA
{{ $('💾 Salvar Anotação').item.json.urgencia }} == "media"

// Else: Urgência BAIXA (continua fluxo normal)
```

### **Passo 2: Branch 1 - Urgência CRÍTICA**

**2.1. Notificar Admin (HTTP Request)**

**URL:** `{{ $('BACKEND_URL').item.json.url }}/api/webhooks/alerta-urgencia-critica`  
**Method:** POST  
**Body:**

```json
{
  "anotacao_id": "{{ $('💾 Salvar Anotação').item.json.id }}",
  "tipo": "{{ $json.tipo }}",
  "urgencia": "critica",
  "categoria": "{{ $json.categoria }}",
  "mensagem": "{{ $json.mensagem }}",
  "colaborador_id": "{{ $json.from }}",
  "acao_sugerida": "{{ $json.acao_sugerida }}",
  "timestamp": "{{ new Date().toISOString() }}"
}
```

**2.2. Criar Ticket (Conditional)**

Se categoria == "tecnico" → Criar ticket TI  
Se categoria == "rh" → Criar ticket RH  

```javascript
// Code Node: Criar Ticket
const categoria = $json.categoria;
const titulo = $json.titulo_sugerido;
const descricao = $json.mensagem;
const urgencia = "CRÍTICA";

let ticketData = {
  titulo: `[URGENTE] ${titulo}`,
  descricao: descricao,
  urgencia: urgencia,
  categoria: categoria,
  colaborador_id: $json.from,
  criado_por: 'sistema_automatico',
  prioridade: 'alta'
};

return [{ json: ticketData }];
```

**HTTP Request: POST Ticket**

```json
POST {{ $('BACKEND_URL').item.json.url }}/api/tickets
{
  "titulo": "{{ $json.titulo }}",
  "descricao": "{{ $json.descricao }}",
  "urgencia": "{{ $json.urgencia }}",
  "categoria": "{{ $json.categoria }}",
  "colaborador_id": "{{ $json.colaborador_id }}",
  "prioridade": "{{ $json.prioridade }}"
}
```

### **Passo 3: Backend - Endpoint de Alerta**

**Arquivo:** `src/routes/webhooks.js`

```javascript
// POST /api/webhooks/alerta-urgencia-critica
router.post('/alerta-urgencia-critica', async (req, res) => {
  try {
    const {
      anotacao_id,
      tipo,
      urgencia,
      categoria,
      mensagem,
      colaborador_id,
      acao_sugerida,
      timestamp
    } = req.body;
    
    console.log('🚨 ALERTA URGÊNCIA CRÍTICA:', {
      anotacao_id,
      categoria,
      mensagem
    });
    
    // 1. Buscar admins para notificar
    const admins = await query(
      `SELECT email FROM users WHERE role = 'admin' AND active = true`
    );
    
    // 2. Enviar emails (se configurado)
    // ... implementar envio de email
    
    // 3. Criar notificação no sistema
    await query(
      `INSERT INTO notifications (user_id, type, title, message, priority, metadata)
       SELECT id, 'urgencia_critica', $1, $2, 'alta', $3
       FROM users WHERE role = 'admin' AND active = true`,
      [
        `Urgência Crítica: ${tipo}`,
        mensagem,
        JSON.stringify({ anotacao_id, categoria, acao_sugerida })
      ]
    );
    
    res.json({ 
      success: true, 
      notified: admins.rows.length,
      message: 'Admins notificados com sucesso'
    });
  } catch (error) {
    console.error('Erro ao processar alerta de urgência:', error);
    res.status(500).json({ error: 'Erro ao processar alerta' });
  }
});
```

### **Teste para 4.5.2:**

```
Mensagem: "Sistema travado há 2 dias, não consigo trabalhar!"

Fluxo esperado:
1. ✅ Analisar Feedback: urgencia = "critica", categoria = "tecnico"
2. ✅ Salvar Anotação: salvo no banco
3. ✅ Analisar Urgência: detecta "critica"
4. ✅ Notificar Admin: POST /alerta-urgencia-critica
5. ✅ Criar Ticket: POST /api/tickets (TI)
6. ✅ Admins recebem notificação
7. ✅ Ticket criado com prioridade ALTA
```

---

## **4.5.3. Análise de Padrões com GPT-4o** (3-4h)

### **Objetivo:**
Workflow agendado que analisa anotações diariamente e gera melhorias automaticamente.

### **Arquitetura:**

```
🕒 Cron Trigger (diário 9h)
    ↓
📊 Buscar Anotações (últimos 7 dias)
    ↓
🧠 GPT-4 Analisa Padrões
    ↓
💡 Gerar Melhorias (onboarding_improvements)
    ↓
📧 Notificar Admins
```

### **Passo 1: Criar Novo Workflow "Análise Diária de Padrões"**

**1.1. Cron Trigger**

- **Tipo:** Schedule Trigger
- **Interval:** Cron
- **Cron Expression:** `0 9 * * *` (todo dia às 9h)

**1.2. HTTP Request: Buscar Anotações**

**URL:** `{{ $('BACKEND_URL').item.json.url }}/api/agente/anotacoes/ultimos-dias?dias=7&limit=100`  
**Method:** GET

**1.3. Code Node: Preparar Dados para GPT-4**

```javascript
// Agrupar anotações por padrões
const anotacoes = $input.all().map(item => item.json);

// Agrupar por categoria
const porCategoria = {};
const porTipo = {};
const porUrgencia = {};

anotacoes.forEach(anotacao => {
  // Por categoria
  const cat = anotacao.categoria || 'outros';
  if (!porCategoria[cat]) porCategoria[cat] = [];
  porCategoria[cat].push(anotacao);
  
  // Por tipo
  const tipo = anotacao.tipo;
  if (!porTipo[tipo]) porTipo[tipo] = [];
  porTipo[tipo].push(anotacao);
  
  // Por urgência
  const urg = anotacao.urgencia || 'baixa';
  if (!porUrgencia[urg]) porUrgencia[urg] = [];
  porUrgencia[urg].push(anotacao);
});

// Criar resumo para GPT-4
const resumo = {
  total_anotacoes: anotacoes.length,
  periodo: '7 dias',
  por_categoria: Object.entries(porCategoria).map(([cat, items]) => ({
    categoria: cat,
    quantidade: items.length,
    exemplos: items.slice(0, 3).map(i => i.anotacao)
  })),
  por_tipo: Object.entries(porTipo).map(([tipo, items]) => ({
    tipo: tipo,
    quantidade: items.length
  })),
  por_urgencia: Object.entries(porUrgencia).map(([urg, items]) => ({
    urgencia: urg,
    quantidade: items.length
  })),
  anotacoes_completas: anotacoes.slice(0, 20) // Limitar para não exceder tokens
};

return [{ json: resumo }];
```

**1.4. HTTP Request: GPT-4 Análise de Padrões**

**URL:** `https://api.openai.com/v1/chat/completions`  
**Method:** POST  
**Headers:**
```json
{
  "Authorization": "Bearer sk-proj-...",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "Você é um especialista em análise de padrões e geração de melhorias para processos de onboarding corporativo. Analise os dados fornecidos e identifique padrões, problemas recorrentes e oportunidades de melhoria."
    },
    {
      "role": "user",
      "content": "Analise as seguintes anotações dos últimos 7 dias e gere melhorias:\n\n{{ JSON.stringify($json, null, 2) }}\n\nRetorne um JSON com:\n{\n  \"padroes_identificados\": [\n    {\n      \"descricao\": \"string\",\n      \"frequencia\": number,\n      \"categoria\": \"string\",\n      \"impacto\": \"muito_alto|alto|medio|baixo\"\n    }\n  ],\n  \"melhorias_sugeridas\": [\n    {\n      \"titulo\": \"string\",\n      \"descricao\": \"string\",\n      \"categoria\": \"conteudo|interface|fluxo|performance|engajamento|acessibilidade|outros\",\n      \"prioridade\": \"alta|media|baixa\",\n      \"impacto_estimado\": \"muito_alto|alto|medio|baixo\",\n      \"esforco_estimado\": \"alto|medio|baixo\",\n      \"evidencias\": [\"string\"],\n      \"metricas_sucesso\": [\"string\"]\n    }\n  ]\n}"
    }
  ],
  "temperature": 0.5,
  "max_tokens": 2000
}
```

**1.5. Code Node: Processar Resposta GPT-4**

```javascript
const response = $input.first().json;
const content = response.choices[0].message.content;

let analise;
try {
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  analise = JSON.parse(jsonStr);
} catch (e) {
  console.error('Erro ao parsear resposta GPT-4:', e);
  analise = { padroes_identificados: [], melhorias_sugeridas: [] };
}

return analise.melhorias_sugeridas.map(melhoria => ({
  json: {
    ...melhoria,
    gerado_por: 'analise_automatica_gpt4',
    data_analise: new Date().toISOString(),
    periodo_analise: '7_dias'
  }
}));
```

**1.6. HTTP Request: Salvar Melhorias**

**URL:** `{{ $('BACKEND_URL').item.json.url }}/api/melhorias`  
**Method:** POST  
**Body:**
```json
{
  "titulo": "{{ $json.titulo }}",
  "descricao": "{{ $json.descricao }}",
  "categoria": "{{ $json.categoria }}",
  "prioridade": "{{ $json.prioridade }}",
  "impacto_estimado": "{{ $json.impacto_estimado }}",
  "esforco_estimado": "{{ $json.esforco_estimado }}",
  "evidencias": {{ JSON.stringify($json.evidencias) }},
  "metricas_sucesso": {{ JSON.stringify($json.metricas_sucesso) }},
  "metadata": {
    "gerado_por": "{{ $json.gerado_por }}",
    "data_analise": "{{ $json.data_analise }}",
    "periodo_analise": "{{ $json.periodo_analise }}"
  }
}
```

### **Teste para 4.5.3:**

**Cenário:** 15 anotações sobre "Trilha de Compliance muito longa"

**Saída esperada do GPT-4:**
```json
{
  "padroes_identificados": [
    {
      "descricao": "15 colaboradores reclamaram que Trilha de Compliance é muito longa",
      "frequencia": 15,
      "categoria": "conteudo",
      "impacto": "alto"
    }
  ],
  "melhorias_sugeridas": [
    {
      "titulo": "Dividir Trilha de Compliance em 2 módulos",
      "descricao": "Dividir em 'Compliance Básico' (conceitos) e 'Compliance Avançado' (aplicação prática) para reduzir sensação de sobrecarga",
      "categoria": "conteudo",
      "prioridade": "alta",
      "impacto_estimado": "alto",
      "esforco_estimado": "medio",
      "evidencias": [
        "15 reclamações sobre duração",
        "Sentimento médio: negativo (0.68)",
        "30% dos colaboradores afetados"
      ],
      "metricas_sucesso": [
        "Redução de 50% nas reclamações sobre duração",
        "Aumento de 20% na taxa de conclusão",
        "Melhoria no sentimento médio para neutro/positivo"
      ]
    }
  ]
}
```

---

## **4.5.4. Anotações Proativas (Auto-geradas)** (2-3h)

### **Objetivo:**
Sistema gera anotações automaticamente baseado em comportamentos, SEM mensagem do usuário.

### **Arquitetura:**

```
🕒 Cron Trigger (4x/dia - 9h, 12h, 15h, 18h)
    ↓
📊 Buscar Colaboradores Ativos
    ↓
🔍 Analisar Comportamento (para cada colaborador)
    ↓
IF: Padrão detectado (inatividade, progresso excepcional, etc.)
    ↓
💡 GPT-4 Gera Anotação Proativa
    ↓
💾 Salvar Anotação
```

### **Padrões a Detectar:**

1. **Inatividade:** 5+ dias sem interação
2. **Progresso Excepcional:** 5+ trilhas em 7 dias
3. **Baixo Engajamento:** 3+ trilhas iniciadas, 0 concluídas em 14 dias
4. **Dificuldade Recorrente:** 3+ mensagens negativas sobre mesma trilha
5. **Risco de Evasão:** Inatividade + trilha incompleta + último sentimento negativo

### **Implementação:**

**Workflow: "Monitoramento Proativo"**

**1. Cron Trigger**
- Interval: `0 9,12,15,18 * * *` (4x/dia)

**2. HTTP Request: Buscar Colaboradores**
```
GET {{ $('BACKEND_URL').item.json.url }}/api/colaboradores/ativos?onboarding_ativo=true
```

**3. Code Node: Analisar Comportamento**

```javascript
const colaboradores = $input.all().map(i => i.json);
const anotacoesProativas = [];

for (const colab of colaboradores) {
  const { 
    id, 
    nome, 
    dias_sem_interacao, 
    trilhas_concluidas, 
    trilhas_iniciadas,
    dias_onboarding,
    ultimo_sentimento,
    progresso_trilha_atual
  } = colab;
  
  // PADRÃO 1: Inatividade
  if (dias_sem_interacao >= 5 && progresso_trilha_atual < 100) {
    anotacoesProativas.push({
      colaborador_id: id,
      tipo: 'padrao_identificado',
      padrao: 'inatividade',
      titulo: `Colaborador ${nome} inativo há ${dias_sem_interacao} dias`,
      descricao: `${nome} está há ${dias_sem_interacao} dias sem interagir. Trilha atual: ${progresso_trilha_atual}% concluída.`,
      urgencia: dias_sem_interacao >= 7 ? 'alta' : 'media',
      acao_sugerida: 'Enviar mensagem de re-engajamento ou contato do RH',
      metadata: { dias_sem_interacao, progresso_trilha_atual }
    });
  }
  
  // PADRÃO 2: Progresso Excepcional
  if (trilhas_concluidas >= 5 && dias_onboarding <= 7) {
    anotacoesProativas.push({
      colaborador_id: id,
      tipo: 'padrao_identificado',
      padrao: 'progresso_excepcional',
      titulo: `${nome} com progresso excepcional`,
      descricao: `${nome} completou ${trilhas_concluidas} trilhas em apenas ${dias_onboarding} dias. Performance acima da média.`,
      urgencia: 'baixa',
      acao_sugerida: 'Considerar como candidato a mentor ou embaixador',
      metadata: { trilhas_concluidas, dias_onboarding }
    });
  }
  
  // PADRÃO 3: Baixo Engajamento
  if (trilhas_iniciadas >= 3 && trilhas_concluidas === 0 && dias_onboarding >= 14) {
    anotacoesProativas.push({
      colaborador_id: id,
      tipo: 'padrao_identificado',
      padrao: 'baixo_engajamento',
      titulo: `${nome} com baixo engajamento`,
      descricao: `${nome} iniciou ${trilhas_iniciadas} trilhas mas não concluiu nenhuma em ${dias_onboarding} dias.`,
      urgencia: 'media',
      acao_sugerida: 'Investigar dificuldades e oferecer suporte personalizado',
      metadata: { trilhas_iniciadas, trilhas_concluidas, dias_onboarding }
    });
  }
  
  // PADRÃO 4: Risco de Evasão
  if (
    dias_sem_interacao >= 7 && 
    progresso_trilha_atual > 0 && 
    progresso_trilha_atual < 50 && 
    ultimo_sentimento === 'negativo'
  ) {
    anotacoesProativas.push({
      colaborador_id: id,
      tipo: 'padrao_identificado',
      padrao: 'risco_evasao',
      titulo: `⚠️ RISCO: ${nome} pode evadir`,
      descricao: `${nome} está inativo há ${dias_sem_interacao} dias, trilha ${progresso_trilha_atual}% completa e último sentimento negativo.`,
      urgencia: 'critica',
      acao_sugerida: 'Contato URGENTE do gestor/RH para entender situação',
      metadata: { dias_sem_interacao, progresso_trilha_atual, ultimo_sentimento }
    });
  }
}

return anotacoesProativas.map(a => ({ json: a }));
```

**4. Loop: Para cada anotação proativa**

**4.1. HTTP Request: GPT-4 Enriquecer Anotação**

```json
POST https://api.openai.com/v1/chat/completions
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "Você é um especialista em RH e onboarding. Enriqueça a anotação proativa com insights e recomendações específicas."
    },
    {
      "role": "user",
      "content": "Enriqueça esta anotação:\n\n{{ JSON.stringify($json) }}\n\nRetorne JSON com:\n{\n  \"tags\": [5 tags específicas],\n  \"insights\": \"string (2-3 frases de insights)\",\n  \"acoes_especificas\": [\"ação 1\", \"ação 2\", \"ação 3\"],\n  \"prioridade_revisao\": \"urgente|alta|media|baixa\"\n}"
    }
  ],
  "temperature": 0.4,
  "max_tokens": 300
}
```

**4.2. HTTP Request: Salvar Anotação Proativa**

```
POST {{ $('BACKEND_URL').item.json.url }}/api/agente/anotacoes/proativa
{
  "colaborador_id": "{{ $json.colaborador_id }}",
  "tipo": "{{ $json.tipo }}",
  "padrao": "{{ $json.padrao }}",
  "titulo": "{{ $json.titulo }}",
  "anotacao": "{{ $json.descricao }}",
  "tags": {{ JSON.stringify($json.tags || []) }},
  "urgencia": "{{ $json.urgencia }}",
  "acao_sugerida": "{{ $json.acao_sugerida }}",
  "insights": "{{ $json.insights }}",
  "acoes_especificas": {{ JSON.stringify($json.acoes_especificas || []) }},
  "prioridade_revisao": "{{ $json.prioridade_revisao }}",
  "metadata": {{ JSON.stringify($json.metadata || {}) }},
  "gerado_automaticamente": true
}
```

### **Teste para 4.5.4:**

**Cenário:** Colaborador João - 8 dias sem interação, trilha 35% completa, último sentimento: negativo

**Anotação Proativa Gerada:**
```json
{
  "colaborador_id": "uuid-joao",
  "tipo": "padrao_identificado",
  "padrao": "risco_evasao",
  "titulo": "⚠️ RISCO: João pode evadir",
  "anotacao": "João está inativo há 8 dias, trilha 35% completa e último sentimento negativo.",
  "tags": [
    "risco-evasao",
    "inatividade-critica",
    "trilha-incompleta",
    "sentimento-negativo",
    "intervencao-urgente"
  ],
  "urgencia": "critica",
  "acao_sugerida": "Contato URGENTE do gestor/RH para entender situação",
  "insights": "João pode estar enfrentando dificuldades não comunicadas. A combinação de inatividade prolongada e sentimento negativo indica alto risco de desengajamento permanente. Intervenção nas próximas 24-48h é crucial.",
  "acoes_especificas": [
    "Ligar para João hoje para entender situação",
    "Oferecer reunião 1:1 com gestor",
    "Propor ajuste de trilhas ou suporte personalizado"
  ],
  "prioridade_revisao": "urgente",
  "metadata": {
    "dias_sem_interacao": 8,
    "progresso_trilha_atual": 35,
    "ultimo_sentimento": "negativo"
  },
  "gerado_automaticamente": true
}
```

---

## 📊 IMPACTO ESPERADO DA FASE 4.5

| Métrica | Antes (4.0) | Depois (4.5) | Melhoria |
|---------|-------------|--------------|----------|
| **Categorização** | Regex básica | GPT-4o semântica | **+200%** |
| **Urgência** | Manual | Automática | **Novo** 🆕 |
| **Tags** | 2 genéricas | 5+ específicas | **+150%** |
| **Ações Automáticas** | 0 | 4 (crítica/alta/proativa/padrões) | **Novo** 🆕 |
| **Análise de Padrões** | Manual | Diária (GPT-4) | **Novo** 🆕 |
| **Anotações Proativas** | 0 | 4x/dia | **Novo** 🆕 |
| **Detecção de Riscos** | ❌ | ✅ 5 padrões | **Novo** 🆕 |

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **4.5.1 - Categorização Inteligente:**
- [ ] Criar Code Node "Analisar Feedback com GPT-4o"
- [ ] Atualizar "💾 Salvar Anotação" com novos campos
- [ ] Atualizar backend (se necessário)
- [ ] Testar 3 cenários (construtivo, urgente, elogio)

### **4.5.2 - Detecção de Urgência:**
- [ ] Adicionar IF Node "🚨 Analisar Urgência"
- [ ] Criar branch "Urgência CRÍTICA" (notificar + ticket)
- [ ] Criar endpoint backend `/alerta-urgencia-critica`
- [ ] Criar endpoint `/api/tickets` (se não existir)
- [ ] Testar detecção e escalação

### **4.5.3 - Análise de Padrões:**
- [ ] Criar novo workflow "Análise Diária de Padrões"
- [ ] Cron Trigger (9h diário)
- [ ] Buscar anotações (7 dias)
- [ ] GPT-4 analisa padrões
- [ ] Salvar melhorias no banco
- [ ] Notificar admins
- [ ] Testar análise completa

### **4.5.4 - Anotações Proativas:**
- [ ] Criar workflow "Monitoramento Proativo"
- [ ] Cron Trigger (4x/dia)
- [ ] Detectar 5 padrões de comportamento
- [ ] GPT-4 enriquecer anotações
- [ ] Salvar anotações proativas
- [ ] Testar 5 cenários

---

## 🚀 PRÓXIMOS PASSOS

**Agora vamos implementar passo a passo!**

Quer começar por qual sub-fase?

1. **4.5.1** - Categorização Inteligente (mais impacto imediato)
2. **4.5.2** - Detecção de Urgência (crítico para produção)
3. **4.5.3** - Análise de Padrões (mais estratégico)
4. **4.5.4** - Anotações Proativas (mais inovador)

**Ou implementar tudo em sequência?** 

Aguardo sua decisão! 🎯

