# 📦 Workflow Navigator v4.0.0 - Metadata

## 🎯 Informações Gerais

**Versão:** 4.0.0  
**Data:** 2025-10-14  
**Status:** ✅ Produção  
**N8N Version:** 1.113.3 (Cloud)

---

## 📊 Estatísticas do Workflow

| Métrica | Valor |
|---------|-------|
| **Total de Nós** | 44 nós |
| **Triggers** | 3 (WhatsApp, Telegram, Webhook) |
| **Chat Models** | 2 (OpenAI gpt-4o-mini, OpenAI gpt-4o) |
| **Ferramentas (AI Tools)** | 4 |
| **HTTP Requests** | 15 |
| **Code Nodes** | 3 |
| **Conditionals (If/Switch)** | 5 |
| **Sticky Notes** | 4 |

---

## 🔧 Nós Críticos

### **1. OpenAI Chat Model (Sentiment)**
- **ID:** `aa00f3f2-c2f9-4cbc-ba4f-53b065d7da47`
- **Modelo:** gpt-4o-mini (gpt-4.1-mini)
- **Temperature:** 0
- **Max Tokens:** 256
- **Função:** Análise de sentimento com 5 categorias

### **2. Sentiment Analysis**
- **ID:** `1605beea-023d-423d-9ce8-c20f267b5cc5`
- **Input:** `{{ $('Merge').item.json.messageText }}`
- **Categorias:** `muito_positivo, positivo, neutro, negativo, muito_negativo`
- **Options:**
  - includeDetailedResults: true
  - enableAutoFixing: true

### **3. Process Sentiment Data**
- **ID:** `fbaac2f6-6aca-4630-b236-915bfedeac2c`
- **Tipo:** Code Node (JavaScript)
- **Função:** Normaliza dados do Sentiment Analysis para formato backend
- **Output:**
  ```json
  {
    "sentimento": "neutro|positivo|negativo|muito_positivo|muito_negativo",
    "intensidade": 0.5,
    "fatores_detectados": "string",
    "raw_analysis": {
      "provider": "n8n_sentiment_analysis",
      "timestamp": "2025-10-14T...",
      "original_data": {...},
      "confidence": 0.5,
      "model_used": "gpt-4o-mini"
    }
  }
  ```

### **4. Save Sentiment to Backend**
- **ID:** `a8f5fa8f-ba2a-4346-94cb-c44953202faf`
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/analise-sentimento`
- **Method:** POST
- **Body:**
  ```json
  {
    "message": "...",
    "phone": "...",
    "userId": null,
    "sentimento": "...",
    "intensidade": 0.5,
    "fatores_detectados": "...",
    "raw_analysis": {...},
    "provider": "n8n_sentiment_analysis"
  }
  ```

### **5. Information Extractor**
- **ID:** `32d87c48-ca2e-4a16-8002-2826b98df18b`
- **Modelo:** Google Gemini (via `9e2dfa91-e092-4280-ba7d-075d9e97ee2f`)
- **Schema:** JSON Schema com 12+ campos
- **Campos extraídos:**
  1. categoria_principal
  2. subcategorias (max 5)
  3. tags (max 10)
  4. resumo
  5. tipo_documento
  6. nivel_acesso
  7. departamentos_relevantes
  8. palavras_chave (max 15)

### **6. Load Conversation History**
- **ID:** `9b875163-9bf2-410c-ae96-ff7cdde65edb`
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/conversations/history/{{ $('Merge').item.json.from }}?tenant_id={{ $json.record.tenant_id }}&limit=10`
- **Method:** GET
- **Função:** Carrega últimas 10 mensagens da conversação

### **7. Prepare System Message**
- **ID:** `6f8e427d-1559-4ca4-b39c-b64d6f66c00e`
- **Tipo:** Code Node (JavaScript)
- **Função:** Cria system prompt dinâmico baseado em:
  - Sentimento detectado
  - Intensidade (0-1)
  - Histórico de conversas
  - Canal (WhatsApp/Telegram)
- **Tom de voz:** 5 variações
  1. EXTREMAMENTE EMPÁTICO (muito_negativo)
  2. EMPÁTICO (negativo)
  3. PROFISSIONAL (neutro)
  4. MOTIVADOR (positivo)
  5. ENTUSIASMADO (muito_positivo)

### **8. OpenAI Conversational Agent**
- **ID:** `f5218b19-f4c6-4a70-8c43-16c5dd4cafb2`
- **Modelo:** gpt-4o
- **Mensagens:**
  1. System: `{{ $('Prepare System Message').item.json.systemMessage }}`
  2. User: `{{ $('Merge').item.json.messageText }}`
- **Ferramentas conectadas:**
  1. `Busca_Trilhas` (8cdc55a9-2734-484b-a878-99394069dfe7)
  2. `Inicia_trilha` (cdcfd39f-d9d1-415d-bb0e-befb3751635b)
  3. `Registrar_feedback` (b3e2b885-a1d9-4329-b5b4-15992b220d20)
  4. `Busca documentos` (09716623-d581-4380-b69b-78d54f2b550c)

### **9. Save Conversation History**
- **ID:** `22f4e16c-2847-44e4-b190-0998ea628c60`
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/conversations/history`
- **Method:** POST
- **Body:**
  ```json
  {
    "phone": "...",
    "tenant_id": "...",
    "session_id": "...",
    "messages": [
      {
        "role": "user",
        "content": "...",
        "sentiment": "...",
        "sentiment_intensity": 0.5
      },
      {
        "role": "assistant",
        "content": "..."
      }
    ],
    "metadata": {
      "channel": "whatsapp|telegram",
      "model": "gpt-4o"
    }
  }
  ```

### **10. Detectar feedback**
- **ID:** `ea2681a2-65df-432b-9b18-949f72913a0b`
- **Tipo:** Code Node
- **Palavras-chave:** `['dificuldade', 'difícil', 'problema', 'não consigo', 'ajuda', 'sugestão', 'melhorar', 'trilha']`
- **Output:** `{ tem_feedback: true|false, mensagem: "..." }`

### **11. Salvar Anotação**
- **ID:** `69fd7b4c-d34c-42b9-9759-400e3f3e87ea`
- **URL:** `https://navigator-gules.vercel.app/api/agente/anotacoes`
- **Method:** POST
- **Body:**
  ```json
  {
    "tipo": "observacao_geral",
    "titulo": "Feedback: [primeiros 50 chars]",
    "anotacao": "[mensagem completa]",
    "tags": ["feedback", "automatico"]
  }
  ```

---

## 🔗 Conexões Principais

```
WhatsApp/Telegram Trigger
  → Normalize Message
  → Merge
  → BACKEND_URL
  → Sentiment Analysis
  → Process Sentiment Data
  → Save Sentiment to Backend
  → É Muito Negativo?
    ├─ TRUE: Enviar Alerta RH + Load History
    └─ FALSE: Load History
  → Prepare System Message
  → OpenAI Conversational Agent (+ 4 tools)
  → Save Conversation History
  → Detectar feedback
  → Tem feedback?
    ├─ TRUE: Salvar Anotação
    └─ FALSE: Code responder
  → Decide Canal
  → Send Message (WhatsApp/Telegram)
```

---

## 🎨 Pin Data (Dados de Teste)

### **WhatsApp Trigger:**
```json
{
  "from": "556291708483",
  "text": "Sobre quais processos vc pode me ajudar?"
}
```

### **Telegram Trigger:**
```json
{
  "from": { "id": 1233801973 },
  "text": "Oi"
}
```

### **Webhook Onboarding:**
```json
{
  "type": "document_categorization",
  "documentId": "1950f082-6545-4a9f-86fc-872cb28c796f",
  "tenantId": "5978f911-738b-4aae-802a-f037fdac2e64",
  "content": "NexaPay - Políticas & Normas Internas..."
}
```

---

## 🚀 Performance

| Operação | Latência | Custo/Req |
|----------|----------|-----------|
| **Sentiment Analysis** | ~500ms | $0.0003 |
| **Information Extractor** | ~2000ms | $0.001 |
| **Conversational (GPT-4o)** | ~1500ms | $0.01 |
| **Load History** | ~200ms | - |
| **Save History** | ~150ms | - |
| **Total (conversa completa)** | ~2500ms | ~$0.011 |

---

## 📝 Notas Importantes

1. **Backend URL configurável:** Node `BACKEND_URL` (e34ad4e6-fb97-4193-aa26-deab23716ce2)
2. **Sentimento negativo:** Envia alerta para RH automaticamente
3. **Histórico:** Limitado a 10 mensagens recentes
4. **System prompt:** Adaptado dinamicamente ao sentimento
5. **Ferramentas:** Só são chamadas quando GPT-4o decide usar
6. **Anotações:** Salvas automaticamente quando detecta feedback

---

## 🔧 Credenciais Necessárias

1. **OpenAI:** `U7neXZRDKM4Z1alD`
2. **Google Gemini:** `zVg2JCqxlVgfR1dq`
3. **WhatsApp:** `BPgwCD2SMjqAgHHY`
4. **Telegram:** `S5VBRZetX4SbRp5H`
5. **SMTP:** `cRrwa0G14wojU1Eh`

---

## ✅ Testes Executados

- [x] Sentiment Analysis com mensagens positivas/negativas
- [x] Information Extractor com documento de políticas
- [x] OpenAI conversação simples
- [x] OpenAI usando ferramentas (Busca_Trilhas)
- [x] Load/Save Conversation History
- [x] Detectar feedback e salvar anotação
- [x] Alerta RH para sentimento muito negativo
- [x] Envio WhatsApp
- [x] Envio Telegram
- [x] Webhook onboarding (categorização)

---

**Workflow completo exportado em:** `N8N_WORKFLOW_NAVIGATOR_ATUAL.json`  
**Documentação completa em:** `N8N_WORKFLOW_README.md`  
**Última atualização:** 2025-10-14 às 14:50 BRT

