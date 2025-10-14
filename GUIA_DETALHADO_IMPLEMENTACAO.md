# 📘 Guia Detalhado de Implementação - Flowly

**Projeto:** Flowly - Sistema de Onboarding com IA  
**Objetivo:** Documentação completa para retomada rápida de contexto  
**Última Atualização:** 14 de outubro de 2025

---

## 🎯 **COMO USAR ESTE GUIA**

Este documento contém **todas as implementações pendentes** com:
- ✅ **Contexto completo** - Por que implementar
- ✅ **Pré-requisitos** - O que precisa estar pronto
- ✅ **Passo a passo** - Como implementar
- ✅ **Código exemplo** - Pronto para copiar/colar
- ✅ **Critérios de aceite** - Como validar sucesso
- ✅ **Troubleshooting** - Problemas comuns

---

## 📋 **ÍNDICE RÁPIDO**

### **🚧 FASE 4.5: APRIMORAMENTO DE ANOTAÇÕES** (6-8h)
1. [4.5.1 - Categorização Inteligente](#451-categorização-inteligente-de-feedback-3-4h) (3-4h)
2. [4.5.2 - Detecção de Urgência](#452-detecção-de-urgência-automática-2-3h) (2-3h)
3. [4.5.3 - Análise de Padrões](#453-análise-de-padrões-com-gpt-4o-3-4h) (3-4h)
4. [4.5.4 - Anotações Proativas](#454-anotações-proativas-auto-geradas-2-3h) (2-3h)

### **📝 FASES COMPLEMENTARES**
5. [Fase 1 - Trilhas Inteligentes](#fase-1-trilhas-inteligentes-por-cargodepartamento-4-6h) (4-6h)
6. [Fase 3 - Frontend Anotações](#fase-3-frontend-anotações-avançadas-3-4h) (3-4h)
7. [Testes e Validação](#testes-e-validação-4-6h) (4-6h)
8. [Preparação Produção](#preparação-para-produção-6-8h) (6-8h)

---

# 🚧 **FASE 4.5: APRIMORAMENTO DE ANOTAÇÕES**

## **4.5.1. Categorização Inteligente de Feedback** (3-4h)

### **📌 CONTEXTO**
**Status Atual:** Sistema detecta feedback com regex simples (palavras-chave)  
**Objetivo:** Usar GPT-4o-mini para categorização semântica inteligente  
**Benefício:** Categorização 90%+ precisa, tags ricas, detecção de urgência

### **🔧 PRÉ-REQUISITOS**
- ✅ N8N workflow com nó `Tem feedback?` funcionando
- ✅ OpenAI API Key configurada
- ✅ Endpoint `/api/agente/anotacoes` ativo

---

### **📝 SUBTAREFA 1.1: Code Node "Analisar Feedback com GPT-4o"** (1.5h)

#### **PASSO 1: Adicionar Code Node no N8N**

**Localização:**
```
Fluxo N8N:
... → Tem feedback? (TRUE) → [NOVO] Analisar Feedback com GPT-4o → 💾 Salvar Anotação
```

**Configuração do Nó:**
- **Nome:** `Analisar Feedback com GPT-4o`
- **Tipo:** Code (JavaScript)
- **Posição:** Entre `Tem feedback?` (branch TRUE) e `💾 Salvar Anotação`

#### **PASSO 2: Implementar Código JavaScript**

**Código Completo:**
```javascript
const axios = require('axios');

// ========== CONFIGURAÇÃO ==========
const OPENAI_API_KEY = 'sk-proj-SUA_KEY_AQUI'; // ⚠️ SUBSTITUIR!
const MODEL = 'gpt-4o-mini';
const TEMPERATURE = 0.3;
const MAX_TOKENS = 500;

// ========== EXTRAÇÃO DE DADOS ==========
const mensagem = $input.first().json.mensagem || $('Merge').item.json.messageText;
const sentimento = $('Process Sentiment Data').item.json.sentimento || 'neutro';
const intensidade = $('Process Sentiment Data').item.json.intensidade || 0.5;
const from = $('Merge').item.json.from;
const tenantId = $('Merge').item.json.tenantId || 'unknown';

// ========== PROMPT DE ANÁLISE ==========
const prompt = `Você é um analista especializado em feedback de colaboradores em processos de onboarding.

Analise o seguinte feedback e extraia informações estruturadas:

**Feedback:** "${mensagem}"
**Sentimento detectado:** ${sentimento}
**Intensidade:** ${intensidade}

Retorne um JSON com a seguinte estrutura:
{
  "tipo": "problema_tecnico|dificuldade_trilha|sugestao_colaborador|elogio|reclamacao|duvida_geral|sentimento_trilha|observacao_geral",
  "urgencia": "critica|alta|media|baixa",
  "categoria": "tecnico|trilha|conteudo|ux|rh|geral",
  "subcategoria": "string descritiva (ex: 'acesso-sistema', 'trilha-longa', 'quiz-dificil')",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "sentimento_contexto": "muito_positivo|positivo|neutro|negativo|muito_negativo",
  "acao_sugerida": "string com ação recomendada",
  "impacto_estimado": "critico|alto|medio|baixo",
  "titulo_sugerido": "Título curto e descritivo (máx 60 chars)"
}

**CRITÉRIOS DE URGÊNCIA:**
- "critica": Bloqueio total, erro grave, colaborador impedido de continuar
- "alta": Problema significativo que atrapalha bastante
- "media": Feedback importante mas não urgente
- "baixa": Observação, elogio, sugestão

**REGRAS:**
- Mínimo 5 tags relevantes
- Título claro e objetivo
- Ação sugerida específica e acionável
- Se sentimento é muito_negativo, urgência >= media`;

// ========== CHAMADA OPENAI ==========
try {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: MODEL,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em análise de feedback. Retorne SEMPRE JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' } // ⭐ Força JSON válido
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // ========== PARSER DE RESPOSTA ==========
  const content = response.data.choices[0].message.content;
  let analise;
  
  try {
    analise = JSON.parse(content);
  } catch (parseError) {
    console.error('Erro ao parsear JSON da OpenAI:', parseError);
    // Fallback: extrair JSON do texto
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analise = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('JSON inválido da OpenAI');
    }
  }

  // ========== VALIDAÇÃO E NORMALIZAÇÃO ==========
  const resultado = {
    tipo: analise.tipo || 'observacao_geral',
    urgencia: analise.urgencia || 'baixa',
    categoria: analise.categoria || 'geral',
    subcategoria: analise.subcategoria || '',
    tags: Array.isArray(analise.tags) ? analise.tags : ['feedback', 'automatico'],
    sentimento_contexto: analise.sentimento_contexto || sentimento,
    acao_sugerida: analise.acao_sugerida || 'Revisar feedback manualmente',
    impacto_estimado: analise.impacto_estimado || 'baixo',
    titulo_sugerido: analise.titulo_sugerido || mensagem.substring(0, 60),
    
    // Metadata de análise
    analisado_em: new Date().toISOString(),
    modelo_usado: MODEL,
    versao_analise: 'v1.0',
    temperatura_ia: TEMPERATURE,
    
    // Dados originais
    mensagem_original: mensagem,
    from: from,
    tenantId: tenantId
  };

  return [{
    json: resultado
  }];

} catch (error) {
  console.error('Erro ao analisar feedback com GPT-4o:', error);
  
  // ========== FALLBACK EM CASO DE ERRO ==========
  return [{
    json: {
      tipo: 'observacao_geral',
      urgencia: sentimento.includes('negativo') ? 'media' : 'baixa',
      categoria: 'geral',
      subcategoria: 'analise_falhou',
      tags: ['erro-analise', 'fallback', 'revisar'],
      sentimento_contexto: sentimento,
      acao_sugerida: 'Revisar manualmente - IA falhou',
      impacto_estimado: 'baixo',
      titulo_sugerido: mensagem.substring(0, 60),
      analisado_em: new Date().toISOString(),
      modelo_usado: 'fallback',
      versao_analise: 'v1.0-fallback',
      erro: error.message,
      mensagem_original: mensagem,
      from: from,
      tenantId: tenantId
    }
  }];
}
```

#### **PASSO 3: Configurar OpenAI API Key**

**⚠️ IMPORTANTE:** Substituir `sk-proj-SUA_KEY_AQUI` pela key real.

**Onde obter:**
1. Acessar: https://platform.openai.com/api-keys
2. Criar nova key ou usar existente
3. Copiar e colar no código

**Segurança:**
- ✅ NUNCA commitar a key no Git
- ✅ Usar variáveis de ambiente no N8N (se disponível)
- ✅ Rotacionar key periodicamente

#### **PASSO 4: Validar Saída do Nó**

**Executar teste manual no N8N:**
1. Enviar mensagem de teste via WhatsApp/Telegram
2. Clicar em "Execute Node" no Code Node
3. Verificar output JSON

**Output Esperado:**
```json
{
  "tipo": "sugestao_colaborador",
  "urgencia": "media",
  "categoria": "trilha",
  "subcategoria": "trilha-longa",
  "tags": ["compliance", "melhoria", "estrutura", "divisao", "modulos"],
  "sentimento_contexto": "neutro",
  "acao_sugerida": "Dividir trilha de compliance em 3 módulos menores",
  "impacto_estimado": "medio",
  "titulo_sugerido": "Sugestão: Dividir trilha de compliance",
  "analisado_em": "2025-10-14T12:34:56.789Z",
  "modelo_usado": "gpt-4o-mini",
  "versao_analise": "v1.0",
  "temperatura_ia": 0.3,
  "mensagem_original": "A trilha de compliance está muito longa...",
  "from": "556291708483",
  "tenantId": "5978f911-738b-4aae-802a-f037fdac2e64"
}
```

---

### **📝 SUBTAREFA 1.2: Atualizar nó "💾 Salvar Anotação"** (1h)

#### **PASSO 1: Expandir Campos do HTTP Request**

**Localização:** Nó `💾 Salvar Anotação` (HTTP Request)

**Body Atual (básico):**
```json
{
  "tipo": "observacao_geral",
  "titulo": "Feedback: {{ $('Merge').item.json.messageText.substring(0, 50) }}",
  "anotacao": "{{ $('Merge').item.json.messageText }}",
  "tags": ["feedback", "automatico"]
}
```

**Body Novo (completo):**
```json
{
  "tipo": "{{ $('Analisar Feedback com GPT-4o').item.json.tipo }}",
  "urgencia": "{{ $('Analisar Feedback com GPT-4o').item.json.urgencia }}",
  "categoria": "{{ $('Analisar Feedback com GPT-4o').item.json.categoria }}",
  "subcategoria": "{{ $('Analisar Feedback com GPT-4o').item.json.subcategoria }}",
  "titulo": "{{ $('Analisar Feedback com GPT-4o').item.json.titulo_sugerido }}",
  "anotacao": "{{ $('Analisar Feedback com GPT-4o').item.json.mensagem_original }}",
  "tags": {{ JSON.stringify($('Analisar Feedback com GPT-4o').item.json.tags) }},
  "sentimento_contexto": "{{ $('Analisar Feedback com GPT-4o').item.json.sentimento_contexto }}",
  "acao_sugerida": "{{ $('Analisar Feedback com GPT-4o').item.json.acao_sugerida }}",
  "impacto_estimado": "{{ $('Analisar Feedback com GPT-4o').item.json.impacto_estimado }}",
  "metadata": {
    "analisado_em": "{{ $('Analisar Feedback com GPT-4o').item.json.analisado_em }}",
    "modelo_usado": "{{ $('Analisar Feedback com GPT-4o').item.json.modelo_usado }}",
    "versao_analise": "{{ $('Analisar Feedback com GPT-4o').item.json.versao_analise }}",
    "from": "{{ $('Analisar Feedback com GPT-4o').item.json.from }}",
    "tenantId": "{{ $('Analisar Feedback com GPT-4o').item.json.tenantId }}"
  }
}
```

#### **PASSO 2: Verificar Backend**

**Arquivo:** `src/routes/agente-anotacoes.js`

**Verificar se endpoint aceita novos campos:**
```bash
# Testar com curl
curl -X POST http://localhost:3000/api/agente/anotacoes \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "sugestao_colaborador",
    "urgencia": "media",
    "categoria": "trilha",
    "subcategoria": "teste",
    "titulo": "Teste",
    "anotacao": "Teste de anotação",
    "tags": ["teste"],
    "sentimento_contexto": "neutro",
    "acao_sugerida": "Teste",
    "impacto_estimado": "baixo"
  }'
```

**Se retornar erro 400 (campos não aceitos):**

**Atualizar código do backend:**
```javascript
// src/routes/agente-anotacoes.js
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      tipo, 
      titulo, 
      anotacao, 
      tags,
      // NOVOS CAMPOS ⬇️
      urgencia,
      categoria,
      subcategoria,
      sentimento_contexto,
      acao_sugerida,
      impacto_estimado,
      metadata
    } = req.body;

    const result = await query(
      `INSERT INTO agente_anotacoes (
        tipo, titulo, anotacao, tags, 
        urgencia, categoria, subcategoria, 
        sentimento_contexto, acao_sugerida, impacto_estimado,
        contexto, created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) 
      RETURNING *`,
      [
        tipo, 
        titulo, 
        anotacao, 
        tags, 
        urgencia || 'baixa',
        categoria || 'geral',
        subcategoria || '',
        sentimento_contexto || 'neutro',
        acao_sugerida || '',
        impacto_estimado || 'baixo',
        JSON.stringify(metadata || {})
      ]
    );

    res.json({ success: true, anotacao: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar anotação:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**Se tabela não tiver colunas, adicionar migração:**
```sql
-- migrations/012_anotacoes_campos_ia.sql
ALTER TABLE agente_anotacoes 
ADD COLUMN IF NOT EXISTS urgencia VARCHAR(20) DEFAULT 'baixa',
ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'geral',
ADD COLUMN IF NOT EXISTS subcategoria VARCHAR(100),
ADD COLUMN IF NOT EXISTS sentimento_contexto VARCHAR(30),
ADD COLUMN IF NOT EXISTS acao_sugerida TEXT,
ADD COLUMN IF NOT EXISTS impacto_estimado VARCHAR(20) DEFAULT 'baixo';

CREATE INDEX IF NOT EXISTS idx_anotacoes_urgencia ON agente_anotacoes(urgencia);
CREATE INDEX IF NOT EXISTS idx_anotacoes_categoria ON agente_anotacoes(categoria);
```

---

### **📝 SUBTAREFA 1.3: Testes de Categorização** (0.5h)

#### **TESTE 1: Feedback Construtivo**

**Input (via WhatsApp/Telegram):**
```
A trilha de compliance está muito longa, poderia ser dividida em módulos menores
```

**Output Esperado:**
```json
{
  "tipo": "sugestao_colaborador",
  "urgencia": "media",
  "categoria": "trilha",
  "subcategoria": "estrutura-conteudo",
  "tags": ["compliance", "melhoria", "estrutura", "modulos", "organizacao"],
  "sentimento_contexto": "neutro",
  "acao_sugerida": "Revisar estrutura da trilha de compliance e considerar divisão em módulos",
  "impacto_estimado": "medio",
  "titulo_sugerido": "Sugestão: Dividir trilha de compliance em módulos"
}
```

**Validação:** ✅ Tipo correto, urgência adequada, tags relevantes

---

#### **TESTE 2: Problema Urgente**

**Input:**
```
Não consigo acessar o sistema há 2 dias, isso está atrasando meu onboarding
```

**Output Esperado:**
```json
{
  "tipo": "problema_tecnico",
  "urgencia": "alta",
  "categoria": "tecnico",
  "subcategoria": "acesso-sistema",
  "tags": ["acesso", "bloqueio", "urgente", "atraso", "sistema"],
  "sentimento_contexto": "negativo",
  "acao_sugerida": "Escalar para TI imediatamente - colaborador sem acesso há 2 dias",
  "impacto_estimado": "alto",
  "titulo_sugerido": "URGENTE: Colaborador sem acesso há 2 dias"
}
```

**Validação:** ✅ Urgência ALTA detectada, ação clara

---

#### **TESTE 3: Elogio**

**Input:**
```
Adorei a trilha de boas-vindas, muito bem estruturada e interativa
```

**Output Esperado:**
```json
{
  "tipo": "elogio",
  "urgencia": "baixa",
  "categoria": "trilha",
  "subcategoria": "boas-vindas",
  "tags": ["elogio", "boas-vindas", "satisfacao", "estrutura", "interatividade"],
  "sentimento_contexto": "muito_positivo",
  "acao_sugerida": "Registrar como boas práticas e replicar estrutura em outras trilhas",
  "impacto_estimado": "baixo",
  "titulo_sugerido": "Elogio: Trilha de boas-vindas bem avaliada"
}
```

**Validação:** ✅ Tipo elogio, urgência baixa, tags positivas

---

### **✅ CRITÉRIOS DE ACEITE (SUBTAREFA 1.1-1.3)**

- [ ] Code Node executa sem erros
- [ ] Output JSON válido e completo (12 campos)
- [ ] OpenAI retorna análise em < 2 segundos
- [ ] Fallback funciona se OpenAI falhar
- [ ] Backend aceita novos campos
- [ ] Anotação salva no banco com sucesso
- [ ] 3 testes passam com 90%+ de precisão

---

## **4.5.2. Detecção de Urgência Automática** (2-3h)

### **📌 CONTEXTO**
**Status Atual:** Anotações salvas sem ação automática  
**Objetivo:** Notificar admins e criar tickets para urgência crítica/alta  
**Benefício:** Problemas resolvidos 70% mais rápido

### **🔧 PRÉ-REQUISITOS**
- ✅ Subtarefa 1.1-1.3 implementada
- ✅ Campo `urgencia` disponível no output do Code Node

---

### **📝 SUBTAREFA 2.1: Lógica de Urgência no N8N** (1h)

#### **PASSO 1: Adicionar Switch Node**

**Localização:**
```
... → Analisar Feedback com GPT-4o → [NOVO] 🚨 Analisar Urgência → ...
```

**Configuração do Switch:**
- **Nome:** `🚨 Analisar Urgência`
- **Tipo:** Switch
- **Modo:** Rules

**Condições (4 branches):**
```javascript
// Condição 1: CRÍTICA
{{ $json.urgencia }} === 'critica'

// Condição 2: ALTA
{{ $json.urgencia }} === 'alta'

// Condição 3: MÉDIA
{{ $json.urgencia }} === 'media'

// Condição 4: BAIXA (fallback)
(sempre true para pegar o resto)
```

#### **PASSO 2: Branch CRÍTICA - Notificação Imediata**

**Sub-nó 1: HTTP Request "Notificar Admin"**

**Configuração:**
- **Method:** POST
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/agente/alertas/urgencia-critica`

**Body:**
```json
{
  "phone": "{{ $('Merge').item.json.from }}",
  "urgencia": "critica",
  "feedback": "{{ $('Merge').item.json.messageText }}",
  "categoria": "{{ $json.categoria }}",
  "subcategoria": "{{ $json.subcategoria }}",
  "acao_sugerida": "{{ $json.acao_sugerida }}",
  "colaborador_id": "{{ $('Merge').item.json.from }}",
  "tenant_id": "{{ $('Merge').item.json.tenantId }}",
  "timestamp": "{{ new Date().toISOString() }}"
}
```

**Sub-nó 2: Code Node "Preparar Ticket"**

**Código:**
```javascript
const dados = $input.first().json;

const ticketData = {
  titulo: `[CRÍTICO] ${dados.titulo_sugerido || 'Problema urgente'}`,
  descricao: `
**Colaborador:** ${dados.from}
**Categoria:** ${dados.categoria} / ${dados.subcategoria}
**Urgência:** CRÍTICA

**Feedback:**
${dados.mensagem_original}

**Ação Sugerida pela IA:**
${dados.acao_sugerida}

**Impacto Estimado:** ${dados.impacto_estimado}
**Detectado em:** ${dados.analisado_em}
  `.trim(),
  prioridade: 'maxima',
  categoria: dados.categoria,
  tipo: 'urgencia_critica',
  responsavel: dados.categoria === 'tecnico' ? 'TI' : 'RH',
  tenant_id: dados.tenantId,
  metadata: {
    origem: 'ia_deteccao_urgencia',
    modelo: dados.modelo_usado,
    versao: dados.versao_analise
  }
};

return [{ json: ticketData }];
```

**Sub-nó 3: HTTP Request "Criar Ticket"**

**Configuração:**
- **Method:** POST
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/tickets`
- **Body:** `{{ $json }}`

---

### **📝 SUBTAREFA 2.2: Backend - Endpoints de Urgência** (1h)

#### **PASSO 1: Endpoint de Alerta Crítico**

**Arquivo:** `src/routes/webhooks.js` (ou criar `src/routes/alertas.js`)

**Código:**
```javascript
// POST /api/agente/alertas/urgencia-critica
router.post('/urgencia-critica', authenticate, async (req, res) => {
  try {
    const {
      phone,
      urgencia,
      feedback,
      categoria,
      subcategoria,
      acao_sugerida,
      colaborador_id,
      tenant_id,
      timestamp
    } = req.body;

    // 1. Buscar dados do colaborador
    const colaborador = await query(
      `SELECT id, name, email FROM users WHERE phone = $1 OR id::text = $2`,
      [phone, colaborador_id]
    );

    if (colaborador.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    const colab = colaborador.rows[0];

    // 2. Buscar administradores do tenant
    const admins = await query(
      `SELECT email, name FROM users 
       WHERE tenant_id = $1 AND role IN ('admin', 'rh', 'gestor')`,
      [tenant_id]
    );

    // 3. Criar notificação no sistema
    await query(
      `INSERT INTO notificacoes (
        tipo, titulo, descricao, urgencia, 
        destinatarios, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        'alerta_urgencia_critica',
        `[CRÍTICO] Problema urgente - ${colab.name}`,
        feedback,
        'critica',
        JSON.stringify(admins.rows.map(a => a.email)),
        JSON.stringify({
          categoria,
          subcategoria,
          acao_sugerida,
          colaborador_id: colab.id,
          timestamp
        })
      ]
    );

    // 4. Enviar emails (se configurado)
    if (process.env.SMTP_ENABLED === 'true') {
      const emailPromises = admins.rows.map(admin => 
        sendEmail({
          to: admin.email,
          subject: `[URGENTE] Problema Crítico - ${colab.name}`,
          html: `
            <h2>⚠️ Alerta de Urgência Crítica</h2>
            <p><strong>Colaborador:</strong> ${colab.name} (${colab.email})</p>
            <p><strong>Categoria:</strong> ${categoria} / ${subcategoria}</p>
            <p><strong>Feedback:</strong></p>
            <blockquote>${feedback}</blockquote>
            <p><strong>Ação Sugerida:</strong> ${acao_sugerida}</p>
            <hr>
            <p><em>Detectado automaticamente pelo sistema em ${new Date(timestamp).toLocaleString('pt-BR')}</em></p>
          `
        })
      );

      await Promise.all(emailPromises);
    }

    res.json({
      success: true,
      notificados: admins.rows.length,
      colaborador: colab.name
    });

  } catch (error) {
    console.error('Erro ao processar alerta crítico:', error);
    res.status(500).json({ error: error.message });
  }
});
```

#### **PASSO 2: Endpoint de Tickets**

**Arquivo:** `src/routes/tickets.js` (criar se não existir)

**Código:**
```javascript
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');

// POST /api/tickets
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      titulo,
      descricao,
      prioridade,
      categoria,
      tipo,
      responsavel,
      tenant_id,
      metadata
    } = req.body;

    // Validação
    if (!titulo || !descricao) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
    }

    // Criar ticket
    const result = await query(
      `INSERT INTO tickets (
        titulo, descricao, prioridade, categoria, tipo,
        responsavel, tenant_id, status, metadata, created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'aberto', $8, NOW()) 
      RETURNING *`,
      [
        titulo,
        descricao,
        prioridade || 'media',
        categoria || 'geral',
        tipo || 'suporte',
        responsavel || 'TI',
        tenant_id,
        JSON.stringify(metadata || {})
      ]
    );

    const ticket = result.rows[0];

    // Notificar responsável
    await query(
      `INSERT INTO notificacoes (
        tipo, titulo, descricao, destinatarios, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        'novo_ticket',
        `Novo Ticket: ${titulo}`,
        `Prioridade: ${prioridade} | Categoria: ${categoria}`,
        JSON.stringify([responsavel]),
        JSON.stringify({ ticket_id: ticket.id })
      ]
    );

    res.json({
      success: true,
      ticket: ticket
    });

  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

**Registrar rota no server.js:**
```javascript
// src/server.js
const ticketsRouter = require('./routes/tickets');
app.use('/api/tickets', ticketsRouter);
```

---

### **📝 SUBTAREFA 2.3: Testes de Urgência** (0.5h)

#### **TESTE 1: Urgência Crítica**

**Input:**
```
Sistema travou completamente, não consigo fazer nada há 3 horas!!!
```

**Validações:**
- [ ] Code Node detecta `urgencia: "critica"`
- [ ] Switch direciona para branch CRÍTICA
- [ ] HTTP Request notifica admins (status 200)
- [ ] Ticket criado com prioridade máxima
- [ ] Email enviado aos administradores

**Verificar no banco:**
```sql
SELECT * FROM notificacoes WHERE tipo = 'alerta_urgencia_critica' ORDER BY created_at DESC LIMIT 1;
SELECT * FROM tickets WHERE tipo = 'urgencia_critica' ORDER BY created_at DESC LIMIT 1;
```

---

#### **TESTE 2: Urgência Baixa**

**Input:**
```
Achei a trilha de boas-vindas muito legal!
```

**Validações:**
- [ ] Code Node detecta `urgencia: "baixa"`
- [ ] Switch direciona para branch BAIXA
- [ ] NÃO notifica admins
- [ ] NÃO cria ticket
- [ ] Apenas salva anotação normalmente

---

### **✅ CRITÉRIOS DE ACEITE (SUBTAREFA 2.1-2.3)**

- [ ] Switch funciona corretamente (4 branches)
- [ ] Branch CRÍTICA executa 3 sub-nós sem erro
- [ ] Admins notificados em < 30 segundos
- [ ] Ticket criado com dados completos
- [ ] Email enviado (se SMTP configurado)
- [ ] Branch BAIXA não dispara alertas
- [ ] Logs detalhados de cada ação

---

## **4.5.3. Análise de Padrões com GPT-4o** (3-4h)

### **📌 CONTEXTO**
**Status Atual:** Anotações acumulam sem análise agregada  
**Objetivo:** Workflow diário que identifica padrões e gera melhorias  
**Benefício:** Insights automáticos, melhorias baseadas em dados reais

---

### **📝 SUBTAREFA 3.1: Workflow de Análise Diária** (2h)

#### **PASSO 1: Criar Novo Workflow no N8N**

**Configuração:**
- **Nome:** `Análise Diária de Padrões`
- **Descrição:** Analisa anotações dos últimos 7 dias e gera melhorias automáticas

#### **PASSO 2: Adicionar Cron Trigger**

**Configuração:**
- **Tipo:** Schedule Trigger
- **Mode:** Cron
- **Expression:** `0 9 * * *` (9h da manhã, todos os dias)
- **Timezone:** America/Sao_Paulo

#### **PASSO 3: Buscar Anotações (HTTP Request)**

**Configuração:**
- **Nome:** `Buscar Anotações (7 dias)`
- **Method:** GET
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/agente/anotacoes/ultimos-dias?dias=7&limit=100`

**⚠️ IMPORTANTE:** Criar endpoint primeiro (ver Subtarefa 3.2)

#### **PASSO 4: Preparar Dados (Code Node)**

**Nome:** `Preparar Dados para GPT-4`

**Código:**
```javascript
const anotacoes = $input.all().flatMap(item => item.json.anotacoes || []);

if (anotacoes.length === 0) {
  return [{ json: { sem_dados: true } }];
}

// Agrupar por categoria
const porCategoria = {};
anotacoes.forEach(a => {
  const cat = a.categoria || 'geral';
  if (!porCategoria[cat]) porCategoria[cat] = [];
  porCategoria[cat].push(a);
});

// Agrupar por tipo
const porTipo = {};
anotacoes.forEach(a => {
  const tipo = a.tipo || 'observacao';
  if (!porTipo[tipo]) porTipo[tipo] = [];
  porTipo[tipo].push(a);
});

// Agrupar por urgência
const porUrgencia = {
  critica: anotacoes.filter(a => a.urgencia === 'critica').length,
  alta: anotacoes.filter(a => a.urgencia === 'alta').length,
  media: anotacoes.filter(a => a.urgencia === 'media').length,
  baixa: anotacoes.filter(a => a.urgencia === 'baixa').length
};

// Top 20 anotações mais relevantes (urgência alta/crítica + recentes)
const topAnotacoes = anotacoes
  .filter(a => ['critica', 'alta', 'media'].includes(a.urgencia))
  .sort((a, b) => {
    const urgenciaScore = { critica: 3, alta: 2, media: 1, baixa: 0 };
    return urgenciaScore[b.urgencia] - urgenciaScore[a.urgencia];
  })
  .slice(0, 20)
  .map(a => ({
    tipo: a.tipo,
    categoria: a.categoria,
    subcategoria: a.subcategoria,
    urgencia: a.urgencia,
    titulo: a.titulo,
    anotacao: a.anotacao,
    tags: a.tags,
    acao_sugerida: a.acao_sugerida
  }));

// Resumo para GPT-4
const resumo = {
  periodo: '7 dias',
  total_anotacoes: anotacoes.length,
  por_categoria: Object.keys(porCategoria).map(cat => ({
    categoria: cat,
    quantidade: porCategoria[cat].length,
    urgencias: {
      critica: porCategoria[cat].filter(a => a.urgencia === 'critica').length,
      alta: porCategoria[cat].filter(a => a.urgencia === 'alta').length
    }
  })),
  por_tipo: Object.keys(porTipo).map(tipo => ({
    tipo: tipo,
    quantidade: porTipo[tipo].length
  })),
  distribuicao_urgencia: porUrgencia,
  anotacoes_relevantes: topAnotacoes
};

return [{ json: resumo }];
```

#### **PASSO 5: GPT-4 Análise (HTTP Request)**

**Nome:** `GPT-4 Análise de Padrões`

**Configuração:**
- **Method:** POST
- **URL:** `https://api.openai.com/v1/chat/completions`
- **Authentication:** Bearer Token

**Headers:**
```json
{
  "Authorization": "Bearer {{ $credentials.openai.apiKey }}",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "model": "gpt-4o",
  "temperature": 0.5,
  "max_tokens": 2000,
  "messages": [
    {
      "role": "system",
      "content": "Você é um analista especializado em identificar padrões em feedback de onboarding e gerar melhorias acionáveis. Retorne SEMPRE JSON válido."
    },
    {
      "role": "user",
      "content": "Analise os dados de feedback dos últimos 7 dias e identifique padrões, problemas recorrentes e gere melhorias acionáveis.\n\nDADOS:\n{{ JSON.stringify($json, null, 2) }}\n\nRetorne JSON com:\n{\n  \"padroes_identificados\": [\n    {\n      \"padrao\": \"descrição do padrão\",\n      \"frequencia\": número,\n      \"categorias_afetadas\": [\"cat1\", \"cat2\"],\n      \"gravidade\": \"alta|media|baixa\"\n    }\n  ],\n  \"melhorias_sugeridas\": [\n    {\n      \"titulo\": \"título curto\",\n      \"descricao\": \"descrição detalhada\",\n      \"categoria\": \"trilha|tecnico|conteudo|ux|processo\",\n      \"prioridade\": \"critica|alta|media|baixa\",\n      \"impacto_estimado\": \"alto|medio|baixo\",\n      \"esforco_estimado\": \"alto|medio|baixo\",\n      \"evidencias\": [\"evidência 1\", \"evidência 2\"],\n      \"acoes_recomendadas\": [\"ação 1\", \"ação 2\"]\n    }\n  ],\n  \"insights_gerais\": \"texto com insights principais\"\n}"
    }
  ],
  "response_format": { "type": "json_object" }
}
```

#### **PASSO 6: Processar Resposta (Code Node)**

**Nome:** `Processar Resposta GPT-4`

**Código:**
```javascript
const response = $input.first().json;
const content = response.choices[0].message.content;

let analise;
try {
  analise = JSON.parse(content);
} catch (error) {
  console.error('Erro ao parsear JSON:', error);
  return [{ json: { erro: 'JSON inválido', raw: content } }];
}

// Adicionar metadata
const resultado = {
  ...analise,
  metadata: {
    gerado_em: new Date().toISOString(),
    modelo: 'gpt-4o',
    periodo_analise: '7_dias',
    total_anotacoes_analisadas: $('Preparar Dados para GPT-4').item.json.total_anotacoes
  }
};

return [{ json: resultado }];
```

#### **PASSO 7: Salvar Melhorias (HTTP Request)**

**Nome:** `Salvar Melhorias no Backend`

**Configuração:**
- **Method:** POST
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/agente/melhorias`

**Body:**
```json
{
  "melhorias": {{ JSON.stringify($json.melhorias_sugeridas) }},
  "padroes": {{ JSON.stringify($json.padroes_identificados) }},
  "insights": "{{ $json.insights_gerais }}",
  "metadata": {{ JSON.stringify($json.metadata) }}
}
```

---

### **📝 SUBTAREFA 3.2: Backend - Endpoints** (1h)

#### **Endpoint 1: Buscar Anotações Recentes**

**Arquivo:** `src/routes/agente-anotacoes.js`

**Código:**
```javascript
// GET /api/agente/anotacoes/ultimos-dias
router.get('/ultimos-dias', authenticate, async (req, res) => {
  try {
    const { dias = 7, limit = 100 } = req.query;
    const tenantId = req.user.tenant_id;

    const result = await query(
      `SELECT * FROM agente_anotacoes 
       WHERE tenant_id = $1 
       AND created_at >= NOW() - INTERVAL '${parseInt(dias)} days'
       ORDER BY urgencia DESC, created_at DESC
       LIMIT $2`,
      [tenantId, parseInt(limit)]
    );

    res.json({
      success: true,
      anotacoes: result.rows,
      periodo_dias: parseInt(dias),
      total: result.rows.length
    });
  } catch (error) {
    console.error('Erro ao buscar anotações:', error);
    res.status(500).json({ error: error.message });
  }
});
```

#### **Endpoint 2: Salvar Melhorias**

**Arquivo:** `src/routes/melhorias.js` (criar novo)

**Código:**
```javascript
const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');

// POST /api/agente/melhorias
router.post('/', authenticate, async (req, res) => {
  try {
    const { melhorias, padroes, insights, metadata } = req.body;
    const tenantId = req.user.tenant_id;

    if (!melhorias || !Array.isArray(melhorias)) {
      return res.status(400).json({ error: 'Melhorias inválidas' });
    }

    const resultados = [];

    for (const melhoria of melhorias) {
      const result = await query(
        `INSERT INTO onboarding_improvements (
          tenant_id, tipo, titulo, descricao, 
          categoria, prioridade, impacto_estimado, esforco_estimado,
          status, dados_origem, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendente', $9, NOW())
        RETURNING *`,
        [
          tenantId,
          'ia_analise_padroes',
          melhoria.titulo,
          melhoria.descricao,
          melhoria.categoria,
          melhoria.prioridade,
          melhoria.impacto_estimado,
          melhoria.esforco_estimado,
          JSON.stringify({
            evidencias: melhoria.evidencias,
            acoes_recomendadas: melhoria.acoes_recomendadas,
            padroes_relacionados: padroes,
            insights_gerais: insights,
            metadata
          })
        ]
      );

      resultados.push(result.rows[0]);
    }

    // Notificar administradores
    const admins = await query(
      `SELECT email FROM users WHERE tenant_id = $1 AND role = 'admin'`,
      [tenantId]
    );

    if (admins.rows.length > 0) {
      await query(
        `INSERT INTO notificacoes (
          tipo, titulo, descricao, destinatarios, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          'novas_melhorias_ia',
          `${melhorias.length} Novas Melhorias Sugeridas pela IA`,
          insights,
          JSON.stringify(admins.rows.map(a => a.email)),
          JSON.stringify({ total_melhorias: melhorias.length, ...metadata })
        ]
      );
    }

    res.json({
      success: true,
      melhorias_criadas: resultados.length,
      melhorias: resultados
    });

  } catch (error) {
    console.error('Erro ao salvar melhorias:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

**Registrar no server.js:**
```javascript
// src/server.js
const melhoriasRouter = require('./routes/melhorias');
app.use('/api/agente/melhorias', melhoriasRouter);
```

---

### **📝 SUBTAREFA 3.3: Teste Completo** (0.5h)

#### **TESTE MANUAL: Executar Workflow**

**PASSO 1: Preparar Dados de Teste**
```sql
-- Criar 15 anotações de teste
INSERT INTO agente_anotacoes (tipo, titulo, anotacao, urgencia, categoria, tags, created_at)
VALUES 
('problema_tecnico', 'Acesso negado', 'Não consigo acessar', 'alta', 'tecnico', ARRAY['acesso'], NOW() - INTERVAL '2 days'),
('problema_tecnico', 'Login falhou', 'Erro ao fazer login', 'alta', 'tecnico', ARRAY['login'], NOW() - INTERVAL '3 days'),
('sugestao', 'Trilha longa', 'Trilha de compliance muito longa', 'media', 'trilha', ARRAY['compliance'], NOW() - INTERVAL '1 day'),
('sugestao', 'Dividir módulos', 'Sugestão de dividir em módulos', 'media', 'trilha', ARRAY['compliance'], NOW() - INTERVAL '4 days'),
... (mais 11 anotações)
```

**PASSO 2: Executar Workflow Manualmente**
1. Abrir workflow "Análise Diária de Padrões" no N8N
2. Clicar em "Execute Workflow"
3. Acompanhar execução nó por nó

**PASSO 3: Validações**
- [ ] Cron Trigger está ativo
- [ ] Busca retorna 15+ anotações
- [ ] Preparação agrupa corretamente
- [ ] GPT-4 retorna JSON válido
- [ ] Padrões identificados (ex: "Problemas de acesso recorrentes")
- [ ] Melhorias sugeridas (2-5 itens)
- [ ] Melhorias salvas no banco

**Verificar no banco:**
```sql
SELECT * FROM onboarding_improvements 
WHERE tipo = 'ia_analise_padroes' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Output Esperado:**
```
titulo: "Revisar sistema de autenticação - múltiplos relatos de problemas"
categoria: "tecnico"
prioridade: "alta"
evidencias: ["5 relatos de acesso negado em 7 dias", "Pico de problemas nas últimas 48h"]
```

---

### **✅ CRITÉRIOS DE ACEITE (SUBTAREFA 3.1-3.3)**

- [ ] Workflow executa automaticamente às 9h diariamente
- [ ] Busca retorna anotações dos últimos 7 dias
- [ ] GPT-4 identifica padrões reais
- [ ] Melhorias sugeridas são acionáveis
- [ ] Salvamento no banco sem erros
- [ ] Administradores notificados
- [ ] Logs de execução completos

---

## **4.5.4. Anotações Proativas (Auto-geradas)** (2-3h)

### **📌 CONTEXTO**
**Status Atual:** Anotações criadas apenas quando colaborador envia mensagem  
**Objetivo:** IA gera anotações automaticamente detectando padrões de comportamento  
**Benefício:** Identificação precoce de problemas, anotações 4x mais frequentes

---

### **📝 SUBTAREFA 4.1: Workflow de Monitoramento** (1.5h)

#### **PASSO 1: Criar Novo Workflow**

**Configuração:**
- **Nome:** `Monitoramento Proativo de Comportamento`
- **Descrição:** Detecta padrões de comportamento e gera anotações automáticas

#### **PASSO 2: Cron Trigger (4x por dia)**

**Configuração:**
- **Expression:** `0 */6 * * *` (0h, 6h, 12h, 18h)
- **Timezone:** America/Sao_Paulo

#### **PASSO 3: Buscar Colaboradores Ativos**

**HTTP Request:**
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/colaboradores/ativos?onboarding=true`

#### **PASSO 4: Analisar Comportamento (Code Node)**

**Nome:** `Detectar Padrões de Comportamento`

**Código:**
```javascript
const colaboradores = $input.first().json.colaboradores || [];
const anotacoesProativas = [];

for (const colab of colaboradores) {
  const padroes = [];
  
  // ========== PADRÃO 1: INATIVIDADE ==========
  if (colab.dias_sem_interacao >= 5) {
    padroes.push({
      tipo: 'inatividade',
      urgencia: colab.dias_sem_interacao >= 7 ? 'alta' : 'media',
      categoria: 'engajamento',
      subcategoria: 'inatividade-prolongada',
      titulo: `Inatividade detectada: ${colab.dias_sem_interacao} dias sem interação`,
      anotacao: `Colaborador ${colab.name} está ${colab.dias_sem_interacao} dias sem interagir com o sistema. Última atividade: ${colab.ultima_atividade}`,
      tags: ['inatividade', 'risco-evasao', 'proativo', 'automatico'],
      acao_sugerida: `Contato proativo: verificar se colaborador está com dificuldades ou precisa de suporte`,
      impacto_estimado: 'alto'
    });
  }
  
  // ========== PADRÃO 2: PROGRESSO EXCEPCIONAL ==========
  if (colab.trilhas_concluidas_7dias >= 3) {
    padroes.push({
      tipo: 'progresso_excepcional',
      urgencia: 'baixa',
      categoria: 'desempenho',
      subcategoria: 'alto-engajamento',
      titulo: `Progresso excepcional: ${colab.trilhas_concluidas_7dias} trilhas em 7 dias`,
      anotacao: `Colaborador ${colab.name} demonstra alto engajamento, concluindo ${colab.trilhas_concluidas_7dias} trilhas em apenas 7 dias.`,
      tags: ['progresso-excepcional', 'alto-engajamento', 'talento', 'proativo'],
      acao_sugerida: `Considerar para mentoria de novos colaboradores ou projetos desafiadores`,
      impacto_estimado: 'medio'
    });
  }
  
  // ========== PADRÃO 3: SENTIMENTO NEGATIVO RECORRENTE ==========
  if (colab.dias_sentimento_negativo >= 3) {
    padroes.push({
      tipo: 'sentimento_persistente',
      urgencia: 'alta',
      categoria: 'bem-estar',
      subcategoria: 'sentimento-negativo-recorrente',
      titulo: `Sentimento negativo por ${colab.dias_sentimento_negativo} dias consecutivos`,
      anotacao: `Colaborador ${colab.name} apresenta sentimento negativo há ${colab.dias_sentimento_negativo} dias. Possível sinal de desmotivação ou problemas no onboarding.`,
      tags: ['sentimento-negativo', 'risco-turnover', 'urgente', 'proativo'],
      acao_sugerida: `Intervenção urgente: RH deve entrar em contato para entender causas e oferecer suporte`,
      impacto_estimado: 'critico'
    });
  }
  
  // ========== PADRÃO 4: ACESSO FREQUENTE SEM CONCLUSÃO ==========
  if (colab.acessos_ultimos_7dias >= 10 && colab.trilhas_concluidas_7dias === 0) {
    padroes.push({
      tipo: 'dificuldade_trilha',
      urgencia: 'media',
      categoria: 'aprendizagem',
      subcategoria: 'bloqueio-conclusao',
      titulo: `${colab.acessos_ultimos_7dias} acessos mas 0 trilhas concluídas`,
      anotacao: `Colaborador ${colab.name} acessou o sistema ${colab.acessos_ultimos_7dias} vezes nos últimos 7 dias mas não concluiu nenhuma trilha. Possível dificuldade de compreensão ou bloqueio técnico.`,
      tags: ['dificuldade', 'bloqueio', 'sem-conclusao', 'proativo'],
      acao_sugerida: `Contato de suporte: verificar se há dúvidas ou dificuldades específicas`,
      impacto_estimado: 'medio'
    });
  }
  
  // ========== PADRÃO 5: RISCO DE EVASÃO (COMBO) ==========
  if (colab.dias_sem_interacao >= 5 && 
      colab.sentimento_atual === 'negativo' && 
      colab.progresso_onboarding < 50) {
    padroes.push({
      tipo: 'risco_evasao',
      urgencia: 'critica',
      categoria: 'retencao',
      subcategoria: 'risco-alto-evasao',
      titulo: `RISCO ALTO: Inatividade + sentimento negativo + baixo progresso`,
      anotacao: `ALERTA: Colaborador ${colab.name} apresenta múltiplos sinais de risco de evasão: ${colab.dias_sem_interacao} dias inativo, sentimento negativo, apenas ${colab.progresso_onboarding}% de progresso.`,
      tags: ['risco-critico', 'evasao', 'intervencao-urgente', 'proativo'],
      acao_sugerida: `URGENTE: Gestor direto + RH devem entrar em contato imediatamente. Considerar 1:1 emergencial.`,
      impacto_estimado: 'critico'
    });
  }
  
  // Adicionar anotações deste colaborador
  if (padroes.length > 0) {
    anotacoesProativas.push(...padroes.map(p => ({
      ...p,
      colaborador_id: colab.id,
      colaborador_nome: colab.name,
      tenant_id: colab.tenant_id,
      gerado_automaticamente: true,
      detectado_em: new Date().toISOString()
    })));
  }
}

return [{ 
  json: { 
    total_colaboradores: colaboradores.length,
    anotacoes_geradas: anotacoesProativas.length,
    anotacoes: anotacoesProativas 
  } 
}];
```

#### **PASSO 5: Enriquecer com GPT-4 (Loop)**

**HTTP Request (dentro de Loop):**
```json
{
  "model": "gpt-4o-mini",
  "max_tokens": 300,
  "temperature": 0.4,
  "messages": [
    {
      "role": "system",
      "content": "Você enriquece anotações proativas com insights adicionais."
    },
    {
      "role": "user",
      "content": "Anotação: {{ $json.anotacao }}\n\nTipo: {{ $json.tipo }}\nCategoria: {{ $json.categoria }}\n\nAdicione:\n1. Tags extras relevantes (3-5)\n2. Insights comportamentais\n3. Prioridade de revisão (alta/media/baixa)\n\nRetorne JSON: {\"tags_extras\": [], \"insights\": \"\", \"prioridade_revisao\": \"\"}"
    }
  ]
}
```

#### **PASSO 6: Salvar Anotações Proativas**

**HTTP Request:**
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/agente/anotacoes/proativa`
- **Body:** `{{ $json }}`

---

### **📝 SUBTAREFA 4.2: Backend - Endpoint Proativo** (0.5h)

**Arquivo:** `src/routes/agente-anotacoes.js`

**Código:**
```javascript
// POST /api/agente/anotacoes/proativa
router.post('/proativa', authenticate, async (req, res) => {
  try {
    const anotacoes = Array.isArray(req.body) ? req.body : [req.body];
    const resultados = [];

    for (const anot of anotacoes) {
      const result = await query(
        `INSERT INTO agente_anotacoes (
          tipo, titulo, anotacao, urgencia, categoria, subcategoria,
          tags, acao_sugerida, impacto_estimado,
          colaborador_id, tenant_id, 
          proativa, gerado_automaticamente, contexto, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, true, $12, NOW())
        RETURNING *`,
        [
          anot.tipo,
          anot.titulo,
          anot.anotacao,
          anot.urgencia,
          anot.categoria,
          anot.subcategoria,
          anot.tags,
          anot.acao_sugerida,
          anot.impacto_estimado,
          anot.colaborador_id,
          anot.tenant_id,
          JSON.stringify({
            padrao_detectado: anot.tipo,
            detectado_em: anot.detectado_em,
            insights: anot.insights || '',
            prioridade_revisao: anot.prioridade_revisao || 'media'
          })
        ]
      );

      // Se urgência crítica, notificar imediatamente
      if (anot.urgencia === 'critica') {
        await query(
          `INSERT INTO notificacoes (
            tipo, titulo, descricao, urgencia, destinatarios, created_at
          ) VALUES ($1, $2, $3, 'critica', $4, NOW())`,
          [
            'anotacao_proativa_critica',
            `[URGENTE] ${anot.titulo}`,
            anot.anotacao,
            JSON.stringify(['admin', 'rh'])
          ]
        );
      }

      resultados.push(result.rows[0]);
    }

    res.json({
      success: true,
      anotacoes_criadas: resultados.length,
      anotacoes: resultados
    });

  } catch (error) {
    console.error('Erro ao salvar anotações proativas:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/colaboradores/ativos
router.get('/ativos', authenticate, async (req, res) => {
  try {
    const { onboarding } = req.query;
    const tenantId = req.user.tenant_id;

    const result = await query(`
      SELECT 
        u.id, u.name, u.email, u.phone,
        u.tenant_id, u.sentimento_atual,
        COALESCE(DATE_PART('day', NOW() - MAX(ch.created_at)), 0) as dias_sem_interacao,
        MAX(ch.created_at) as ultima_atividade,
        COUNT(DISTINCT CASE WHEN ct.status = 'concluida' AND ct.concluded_at >= NOW() - INTERVAL '7 days' THEN ct.id END) as trilhas_concluidas_7dias,
        COUNT(DISTINCT CASE WHEN al.created_at >= NOW() - INTERVAL '7 days' THEN al.id END) as acessos_ultimos_7dias,
        COALESCE(
          (SELECT COUNT(*) FROM colaborador_sentimentos cs 
           WHERE cs.user_id = u.id 
           AND cs.sentimento IN ('negativo', 'muito_negativo')
           AND cs.created_at >= NOW() - INTERVAL '3 days'), 
          0
        ) as dias_sentimento_negativo,
        ROUND(COALESCE(AVG(ct.progresso), 0)) as progresso_onboarding
      FROM users u
      LEFT JOIN conversation_history ch ON ch.user_id = u.id
      LEFT JOIN colaborador_trilhas ct ON ct.colaborador_id = u.id
      LEFT JOIN access_logs al ON al.user_id = u.id
      WHERE u.tenant_id = $1
      ${onboarding ? "AND EXISTS (SELECT 1 FROM colaborador_trilhas WHERE colaborador_id = u.id AND status != 'concluida')" : ''}
      GROUP BY u.id
      HAVING COALESCE(DATE_PART('day', NOW() - MAX(ch.created_at)), 0) >= 0
      ORDER BY dias_sem_interacao DESC
    `, [tenantId]);

    res.json({
      success: true,
      colaboradores: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar colaboradores ativos:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### **📝 SUBTAREFA 4.3: Testes Proativos** (0.5h)

#### **TESTE 1: Inatividade**

**Setup:**
```sql
-- Colaborador inativo há 6 dias
UPDATE users SET last_activity = NOW() - INTERVAL '6 days' WHERE id = 'UUID_TESTE';
```

**Executar workflow → Validar:**
- [ ] Padrão "inatividade" detectado
- [ ] Urgência = "media"
- [ ] Tags: ["inatividade", "risco-evasao"]
- [ ] Anotação salva com `proativa = true`

---

#### **TESTE 2: Progresso Excepcional**

**Setup:**
```sql
-- Colaborador com 4 trilhas concluídas em 5 dias
INSERT INTO colaborador_trilhas (colaborador_id, trilha_id, status, concluded_at)
VALUES 
('UUID_TESTE', 'trilha1', 'concluida', NOW() - INTERVAL '1 day'),
('UUID_TESTE', 'trilha2', 'concluida', NOW() - INTERVAL '2 days'),
('UUID_TESTE', 'trilha3', 'concluida', NOW() - INTERVAL '3 days'),
('UUID_TESTE', 'trilha4', 'concluida', NOW() - INTERVAL '4 days');
```

**Executar workflow → Validar:**
- [ ] Padrão "progresso_excepcional" detectado
- [ ] Ação sugerida: "Considerar para mentoria"
- [ ] Tags: ["talento", "alto-engajamento"]

---

### **✅ CRITÉRIOS DE ACEITE (SUBTAREFA 4.1-4.3)**

- [ ] Workflow executa 4x por dia (0h, 6h, 12h, 18h)
- [ ] 5 padrões diferentes detectados corretamente
- [ ] GPT-4o-mini enriquece anotações em < 1s
- [ ] Anotações salvas com flag `proativa = true`
- [ ] Urgência crítica dispara notificação imediata
- [ ] Logs de detecção completos
- [ ] Testes passam com 100% de precisão

---

# 📋 **ÍNDICE DE IMPLEMENTAÇÕES COMPLEMENTARES**

## **FASE 1: Trilhas Inteligentes** (4-6h)

### **1.1. N8N Workflow - Trilhas Personalizadas** (3h)

**Contexto:** Personalizar trilhas recomendadas baseado no cargo e departamento do colaborador.

**Implementação:**

1. **Buscar dados do colaborador:**
```javascript
// Code Node: Buscar Perfil
const from = $('Merge').item.json.from;

const response = await axios.get(
  `${BACKEND_URL}/api/colaboradores/perfil/${from}`
);

const perfil = response.data;
return [{ 
  json: { 
    cargo: perfil.cargo,
    departamento: perfil.departamento,
    nivel: perfil.nivel || 'junior'
  } 
}];
```

2. **Buscar trilhas aplicáveis:**
```javascript
// HTTP Request
GET /api/trilhas/disponiveis/:colaboradorId?cargo=${cargo}&dept=${departamento}
```

3. **Atualizar prompt do AI Agent:**
```javascript
// Adicionar ao system prompt
TRILHAS RECOMENDADAS PARA ESTE PERFIL:
- Cargo: {{ cargo }}
- Departamento: {{ departamento }}
- Trilhas disponíveis: {{ trilhas_disponiveis }}

SEMPRE mencione trilhas específicas do cargo quando recomendar.
```

**Critérios de Aceite:**
- [ ] Colaboradores de TI veem trilhas técnicas
- [ ] Colaboradores de RH veem trilhas de compliance
- [ ] Trilhas "para todos" aparecem para qualquer perfil

---

## **TESTES E VALIDAÇÃO** (4-6h)

### **Integração** (4 tarefas - 2h)

**Teste 1: Fluxo Completo**
```
WhatsApp Message → Sentiment Analysis → Categorização IA → 
Detecção Urgência → Salvar Anotação → Análise Padrões → Melhorias
```

**Script de Teste:**
```bash
# 1. Enviar 10 mensagens variadas via WhatsApp
# 2. Verificar cada etapa do fluxo
# 3. Validar saída final

# Verificação no banco:
psql -d navigator -c "
  SELECT 
    COUNT(*) as total_anotacoes,
    COUNT(*) FILTER (WHERE urgencia = 'critica') as criticas,
    COUNT(*) FILTER (WHERE proativa = true) as proativas
  FROM agente_anotacoes 
  WHERE created_at >= NOW() - INTERVAL '1 hour';
"
```

**Critérios:**
- [ ] 0 erros em 10 mensagens consecutivas
- [ ] Latência média < 3 segundos
- [ ] 100% das mensagens processadas

---

### **Performance** (4 tarefas - 2h)

**Benchmark de Análise de Sentimento:**
```javascript
// Teste de carga
const messages = Array(100).fill(null).map((_, i) => ({
  text: `Mensagem de teste ${i}`,
  from: '5562917084'
}));

const start = Date.now();
await Promise.all(messages.map(m => analyzeSentiment(m)));
const end = Date.now();

console.log(`100 análises em ${end - start}ms`);
console.log(`Média: ${(end - start) / 100}ms por análise`);
```

**Metas:**
- [ ] < 500ms por análise de sentimento
- [ ] < 1s por categorização IA
- [ ] < 3s por análise de padrões (GPT-4)

---

## **PREPARAÇÃO PARA PRODUÇÃO** (6-8h)

### **Infraestrutura** (5 tarefas - 3h)

**1. Rate Limiting:**
```javascript
// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // 100 requests
  message: 'Muitas requisições. Tente novamente em 15 minutos.'
});

app.use('/api/', apiLimiter);
```

**2. Monitoramento de Erros (Sentry):**
```javascript
// src/server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**3. Logs Estruturados:**
```javascript
// src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = logger;
```

**Critérios:**
- [ ] Rate limiting ativo (100 req/15min)
- [ ] Sentry capturando erros
- [ ] Logs em JSON estruturado
- [ ] Alertas configurados (Slack/Email)

---

## 📝 **TROUBLESHOOTING COMUM**

### **Erro: "OpenAI API Key inválida"**

**Sintomas:** Code Node falha com erro 401

**Solução:**
1. Verificar key: https://platform.openai.com/api-keys
2. Atualizar no código do Code Node
3. Testar com curl:
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer sk-proj-SUA_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'
```

---

### **Erro: "Paired item data unavailable"**

**Sintomas:** N8N não encontra dados de nó anterior

**Solução:**
1. Verificar nome exato do nó (case-sensitive)
2. Usar `$input.first().json` em vez de `$()`
3. Adicionar logs: `console.log('Data:', $input.all())`

---

### **Erro: "Backend endpoint não encontrado (404)"**

**Sintomas:** HTTP Request retorna 404

**Solução:**
1. Verificar rota registrada no server.js
2. Testar endpoint localmente:
```bash
curl http://localhost:3000/api/agente/anotacoes
```
3. Verificar URL no N8N: usar `{{ $('BACKEND_URL').item.json.url }}`

---

## 📊 **CHECKLISTS RÁPIDOS**

### **✅ Checklist: Antes de Implementar**
- [ ] OpenAI API Key configurada e válida
- [ ] Backend rodando (local ou produção)
- [ ] N8N acessível e com credenciais
- [ ] Banco de dados atualizado (migrações)
- [ ] Documentação lida e entendida

### **✅ Checklist: Durante Implementação**
- [ ] Testar cada nó isoladamente
- [ ] Validar output JSON de cada etapa
- [ ] Adicionar logs para debugging
- [ ] Commitar código frequentemente
- [ ] Documentar decisões importantes

### **✅ Checklist: Após Implementação**
- [ ] Executar todos os testes
- [ ] Validar performance (< 3s)
- [ ] Verificar logs de erro (0 erros)
- [ ] Atualizar documentação
- [ ] Deploy em produção
- [ ] Monitorar primeiras 24h

---

## 🎯 **RESUMO EXECUTIVO**

### **Fase 4.5 Completa:**
- **Tempo Total:** 6-8 horas
- **Subtarefas:** 12 subtarefas
- **Endpoints Novos:** 5 endpoints
- **Workflows N8N:** 3 workflows
- **Impacto:** Anotações BÁSICAS → INTELIGENTES

### **Benefícios Quantificáveis:**
- ✅ **Precisão:** 60% → 90% (+50%)
- ✅ **Velocidade:** Resposta a problemas 70% mais rápida
- ✅ **Cobertura:** 4x mais anotações (proativas)
- ✅ **Insights:** Padrões identificados automaticamente
- ✅ **Autonomia:** 80% das ações automáticas

---

*Última atualização: 14 de outubro de 2025*  
*Status: Pronto para implementação*  
*Próximo: Fase 4.5.1 - Categorização Inteligente*

