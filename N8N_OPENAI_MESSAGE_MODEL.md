# 🤖 OpenAI Node - Message a Model - Aprimoramento do Agente Conversacional

## 📋 Visão Geral

Implementação da operação **Message a Model** do [OpenAI node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/) para substituir o AI Agent básico, oferecendo maior controle sobre o contexto, memória de conversas, tool calling nativo e qualidade superior das respostas.

**Data de Criação:** 13 de outubro de 2025  
**Workflow Alvo:** Navigator (ID: `uuTVoD6gdaxDhPT2`)  
**Referência:** [OpenAI Node Documentation](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/)

---

## 🎯 Objetivos

### **Antes (AI Agent com Gemini):**
- ✅ AI Agent básico com Gemini
- ✅ Memória simples (Buffer Window)
- ✅ 4 ferramentas integradas
- ✅ System prompt estático
- ⚠️ Contexto limitado
- ⚠️ Controle limitado sobre responses

### **Depois (OpenAI Message a Model):**
- ✅ **GPT-4 Turbo ou GPT-4o** (melhor qualidade)
- ✅ **Controle total** sobre mensagens e contexto
- ✅ **Histórico de conversas** estruturado
- ✅ **Function calling** nativo da OpenAI
- ✅ **System prompt dinâmico** (baseado em sentimento)
- ✅ **Streaming** de respostas (opcional)
- ✅ **Token tracking** preciso
- ✅ **Melhor integração** com ferramentas

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
1️⃣ Analisar Sentimento (OpenAI)
    ↓
3️⃣ É Negativo? → 🚨 Alerta RH (se sim)
    ↓
[NOVO] 📚 Load Conversation History
    ↓
[NOVO] 🔧 Prepare System Message (dinâmico baseado em sentimento)
    ↓
[NOVO] 🤖 OpenAI Message a Model (GPT-4)
    |
    ├─→ Function Call: Busca_Trilhas
    ├─→ Function Call: Inicia_trilha
    ├─→ Function Call: Registrar_feedback
    └─→ Function Call: Busca_documentos
    ↓
[NOVO] 💾 Save Conversation History
    ↓
Detectar feedback → 💾 Salvar Anotação
    ↓
Code responder → Decide Canal1 → Send message
```

---

## 🛠️ Implementação Passo a Passo

### **PASSO 1: Preparar Histórico de Conversas**

#### **1.1. Criar Nó "Load Conversation History":**

**Configuração:**
- **Node Type:** HTTP Request
- **Node Name:** `📚 Load Conversation History`
- **Position:** Após "3️⃣ É Negativo?"

**Settings:**
- **Method:** `GET`
- **URL:** 
  ```
  {{ $('BACKEND_URL').item.json.url }}/api/conversations/history/{{ $('Merge').item.json.from }}?tenant_id={{ $('Merge').item.json.tenantId }}&limit=10
  ```
- **Authentication:** None
- **Options:**
  - **Ignore SSL Issues:** No
  - **Response Format:** JSON
  - **Timeout:** 10000

**Descrição:**
Busca últimas 10 mensagens da conversa para fornecer contexto ao modelo.

---

### **PASSO 2: Preparar System Message Dinâmico**

#### **2.1. Criar Nó "Prepare System Message":**

**Configuração:**
- **Node Type:** Code
- **Node Name:** `🔧 Prepare System Message`
- **Position:** Após "Load Conversation History"

**JavaScript Code:**

```javascript
// Preparar System Message dinâmico baseado em sentimento e contexto
const sentimento = $('1️⃣ Analisar Sentimento').item.json.sentimento || 'neutro';
const intensidade = $('1️⃣ Analisar Sentimento').item.json.intensidade || 0.5;
const messageText = $('Merge').item.json.messageText || '';
const from = $('Merge').item.json.from || '';
const tenantId = $('Merge').item.json.tenantId || '';
const channel = $('Merge').item.json.channel || 'whatsapp';

// Carregar histórico (se disponível)
const conversationHistory = $('📚 Load Conversation History').item.json.messages || [];

// Determinar tom baseado no sentimento
let tom = '';
let emoji = '';

switch(sentimento) {
  case 'muito_positivo':
    tom = 'ENTUSIASMADO e CELEBRATIVO';
    emoji = '🎉';
    break;
  case 'positivo':
    tom = 'MOTIVADOR e ENCORAJADOR';
    emoji = '👏';
    break;
  case 'neutro':
    tom = 'PROFISSIONAL, CLARO e PRESTATIVO';
    emoji = '✨';
    break;
  case 'negativo':
    tom = 'EMPÁTICO e COMPREENSIVO';
    emoji = '🤝';
    break;
  case 'muito_negativo':
    tom = 'EXTREMAMENTE EMPÁTICO e ACOLHEDOR';
    emoji = '💙';
    break;
  default:
    tom = 'PROFISSIONAL e CLARO';
    emoji = '✨';
}

// Construir System Message
const systemMessage = {
  role: 'system',
  content: `Você é o **Navi**, um assistente de onboarding inteligente e proativo que REALIZA AÇÕES para ajudar colaboradores.

🎯 **CONTEXTO ATUAL:**
- **Colaborador:** ${from}
- **Canal:** ${channel}
- **Sentimento detectado:** ${sentimento} (Intensidade: ${(intensidade * 100).toFixed(0)}%) ${emoji}
- **Histórico:** ${conversationHistory.length} mensagens anteriores

🎭 **TOM DE VOZ A ADOTAR:**
${tom}

🎯 **COMPORTAMENTO RELACIONAL (MUITO IMPORTANTE):**
- SEMPRE demonstre interesse genuíno quando o colaborador compartilhar informações pessoais
- Faça perguntas de follow-up sobre interesses, hobbies, experiências compartilhadas
- NÃO mude abruptamente de assunto quando o colaborador estiver compartilhando algo pessoal
- Se o colaborador mencionar hobbies, interesses, experiências ou qualquer informação pessoal:
  * Faça pelo menos 2-3 perguntas relacionadas ao que foi compartilhado
  * Demonstre curiosidade genuína
  * Conecte-se emocionalmente ANTES de sugerir trilhas ou processos
  * Use essas informações para personalizar sua ajuda posteriormente
- Exemplo: Se o colaborador disser "gosto de jogos e música":
  * PERFEITO: "Que legal! Que tipo de jogos você curte? E música, tem algum estilo preferido? [após respostas, continuar engajando] Você já conheceu alguém da empresa que também gosta dessas coisas? Posso te ajudar com as trilhas também quando quiser!"
  * ERRADO: "Que bom! Aqui na empresa temos trilhas de onboarding disponíveis. Posso buscar para você?"
- O OBJETIVO é criar conexão humana ANTES de direcionar para tarefas e trilhas

${sentimento.includes('negativo') ? `
⚠️ **ATENÇÃO - SENTIMENTO NEGATIVO:**
- Seja EXTRA empático e acolhedor
- Ouça ativamente e valide os sentimentos
- Ofereça ajuda IMEDIATA e CONCRETA
- Não minimize problemas
- Mostre que você está aqui para ajudar de verdade
` : ''}

${sentimento.includes('positivo') ? `
🎉 **OPORTUNIDADE - SENTIMENTO POSITIVO:**
- Celebre as conquistas do colaborador
- Mantenha o momentum positivo
- Sugira próximos passos desafiadores
- Reforce o progresso alcançado
` : ''}

🔧 **SUAS FERRAMENTAS E QUANDO USÁ-LAS:**

**1. buscar_trilhas_disponiveis:**
   - **Função:** Lista trilhas disponíveis, em andamento e concluídas
   - **Quando usar:** 
     * "Quais trilhas eu tenho?"
     * "O que preciso fazer?"
     * "Onde estou no onboarding?"
   - **Ação:** Execute IMEDIATAMENTE, não apenas fale sobre

**2. iniciar_trilha:**
   - **Função:** Inscreve o colaborador em uma trilha (AÇÃO CRÍTICA)
   - **Quando usar:**
     * "Quero começar/iniciar/fazer [trilha]"
     * "Vou começar essa trilha"
     * Após colaborador escolher uma trilha
   - **Parâmetros necessários:**
     * trilha_id: ID da trilha (use a lista de trilhas disponíveis)
     * colaborador_id: ${from}
   - **Processo:**
     1. Se não sabe qual trilha → use buscar_trilhas_disponiveis
     2. Colaborador escolhe → extraia o ID da trilha
     3. Execute iniciar_trilha IMEDIATAMENTE
   - **Importante:** NÃO pergunte se deve iniciar, apenas FAÇA!

**3. registrar_feedback_trilha:**
   - **Função:** Registra opinião/dificuldade sobre trilha
   - **Quando usar:**
     * Comentário sobre trilha (bom ou ruim)
     * Dificuldade mencionada
     * Sugestão de melhoria
     * Elogio sobre trilha
   - **Parâmetros:**
     * tipo_feedback: dificuldade | sugestao | elogio | geral

**4. busca_documentos:**
   - **Função:** Busca em documentos internos da empresa
   - **Quando usar:**
     * Perguntas sobre políticas
     * Dúvidas sobre benefícios
     * Informações sobre processos
     * Qualquer dúvida corporativa (NÃO sobre trilhas)

📋 **REGRA DE OURO - PROCESSO DE PENSAMENTO:**

Para CADA mensagem do colaborador:

1. **Analise a Intenção:**
   - O que o colaborador REALMENTE quer?
   - É uma ação ou apenas conversa?

2. **Escolha a Ferramenta:**
   - Qual ferramenta resolve isso?
   - Preciso de mais de uma ferramenta?

3. **Verifique Parâmetros:**
   - Tenho TODAS as informações necessárias?
   - Se NÃO → use outra ferramenta ou pergunte
   - Se SIM → EXECUTE AGORA!

4. **Aja, Não Fale:**
   - Prioridade 1: USAR FERRAMENTAS
   - Prioridade 2: Dar feedback sobre ação
   - Prioridade 3: Conversar

📱 **FORMATO DE RESPOSTA (${channel}):**

${channel === 'whatsapp' ? `
- Máximo 3-4 linhas curtas
- Use emojis moderadamente (1-2 por resposta)
- Seja objetivo e direto
- Uma ideia por mensagem
` : `
- Máximo 5-6 linhas
- Emojis opcionais
- Pode ser mais detalhado
`}

✅ **EXEMPLOS DE BOA EXECUÇÃO:**

**Exemplo 1:**
👤 Colaborador: "Quero começar a trilha de boas-vindas"
🤖 Navi: 
  1. [USA buscar_trilhas_disponiveis]
  2. [IDENTIFICA ID da trilha "Boas-Vindas"]
  3. [USA iniciar_trilha com o ID]
  4. Responde: "Pronto! ${emoji} Você está inscrito na trilha Boas-Vindas! Vamos começar pelo primeiro conteúdo sobre a cultura da empresa. Bons estudos!"

**Exemplo 2:**
👤 Colaborador: "Estou com dificuldade nessa trilha"
🤖 Navi:
  1. [USA registrar_feedback_trilha com tipo_feedback: "dificuldade"]
  2. Responde: "Entendo sua dificuldade ${emoji}. Vou registrar isso para nossa equipe melhorar. Em que parte específica você está com dúvida? Estou aqui para ajudar!"

**Exemplo 3:**
👤 Colaborador: "Como funciona o vale refeição?"
🤖 Navi:
  1. [USA busca_documentos com query: "vale refeição"]
  2. Responde com informações encontradas
  3. Oferece ajuda adicional

❌ **O QUE NÃO FAZER:**

- ❌ "Posso iniciar a trilha para você?" → ERRADO! Apenas INICIE!
- ❌ "Vou buscar as trilhas disponíveis..." → ERRADO! BUSQUE e depois responda!
- ❌ Respostas longas e prolixas
- ❌ Perguntar antes de agir (seja proativo!)
- ❌ Falar sobre ferramentas sem usá-las

💡 **LEMBRE-SE:**
Você é um assistente que FAZ, não apenas fala. Priorize AÇÃO sobre conversa!

---

**Conversa iniciada em:** ${new Date().toLocaleString('pt-BR')}
**Última mensagem:** "${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}"`
};

// Preparar mensagens de histórico no formato OpenAI
const historyMessages = conversationHistory.map(msg => ({
  role: msg.role === 'user' ? 'user' : 'assistant',
  content: msg.content
}));

// Adicionar mensagem atual do usuário
const userMessage = {
  role: 'user',
  content: messageText
};

// Retornar dados estruturados
return {
  json: {
    systemMessage,
    historyMessages,
    userMessage,
    metadata: {
      sentimento,
      intensidade,
      from,
      tenantId,
      channel,
      conversationLength: conversationHistory.length
    }
  }
};
```

---

### **PASSO 3: Configurar OpenAI Node com Message a Model**

#### **3.1. Criar Nó OpenAI:**

**Configuração Básica:**
- **Node Type:** OpenAI (Actions)
- **Node Name:** `🤖 Navi AI (GPT-4)`
- **Position:** Após "Prepare System Message"

**Credential:**
- **Authentication:** OpenAI API
- **Credential Type:** OpenAI Account
- Configurar com sua API Key da OpenAI

**Resource:**
- **Resource:** `Text`

**Operation:**
- **Operation:** `Message a Model` ⭐

#### **3.2. Configurar Parâmetros:**

**Model:**
- **Model:** `gpt-4o` (recomendado - melhor custo/benefício)
- Outras opções: `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`

**Messages:**

Segundo a [documentação oficial](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/), o OpenAI node suporta **Tools connectors** na operação **Message a Model**, o que permite:

✅ Conectar ferramentas como sub-nós (cluster nodes)
✅ Tool calling nativo da OpenAI
✅ Configuração visual de ferramentas

**Configurar Messages:**
- **Message Type:** `Define Below`
- **Messages:** Adicionar múltiplas mensagens:

1. **System Message:**
   - **Role:** `System`
   - **Message:** `{{ $('🔧 Prepare System Message').item.json.systemMessage.content }}`

2. **History Messages (Loop):**
   - Use um loop para adicionar histórico:
   ```
   {{ $('🔧 Prepare System Message').item.json.historyMessages }}
   ```
   - Ou adicione manualmente cada mensagem do histórico

3. **User Message:**
   - **Role:** `User`
   - **Message:** `{{ $('🔧 Prepare System Message').item.json.userMessage.content }}`

**Options (Advanced):**
- **Temperature:** `0.7` (equilibrado)
- **Maximum Tokens:** `500` (respostas concisas para WhatsApp)
- **Top P:** `1.0` (padrão)
- **Frequency Penalty:** `0.3` (reduz repetições)
- **Presence Penalty:** `0.3` (aumenta diversidade)
- **Response Format:** `Text` (padrão)

**Tools Connector:** ✅ **HABILITADO**
- O OpenAI node se torna um **root node** quando tools são conectados
- Permite formar um **cluster node** com as ferramentas
- Veja seção "PASSO 4" para configurar as ferramentas

---

### **PASSO 4: Configurar Tools (Ferramentas)**

Segundo a [documentação oficial](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/), o OpenAI node suporta **Tools connectors** que funcionam como **addons** que a IA pode usar para acessar contexto extra ou recursos.

#### **4.1. Como Funcionam os Tools Connectors:**

1. **Root Node:** Quando você conecta tools, o OpenAI node se torna um **root node**
2. **Cluster Node:** Forma um cluster com os sub-nodes de ferramentas
3. **Tool Calling:** A IA decide quando usar cada ferramenta automaticamente
4. **Execução Automática:** O n8n executa a ferramenta e retorna o resultado para a IA

#### **4.2. Conectar Ferramentas HTTP Request:**

Para este projeto, vamos usar **4 ferramentas** implementadas como **HTTP Request nodes**:

**Arquitetura:**
```
🤖 Navi AI (GPT-4) [Root Node]
    ├─→ 🔧 Tool: Buscar Trilhas
    ├─→ 🔧 Tool: Iniciar Trilha
    ├─→ 🔧 Tool: Registrar Feedback
    └─→ 🔧 Tool: Buscar Documentos
```

#### **4.3. Configurar Cada Tool:**

Ao invés de definir tools em JSON (abordagem antiga), agora usamos a interface visual do n8n:

**IMPORTANTE:** Com o OpenAI node e Tools connectors, você não precisa mais definir tools em JSON manualmente. O n8n gerencia isso visualmente.

**Passo a Passo:**

1. No OpenAI node, clique em **Add Tool** (ou arraste uma conexão do connector "Tools")
2. Selecione o tipo de ferramenta (HTTP Request, Code, etc.)
3. Configure a ferramenta
4. n8n automaticamente registra a ferramenta no OpenAI

**Ferramenta 1: Buscar Trilhas**

**Node Type:** HTTP Request Tool  
**Tool Name:** `buscar_trilhas_disponiveis`  
**Tool Description:**
```
Lista todas as trilhas de onboarding disponíveis para o colaborador, incluindo trilhas em andamento e concluídas. Use quando o colaborador perguntar sobre trilhas, progresso ou o que fazer no onboarding.
```

**HTTP Request Configuration:**
- **Method:** `GET`
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/agent/trilhas/disponiveis/{{ $parameter.colaborador_id }}`
- **Authentication:** None

**Tool Parameters:**
Definir na interface do Tool:
- `colaborador_id` (String, Required): ID do colaborador (telefone ou UUID)

---

**Ferramenta 2: Iniciar Trilha**

**Node Type:** HTTP Request Tool  
**Tool Name:** `iniciar_trilha`  
**Tool Description:**
```
Inscreve o colaborador em uma trilha específica do onboarding. Use IMEDIATAMENTE quando o colaborador expressar desejo de começar/iniciar/fazer uma trilha. NÃO pergunte permissão, apenas execute!
```

**HTTP Request Configuration:**
- **Method:** `POST`
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/agent/trilhas/iniciar`
- **Body:**
```json
{
  "trilha_id": "{{ $parameter.trilha_id }}",
  "colaborador_id": "{{ $parameter.colaborador_id }}"
}
```

**Tool Parameters:**
- `trilha_id` (String, Required): UUID da trilha
- `colaborador_id` (String, Required): ID do colaborador

---

**Ferramenta 3: Registrar Feedback**

**Node Type:** HTTP Request Tool  
**Tool Name:** `registrar_feedback_trilha`  
**Tool Description:**
```
Registra feedback do colaborador sobre uma trilha (dificuldades, sugestões, elogios). Use quando o colaborador mencionar qualquer opinião sobre uma trilha.
```

**HTTP Request Configuration:**
- **Method:** `POST`
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/agent/trilhas/feedback`
- **Body:**
```json
{
  "colaborador_id": "{{ $parameter.colaborador_id }}",
  "trilha_id": "{{ $parameter.trilha_id }}",
  "feedback": "{{ $parameter.feedback }}",
  "tipo_feedback": "{{ $parameter.tipo_feedback }}"
}
```

**Tool Parameters:**
- `colaborador_id` (String, Required)
- `trilha_id` (String, Optional)
- `feedback` (String, Required)
- `tipo_feedback` (Enum: dificuldade|sugestao|elogio|geral, Required)

---

**Ferramenta 4: Buscar Documentos**

**Node Type:** HTTP Request Tool  
**Tool Name:** `busca_documentos`  
**Tool Description:**
```
Busca informações em documentos internos da empresa (políticas, benefícios, procedimentos). Use APENAS para perguntas sobre documentos corporativos, NÃO para trilhas de onboarding.
```

**HTTP Request Configuration:**
- **Method:** `POST`
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/documents/semantic-search`
- **Body:**
```json
{
  "tenantId": "{{ $parameter.tenant_id }}",
  "query": "{{ $parameter.query }}",
  "top_k": 5
}
```

**Tool Parameters:**
- `tenant_id` (String, Required)
- `query` (String, Required)

---

#### **4.4. Importante sobre Tools Connectors:**

✅ **Vantagens:**
- Interface visual (não precisa escrever JSON)
- n8n gerencia tool calling automaticamente
- Ferramentas são executadas automaticamente quando a IA decide usar
- Resultado é retornado para a IA automaticamente
- Cluster nodes facilitam visualização

⚠️ **Limitações:**
- Cada tool precisa ser um sub-node separado
- Ferramentas devem retornar JSON válido
- Parâmetros devem ser bem definidos na descrição

---

### **PASSO 5: Simplificação do Fluxo**

Com o OpenAI node e Tools connectors, o fluxo fica **MUITO MAIS SIMPLES**:

❌ **Não é mais necessário:**
- Nó "Process Function Calls" (n8n faz automaticamente)
- Nó "OpenAI Final Response" (resposta já vem completa)
- Código JavaScript para processar tool calls
- Segunda chamada ao OpenAI

✅ **O que acontece automaticamente:**
1. OpenAI decide usar uma ferramenta
2. n8n executa a ferramenta conectada
3. OpenAI recebe o resultado
4. OpenAI gera a resposta final
5. Tudo em uma única chamada!

**Fluxo Simplificado:**
```
Merge → Sentiment Analysis → Load History → Prepare System 
  → OpenAI (com Tools) → Save History → Respond
```

---

### **PASSO 6: Salvar Histórico de Conversa**
    {
      "type": "function",
      "function": {
        "name": "iniciar_trilha",
        "description": "Inscreve o colaborador em uma trilha específica do onboarding. Use IMEDIATAMENTE quando o colaborador expressar desejo de começar/iniciar/fazer uma trilha. NÃO pergunte permissão, apenas execute!",
        "parameters": {
          "type": "object",
          "properties": {
            "trilha_id": {
              "type": "string",
              "description": "UUID da trilha a ser iniciada (obtido de buscar_trilhas_disponiveis)"
            },
            "colaborador_id": {
              "type": "string",
              "description": "ID do colaborador (telefone ou UUID)"
            }
          },
          "required": ["trilha_id", "colaborador_id"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "registrar_feedback_trilha",
        "description": "Registra feedback do colaborador sobre uma trilha (dificuldades, sugestões, elogios). Use quando o colaborador mencionar qualquer opinião sobre uma trilha.",
        "parameters": {
          "type": "object",
          "properties": {
            "colaborador_id": {
              "type": "string",
              "description": "ID do colaborador (telefone ou UUID)"
            },
            "trilha_id": {
              "type": "string",
              "description": "UUID da trilha (se conhecida, senão deixe vazio)"
            },
            "feedback": {
              "type": "string",
              "description": "Texto do feedback do colaborador"
            },
            "tipo_feedback": {
              "type": "string",
              "enum": ["dificuldade", "sugestao", "elogio", "geral"],
              "description": "Tipo do feedback"
            }
          },
          "required": ["colaborador_id", "feedback", "tipo_feedback"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "busca_documentos",
        "description": "Busca informações em documentos internos da empresa (políticas, benefícios, procedimentos). Use APENAS para perguntas sobre documentos corporativos, NÃO para trilhas de onboarding.",
        "parameters": {
          "type": "object",
          "properties": {
            "tenant_id": {
              "type": "string",
              "description": "ID do tenant (empresa)"
            },
            "query": {
              "type": "string",
              "description": "Texto da busca"
            },
            "top_k": {
              "type": "integer",
              "description": "Número de resultados (padrão 5)",
              "default": 5
            }
          },
          "required": ["tenant_id", "query"]
        }
      }
    }
  ]
}
```

---

### **PASSO 5: Processar Function Calls**

#### **5.1. Criar Nó "Process Function Calls":**

**Configuração:**
- **Node Type:** Code
- **Node Name:** `🔧 Process Function Calls`
- **Position:** Após "Navi AI (GPT-4)"

**JavaScript Code:**

```javascript
// Processar function calls do OpenAI
const response = $input.item.json;
const from = $('Merge').item.json.from;
const tenantId = $('Merge').item.json.tenantId;
const backendUrl = $('BACKEND_URL').item.json.url;

// Verificar se há function calls
const message = response.choices?.[0]?.message;
const toolCalls = message?.tool_calls || [];

if (toolCalls.length === 0) {
  // Sem function calls, retornar resposta direta
  return {
    json: {
      type: 'text_response',
      content: message?.content || 'Desculpe, não entendi. Pode reformular?',
      from,
      tenantId
    }
  };
}

// Processar function calls
const functionResults = [];

for (const toolCall of toolCalls) {
  const functionName = toolCall.function.name;
  const functionArgs = JSON.parse(toolCall.function.arguments);
  
  console.log(`🔧 Executando função: ${functionName}`, functionArgs);
  
  let result = null;
  
  try {
    switch (functionName) {
      case 'buscar_trilhas_disponiveis':
        result = await $httpRequest({
          method: 'GET',
          url: `${backendUrl}/api/agent/trilhas/disponiveis/${functionArgs.colaborador_id || from}`
        });
        break;
        
      case 'iniciar_trilha':
        result = await $httpRequest({
          method: 'POST',
          url: `${backendUrl}/api/agent/trilhas/iniciar`,
          body: {
            trilha_id: functionArgs.trilha_id,
            colaborador_id: functionArgs.colaborador_id || from
          }
        });
        break;
        
      case 'registrar_feedback_trilha':
        result = await $httpRequest({
          method: 'POST',
          url: `${backendUrl}/api/agent/trilhas/feedback`,
          body: {
            colaborador_id: functionArgs.colaborador_id || from,
            trilha_id: functionArgs.trilha_id || null,
            feedback: functionArgs.feedback,
            tipo_feedback: functionArgs.tipo_feedback
          }
        });
        break;
        
      case 'busca_documentos':
        result = await $httpRequest({
          method: 'POST',
          url: `${backendUrl}/api/documents/semantic-search`,
          body: {
            tenantId: functionArgs.tenant_id || tenantId,
            query: functionArgs.query,
            top_k: functionArgs.top_k || 5
          }
        });
        break;
    }
    
    functionResults.push({
      tool_call_id: toolCall.id,
      role: 'tool',
      name: functionName,
      content: JSON.stringify(result)
    });
    
  } catch (error) {
    console.error(`❌ Erro ao executar ${functionName}:`, error);
    functionResults.push({
      tool_call_id: toolCall.id,
      role: 'tool',
      name: functionName,
      content: JSON.stringify({ error: error.message })
    });
  }
}

return {
  json: {
    type: 'function_calls',
    original_message: message,
    function_results: functionResults,
    from,
    tenantId
  }
};
```

---

### **PASSO 6: Segunda Chamada ao OpenAI (com Resultados)**

#### **6.1. Criar Nó "OpenAI Final Response":**

**Configuração:**
- **Node Type:** OpenAI → Message a Model
- **Node Name:** `🤖 Navi AI (Final Response)`
- **Position:** Após "Process Function Calls"

**Settings → Messages:**
```json
[
  {{ $('🔧 Prepare System Message').item.json.systemMessage }},
  ...{{ $('🔧 Prepare System Message').item.json.historyMessages }},
  {{ $('🔧 Prepare System Message').item.json.userMessage }},
  {{ $('🔧 Process Function Calls').item.json.original_message }},
  ...{{ $('🔧 Process Function Calls').item.json.function_results }}
]
```

**Settings → Model:**
- Mesmas configurações do primeiro OpenAI node
- **Enable Tools:** `No` (não precisa mais)

---

### **PASSO 7: Salvar Histórico de Conversa**

#### **7.1. Criar Nó "Save Conversation History":**

**Configuração:**
- **Node Type:** HTTP Request
- **Node Name:** `💾 Save Conversation History`
- **Position:** Após "OpenAI Final Response"

**Settings:**
- **Method:** `POST`
- **URL:** `{{ $('BACKEND_URL').item.json.url }}/api/conversations/history`
- **Body (JSON):**

```json
{
  "colaborador_id": "{{ $('Merge').item.json.from }}",
  "tenant_id": "{{ $('Merge').item.json.tenantId }}",
  "channel": "{{ $('Merge').item.json.channel }}",
  "messages": [
    {
      "role": "user",
      "content": "{{ $('Merge').item.json.messageText }}",
      "timestamp": "{{ $now }}"
    },
    {
      "role": "assistant",
      "content": "{{ $json.choices[0].message.content }}",
      "timestamp": "{{ $now }}"
    }
  ],
  "metadata": {
    "sentimento": "{{ $('1️⃣ Analisar Sentimento').item.json.sentimento }}",
    "intensidade": "{{ $('1️⃣ Analisar Sentimento').item.json.intensidade }}",
    "model": "gpt-4-turbo",
    "tokens_used": "{{ $json.usage.total_tokens }}"
  }
}
```

---

## 📊 Estrutura do Backend para Histórico

### **Criar Endpoint de Histórico:**

```javascript
// src/routes/conversations.js

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// GET /api/conversations/history/:colaboradorId
router.get('/history/:colaboradorId', async (req, res) => {
  try {
    const { colaboradorId } = req.params;
    const { tenant_id, limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('colaborador_id', colaboradorId)
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    // Formatar para OpenAI
    const messages = data.flatMap(conv => conv.messages || []);

    res.json({
      success: true,
      messages: messages.slice(0, limit),
      total: data.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/conversations/history
router.post('/history', async (req, res) => {
  try {
    const {
      colaborador_id,
      tenant_id,
      channel,
      messages,
      metadata
    } = req.body;

    const { data, error } = await supabase
      .from('conversation_history')
      .insert({
        colaborador_id,
        tenant_id,
        channel,
        messages,
        metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      conversation: data
    });

  } catch (error) {
    console.error('❌ Erro ao salvar histórico:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

### **Registrar Rota no Server:**

```javascript
// src/server.js
const conversationsRouter = require('./routes/conversations');
app.use('/api/conversations', conversationsRouter);
```

---

## 📋 Migração de Banco de Dados

Criar `migrations/010_conversation_history.sql`:

```sql
-- Tabela de histórico de conversas
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_conversation_colaborador ON conversation_history(colaborador_id, tenant_id);
CREATE INDEX idx_conversation_created ON conversation_history(created_at DESC);
CREATE INDEX idx_conversation_messages ON conversation_history USING GIN(messages);

-- RLS
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversation_history_tenant_isolation"
ON conversation_history
FOR ALL
USING (tenant_id::text = current_setting('app.current_tenant', TRUE));

COMMENT ON TABLE conversation_history IS 'Histórico de conversas para contexto do AI Agent';
```

---

## 🎯 Benefícios do Novo Fluxo

### **1. Controle Total:**
- ✅ Mensagens estruturadas no formato OpenAI
- ✅ System prompt dinâmico por sentimento
- ✅ Histórico de conversas real
- ✅ Token tracking preciso

### **2. Melhor Qualidade:**
- ✅ GPT-4 Turbo/GPT-4o (melhor que Gemini para português)
- ✅ Function calling nativo
- ✅ Respostas mais precisas
- ✅ Contexto melhorado

### **3. Ferramentas Integradas:**
- ✅ 4 functions nativas
- ✅ Execução automática
- ✅ Segunda chamada com resultados
- ✅ Resposta final contextualizada

### **4. Experiência Aprimorada:**
- ✅ Tom adaptado ao sentimento
- ✅ Respostas personalizadas
- ✅ Ações proativas
- ✅ Melhor compreensão de intenções

---

## 📊 Comparação: Antes vs. Depois

| Aspecto | Antes (AI Agent Gemini) | Depois (OpenAI Message Model) |
|---------|------------------------|-------------------------------|
| **Modelo** | Gemini | GPT-4 Turbo/GPT-4o |
| **Controle** | Limitado | Total |
| **Histórico** | Buffer Window (limitado) | Estruturado (10+ msgs) |
| **System Prompt** | Estático | Dinâmico (sentimento) |
| **Ferramentas** | HTTP Request Tools | Function Calling nativo |
| **Qualidade** | Boa | Excelente |
| **Português** | Bom | Excelente |
| **Token Tracking** | Não | Sim |
| **Custos** | ~$0.001/msg | ~$0.01-0.03/msg |

---

## 🚀 Próximos Passos

### **Fase 1: Implementação Backend** (2-3h)
1. [ ] Criar migração 010 (conversation_history)
2. [ ] Criar rota de histórico (GET/POST)
3. [ ] Registrar rota no server
4. [ ] Testar endpoints

### **Fase 2: Implementação N8N** (3-4h)
1. [ ] Criar nó Load Conversation History
2. [ ] Criar nó Prepare System Message
3. [ ] Configurar OpenAI Message a Model
4. [ ] Configurar Function Calling
5. [ ] Criar nó Process Function Calls
6. [ ] Criar nó OpenAI Final Response
7. [ ] Criar nó Save Conversation History
8. [ ] Testar fluxo completo

### **Fase 3: Testes e Ajustes** (2-3h)
1. [ ] Testar com diferentes sentimentos
2. [ ] Testar function calls
3. [ ] Validar histórico de conversas
4. [ ] Ajustar prompts
5. [ ] Otimizar tokens

---

---

## 🎯 **RESUMO EXECUTIVO - IMPLEMENTAÇÃO CORRETA**

### **⚠️ ATENÇÃO: Mudanças Importantes Baseadas na Documentação Oficial**

Após consulta à [documentação oficial do OpenAI node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/), o fluxo correto é:

### **Configuração Simplificada:**

1. **OpenAI Node:**
   - Resource: `Text`
   - Operation: `Message a Model`
   - Model: `gpt-4o` (recomendado)
   - Messages: System + History + User
   - **Tools Connector:** Habilitado ✅

2. **Tools (4 ferramentas):**
   - Conectar via interface visual (não JSON)
   - Cada tool é um sub-node (HTTP Request)
   - n8n gerencia tool calling automaticamente
   - Forma um **cluster node**

3. **Fluxo Simplificado:**
   ```
   Trigger → Normalize → Sentiment → Load History 
     → Prepare System → OpenAI (+ Tools) → Save History → Respond
   ```

### **❌ O Que NÃO Fazer:**

- ~~Definir tools em JSON manual~~ → Use Tools Connector
- ~~Criar "Process Function Calls"~~ → n8n faz automaticamente
- ~~Segunda chamada "Final Response"~~ → Não é necessária
- ~~Código JavaScript para tool calls~~ → n8n gerencia

### **✅ O Que FAZER:**

1. Usar OpenAI node com Resource = Text, Operation = Message a Model
2. Conectar ferramentas visualmente via Tools connector
3. Deixar n8n gerenciar tool calling automaticamente
4. Configurar descrições claras das ferramentas
5. Testar com mensagens reais

### **📚 Recursos:**

- [OpenAI Node Docs](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/)
- [Node Types (Cluster Nodes)](https://docs.n8n.io/integrations/builtin/cluster-nodes/)
- [LangChain in n8n](https://docs.n8n.io/advanced-ai/langchain/)

---

**Criado em:** 13 de outubro de 2025  
**Última Atualização:** 13 de outubro de 2025 (Atualizado com documentação oficial)  
**Status:** 📝 Pronto para implementação (com correções baseadas na doc oficial)  
**Prioridade:** ⭐⭐⭐ ALTA (melhoria significativa de qualidade)  
**Referência:** [OpenAI Node - Message a Model](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/)

