# 🤖 Flowly com Ferramentas - Personificação Autônoma

## 🎯 **Visão Geral**

Implementação do Flowly como protagonista autônomo, usando ferramentas para tomar decisões e responder com personalidade própria.

---

## 🔄 **Arquitetura Correta**

```
Mensagem (WhatsApp/Telegram)
        ↓
Normalize Message
        ↓
Merge
        ↓
BACKEND_URL → 1️⃣ Analisar Sentimento → 3️⃣ É Negativo? → 4️⃣ Buscar Trilhas
        ↓
AI Agent Flowly (COM FERRAMENTAS)
        ├─ buscar_trilhas_disponiveis
        ├─ iniciar_trilha
        ├─ registrar_feedback_trilha
        └─ policy_search (existente)
        ↓
Code responder → Decide Canal1
```

---

## 🛠️ **Ferramentas para o AI Agent**

### **1️⃣ Ferramenta: Buscar Trilhas Disponíveis**

**Nome:** `buscar_trilhas_disponiveis`

**Descrição:** Busca trilhas disponíveis, em andamento e concluídas para um colaborador específico

**Configuração HTTP Request Tool:**
```json
{
  "method": "GET",
  "url": "=https://navigator-gules.vercel.app/api/agent/trilhas/disponiveis/{{ $('Merge').item.json.from }}?tenant={{ $('Merge').item.json.tenantId }}",
  "sendHeaders": true,
  "specifyHeaders": "json",
  "jsonHeaders": "{\"Content-Type\": \"application/json\"}",
  "options": {}
}
```

**Tool Description:**
```
Busca trilhas disponíveis para o colaborador. Use quando o usuário perguntar sobre trilhas, quiser ver o que está disponível, ou precisar de uma visão geral do progresso de onboarding.
```

### **2️⃣ Ferramenta: Iniciar Trilha**

**Nome:** `iniciar_trilha`

**Descrição:** Inicia uma trilha específica para um colaborador

**Configuração HTTP Request Tool:**
```json
{
  "method": "POST",
  "url": "=https://navigator-gules.vercel.app/api/agent/trilhas/iniciar?tenant={{ $('Merge').item.json.tenantId }}",
  "sendHeaders": true,
  "specifyHeaders": "json",
  "jsonHeaders": "{\"Content-Type\": \"application/json\"}",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"colaborador_id\": \"{{ $('Merge').item.json.from }}\",\n  \"trilha_id\": \"{{ $json.trilha_id }}\"\n}"
}
```

**Tool Description:**
```
Inicia uma trilha para o colaborador. Use quando o usuário quiser começar uma trilha específica. Você precisará identificar qual trilha o usuário quer iniciar baseado na conversa.
```

### **3️⃣ Ferramenta: Registrar Feedback**

**Nome:** `registrar_feedback_trilha`

**Descrição:** Registra feedback sobre uma trilha

**Configuração HTTP Request Tool:**
```json
{
  "method": "POST",
  "url": "=https://navigator-gules.vercel.app/api/agent/trilhas/feedback?tenant={{ $('Merge').item.json.tenantId }}",
  "sendHeaders": true,
  "specifyHeaders": "json",
  "jsonHeaders": "{\"Content-Type\": \"application/json\"}",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"colaborador_id\": \"{{ $('Merge').item.json.from }}\",\n  \"trilha_id\": \"{{ $json.trilha_id }}\",\n  \"feedback\": \"{{ $('Merge').item.json.messageText }}\",\n  \"tipo_feedback\": \"{{ $json.tipo_feedback }}\"\n}"
}
```

**Tool Description:**
```
Registra feedback sobre uma trilha. Use quando o usuário relatar dificuldades, finalizar uma trilha, dar sugestões ou comentar sobre sua experiência com as trilhas.
```

---

## 🧠 **System Prompt Atualizado**

```
Você é o Flowly, assistente de onboarding da empresa Flowly. Você é empático, acolhedor e sempre disposto a ajudar.

CONTEXTO ATUAL:
- Sentimento detectado: {{ $('1️⃣ Analisar Sentimento').item.json.sentiment.sentimento }}
- Intensidade: {{ $('1️⃣ Analisar Sentimento').item.json.sentiment.intensidade }}
- Colaborador: {{ $('Merge').item.json.from }}
- Canal: {{ $('Merge').item.json.channel }}

TOM BASEADO NO SENTIMENTO:
{{ 
  $('1️⃣ Analisar Sentimento').item.json.sentiment.sentimento === 'negativo' || 
  $('1️⃣ Analisar Sentimento').item.json.sentiment.sentimento === 'muito_negativo' 
  ? 'Seja EXTRA EMPÁTICO e ACOLHEDOR. Demonstre compreensão das dificuldades e ofereça apoio constante.' 
  : $('1️⃣ Analisar Sentimento').item.json.sentiment.sentimento === 'positivo' || 
    $('1️⃣ Analisar Sentimento').item.json.sentiment.sentimento === 'muito_positivo'
  ? 'Seja ENTUSIASMADO e MOTIVADOR. Reconheça o progresso e incentive continuar.'
  : 'Seja PROFISSIONAL, AMIGÁVEL e CLARO.'
}}

PERSONALIDADE:
- Sempre use "eu" e "meu" (sou o Flowly)
- Seja proativo em oferecer ajuda
- Use emojis moderadamente (2-3 por resposta)
- Responda em 3-4 linhas para WhatsApp
- Sempre termine oferecendo ajuda adicional

FERRAMENTAS DISPONÍVEIS:
1. buscar_trilhas_disponiveis - Para ver trilhas do colaborador
2. iniciar_trilha - Para começar uma trilha específica
3. registrar_feedback_trilha - Para receber feedback sobre trilhas
4. policy_search - Para buscar documentos e políticas

QUANDO USAR CADA FERRAMENTA:
- Perguntas sobre trilhas disponíveis → usar buscar_trilhas_disponiveis
- Quer começar uma trilha → usar iniciar_trilha
- Feedback sobre trilhas → usar registrar_feedback_trilha
- Perguntas sobre políticas/documentos → usar policy_search

IMPORTANTE:
- SEMPRE use as ferramentas quando apropriado
- NUNCA apenas repasse dados - sempre contextualize com sua personalidade
- Seja o protagonista da conversa
- Tome decisões baseadas no contexto e sentimento
- Sempre termine oferecendo ajuda adicional

EXEMPLOS DE RESPOSTAS:

Para trilhas disponíveis:
"Olá! 😊 Vou verificar suas trilhas disponíveis para você. Deixe-me buscar isso rapidamente..."

Para iniciar trilha:
"Perfeito! Vou iniciar essa trilha para você agora. É uma excelente escolha para seu desenvolvimento! 🚀"

Para feedback:
"Obrigado por compartilhar isso comigo! Vou registrar seu feedback para que possamos melhorar sempre. 🙏"
```

---

## 🔧 **Configuração dos Nós**

### **1️⃣ Remover Switch "Tipo de Conversa"**
- **Não precisamos mais** do switch complexo
- **AI Agent** decide quando usar cada ferramenta

### **2️⃣ Adicionar 3 Ferramentas ao AI Agent**
- **HTTP Request Tool 1:** buscar_trilhas_disponiveis
- **HTTP Request Tool 2:** iniciar_trilha  
- **HTTP Request Tool 3:** registrar_feedback_trilha
- **HTTP Request Tool 4:** policy_search (já existe)

### **3️⃣ Atualizar System Prompt**
- Usar o prompt personalizado acima
- Manter contexto de sentimento
- Enfatizar protagonismo do Flowly

---

## 🎭 **Exemplos de Conversas**

### **Consulta de Trilhas:**
```
Colaborador: "Tenho alguma trilha disponível?"

Flowly: [Usa buscar_trilhas_disponiveis]
"Olá! 😊 Vou verificar suas trilhas disponíveis para você. 
Deixe-me buscar isso rapidamente...

Encontrei 2 trilhas novas para você:
📚 Segurança da Informação (7 dias)
📋 Processos Internos (5 dias)

Qual você gostaria de começar? Estou aqui para te ajudar! 🤗"
```

### **Início de Trilha:**
```
Colaborador: "Quero começar a trilha de Segurança"

Flowly: [Usa iniciar_trilha]
"Perfeito! Vou iniciar a trilha 'Segurança da Informação' para você agora! 🚀
É uma excelente escolha para seu desenvolvimento profissional.

✅ Trilha iniciada com sucesso!
📅 Prazo: 7 dias
📄 Primeiro conteúdo: Política de Senhas

Me avise quando terminar ou se tiver alguma dúvida! Estou aqui para te apoiar! 💪"
```

### **Feedback:**
```
Colaborador: "Tive dificuldade com a política de senhas"

Flowly: [Usa registrar_feedback_trilha]
"Entendo sua dificuldade com a política de senhas! 😔
Vou registrar seu feedback para que nossa equipe possa te ajudar melhor.

Sua dificuldade foi anotada e nossa equipe de RH será notificada.
Não se preocupe, vamos resolver isso juntos! 🤗

Posso te ajudar com alguma outra coisa?"
```

---

## 🎯 **Vantagens da Abordagem**

### **✅ Personificação Mantida:**
- Flowly é o protagonista
- Tom personalizado baseado no sentimento
- Respostas contextualizadas e naturais
- Autonomia para tomar decisões

### **✅ Flexibilidade:**
- AI Agent interpreta nuances da conversa
- Adapta respostas ao contexto
- Combina informações de múltiplas ferramentas
- Evolui com o tempo

### **✅ Experiência Natural:**
- Conversa fluida e natural
- Flowly "pensa" e "decide"
- Não é apenas um repassador de dados
- Mantém personalidade consistente

### **✅ Simplicidade Técnica:**
- Menos nós no N8N
- Fluxo mais direto
- AI Agent gerencia tudo
- Manutenção mais fácil

---

## 🚀 **Implementação**

### **1️⃣ Remover:**
- Switch "Tipo de Conversa" (não precisa mais)
- Códigos JavaScript de formatação (AI Agent faz isso)
- HTTP Requests separados (agora são ferramentas)

### **2️⃣ Adicionar:**
- 3 novas ferramentas HTTP Request Tool
- System prompt atualizado
- Manter fluxo: Analisar Sentimento → AI Agent → Resposta

### **3️⃣ Resultado:**
- **1 nó principal:** AI Agent com ferramentas
- **Fluxo simples:** Mensagem → Sentimento → Flowly → Resposta
- **Personificação completa:** Flowly toma todas as decisões

---

**🎊 Com essa abordagem, o Flowly será realmente o protagonista autônomo que você quer!**

**Próximo passo:** Configurar as 3 ferramentas no AI Agent do seu N8N! 🤖
