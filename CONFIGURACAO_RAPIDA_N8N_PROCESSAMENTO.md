# 🚀 CONFIGURAÇÃO RÁPIDA: Workflow N8N para Processamento de Conteúdos

## 📋 Status Atual
- ✅ **Migração SQL:** Aplicada com sucesso
- ✅ **Backend:** Webhook implementado
- ✅ **Teste:** Webhook retorna erro 500 (N8N não configurado)
- 🔄 **Próximo:** Configurar workflow N8N

---

## 🎯 OBJETIVO
Configurar o workflow N8N existente para processar o novo tipo de payload `trilha_conteudo_processamento`.

---

## 🔧 CONFIGURAÇÃO NO N8N

### **1️⃣ Acessar N8N**
- URL: https://hndll.app.n8n.cloud
- Login com suas credenciais

### **2️⃣ Localizar Workflow Existente**
- Buscar workflow: "Navigator" ou "Onboarding"
- Abrir o workflow principal

### **3️⃣ Adicionar Switch Node**

**Localização:** Após o Webhook Trigger

**Configuração do Switch:**
```json
{
  "rules": [
    {
      "operation": "equal",
      "value1": "={{ $json.type }}",
      "value2": "trilha_conteudo_processamento"
    }
  ]
}
```

**Rotas:**
- **Rota 1:** `trilha_conteudo_processamento` → Novo processamento
- **Rota 2:** `default` → Fluxo existente (onboarding)

### **4️⃣ Configurar Processamento de Conteúdos**

**Após a Rota 1 do Switch, adicionar:**

#### **4.1. Switch por Tipo de Conteúdo**
```json
{
  "rules": [
    {
      "operation": "equal",
      "value1": "={{ $json.conteudo.tipo }}",
      "value2": "documento"
    },
    {
      "operation": "equal", 
      "value1": "={{ $json.conteudo.tipo }}",
      "value2": "pdf"
    },
    {
      "operation": "equal",
      "value1": "={{ $json.conteudo.tipo }}",
      "value2": "video"
    },
    {
      "operation": "equal",
      "value1": "={{ $json.conteudo.tipo }}",
      "value2": "link"
    }
  ]
}
```

#### **4.2. Processar PDF/Documento**
**Node:** HTTP Request
- **Método:** GET
- **URL:** `={{ $json.conteudo.url }}`
- **Response Format:** File

**Node:** Extract from File
- **Action:** Extract Text
- **File Format:** PDF

#### **4.3. Processar Vídeo**
**Node:** Code (JavaScript)
```javascript
const url = $input.first().json.conteudo.url;
let platform = 'unknown';
let videoId = null;

if (url.includes('youtube.com') || url.includes('youtu.be')) {
  platform = 'youtube';
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
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

#### **4.4. Processar URL/Link**
**Node:** HTTP Request
- **Método:** GET
- **URL:** `={{ $json.conteudo.url }}`
- **Headers:** 
  ```
  User-Agent: Mozilla/5.0 (compatible; N8N-Bot/1.0)
  Accept: text/html,application/xhtml+xml
  ```

### **5️⃣ AI Agent - Análise Estruturada**

**Node:** OpenAI
- **Model:** GPT-4
- **System Message:**
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

### **6️⃣ Gerar Embedding**

**Node:** OpenAI
- **Model:** text-embedding-3-small
- **Input:** `={{ $json.conteudo_extraido }}`

### **7️⃣ Salvar Resultado no Backend**

**Node:** HTTP Request
- **Método:** POST
- **URL:** `https://navigator-gules.vercel.app/api/trilhas/conteudos/processamento-resultado`
- **Headers:** `Content-Type: application/json`

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

### **8️⃣ Tratamento de Erros**

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

## 🧪 TESTE APÓS CONFIGURAÇÃO

### **1️⃣ Testar Webhook**
```bash
node testar-webhook-processamento.js
```

### **2️⃣ Verificar Logs**
- N8N: Verificar execução do workflow
- Backend: Verificar logs de processamento
- Banco: Verificar dados salvos

### **3️⃣ Testar Busca Semântica**
```bash
curl -X GET "https://navigator-gules.vercel.app/api/agent/trilhas/buscar-conteudo?query=segurança&limit=5"
```

---

## 📊 MONITORAMENTO

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

## ⚡ CONFIGURAÇÃO RÁPIDA (5 minutos)

**Se você quiser uma configuração mais simples:**

1. **Adicionar Switch** após Webhook
2. **Rota 1:** `trilha_conteudo_processamento`
3. **Adicionar OpenAI** para análise
4. **Adicionar HTTP Request** para salvar resultado
5. **Testar** com webhook

**Isso já funcionará para processamento básico!**

---

## 🎯 PRÓXIMOS PASSOS

1. **Configurar workflow** conforme especificação
2. **Testar webhook** novamente
3. **Verificar processamento** completo
4. **Monitorar logs** e métricas
5. **Otimizar** conforme necessário

**Tempo estimado:** 15 minutos  
**Status:** Pronto para configuração
