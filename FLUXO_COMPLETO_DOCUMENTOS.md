# 📄 Fluxo Completo de Processamento de Documentos

## 🎯 Visão Geral

Este documento explica o fluxo completo desde o upload de um documento até a busca semântica.

**Data:** 14 de outubro de 2025  
**Status:** ✅ Funcionando em produção

---

## 🔄 FLUXO COMPLETO (Passo a Passo)

### **ETAPA 1: Upload no Frontend** 📤

```
Frontend (documentos.html)
    ↓
Admin faz upload do arquivo (PDF, DOCX, DOC, TXT)
    ↓
Form submete para: POST /api/documents/upload
```

**Dados enviados:**
- `file` (arquivo binário)
- `title` (título do documento)
- `category` (categoria inicial)
- `department` (opcional)
- `description` (opcional)

---

### **ETAPA 2: Backend - Processamento Inicial** 🔧

**Arquivo:** `src/server.js` - linha 1354

```javascript
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  // 1. Validações
  // 2. Extração de texto
  // 3. Análise com IA
  // 4. Gera embedding
  // 5. Salva no banco
  // 6. Notifica N8N
})
```

**Pipeline de análise (document-analyzer.js):**

```
1️⃣ extractText(fileBuffer)
    ↓ PDF → pdf-parse
    ↓ DOCX → mammoth
    ↓ TXT → buffer.toString()
    ↓
📝 Texto extraído

2️⃣ generateEmbedding(text)
    ↓ OpenAI text-embedding-3-small
    ↓ OU Hugging Face sentence-transformers
    ↓
🧬 Vetor de embeddings (array de números)

3️⃣ classifyDocument(text)
    ↓ IA analisa e classifica
    ↓
📂 Categoria sugerida

4️⃣ analyzeSentiment(text)
    ↓ IA analisa tom do documento
    ↓
😊 Score de sentimento

5️⃣ generateSummary(text)
    ↓ IA cria resumo
    ↓
📝 Resumo (2-3 frases)

6️⃣ generateTags(text)
    ↓ Extração de palavras-chave
    ↓
🏷️ Tags do documento
```

---

### **ETAPA 3: Salvar no Banco (PostgreSQL/Supabase)** 💾

**Tabela: `documents`**

```sql
INSERT INTO documents (
  id,                    -- UUID do documento
  tenant_id,             -- UUID do tenant
  title,                 -- Título
  category,              -- Categoria original
  file_name,             -- Nome do arquivo
  file_data,             -- Arquivo em base64
  file_size,             -- Tamanho em bytes
  extracted_text,        -- ✅ Texto extraído
  ai_classification,     -- ✅ Categoria sugerida pela IA
  ai_summary,            -- ✅ Resumo gerado
  ai_tags,               -- ✅ Tags extraídas
  sentiment_score,       -- ✅ Score de sentimento
  word_count,            -- Contagem de palavras
  language,              -- Idioma (pt-BR)
  analysis_status,       -- completed/failed
  embedding,             -- ✅✅✅ VETOR DE EMBEDDINGS (JSONB)
  analyzed_at,           -- Timestamp da análise
  created_at             -- Timestamp de criação
) VALUES (...)
```

**🔑 Campo CRÍTICO: `embedding`**
- Armazena vetor de números (array de ~1536 dimensões)
- Formato: `[0.123, -0.456, 0.789, ...]`
- Usado para busca semântica (similaridade)

---

### **ETAPA 4: Notificação para N8N (Webhook)** 📡

**Webhook URL:** `https://hndll.app.n8n.cloud/webhook/onboarding`

```json
{
  "type": "document_categorization",
  "documentId": "uuid-do-documento",
  "tenantId": "uuid-do-tenant",
  "title": "Política de Benefícios",
  "category": "Benefícios",
  "content": "Texto completo extraído do documento...",
  "aiAnalysis": {
    "classification": "Benefícios",
    "sentiment": 0.8,
    "summary": "Documento sobre benefícios...",
    "tags": ["vale-refeição", "plano-saúde"],
    "wordCount": 1500,
    "language": "pt-BR",
    "status": "completed"
  }
}
```

---

### **ETAPA 5: N8N - Categorização com IA** 🤖

**Fluxo ATUAL (Fase 1 - a ser substituído na Fase 2):**

```
Webhook Onboarding
    ↓
Switch (verifica body.type)
    ↓ (se document_categorization)
AI Agent - Categorização (Gemini)
    ↓ System Prompt:
    "Analise este documento e extraia:
     - Categoria principal
     - Subcategorias
     - Tags relevantes
     - Resumo
     - Confidence"
    ↓
Code in JavaScript (parse JSON)
    ↓ Extrai:
    {
      suggestedCategory: "...",
      subcategories: [...],
      tags: [...],
      summary: "...",
      confidence: 0.95
    }
    ↓
Retorno categorização (POST /documents/categorization-result)
```

**⚠️ LIMITAÇÕES DO FLUXO ATUAL:**
- ❌ Apenas 5 campos extraídos
- ❌ Parse manual de JSON (pode falhar)
- ❌ Sem validação estruturada
- ❌ Sem metadados adicionais (autor, vigência, departamentos)

---

### **ETAPA 6: Backend - Atualizar Categorização** 🔄

**Endpoint:** `POST /documents/categorization-result`

```javascript
app.post('/documents/categorization-result', async (req, res) => {
  // Recebe dados do N8N
  const {
    documentId,
    tenantId,
    suggestedCategory,
    subcategories,
    tags,
    summary,
    confidence
  } = req.body;
  
  // Atualiza documento no banco
  await query(`
    UPDATE documents 
    SET 
      ai_classification = $1,
      ai_summary = $2,
      ai_tags = $3,
      confidence_score = $4
    WHERE id = $5 AND tenant_id = $6
  `, [suggestedCategory, summary, JSON.stringify(tags), confidence, documentId, tenantId]);
});
```

---

### **ETAPA 7: Busca Semântica (RAG)** 🔍

**Como funciona a busca semântica:**

```
Colaborador pergunta: "Como funciona o vale refeição?"
    ↓
1️⃣ Gera embedding da pergunta
    await generateEmbedding("Como funciona o vale refeição?")
    ↓
    [0.234, -0.567, 0.890, ...] (vetor de 1536 dimensões)

2️⃣ Busca documentos similares (PostgreSQL)
    SELECT * FROM documents
    WHERE tenant_id = '...'
    AND embedding IS NOT NULL
    ORDER BY embedding <=> $1  -- Operador de distância vetorial
    LIMIT 5
    ↓
    Documentos ordenados por similaridade
    
3️⃣ Retorna documentos mais relevantes
    [
      {title: "Benefícios 2025", similarity: 0.92},
      {title: "Política de RH", similarity: 0.78},
      ...
    ]

4️⃣ AI Agent usa documentos como contexto
    System Prompt + Documentos encontrados + Pergunta
    ↓
    OpenAI gera resposta baseada nos documentos
```

**⚠️ IMPORTANTE:** O operador `<=>` é o **cosine distance** do PostgreSQL (extensão pgvector)

---

## ❓ RESPONDENDO SUAS PERGUNTAS

### **1. O documento passa pelo extractor?** ✅ SIM

**ATUALMENTE:**
- Upload → Backend analisa → Salva no banco → Notifica N8N
- N8N → AI Agent categoriza → Retorna ao backend
- Backend → Atualiza categorização no documento

**APÓS FASE 2:**
- Upload → Backend analisa → Salva no banco → Notifica N8N
- N8N → **Information Extractor** categoriza (12+ campos) → Retorna ao backend
- Backend → Atualiza categorização + metadata no documento

---

### **2. É feita vetorização?** ✅ SIM!

**Quando:** Durante o upload (linha 1430 do server.js)

**Como:**
```javascript
// Se análise foi bem-sucedida, salvar embedding
if (analysis && analysis.embedding) {
  await query('UPDATE documents SET embedding = $1 WHERE id = $2', [
    JSON.stringify(analysis.embedding),  // Vetor de ~1536 números
    documentId
  ]);
}
```

**Modelo usado:**
- **Primary:** OpenAI `text-embedding-3-small` (~$0.00002/1K tokens)
- **Fallback:** Hugging Face `sentence-transformers/all-MiniLM-L6-v2` (grátis)
- **Fallback final:** Hash simulado (se APIs falharem)

**Armazenamento:**
- Campo `embedding` na tabela `documents` (JSONB)
- Formato: `[0.123, -0.456, 0.789, ...]` (array de floats)
- Usado pelo operador `<=>` (cosine distance) do PostgreSQL

---

### **3. Chunks são criados?** ⚠️ PARCIAL

**Atualmente:**
- ❓ Tabela `chunks` existe no schema
- ❓ Código busca chunks: `SELECT * FROM chunks WHERE document_id = $1`
- ❌ NÃO vi código que CRIA chunks durante upload

**Parece que:**
- Sistema foi projetado para suportar chunks
- Mas atualmente salva documento inteiro no embedding
- Chunks podem ser criados manualmente ou em reprocessamento

---

## 🎯 O QUE A FASE 2 VAI MELHORAR

### **ANTES (Fluxo Atual):**

```
Upload → Backend analisa → Embedding
    ↓
N8N AI Agent extrai:
  - suggestedCategory
  - subcategories (3-5 itens)
  - tags (3-5 itens)
  - summary
  - confidence
    ↓
Backend atualiza apenas esses 5 campos
```

**Limitações:**
- ❌ Apenas 5 campos
- ❌ Sem metadados estruturados
- ❌ Sem validação de schema
- ❌ Parse manual de JSON pode falhar

---

### **DEPOIS (Fase 2 - Information Extractor):**

```
Upload → Backend analisa → Embedding (igual)
    ↓
N8N Information Extractor extrai:
  ✅ categoria_principal (validado com enum)
  ✅ subcategorias (array estruturado)
  ✅ tags (array estruturado)
  ✅ resumo
  ✅ tipo_documento (Política, Manual, Formulário, etc.)
  ✅ nivel_acesso (Público, Interno, Confidencial, Restrito)
  ✅ departamentos_relevantes (array)
  ✅ palavras_chave (array de 15+ termos)
  ✅ vigencia (data_inicio, data_fim)
  ✅ autoria (autor, revisor)
  ✅ versao
  ✅ referencias (array de documentos relacionados)
    ↓
Backend atualiza 12+ campos estruturados
    ↓
Busca semântica MUITO MELHOR (mais palavras-chave)
```

**Benefícios:**
- ✅ 12+ campos vs 5 campos (**+140%**)
- ✅ Validação automática com JSON Schema
- ✅ Metadados enriquecidos
- ✅ Busca semântica aprimorada

---

## 📊 DIAGRAMA VISUAL

```
┌─────────────────────────────────────────────────────────┐
│                  UPLOAD DE DOCUMENTO                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              BACKEND - Análise Inicial                   │
├─────────────────────────────────────────────────────────┤
│ 1. Extrair texto (PDF/DOCX/TXT)                         │
│ 2. ✅ GERAR EMBEDDING (OpenAI/Hugging Face)             │
│    └─→ Vetor [0.123, -0.456, ...] (1536 dimensões)     │
│ 3. Classificar (IA)                                      │
│ 4. Analisar sentimento                                   │
│ 5. Gerar resumo                                          │
│ 6. Gerar tags                                            │
│ 7. ✅ SALVAR NO BANCO (com embedding)                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              WEBHOOK N8N - Categorização                 │
├─────────────────────────────────────────────────────────┤
│ POST /webhook/onboarding                                 │
│ {                                                         │
│   "type": "document_categorization",                     │
│   "documentId": "...",                                   │
│   "content": "texto completo...",                        │
│   "aiAnalysis": { ... }                                  │
│ }                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              N8N - Extração Estruturada                  │
├─────────────────────────────────────────────────────────┤
│ 🔴 ATUAL: AI Agent (Gemini) + Code Parse JSON           │
│    └─→ 5 campos extraídos (categoria, tags, resumo...)  │
│                                                           │
│ 🟢 FASE 2: Information Extractor                         │
│    └─→ 12+ campos estruturados + validação JSON Schema  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│        N8N - Retorno ao Backend (HTTP Request)           │
├─────────────────────────────────────────────────────────┤
│ POST /documents/categorization-result                    │
│ {                                                         │
│   "documentId": "...",                                   │
│   "suggestedCategory": "Benefícios",                     │
│   "subcategories": ["vale-refeição", "plano-saúde"],    │
│   "tags": ["benefícios", "RH"],                         │
│   "summary": "...",                                      │
│   "confidence": 0.95                                     │
│ }                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│          BACKEND - Atualizar Documento                   │
├─────────────────────────────────────────────────────────┤
│ UPDATE documents SET                                     │
│   ai_classification = '...',                            │
│   ai_summary = '...',                                   │
│   ai_tags = '...',                                      │
│   confidence_score = 0.95                               │
│ WHERE id = documentId                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              DOCUMENTO PRONTO NO BANCO                   │
├─────────────────────────────────────────────────────────┤
│ ✅ Texto extraído                                        │
│ ✅ Embedding vetorizado                                 │
│ ✅ Categorização da IA                                  │
│ ✅ Metadata estruturada                                 │
│ ✅ Pronto para busca semântica                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│           BUSCA SEMÂNTICA (Quando colaborador pergunta)  │
├─────────────────────────────────────────────────────────┤
│ Pergunta: "Como funciona o vale refeição?"              │
│     ↓                                                     │
│ 1. Gera embedding da pergunta                            │
│    [0.234, -0.567, ...]                                  │
│     ↓                                                     │
│ 2. Busca documentos similares:                           │
│    SELECT * FROM documents                               │
│    WHERE tenant_id = '...'                               │
│    ORDER BY embedding <=> $1  -- ⭐ Distância vetorial   │
│    LIMIT 5                                               │
│     ↓                                                     │
│ 3. Retorna documentos mais similares                     │
│    [{title: "Benefícios 2025", similarity: 0.92}, ...]  │
│     ↓                                                     │
│ 4. AI Agent usa como contexto para responder            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 COMPONENTES CHAVE

### **1. Embeddings (Vetorização)** ✅

**O que é:**
- Transformar texto em vetor numérico
- Preserva significado semântico
- Permite comparação matemática entre textos

**Onde é gerado:**
- `src/document-analyzer.js` → `generateEmbedding(text)`

**Modelos usados:**
- **Primary:** OpenAI `text-embedding-3-small` (1536 dimensões)
- **Fallback:** Hugging Face `sentence-transformers/all-MiniLM-L6-v2` (384 dimensões)

**Armazenamento:**
- Campo `embedding` (JSONB) na tabela `documents`

---

### **2. Chunks** ⚠️ PARCIAL

**Status atual:**
- ✅ Tabela `chunks` existe no schema
- ✅ Código busca chunks quando necessário
- ❌ NÃO são criados automaticamente no upload
- ❌ Documento inteiro é vetorizado de uma vez

**Possível uso futuro:**
- Dividir documentos grandes em pedaços
- Vetorizar cada chunk separadamente
- Busca mais precisa (retorna apenas o trecho relevante)

---

### **3. Busca Semântica (RAG)** ✅

**Técnica:** Retrieval-Augmented Generation (RAG)

**Como funciona:**
1. Usuário faz pergunta
2. Sistema gera embedding da pergunta
3. Busca documentos com embedding similar (cosine distance)
4. Passa documentos + pergunta para IA
5. IA responde baseada nos documentos

**Operador PostgreSQL:** `<=>` (cosine distance)
- Compara dois vetores
- Retorna distância (0 = idênticos, 1 = opostos)
- Índice: IVFFLAT ou HNSW (pgvector extension)

---

## 🎯 O QUE A FASE 2 VAI MUDAR

### **Foco da Fase 2:**

**NÃO vai mexer em:**
- ❌ Upload de documentos
- ❌ Geração de embeddings
- ❌ Busca semântica
- ❌ Armazenamento de vetores

**VAI melhorar:**
- ✅ **Extração de metadados** (de 5 para 12+ campos)
- ✅ **Validação automática** (JSON Schema)
- ✅ **Categorização mais precisa** (enums validados)
- ✅ **Metadados enriquecidos** (autor, vigência, departamentos, nível de acesso)

**Resultado:**
- Documentos **mais bem organizados**
- Busca **mais precisa** (mais palavras-chave)
- Filtros **mais ricos** no frontend
- Contexto **mais relevante** para o AI Agent

---

## 📊 RESUMO VISUAL

```
UPLOAD → Análise Backend → ✅ EMBEDDING GERADO → Salva no banco
                ↓
        Notifica N8N (webhook)
                ↓
        🔴 Atual: AI Agent (5 campos)
        🟢 Fase 2: Information Extractor (12+ campos) ⭐
                ↓
        Retorna metadata estruturada
                ↓
        Backend atualiza documento
                ↓
        ✅ DOCUMENTO PRONTO PARA BUSCA SEMÂNTICA
```

---

**Ficou claro o fluxo?** 🤔

**Resumindo:**
1. ✅ **SIM, tem vetorização** (embeddings via OpenAI/Hugging Face)
2. ✅ **SIM, passa pelo N8N** (categorização via webhook)
3. ⚠️ **Chunks existem** mas não são criados automaticamente
4. 🎯 **Fase 2 melhora** apenas a categorização (não mexe em embeddings)

**Quer que eu continue com a implementação da Fase 2 agora?** 🚀

