# 🤖 N8N Workflow: Processamento Automático de Conteúdos de Trilhas

## 📋 Visão Geral

Este documento descreve o workflow N8N para processamento automático de conteúdos de trilhas usando AI agent, similar ao sistema de documentos existente.

**Data:** 2025-10-22  
**Status:** ✅ Implementação completa

---

## 🎯 Objetivo

Quando o RH cria um conteúdo em uma trilha (PDF, vídeo, link), o N8N deve:
- ✅ **Processar automaticamente** o conteúdo
- ✅ **Extrair dados estruturados** com AI
- ✅ **Gerar embeddings** para busca semântica
- ✅ **Salvar no banco** de dados
- ✅ **Notificar** sobre o status

---

## 🔄 Fluxo Completo

```
1️⃣ Webhook Trigger (conteúdo criado)
    ↓
2️⃣ Switch por Tipo de Conteúdo
    ↓
├─ PDF/Documento → Processar PDF
├─ Vídeo → Processar Vídeo  
└─ Link → Processar URL
    ↓
3️⃣ Extrair Conteúdo (por tipo)
    ↓
4️⃣ AI Agent - Análise Estruturada
    ↓
5️⃣ Gerar Embedding
    ↓
6️⃣ Salvar Resultado no Backend
    ↓
7️⃣ Notificar Status
```

---

## 🛠️ Configuração Detalhada

### **1️⃣ Webhook Trigger**

**Node:** Webhook  
**URL:** `https://hndll.app.n8n.cloud/webhook/processar-conteudo-trilha`  
**Método:** POST  
**Ativa em:** Produção

**Payload esperado:**
```json
{
  "type": "trilha_conteudo_processamento",
  "timestamp": "2025-10-22T21:30:00.000Z",
  "trilha_conteudo_id": "uuid-do-conteudo",
  "trilha_id": "uuid-da-trilha",
  "trilha_nome": "Segurança da Informação",
  "tenant_id": "uuid-do-tenant",
  "tenant_subdomain": "demo",
  "conteudo": {
    "tipo": "documento",
    "titulo": "Política de Senhas",
    "descricao": "Documento sobre políticas de senhas",
    "url": "https://storage.com/documento.pdf",
    "ordem": 1,
    "obrigatorio": true
  }
}
```

---

### **2️⃣ Switch por Tipo de Conteúdo**

**Node:** Switch  
**Campo:** `{{ $json.conteudo.tipo }}`

**Rotas:**
- **Rota 1:** `documento` ou `pdf` → Processar PDF
- **Rota 2:** `video` → Processar Vídeo  
- **Rota 3:** `link` → Processar URL

---

### **3️⃣ Processar PDF/Documento**

#### **3.1. Baixar PDF**
**Node:** HTTP Request  
**Método:** GET  
**URL:** `{{ $json.conteudo.url }}`  
**Response Format:** File

#### **3.2. Extrair Texto**
**Node:** Extract from File  
**Action:** Extract Text  
**File Format:** PDF

#### **3.3. Validar Texto Extraído**
**Node:** Code (JavaScript)
```javascript
const extractedText = $input.first().json.text;

if (!extractedText || extractedText.length < 50) {
  return [{
    json: {
      error: 'Texto extraído muito curto ou vazio',
      status: 'failed',
      conteudo_extraido: extractedText || '',
      word_count: extractedText ? extractedText.split(' ').length : 0
    }
  }];
}

return [{
  json: {
    conteudo_extraido: extractedText,
    word_count: extractedText.split(' ').length,
    status: 'ready_for_ai'
  }
}];
```

---

### **4️⃣ Processar Vídeo**

#### **4.1. Detectar Plataforma**
**Node:** Code (JavaScript)
```javascript
const url = $input.first().json.conteudo.url;

let platform = 'unknown';
let videoId = null;

if (url.includes('youtube.com') || url.includes('youtu.be')) {
  platform = 'youtube';
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  videoId = match ? match[1] : null;
} else if (url.includes('vimeo.com')) {
  platform = 'vimeo';
  const match = url.match(/vimeo\.com\/(\d+)/);
  videoId = match ? match[1] : null;
}

return [{
  json: {
    platform,
    video_id: videoId,
    original_url: url,
    status: videoId ? 'ready_for_transcription' : 'failed'
  }
}];
```

#### **4.2. Obter Transcrição (YouTube)**
**Node:** HTTP Request  
**Método:** GET  
**URL:** `https://www.youtube.com/api/timedtext?v={{ $json.video_id }}&lang=pt`  
**Headers:** `Accept: application/xml`

#### **4.3. Processar Transcrição**
**Node:** Code (JavaScript)
```javascript
const transcriptXml = $input.first().json.data;

if (!transcriptXml) {
  return [{
    json: {
      error: 'Transcrição não disponível',
      status: 'failed',
      conteudo_extraido: '',
      word_count: 0
    }
  }];
}

// Extrair texto da transcrição XML
const textMatches = transcriptXml.match(/<text[^>]*>([^<]+)<\/text>/g);
let extractedText = '';

if (textMatches) {
  extractedText = textMatches
    .map(match => match.replace(/<[^>]*>/g, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

return [{
  json: {
    conteudo_extraido: extractedText,
    word_count: extractedText.split(' ').length,
    status: extractedText.length > 50 ? 'ready_for_ai' : 'failed'
  }
}];
```

---

### **5️⃣ Processar URL/Link**

#### **5.1. Scrape Conteúdo**
**Node:** HTTP Request  
**Método:** GET  
**URL:** `{{ $json.conteudo.url }}`  
**Headers:** 
```
User-Agent: Mozilla/5.0 (compatible; N8N-Bot/1.0)
Accept: text/html,application/xhtml+xml
```

#### **5.2. Extrair Texto HTML**
**Node:** HTML Extract  
**CSS Selectors:** 
- `body` (conteúdo principal)
- `article` (artigos)
- `main` (conteúdo principal)
- `p` (parágrafos)

#### **5.3. Limpar e Validar Texto**
**Node:** Code (JavaScript)
```javascript
const htmlContent = $input.first().json.data;

if (!htmlContent) {
  return [{
    json: {
      error: 'Conteúdo HTML não encontrado',
      status: 'failed',
      conteudo_extraido: '',
      word_count: 0
    }
  }];
}

// Extrair texto do HTML (simplificado)
const textContent = htmlContent
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

return [{
  json: {
    conteudo_extraido: textContent,
    word_count: textContent.split(' ').length,
    status: textContent.length > 100 ? 'ready_for_ai' : 'failed'
  }
}];
```

---

### **6️⃣ AI Agent - Análise Estruturada**

**Node:** OpenAI  
**Model:** GPT-4  
**System Message:**
```
Você é um especialista em análise de conteúdo educacional. 
Analise o conteúdo fornecido e extraia informações estruturadas.

INSTRUÇÕES:
1. Gere um resumo conciso (2-3 frases)
2. Extraia 5-10 tags relevantes
3. Sugira uma categoria
4. Determine o nível de dificuldade (Fácil, Médio, Difícil)
5. Estime o tempo de leitura/visualização em minutos
6. Analise o sentimento do conteúdo (-1 a 1)

FORMATO DE RESPOSTA (JSON):
{
  "resumo": "Resumo do conteúdo...",
  "tags": ["tag1", "tag2", "tag3"],
  "categoria_sugerida": "Categoria",
  "nivel_dificuldade": "Médio",
  "tempo_estimado_minutos": 15,
  "sentiment_score": 0.2,
  "idioma": "pt-BR"
}
```

**User Message:**
```
Analise o seguinte conteúdo:

TÍTULO: {{ $json.conteudo.titulo }}
DESCRIÇÃO: {{ $json.conteudo.descricao }}
TIPO: {{ $json.conteudo.tipo }}

CONTEÚDO EXTRAÍDO:
{{ $json.conteudo_extraido }}

Forneça a análise estruturada em formato JSON.
```

---

### **7️⃣ Gerar Embedding**

**Node:** OpenAI  
**Model:** text-embedding-3-small  
**Input:** `{{ $json.conteudo_extraido }}`  
**Output:** Array de números (1536 dimensões)

---

### **8️⃣ Salvar Resultado no Backend**

**Node:** HTTP Request  
**Método:** POST  
**URL:** `https://navigator-gules.vercel.app/api/trilhas/conteudos/processamento-resultado`  
**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "trilha_conteudo_id": "{{ $json.trilha_conteudo_id }}",
  "conteudo_extraido": "{{ $json.conteudo_extraido }}",
  "resumo": "{{ $json.resumo }}",
  "tags": {{ $json.tags }},
  "categoria_sugerida": "{{ $json.categoria_sugerida }}",
  "nivel_dificuldade": "{{ $json.nivel_dificuldade }}",
  "tempo_estimado_minutos": {{ $json.tempo_estimado_minutos }},
  "idioma": "{{ $json.idioma }}",
  "word_count": {{ $json.word_count }},
  "sentiment_score": {{ $json.sentiment_score }},
  "embedding": {{ $json.embedding }},
  "status": "completed"
}
```

---

### **9️⃣ Tratamento de Erros**

**Node:** Code (JavaScript) - Error Handler
```javascript
const error = $input.first().json.error || 'Erro desconhecido';

return [{
  json: {
    trilha_conteudo_id: $('Webhook').first().json.trilha_conteudo_id,
    status: 'failed',
    erro: error,
    conteudo_extraido: '',
    word_count: 0
  }
}];
```

---

## 📊 Monitoramento e Logs

### **Logs Importantes:**
- ✅ Conteúdo recebido para processamento
- ✅ Tipo de conteúdo detectado
- ✅ Texto extraído com sucesso
- ✅ Análise AI concluída
- ✅ Embedding gerado
- ✅ Dados salvos no backend
- ❌ Erros de processamento

### **Métricas:**
- Taxa de sucesso por tipo de conteúdo
- Tempo médio de processamento
- Qualidade dos embeddings gerados
- Erros mais comuns

---

## 🚀 Implementação

### **Passos para Configurar:**

1. **Criar novo workflow** no N8N
2. **Configurar webhook** com URL específica
3. **Adicionar nós** conforme especificação
4. **Testar com diferentes tipos** de conteúdo
5. **Monitorar logs** e ajustar conforme necessário

### **Variáveis de Ambiente Necessárias:**
```
OPENAI_API_KEY=sk-...
N8N_WEBHOOK_URL=https://hndll.app.n8n.cloud/webhook/onboarding
```

---

## ✅ Status da Implementação

- ✅ **Migração SQL** criada
- ✅ **Webhook backend** implementado  
- ✅ **Endpoints** para receber resultado
- ✅ **Busca semântica** implementada
- ✅ **Workflow N8N** documentado
- 🔄 **Testes** em andamento
- 🔄 **Deploy** pendente

**Tempo total estimado:** 50 minutos  
**Status:** 90% completo
