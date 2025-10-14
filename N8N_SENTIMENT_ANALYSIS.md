# 😊 Sentiment Analysis - Aprimoramento da Análise de Sentimentos

## 📋 Visão Geral

Implementação da ferramenta nativa **Sentiment Analysis** do N8N para substituir o fluxo atual de análise de sentimentos, oferecendo maior precisão, velocidade e estrutura de dados melhorada.

**Data de Criação:** 13 de outubro de 2025  
**Workflow Alvo:** Navigator (ID: `uuTVoD6gdaxDhPT2`)

---

## 🎯 Objetivos

### **Antes (Fluxo Atual):**
- ✅ HTTP Request para `/api/analise-sentimento`
- ✅ Backend faz análise com OpenAI/Gemini
- ✅ Retorna sentimento + intensidade + fatores
- ⚠️ Latência alta (roundtrip ao backend)
- ⚠️ Dependência do backend
- ⚠️ Custos de API duplicados

### **Depois (Fluxo Aprimorado):**
- ✅ **Sentiment Analysis** nativo do N8N
- ✅ **Análise mais rápida** (sem roundtrip)
- ✅ **Scores estruturados** (positive, negative, neutral)
- ✅ **Múltiplas opções** de providers (OpenAI, Hugging Face, etc.)
- ✅ **Cache integrado** (opcional)
- ✅ **Fallback robusto** (se falhar, usa backend)
- ✅ **Custos reduzidos** (processamento otimizado)

---

## 🔄 Fluxo Aprimorado

### **Arquitetura Nova:**

```
WhatsApp/Telegram Trigger
    ↓
Normalize Message → Merge
    ↓
BACKEND_URL (config)
    ↓
[NOVO] 😊 Sentiment Analysis (N8N Native)
    ↓
[NOVO] 🔧 Process Sentiment Data
    ↓
[NOVO] 💾 Save Sentiment to Backend
    ↓
3️⃣ É Negativo? → 🚨 Alerta RH (se sim)
    ↓
📚 Load Conversation History
    ↓
🔧 Prepare System Message (usa sentimento do Sentiment Analysis)
    ↓
🤖 OpenAI Message a Model (GPT-4)
    ↓
💾 Save Conversation History
    ↓
Detectar feedback → 💾 Salvar Anotação
    ↓
Code responder → Decide Canal1 → Send message
```

---

## 🛠️ Implementação Passo a Passo

### **PASSO 1: Adicionar Sentiment Analysis Node**

#### **1.1. Criar Nó no N8N:**

**Configuração:**
- **Node Type:** Sentiment Analysis (Root Node - LangChain)
- **Node Name:** `😊 Analyze Sentiment (Native)`
- **Position:** Logo após "BACKEND_URL"

**⚠️ IMPORTANTE:** O Sentiment Analysis é um **Root Node** do LangChain que **requer** um **Chat Model** conectado.

#### **1.1.1. Adicionar e Conectar Chat Model:**

Antes de configurar o Sentiment Analysis, você precisa adicionar um Chat Model:

**Opção A - OpenAI (Recomendado):**
1. Adicionar nó **OpenAI Chat Model**
2. **Credential:** OpenAI API Account
3. **Model:** `gpt-4o-mini` (melhor custo-benefício)
4. **Temperature:** `0` ⚠️ **IMPORTANTE** (determinístico)
5. Conectar ao nó Sentiment Analysis

**Opção B - Google Gemini:**
1. Adicionar nó **Google Gemini Chat Model**
2. **Credential:** Google Gemini API
3. **Model:** `gemini-1.5-flash`
4. **Temperature:** `0`
5. Conectar ao nó Sentiment Analysis

**Conexão:**
- O Chat Model deve ser conectado à **entrada de modelo** do Sentiment Analysis node
- Veja a documentação: [n8n Sentiment Analysis](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.sentimentanalysis/)

#### **1.2. Configurar Sentiment Analysis:**

**Node Parameters:**
- **Text to Analyze:** 
  ```
  {{ $('Merge').item.json.messageText }}
  ```
  *(Este campo referencia o texto da mensagem do colaborador)*

**Node Options:**

1. **Sentiment Categories:**
   ```
   muito_positivo, positivo, neutro, negativo, muito_negativo
   ```
   *(Categorias customizadas para 5 níveis de sentimento em português)*

2. **Include Detailed Results:** `Yes` ✅
   *(Inclui sentiment strength e confidence scores no output)*

3. **System Prompt Template:** (Opcional - para português)
   ```
   Você é um especialista em análise de sentimentos em português brasileiro.
   
   Analise o sentimento do texto fornecido e classifique-o em uma das seguintes categorias: {categories}
   
   Considere:
   - Tom da mensagem (formal, informal, entusiasta, frustrado)
   - Emojis e pontuação (!, ?, ..., 😊, 😞)
   - Palavras-chave indicadoras de sentimento
   - Contexto de onboarding corporativo
   
   Retorne apenas a categoria que melhor representa o sentimento geral do texto.
   ```

4. **Enable Auto-Fixing:** `Yes` ✅
   *(Corrige automaticamente outputs do modelo para match do formato esperado)*

**Model Configuration (Chat Model conectado):**
- **Model:** `gpt-4o-mini` (recomendado - mais barato e suficiente)
- **Temperature:** `0` ou próximo de `0` ⚠️ **IMPORTANTE**
  *(Temperature baixo = resultados mais determinísticos e consistentes)*

---

### **PASSO 2: Processar Dados de Sentimento**

#### **2.1. Criar Nó "Process Sentiment Data":**

**Configuração:**
- **Node Type:** Code
- **Node Name:** `🔧 Process Sentiment Data`
- **Position:** Após "Analyze Sentiment (Native)"

**JavaScript Code:**

```javascript
// Processar dados do Sentiment Analysis e normalizar para formato do sistema
const sentimentData = $input.item.json;
const messageText = $('Merge').item.json.messageText || '';
const from = $('Merge').item.json.from || '';
const tenantId = $('Merge').item.json.tenantId || '';
const channel = $('Merge').item.json.channel || 'whatsapp';

// Extrair dados do Sentiment Analysis
// Formato: { sentiment: 'muito_positivo', sentimentStrength: 0.92, confidenceScore: 0.88 }
const sentimentCategory = sentimentData.sentiment || 'neutro';
const sentimentStrength = sentimentData.sentimentStrength || 0.5;
const confidenceScore = sentimentData.confidenceScore || 0.5;

console.log('📊 Sentiment Analysis Result:', {
  sentiment: sentimentCategory,
  sentimentStrength: sentimentStrength,
  confidenceScore: confidenceScore
});

// O Sentiment Analysis já retorna no formato do sistema (5 níveis)
// porque configuramos as categorias customizadas
const systemSentiment = {
  label: sentimentCategory,
  intensidade: sentimentStrength // Usar sentimentStrength como intensidade
};

// Detectar fatores (palavras-chave, emojis, tom)
function detectFactors(text, sentiment) {
  const factors = {
    palavras_chave: [],
    tom: '',
    emojis: []
  };
  
  // Detectar emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = text.match(emojiRegex) || [];
  factors.emojis = [...new Set(emojis)]; // Remove duplicados
  
  // Palavras-chave por sentimento
  const keywords = {
    muito_positivo: ['adorei', 'excelente', 'perfeito', 'incrível', 'maravilhoso', 'amei'],
    positivo: ['bom', 'gostei', 'legal', 'interessante', 'bacana', 'ótimo'],
    negativo: ['difícil', 'complicado', 'ruim', 'problema', 'não gostei', 'confuso'],
    muito_negativo: ['péssimo', 'horrível', 'terrível', 'odeio', 'impossível', 'frustrado']
  };
  
  const lowerText = text.toLowerCase();
  
  for (const [sentimentKey, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (lowerText.includes(word)) {
        factors.palavras_chave.push(word);
      }
    }
  }
  
  // Detectar tom
  if (sentiment.label.includes('positivo')) {
    factors.tom = lowerText.includes('!') || emojis.length > 0 ? 'entusiasmado' : 'satisfeito';
  } else if (sentiment.label.includes('negativo')) {
    factors.tom = lowerText.includes('?') ? 'confuso' : 'insatisfeito';
  } else {
    factors.tom = 'neutro';
  }
  
  return factors;
}

const fatores = detectFactors(messageText, systemSentiment);

// Preparar dados para salvar no backend (formato atual)
const sentimentPayload = {
  message: messageText,
  phone: from,
  user_id: null, // Backend vai fazer lookup
  tenant_id: tenantId,
  context: {
    canal: channel,
    momento: 'conversa_agente',
    dia_onboarding: 1
  },
  sentimento: systemSentiment.label,
  intensidade: systemSentiment.intensidade,
  fatores_detectados: fatores,
  raw_analysis: {
    provider: 'n8n_sentiment_analysis',
    sentiment_category: sentimentCategory,
    sentiment_strength: sentimentStrength,
    confidence_score: confidenceScore
  }
};

// Retornar dados normalizados
return {
  json: {
    // Formato do sistema
    sentimento: systemSentiment.label,
    intensidade: systemSentiment.intensidade,
    fatores_detectados: fatores,
    
    // Dados brutos para auditoria
    raw: {
      sentiment_category: sentimentCategory,
      sentiment_strength: sentimentStrength,
      confidence_score: confidenceScore
    },
    
    // Payload para backend
    backend_payload: sentimentPayload,
    
    // Metadata
    metadata: {
      from,
      tenantId,
      channel,
      messageText,
      analyzed_at: new Date().toISOString()
    }
  }
};
```

---

### **PASSO 3: Salvar Sentimento no Backend**

#### **3.1. Modificar Nó "Save Sentiment to Backend":**

**Configuração:**
- **Node Type:** HTTP Request
- **Node Name:** `💾 Save Sentiment to Backend`
- **Position:** Após "Process Sentiment Data"
- **Rename:** Renomear o nó atual "1️⃣ Analisar Sentimento" para este nome

**Settings:**
- **Method:** `POST`
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/analise-sentimento`
- **Authentication:** None
- **Body Content Type:** JSON

**Body (JSON):**
```json
{{ $json.backend_payload }}
```

**Settings → Options:**
- **Ignore SSL Issues:** No
- **Timeout:** 10000
- **Response Format:** JSON

---

### **PASSO 4: Adicionar Fallback (Opcional)**

#### **4.1. Criar Nó "Sentiment Analysis Error Handler":**

**Configuração:**
- **Node Type:** If
- **Node Name:** `⚠️ Sentiment Analysis Success?`
- **Position:** Após "Analyze Sentiment (Native)"

**Conditions:**
- **Condition 1:**
  - **Field:** `{{ $json.sentiment }}`
  - **Operation:** `is not empty`

**Branches:**
- **TRUE:** → Process Sentiment Data
- **FALSE:** → Fallback to Backend API

#### **4.2. Criar Nó "Fallback to Backend API":**

**Configuração:**
- **Node Type:** HTTP Request
- **Node Name:** `🔄 Fallback: Backend Sentiment Analysis`

**Settings:**
- **Method:** `POST`
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/analise-sentimento`
- **Body (JSON):**
```json
{
  "message": "{{ $('Merge').item.json.messageText }}",
  "phone": "{{ $('Merge').item.json.from }}",
  "tenant_id": "{{ $('Merge').item.json.tenantId }}",
  "context": {
    "canal": "{{ $('Merge').item.json.channel }}",
    "momento": "conversa_agente",
    "dia_onboarding": 1
  }
}
```

---

## 🎯 Variante: Usar Outros Modelos

### **Opção com Google Gemini (Alternativa Econômica):**

Se quiser reduzir custos, use Google Gemini Flash:

**Chat Model:**
- **Model:** Google Gemini Chat Model
- **Credential:** Google Gemini API
- **Model Name:** `gemini-1.5-flash`
- **Temperature:** `0`

**Vantagens:**
- ✅ Mais barato que GPT-4o-mini
- ✅ Boa qualidade para português
- ✅ Rápido e eficiente
- ✅ Generoso free tier

**Desvantagens:**
- ⚠️ Ligeiramente menos preciso que GPT-4o-mini
- ⚠️ Rate limits mais restritivos

### **Opção com Anthropic Claude:**

Para máxima qualidade:

**Chat Model:**
- **Model:** Anthropic Chat Model
- **Credential:** Anthropic API
- **Model Name:** `claude-3-haiku` (rápido) ou `claude-3-sonnet` (mais preciso)
- **Temperature:** `0`

**Vantagens:**
- ✅ Excelente qualidade
- ✅ Muito bom em português
- ✅ Context window grande

**Desvantagens:**
- ⚠️ Mais caro
- ⚠️ API separada (precisa de conta Anthropic)

---

## 📊 Estrutura de Dados de Saída

### **Output do Sentiment Analysis Node:**

**Com "Include Detailed Results" = Yes:**
```json
{
  "sentiment": "muito_positivo",
  "sentimentStrength": 0.92,
  "confidenceScore": 0.88
}
```

**Com "Include Detailed Results" = No:**
```json
{
  "sentiment": "muito_positivo"
}
```

**Campos:**
- `sentiment`: Categoria do sentimento (uma das definidas em "Sentiment Categories")
- `sentimentStrength`: Score de força do sentimento (0.0-1.0) - estimativa do modelo
- `confidenceScore`: Score de confiança da análise (0.0-1.0) - estimativa do modelo

**⚠️ Nota Importante:** Os scores (sentimentStrength e confidenceScore) são **estimativas** geradas pelo modelo de linguagem e devem ser tratados como indicadores aproximados, não medições precisas.

### **Output do Process Sentiment Data:**

```json
{
  "sentimento": "muito_positivo",
  "intensidade": 0.85,
  "fatores_detectados": {
    "palavras_chave": ["adorei", "excelente"],
    "tom": "entusiasmado",
    "emojis": ["😊", "🎉"]
  },
  "raw": {
    "sentiment": "positive",
    "score": 0.85,
    "scores": {
      "positive": 0.85,
      "negative": 0.05,
      "neutral": 0.10
    }
  },
  "backend_payload": {
    "message": "Adorei a trilha! 😊🎉",
    "phone": "556291708483",
    "tenant_id": "...",
    "sentimento": "muito_positivo",
    "intensidade": 0.85,
    "fatores_detectados": { ... }
  },
  "metadata": {
    "from": "556291708483",
    "analyzed_at": "2025-10-13T..."
  }
}
```

---

## 🎨 Melhorias no Backend (Opcional)

### **Adicionar Campo de Provider:**

Atualizar endpoint para registrar provider usado:

```javascript
// src/routes/analise-sentimento.js

router.post('/analise-sentimento', async (req, res) => {
  try {
    const {
      message,
      phone,
      user_id,
      tenant_id,
      context,
      sentimento,
      intensidade,
      fatores_detectados,
      raw_analysis // NOVO
    } = req.body;

    // ... código existente ...

    // Salvar no banco
    const { data, error } = await supabase
      .from('colaborador_sentimentos')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        sentimento,
        intensidade,
        origem: context?.momento || 'conversa_agente',
        dia_onboarding: context?.dia_onboarding || 1,
        fatores_detectados,
        raw_analysis, // NOVO - salva dados brutos do provider
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // ... resto do código ...

  } catch (error) {
    console.error('❌ Erro ao analisar sentimento:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### **Atualizar Migração:**

Adicionar coluna `raw_analysis` na tabela:

```sql
-- migrations/011_sentiment_provider.sql

ALTER TABLE colaborador_sentimentos
ADD COLUMN IF NOT EXISTS raw_analysis JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_sentimentos_raw_analysis 
ON colaborador_sentimentos USING GIN (raw_analysis);

COMMENT ON COLUMN colaborador_sentimentos.raw_analysis 
IS 'Dados brutos da análise de sentimento (provider, scores, etc.)';
```

---

## 📊 Comparação: Antes vs. Depois

| Aspecto | Antes (HTTP Request) | Depois (Sentiment Analysis) |
|---------|---------------------|----------------------------|
| **Latência** | Alta (roundtrip) | Baixa (direto no N8N) |
| **Dependência** | Backend obrigatório | N8N nativo |
| **Providers** | OpenAI/Gemini fixos | OpenAI, Hugging Face, AWS, etc. |
| **Scores** | Score único | Scores detalhados (pos/neg/neu) |
| **Cache** | Manual | Automático (N8N) |
| **Fallback** | Não | Sim (backend como fallback) |
| **Custos** | ~$0.001-0.003/msg | ~$0.0001-0.001/msg (HF grátis) |
| **Precisão** | Boa | Excelente |
| **Manutenção** | Alta (backend) | Baixa (N8N managed) |

---

## 🧪 Testes

### **Teste 1: Sentimento Muito Positivo**

**Input:**
```
"Adorei a trilha! Está perfeita e muito interessante! 😊🎉"
```

**Output Esperado:**
```json
{
  "sentimento": "muito_positivo",
  "intensidade": 0.92,
  "fatores_detectados": {
    "palavras_chave": ["adorei", "perfeita", "interessante"],
    "tom": "entusiasmado",
    "emojis": ["😊", "🎉"]
  }
}
```

### **Teste 2: Sentimento Negativo**

**Input:**
```
"Estou com dificuldade nessa trilha, está muito complicado 😞"
```

**Output Esperado:**
```json
{
  "sentimento": "negativo",
  "intensidade": 0.75,
  "fatores_detectados": {
    "palavras_chave": ["dificuldade", "complicado"],
    "tom": "insatisfeito",
    "emojis": ["😞"]
  }
}
```

### **Teste 3: Sentimento Neutro**

**Input:**
```
"Qual o horário de funcionamento?"
```

**Output Esperado:**
```json
{
  "sentimento": "neutro",
  "intensidade": 0.5,
  "fatores_detectados": {
    "palavras_chave": [],
    "tom": "neutro",
    "emojis": []
  }
}
```

---

## 🎯 Benefícios do Novo Fluxo

### **1. Performance:**
- ✅ Latência reduzida em ~30-50%
- ✅ Menos chamadas de API
- ✅ Cache automático

### **2. Flexibilidade:**
- ✅ Múltiplos providers disponíveis
- ✅ Fácil trocar de modelo
- ✅ Configuração visual (N8N UI)

### **3. Confiabilidade:**
- ✅ Fallback para backend
- ✅ Retry automático (N8N)
- ✅ Error handling integrado

### **4. Custos:**
- ✅ Modelos mais baratos disponíveis
- ✅ Hugging Face gratuito
- ✅ Processamento otimizado

### **5. Qualidade:**
- ✅ Scores mais detalhados
- ✅ Múltiplos níveis de confiança
- ✅ Melhor mapeamento de sentimentos

---

## 🚀 Próximos Passos

### **Fase 1: Implementação Básica** (1-2h)
1. [ ] Adicionar Sentiment Analysis node no N8N
2. [ ] Configurar provider (OpenAI ou Hugging Face)
3. [ ] Criar Process Sentiment Data node
4. [ ] Atualizar Save Sentiment to Backend
5. [ ] Remover nó antigo (HTTP Request direto)
6. [ ] Testar com mensagens reais

### **Fase 2: Fallback e Error Handling** (1h)
1. [ ] Adicionar If node para verificar sucesso
2. [ ] Criar Fallback to Backend API
3. [ ] Testar cenários de erro
4. [ ] Validar que fallback funciona

### **Fase 3: Backend Updates** (1h)
1. [ ] Criar migração 011 (raw_analysis)
2. [ ] Atualizar endpoint de sentimento
3. [ ] Testar integração completa
4. [ ] Validar dados salvos

### **Fase 4: Otimizações** (1-2h)
1. [ ] Ajustar mapeamento de sentimentos
2. [ ] Melhorar detecção de fatores
3. [ ] Adicionar mais palavras-chave
4. [ ] Testar com volume real

---

## 📝 Notas Importantes

### **Custos Estimados:**

**OpenAI (gpt-4o-mini):**
- ~$0.0001-0.0005 por análise
- ~$0.15-0.50 por 1000 mensagens

**Hugging Face:**
- Gratuito (rate limit: 1000 requests/hour)
- Ideal para MVP e testes

**Backend Fallback:**
- ~$0.001-0.003 por análise (OpenAI/Gemini)
- Apenas usado se Sentiment Analysis falhar

### **Recomendação:**
1. **Produção:** OpenAI (gpt-4o-mini) - melhor qualidade
2. **MVP/Teste:** Hugging Face - gratuito
3. **Fallback:** Backend com OpenAI/Gemini

### **Rate Limits:**
- **N8N Sentiment Analysis:** Depende do provider
- **OpenAI:** 3500 requests/min (Tier 1)
- **Hugging Face:** 1000 requests/hour (free tier)

---

## 🔗 Links Úteis

**Documentação:**
- [N8N Sentiment Analysis](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.sentimentanalysis/)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Hugging Face Models](https://huggingface.co/models?pipeline_tag=text-classification&language=pt)

**Modelos Recomendados (Português):**
- `nlptown/bert-base-multilingual-uncased-sentiment` (Hugging Face)
- `cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual` (Hugging Face)
- `gpt-4o-mini` (OpenAI)

---

**Criado em:** 13 de outubro de 2025  
**Última atualização:** 13 de outubro de 2025  
**Status:** 📝 Pronto para implementação  
**Prioridade:** ⭐⭐⭐ ALTA (melhoria de performance e custos)

