# 🤖 Information Extractor - Aprimoramento do Fluxo de Documentos

## 📋 Visão Geral

Implementação do **Information Extractor** do N8N para extrair dados estruturados dos documentos, substituindo o fluxo atual de categorização básica por um sistema mais robusto e preciso.

**Data de Criação:** 13 de outubro de 2025  
**Workflow Alvo:** Navigator (ID: `uuTVoD6gdaxDhPT2`)

---

## 🎯 Objetivos

### **Antes (Fluxo Atual):**
- ✅ AI Agent (Gemini) categoriza documento
- ✅ Code Node extrai JSON da resposta
- ✅ Retorna ao backend com categoria sugerida

### **Depois (Fluxo Aprimorado):**
- ✅ **Information Extractor** extrai dados estruturados
- ✅ **Schema JSON** define campos específicos
- ✅ **Validação automática** de dados extraídos
- ✅ **Confiança** (confidence) por campo
- ✅ **Metadata adicional** (autor, data, departamento)
- ✅ Retorna dados enriquecidos ao backend

---

## 🔄 Fluxo Aprimorado

### **1. Trigger de Categorização:**
```
Webhook Onboarding (path: /webhook/onboarding)
    ↓
If1 (body.type === "document_categorization")
    ↓ TRUE
[NOVO] Information Extractor
    ↓
[NOVO] Validate Extracted Data
    ↓
Retorno categorização (POST /documents/categorization-result)
```

### **2. Nós a Serem Criados/Modificados:**

#### **2.1. Remover (Fluxo Antigo):**
- ❌ **AI Agent - Categorização** (substituído por Information Extractor)
- ❌ **Code in JavaScript** (parse JSON) - não mais necessário

#### **2.2. Adicionar (Fluxo Novo):**
- ✅ **Information Extractor** - Extrai dados estruturados
- ✅ **Validate Extracted Data** (opcional) - Valida qualidade

---

## 🛠️ Implementação Passo a Passo

### **PASSO 1: Adicionar Information Extractor**

#### **1.1. Criar Nó no N8N:**
1. Abrir workflow **Navigator** no N8N
2. Deletar nós:
   - "AI Agent - Categorização"
   - "Code in JavaScript" (parse JSON)
3. Adicionar novo nó: **Information Extractor**
4. Posicionar após o nó "If1" (TRUE branch)

#### **1.2. Configurar Information Extractor:**

**Settings → Basic:**
- **Node Name:** `📄 Extract Document Metadata`

**Parameters:**

**Text (Input Text):**
```
{{ $json.body.documentContent }}
```
*Nota: Ajustar conforme estrutura do webhook. Este campo define o texto de entrada do qual as informações serão extraídas.*

**Schema Type:**

O Information Extractor oferece **3 formas** de definir o schema de saída:

1. **From Attribute Descriptions** (Mais Simples)
   - Define o schema especificando atributos e suas descrições
   - Ideal para schemas simples
   - Interface visual mais amigável

2. **Generate From JSON Example** (Mais Rápido)
   - Cole um exemplo de JSON e o schema é gerado automaticamente
   - O nó usa os tipos e nomes das propriedades
   - **Nota:** Todos os campos são tratados como obrigatórios
   - Os valores reais são ignorados

3. **Define using JSON Schema** (Mais Poderoso) ⭐ **RECOMENDADO**
   - Controle total sobre o schema
   - Define campos obrigatórios vs opcionais
   - Suporta validações complexas (enum, format, etc.)
   - Melhor para schemas corporativos

**Para este projeto, use:** `Define using JSON Schema`

**Schema (JSON Schema):**
```json
{
  "type": "object",
  "properties": {
    "categoria_principal": {
      "type": "string",
      "description": "Categoria principal do documento (Benefícios, Políticas, RH, Treinamento, Compliance, TI, Financeiro, Operacional, Outros)",
      "enum": ["Benefícios", "Políticas", "RH", "Treinamento", "Compliance", "TI", "Financeiro", "Operacional", "Outros"]
    },
    "subcategorias": {
      "type": "array",
      "description": "Subcategorias específicas do documento",
      "items": {
        "type": "string"
      },
      "maxItems": 5
    },
    "tags": {
      "type": "array",
      "description": "Tags relevantes para busca e organização",
      "items": {
        "type": "string"
      },
      "maxItems": 10
    },
    "resumo": {
      "type": "string",
      "description": "Resumo conciso do conteúdo em 2-3 frases"
    },
    "departamentos_relevantes": {
      "type": "array",
      "description": "Departamentos aos quais o documento se aplica",
      "items": {
        "type": "string"
      }
    },
    "tipo_documento": {
      "type": "string",
      "description": "Tipo do documento (Política, Procedimento, Manual, Formulário, Contrato, Informativo, Outros)",
      "enum": ["Política", "Procedimento", "Manual", "Formulário", "Contrato", "Informativo", "Outros"]
    },
    "nivel_acesso": {
      "type": "string",
      "description": "Nível de acesso necessário (Público, Interno, Confidencial, Restrito)",
      "enum": ["Público", "Interno", "Confidencial", "Restrito"]
    },
    "palavras_chave": {
      "type": "array",
      "description": "Palavras-chave principais para busca semântica",
      "items": {
        "type": "string"
      },
      "maxItems": 15
    },
    "vigencia": {
      "type": "object",
      "description": "Informações sobre vigência do documento",
      "properties": {
        "data_inicio": {
          "type": "string",
          "description": "Data de início da vigência (formato: YYYY-MM-DD)"
        },
        "data_fim": {
          "type": "string",
          "description": "Data de fim da vigência (formato: YYYY-MM-DD ou 'indeterminado')"
        }
      }
    },
    "autoria": {
      "type": "object",
      "description": "Informações sobre autoria do documento",
      "properties": {
        "autor": {
          "type": "string",
          "description": "Nome do autor ou departamento responsável"
        },
        "revisor": {
          "type": "string",
          "description": "Nome do revisor (se mencionado)"
        }
      }
    },
    "versao": {
      "type": "string",
      "description": "Versão do documento (se mencionada)"
    },
    "referencias": {
      "type": "array",
      "description": "Documentos, leis ou normas referenciadas",
      "items": {
        "type": "string"
      }
    }
  },
  "required": ["categoria_principal", "subcategorias", "tags", "resumo", "tipo_documento"]
}
```

**Node Options (Optional):**

**System Prompt Template:**
*Este campo permite personalizar o prompt do sistema usado para extração. O n8n automaticamente adiciona instruções de especificação de formato ao prompt.*
```
Você é um especialista em análise de documentos corporativos com anos de experiência em classificação e organização de informações.

Analise o documento fornecido e extraia TODAS as informações estruturadas possíveis, seguindo rigorosamente o schema JSON definido.

DIRETRIZES:
1. Seja preciso e objetivo nas classificações
2. Use os valores exatos dos enums quando aplicável
3. Extraia todas as subcategorias relevantes (máximo 5)
4. Identifique tags úteis para busca (máximo 10)
5. Crie um resumo claro e conciso (2-3 frases)
6. Identifique departamentos relevantes
7. Extraia datas no formato YYYY-MM-DD
8. Se informação não estiver disponível, deixe o campo vazio

ATENÇÃO: Retorne APENAS dados que estejam explícitos ou implícitos no documento. Não invente informações.
```

---

### **ALTERNATIVA: Usando "From Attribute Descriptions"**

Se preferir uma abordagem mais visual e simples:

**Schema Type:** `From Attribute Descriptions`

**Attributes:**
```
1. categoria_principal (String)
   Description: "Categoria principal do documento (Benefícios, Políticas, RH, Treinamento, etc.)"

2. subcategorias (Array of Strings)
   Description: "Subcategorias específicas do documento (máximo 5)"

3. tags (Array of Strings)
   Description: "Tags relevantes para busca e organização (máximo 10)"

4. resumo (String)
   Description: "Resumo conciso do conteúdo em 2-3 frases"

5. tipo_documento (String)
   Description: "Tipo do documento (Política, Procedimento, Manual, Formulário, etc.)"
```

**Vantagens:**
- ✅ Interface visual mais simples
- ✅ Não precisa conhecer JSON Schema
- ✅ Ideal para times não técnicos

**Desvantagens:**
- ⚠️ Menos controle sobre validações
- ⚠️ Não define campos obrigatórios explicitamente
- ⚠️ Não suporta enums ou formatos específicos

---

### **ALTERNATIVA: Usando "Generate From JSON Example"**

Para gerar o schema rapidamente de um exemplo:

**Schema Type:** `Generate From JSON Example`

**JSON Example:**
```json
{
  "categoria_principal": "Benefícios",
  "subcategorias": ["vale refeição", "plano de saúde"],
  "tags": ["benefícios", "RH", "alimentação"],
  "resumo": "Documento sobre benefícios da empresa",
  "tipo_documento": "Política",
  "nivel_acesso": "Interno",
  "departamentos_relevantes": ["RH", "Todos"],
  "palavras_chave": ["benefícios", "vale refeição"],
  "vigencia": {
    "data_inicio": "2024-01-01",
    "data_fim": "2024-12-31"
  },
  "autoria": {
    "autor": "RH",
    "revisor": "Diretoria"
  },
  "versao": "1.0",
  "referencias": ["Política de Benefícios 2023"]
}
```

**O que acontece:**
1. n8n analisa o JSON
2. Cria um schema baseado nos **tipos** das propriedades
3. **Ignora os valores** (são apenas exemplos)
4. **Todos os campos se tornam obrigatórios** automaticamente

**Vantagens:**
- ✅ Muito rápido para criar
- ✅ Ótimo para prototipação
- ✅ Não precisa escrever JSON Schema manualmente

**Desvantagens:**
- ⚠️ Todos os campos são obrigatórios (não flexível)
- ⚠️ Não define enums ou validações
- ⚠️ Pode precisar ajustes posteriores

---

### **PASSO 2: Adicionar Validação de Dados (Opcional)**

#### **2.1. Criar Code Node:**
1. Adicionar nó: **Code**
2. Posicionar após "Extract Document Metadata"
3. Nome: `✅ Validate Extracted Data`

#### **2.2. Código de Validação:**

```javascript
// Validar dados extraídos do Information Extractor
const extractedData = $input.item.json;

// Função de validação
function validateExtraction(data) {
  const errors = [];
  const warnings = [];
  
  // Validar campos obrigatórios
  if (!data.categoria_principal) {
    errors.push('categoria_principal é obrigatória');
  }
  
  if (!data.tipo_documento) {
    errors.push('tipo_documento é obrigatório');
  }
  
  if (!data.resumo || data.resumo.length < 20) {
    warnings.push('resumo muito curto ou ausente');
  }
  
  if (!data.subcategorias || data.subcategorias.length === 0) {
    warnings.push('nenhuma subcategoria identificada');
  }
  
  if (!data.tags || data.tags.length === 0) {
    warnings.push('nenhuma tag identificada');
  }
  
  // Validar formatos de data
  if (data.vigencia?.data_inicio) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.vigencia.data_inicio)) {
      warnings.push('formato de data_inicio inválido');
    }
  }
  
  // Calcular score de qualidade
  let qualityScore = 100;
  qualityScore -= errors.length * 25; // -25 por erro crítico
  qualityScore -= warnings.length * 10; // -10 por warning
  
  // Adicionar contagem de campos preenchidos
  const filledFields = Object.keys(data).filter(key => {
    const value = data[key];
    return value !== null && value !== undefined && value !== '' && 
           !(Array.isArray(value) && value.length === 0);
  }).length;
  
  const totalFields = Object.keys(data).length;
  const completenessScore = (filledFields / totalFields) * 100;
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    qualityScore: Math.max(0, qualityScore),
    completenessScore: Math.round(completenessScore),
    filledFields,
    totalFields
  };
}

// Executar validação
const validation = validateExtraction(extractedData);

// Retornar dados enriquecidos
return {
  json: {
    ...extractedData,
    validation: validation,
    extracted_at: new Date().toISOString()
  }
};
```

---

### **PASSO 3: Atualizar Nó de Retorno ao Backend**

#### **3.1. Modificar "Retorno categorização":**

**HTTP Request Settings:**
- **Method:** `POST`
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/documents/categorization-result`
- **Authentication:** None
- **Body Content Type:** JSON

**Body (JSON):**
```json
{
  "documentId": "{{ $('If1').item.json.body.documentId }}",
  "tenantId": "{{ $('If1').item.json.body.tenantId }}",
  "category": "{{ $('If1').item.json.body.category }}",
  "suggestedCategory": "{{ $json.categoria_principal }}",
  "subcategories": "{{ $json.subcategorias }}",
  "tags": "{{ $json.tags }}",
  "summary": "{{ $json.resumo }}",
  "tipo_documento": "{{ $json.tipo_documento }}",
  "nivel_acesso": "{{ $json.nivel_acesso }}",
  "departamentos_relevantes": "{{ $json.departamentos_relevantes }}",
  "palavras_chave": "{{ $json.palavras_chave }}",
  "vigencia": "{{ $json.vigencia }}",
  "autoria": "{{ $json.autoria }}",
  "versao": "{{ $json.versao }}",
  "referencias": "{{ $json.referencias }}",
  "validation": "{{ $json.validation }}",
  "confidence": "{{ $json.validation.qualityScore }}",
  "extracted_at": "{{ $json.extracted_at }}"
}
```

---

### **PASSO 4: Atualizar Backend para Receber Novos Campos**

#### **4.1. Modificar `src/routes/documents.js`:**

```javascript
// POST /api/documents/categorization-result
router.post('/categorization-result', async (req, res) => {
  try {
    const {
      documentId,
      tenantId,
      category,
      suggestedCategory,
      subcategories,
      tags,
      summary,
      tipo_documento,
      nivel_acesso,
      departamentos_relevantes,
      palavras_chave,
      vigencia,
      autoria,
      versao,
      referencias,
      validation,
      confidence,
      extracted_at
    } = req.body;

    console.log('📥 Recebendo resultado de categorização aprimorada:', {
      documentId,
      suggestedCategory,
      confidence,
      qualityScore: validation?.qualityScore
    });

    // Validar dados recebidos
    if (!documentId || !tenantId) {
      return res.status(400).json({
        success: false,
        error: 'documentId e tenantId são obrigatórios'
      });
    }

    // Preparar metadata estruturada
    const metadata = {
      tipo_documento,
      nivel_acesso,
      departamentos_relevantes,
      palavras_chave,
      vigencia,
      autoria,
      versao,
      referencias,
      validation,
      extracted_at
    };

    // Atualizar documento no banco
    const { data: document, error } = await supabase
      .from('documents')
      .update({
        category: suggestedCategory || category,
        subcategories: subcategories || [],
        tags: tags || [],
        summary: summary || '',
        metadata: metadata,
        confidence_score: confidence || validation?.qualityScore || 0,
        ai_categorized: true,
        ai_categorized_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar documento:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar documento',
        details: error.message
      });
    }

    console.log('✅ Documento categorizado com sucesso:', {
      documentId: document.id,
      category: document.category,
      confidence: document.confidence_score
    });

    res.json({
      success: true,
      document: document,
      message: 'Documento categorizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao processar categorização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar categorização',
      details: error.message
    });
  }
});
```

#### **4.2. Atualizar Migração de Banco de Dados:**

Criar arquivo `migrations/009_documents_metadata.sql`:

```sql
-- Migração: Adicionar campos de metadata aos documentos
-- Data: 13/10/2025

-- 1. Adicionar coluna metadata (JSONB)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Adicionar coluna confidence_score
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 0;

-- 3. Adicionar coluna ai_categorized
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS ai_categorized BOOLEAN DEFAULT false;

-- 4. Adicionar coluna ai_categorized_at
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS ai_categorized_at TIMESTAMP WITH TIME ZONE;

-- 5. Criar índice para busca em metadata
CREATE INDEX IF NOT EXISTS idx_documents_metadata 
ON documents USING GIN (metadata);

-- 6. Criar índice para confidence_score
CREATE INDEX IF NOT EXISTS idx_documents_confidence 
ON documents (confidence_score DESC);

-- 7. Criar índice para ai_categorized
CREATE INDEX IF NOT EXISTS idx_documents_ai_categorized 
ON documents (ai_categorized, ai_categorized_at DESC);

-- 8. Adicionar comentários
COMMENT ON COLUMN documents.metadata IS 'Metadata estruturada extraída pelo Information Extractor';
COMMENT ON COLUMN documents.confidence_score IS 'Score de confiança da categorização (0-100)';
COMMENT ON COLUMN documents.ai_categorized IS 'Indica se o documento foi categorizado pela IA';
COMMENT ON COLUMN documents.ai_categorized_at IS 'Data/hora da categorização pela IA';

-- 9. Atualizar documentos existentes (marcar como não categorizados pela IA)
UPDATE documents
SET ai_categorized = false
WHERE ai_categorized IS NULL;

COMMIT;
```

---

## 🎯 Benefícios do Novo Fluxo

### **1. Extração Estruturada:**
- ✅ Dados em formato JSON validado
- ✅ Schema rígido previne erros
- ✅ Campos opcionais e obrigatórios bem definidos

### **2. Qualidade Melhorada:**
- ✅ Validação automática de dados
- ✅ Score de confiança por extração
- ✅ Score de completude dos dados
- ✅ Alertas de warnings e erros

### **3. Metadata Enriquecida:**
- ✅ Tipo de documento identificado
- ✅ Nível de acesso classificado
- ✅ Departamentos relevantes mapeados
- ✅ Vigência extraída
- ✅ Autoria identificada
- ✅ Referências documentadas

### **4. Busca Semântica Aprimorada:**
- ✅ Palavras-chave específicas
- ✅ Tags organizadas
- ✅ Subcategorias detalhadas
- ✅ Resumo conciso para contexto

### **5. Escalabilidade:**
- ✅ Fácil adicionar novos campos
- ✅ Schema versionável
- ✅ Validação automática
- ✅ Logs estruturados

---

## 📊 Comparação: Antes vs. Depois

| Aspecto | Antes (AI Agent) | Depois (Information Extractor) |
|---------|------------------|--------------------------------|
| **Estrutura** | JSON livre | Schema JSON rígido |
| **Validação** | Manual (Code Node) | Automática (built-in) |
| **Confiança** | Estimada manualmente | Score automático |
| **Campos** | 4-5 campos básicos | 12+ campos estruturados |
| **Metadata** | Não estruturada | JSONB indexado |
| **Qualidade** | Variável | Consistente |
| **Manutenção** | Alta (código custom) | Baixa (schema declarativo) |
| **Performance** | Boa | Excelente |
| **Escalabilidade** | Limitada | Alta |

---

## 🧪 Testes

### **Teste 1: Documento de Política de Benefícios**

**Input:**
```
Política de Vale Refeição
Versão 2.1 | Vigência: 01/01/2024 a 31/12/2024

Todos os colaboradores têm direito a vale refeição de R$ 30,00/dia.
Aplicável a todos os departamentos.
Revisado por: RH
```

**Output Esperado:**
```json
{
  "categoria_principal": "Benefícios",
  "subcategorias": ["vale refeição", "alimentação"],
  "tags": ["benefícios", "vale refeição", "RH", "alimentação"],
  "resumo": "Política de vale refeição estabelece valor de R$ 30,00/dia para todos os colaboradores.",
  "tipo_documento": "Política",
  "nivel_acesso": "Interno",
  "departamentos_relevantes": ["Todos"],
  "palavras_chave": ["vale refeição", "benefícios", "colaboradores", "alimentação"],
  "vigencia": {
    "data_inicio": "2024-01-01",
    "data_fim": "2024-12-31"
  },
  "autoria": {
    "revisor": "RH"
  },
  "versao": "2.1",
  "validation": {
    "isValid": true,
    "qualityScore": 90
  }
}
```

### **Teste 2: Documento Técnico de TI**

**Input:**
```
Manual de Acesso VPN
Departamento de TI | Confidencial

Instruções para configurar VPN corporativa.
Requer aprovação do gestor.
Referência: Política de Segurança da Informação 2023
```

**Output Esperado:**
```json
{
  "categoria_principal": "TI",
  "subcategorias": ["VPN", "acesso remoto", "segurança"],
  "tags": ["VPN", "TI", "segurança", "acesso remoto", "configuração"],
  "resumo": "Manual técnico para configuração de VPN corporativa com requisitos de aprovação.",
  "tipo_documento": "Manual",
  "nivel_acesso": "Confidencial",
  "departamentos_relevantes": ["TI"],
  "referencias": ["Política de Segurança da Informação 2023"],
  "validation": {
    "isValid": true,
    "qualityScore": 85
  }
}
```

---

## 🚀 Próximos Passos

### **Fase 1: Implementação Básica** (2-3h)
1. [ ] Adicionar Information Extractor ao workflow
2. [ ] Configurar schema JSON
3. [ ] Remover nós antigos
4. [ ] Testar com documentos reais

### **Fase 2: Backend** (2-3h)
1. [ ] Executar migração 009
2. [ ] Atualizar endpoint de categorização
3. [ ] Adicionar logs estruturados
4. [ ] Testar integração completa

### **Fase 3: Validação e Qualidade** (1-2h)
1. [ ] Adicionar Code Node de validação
2. [ ] Implementar alertas de baixa qualidade
3. [ ] Criar dashboard de métricas
4. [ ] Documentar casos de uso

### **Fase 4: Busca Semântica Aprimorada** (3-4h)
1. [ ] Atualizar endpoint de busca semântica
2. [ ] Usar palavras_chave para melhorar ranking
3. [ ] Filtrar por metadata
4. [ ] Testar relevância de resultados

---

## 📝 Notas Importantes

### **Custos de API:**
- Information Extractor usa GPT-4 ou GPT-4-turbo
- Custo estimado: ~$0.01-0.03 por documento
- Considerar cache para documentos já processados

### **Fallback:**
- Manter AI Agent antigo como fallback
- Se Information Extractor falhar → usar AI Agent
- Logs detalhados para debugging

### **Versionamento:**
- Schema JSON deve ser versionado
- Migrar dados antigos se schema mudar
- Manter compatibilidade retroativa

---

---

## 💡 Dicas Práticas (Baseado na Documentação Oficial)

### **1. Quando Usar Cada Tipo de Schema:**

| Cenário | Schema Type Recomendado | Motivo |
|---------|-------------------------|--------|
| **Prototipação rápida** | Generate From JSON Example | Cria schema em segundos |
| **Time não técnico** | From Attribute Descriptions | Interface visual simples |
| **Produção corporativa** | Define using JSON Schema | Controle total e validações |
| **Schemas simples (≤5 campos)** | From Attribute Descriptions | Não precisa de complexidade |
| **Schemas complexos (>5 campos)** | Define using JSON Schema | Suporta nested objects |
| **Validações rígidas** | Define using JSON Schema | Enums, formats, required |

### **2. System Prompt Template - Boas Práticas:**

O n8n **automaticamente adiciona** instruções de formato ao prompt. Seu prompt deve focar em:

✅ **Faça:**
- Explique o **contexto** do domínio (ex: "documentos corporativos")
- Defina o **nível de detalhe** esperado
- Especifique **regras de negócio** (ex: "vigência é sempre no formato YYYY-MM-DD")
- Indique **quando deixar campos vazios**

❌ **Não Faça:**
- Repetir instruções de formato (n8n já adiciona)
- Pedir para retornar JSON (já é automático)
- Descrever os campos (já estão no schema)

**Exemplo de bom prompt:**
```
Você é um especialista em classificação de documentos corporativos brasileiros.

CONTEXTO:
- Documentos são de empresas de tecnologia
- Foco em políticas internas, benefícios e treinamentos
- Vigência deve sempre estar no formato YYYY-MM-DD

REGRAS:
- Se data não estiver explícita, deixe vazio
- Departamentos devem usar nomes padronizados (RH, TI, Financeiro, etc.)
- Tags devem ser em português, minúsculas
- Resumo: máximo 3 frases, objetivo e claro
```

### **3. Integração com LangChain:**

O Information Extractor é um **nó LangChain**, o que significa:

✅ Pode ser conectado a outros nós LangChain
✅ Suporta múltiplos modelos (OpenAI, Anthropic, etc.)
✅ Herda configurações do Chat Model conectado
✅ Pode usar memória de conversas (se configurado)

**Arquitetura típica:**
```
Chat Model (GPT-4) → Information Extractor → Output Parser
```

### **4. Tratamento de Erros Comuns:**

**Erro: "Schema inválido"**
- Solução: Valide o JSON Schema em [jsonschema.net](https://www.jsonschema.net/)

**Erro: "Campos obrigatórios ausentes"**
- Solução: Use `required: []` vazio ou liste apenas campos críticos

**Erro: "Output não estruturado"**
- Solução: Adicione exemplos ao System Prompt
- Solução 2: Use Schema Type mais rígido

**Erro: "Timeout"**
- Solução: Reduza o tamanho do texto de entrada
- Solução 2: Simplifique o schema (menos campos)

### **5. Performance e Custos:**

**Otimizações:**
- Use `gpt-4o-mini` para schemas simples (10x mais barato)
- Use `gpt-4o` ou `gpt-4-turbo` para schemas complexos
- Limite o tamanho do texto de entrada (ex: primeiros 5000 chars)
- Use cache quando disponível (n8n pode cachear resultados)

**Custos Estimados (OpenAI):**
- gpt-4o-mini: ~$0.0001-0.0005/extração
- gpt-4o: ~$0.005-0.01/extração
- gpt-4-turbo: ~$0.01-0.03/extração

### **6. Recursos Adicionais:**

📚 **Documentação Oficial:**
- [Information Extractor Node](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.information-extractor/)
- [LangChain in n8n](https://docs.n8n.io/advanced-ai/langchain/)
- [JSON Schema Guide](https://json-schema.org/learn/getting-started-step-by-step)

🎓 **Tutoriais:**
- [n8n Advanced AI Docs](https://docs.n8n.io/advanced-ai/)
- [RAG in n8n](https://docs.n8n.io/advanced-ai/rag-in-n8n/)

---

**Criado em:** 13 de outubro de 2025  
**Última atualização:** 13 de outubro de 2025 (Atualizado com documentação oficial)  
**Status:** 📝 Pronto para implementação  
**Referência:** [Documentação Oficial n8n Information Extractor](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.information-extractor/)

