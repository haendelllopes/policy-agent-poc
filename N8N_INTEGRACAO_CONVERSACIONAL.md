# 🤖 Integração Sistema Conversacional de Trilhas - N8N

## 🎯 **Visão Geral**

Integração do sistema conversacional de trilhas ao fluxo N8N existente, mantendo sua arquitetura atual e adicionando apenas os nós necessários.

---

## 🔄 **Fluxo Proposto**

```
Mensagem do Colaborador (WhatsApp/Telegram)
        ↓
Switch Principal (existente)
        ↓
Novo: Switch "Tipo de Conversa"
        ↓
    ├─ "trilhas disponíveis" → API Navigator → Resposta
    ├─ "quero começar trilha" → API Navigator → Inicia trilha
    ├─ "finalizei/dificuldade" → API Navigator → Feedback
    └─ Outras conversas → AI Agent (existente)
```

---

## 🛠️ **Nós a Adicionar**

### **1️⃣ Switch "Tipo de Conversa"**
**Posição:** Entre "Merge" e "1️⃣ Analisar Sentimento"

**Configuração:**
```json
{
  "rules": {
    "values": [
      {
        "conditions": {
          "conditions": [
            {
              "leftValue": "={{ $json.messageText.toLowerCase() }}",
              "rightValue": "trilhas?|trilha|disponíveis|disponivel",
              "operator": {
                "type": "string",
                "operation": "regex"
              }
            }
          ]
        },
        "outputKey": "Consultar Trilhas"
      },
      {
        "conditions": {
          "conditions": [
            {
              "leftValue": "={{ $json.messageText.toLowerCase() }}",
              "rightValue": "começar|iniciar|começar trilha|quero fazer",
              "operator": {
                "type": "string",
                "operation": "regex"
              }
            }
          ]
        },
        "outputKey": "Iniciar Trilha"
      },
      {
        "conditions": {
          "conditions": [
            {
              "leftValue": "={{ $json.messageText.toLowerCase() }}",
              "rightValue": "finalizei|terminei|concluí|dificuldade|problema|ajuda",
              "operator": {
                "type": "string",
                "operation": "regex"
              }
            }
          ]
        },
        "outputKey": "Feedback Trilha"
      }
    ]
  }
}
```

### **2️⃣ HTTP Request - Trilhas Disponíveis**
**Posição:** Após Switch "Consultar Trilhas"

**Configuração:**
```json
{
  "method": "GET",
  "url": "=https://navigator-gules.vercel.app/api/agent/trilhas/disponiveis/{{ $json.from }}?tenant={{ $json.tenantId }}",
  "sendHeaders": true,
  "specifyHeaders": "json",
  "jsonHeaders": "{\"Content-Type\": \"application/json\"}",
  "options": {}
}
```

### **3️⃣ Code - Formatar Trilhas Disponíveis**
**Posição:** Após HTTP Request trilhas

**JavaScript:**
```javascript
const trilhas = $input.first().json;

let resposta = "📚 *Trilhas Disponíveis:*\n\n";

// Trilhas disponíveis
if (trilhas.disponiveis && trilhas.disponiveis.length > 0) {
  resposta += "🆕 *Novas Trilhas:*\n";
  trilhas.disponiveis.forEach((trilha, index) => {
    resposta += `${index + 1}. ${trilha.nome}\n`;
    resposta += `   📅 Prazo: ${trilha.prazo_dias} dias\n`;
    resposta += `   📝 ${trilha.descricao}\n\n`;
  });
}

// Trilhas em andamento
if (trilhas.em_andamento && trilhas.em_andamento.length > 0) {
  resposta += "⏳ *Em Andamento:*\n";
  trilhas.em_andamento.forEach(trilha => {
    resposta += `• ${trilha.nome}\n`;
  });
  resposta += "\n";
}

// Trilhas concluídas
if (trilhas.concluidas && trilhas.concluidas.length > 0) {
  resposta += "✅ *Concluídas:*\n";
  trilhas.concluidas.forEach(trilha => {
    resposta += `• ${trilha.nome}\n`;
  });
  resposta += "\n";
}

resposta += "💡 *Para começar uma trilha, digite:*\n";
resposta += "\"Quero começar a trilha [nome]\"\n\n";
resposta += "🔗 *Dashboard:* " + trilhas.dashboard_url;

return [{
  json: {
    output: resposta,
    channel: $('Merge').first().json.channel,
    from: $('Merge').first().json.from,
    tenantId: $('Merge').first().json.tenantId
  }
}];
```

### **4️⃣ HTTP Request - Iniciar Trilha**
**Posição:** Após Switch "Iniciar Trilha"

**Configuração:**
```json
{
  "method": "POST",
  "url": "=https://navigator-gules.vercel.app/api/agent/trilhas/iniciar?tenant={{ $json.tenantId }}",
  "sendHeaders": true,
  "specifyHeaders": "json",
  "jsonHeaders": "{\"Content-Type\": \"application/json\"}",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"colaborador_id\": \"{{ $json.from }}\",\n  \"trilha_id\": \"{{ $('Code - Extrair Trilha').item.json.trilha_id }}\"\n}"
}
```

### **5️⃣ Code - Extrair Nome da Trilha**
**Posição:** Antes de HTTP Request iniciar trilha

**JavaScript:**
```javascript
const mensagem = $input.first().json.messageText.toLowerCase();

// Buscar trilhas disponíveis primeiro
const trilhasResponse = await fetch(`https://navigator-gules.vercel.app/api/agent/trilhas/disponiveis/${$input.first().json.from}?tenant=${$input.first().json.tenantId}`);
const trilhas = await trilhasResponse.json();

// Extrair nome da trilha da mensagem
let trilhaEncontrada = null;

if (trilhas.disponiveis) {
  trilhaEncontrada = trilhas.disponiveis.find(trilha => 
    mensagem.includes(trilha.nome.toLowerCase()) ||
    trilha.nome.toLowerCase().includes(mensagem.replace(/começar|iniciar|trilha|quero|fazer/gi, '').trim())
  );
}

if (!trilhaEncontrada) {
  return [{
    json: {
      output: "❌ Não encontrei essa trilha. Digite \"trilhas disponíveis\" para ver a lista completa.",
      channel: $input.first().json.channel,
      from: $input.first().json.from,
      tenantId: $input.first().json.tenantId
    }
  }];
}

return [{
  json: {
    trilha_id: trilhaEncontrada.id,
    trilha_nome: trilhaEncontrada.nome,
    channel: $input.first().json.channel,
    from: $input.first().json.from,
    tenantId: $input.first().json.tenantId
  }
}];
```

### **6️⃣ Code - Formatar Resposta Início Trilha**
**Posição:** Após HTTP Request iniciar trilha

**JavaScript:**
```javascript
const resultado = $input.first().json;

if (resultado.success) {
  let resposta = `🎉 *Trilha Iniciada!*\n\n`;
  resposta += `📚 *${resultado.trilha.nome}*\n`;
  resposta += `📝 ${resultado.trilha.descricao}\n\n`;
  resposta += `⏰ *Prazo:* ${resultado.trilha.prazo_dias} dias\n`;
  resposta += `📅 *Data limite:* ${new Date(resultado.data_limite).toLocaleDateString('pt-BR')}\n\n`;
  
  if (resultado.primeiro_conteudo) {
    resposta += `📄 *Primeiro conteúdo:*\n`;
    resposta += `${resultado.primeiro_conteudo.titulo}\n`;
    resposta += `🔗 ${resultado.primeiro_conteudo.url}\n\n`;
  }
  
  resposta += `🔗 *Acesse seu dashboard:*\n${resultado.dashboard_url}\n\n`;
  resposta += `💡 *Dica:* Me avise quando terminar ou se tiver alguma dificuldade!`;
} else {
  let resposta = `❌ *Erro ao iniciar trilha*\n\n`;
  resposta += resultado.message || 'Erro desconhecido';
}

return [{
  json: {
    output: resposta,
    channel: $input.first().json.channel,
    from: $input.first().json.from,
    tenantId: $input.first().json.tenantId
  }
}];
```

### **7️⃣ HTTP Request - Feedback Trilha**
**Posição:** Após Switch "Feedback Trilha"

**Configuração:**
```json
{
  "method": "POST",
  "url": "=https://navigator-gules.vercel.app/api/agent/trilhas/feedback?tenant={{ $json.tenantId }}",
  "sendHeaders": true,
  "specifyHeaders": "json",
  "jsonHeaders": "{\"Content-Type\": \"application/json\"}",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"colaborador_id\": \"{{ $json.from }}\",\n  \"trilha_id\": \"{{ $('Code - Extrair Trilha Feedback').item.json.trilha_id }}\",\n  \"feedback\": \"{{ $json.messageText }}\",\n  \"tipo_feedback\": \"{{ $('Code - Extrair Trilha Feedback').item.json.tipo_feedback }}\"\n}"
}
```

### **8️⃣ Code - Extrair Trilha para Feedback**
**Posição:** Antes de HTTP Request feedback

**JavaScript:**
```javascript
const mensagem = $input.first().json.messageText.toLowerCase();

// Detectar tipo de feedback
let tipoFeedback = 'geral';
if (mensagem.includes('dificuldade') || mensagem.includes('problema') || mensagem.includes('não consigo')) {
  tipoFeedback = 'dificuldade';
} else if (mensagem.includes('sugestão') || mensagem.includes('melhorar')) {
  tipoFeedback = 'sugestao';
} else if (mensagem.includes('finalizei') || mensagem.includes('terminei') || mensagem.includes('concluí')) {
  tipoFeedback = 'elogio';
}

// Buscar trilhas do colaborador
const trilhasResponse = await fetch(`https://navigator-gules.vercel.app/api/agent/trilhas/disponiveis/${$input.first().json.from}?tenant=${$input.first().json.tenantId}`);
const trilhas = await trilhasResponse.json();

// Tentar identificar a trilha (priorizar em andamento)
let trilhaEncontrada = null;
if (trilhas.em_andamento && trilhas.em_andamento.length > 0) {
  trilhaEncontrada = trilhas.em_andamento[0]; // Pegar a primeira em andamento
} else if (trilhas.concluidas && trilhas.concluidas.length > 0) {
  trilhaEncontrada = trilhas.concluidas[0]; // Pegar a primeira concluída
}

if (!trilhaEncontrada) {
  return [{
    json: {
      output: "❌ Não encontrei uma trilha ativa para seu feedback. Verifique se você tem trilhas em andamento.",
      channel: $input.first().json.channel,
      from: $input.first().json.from,
      tenantId: $input.first().json.tenantId
    }
  }];
}

return [{
  json: {
    trilha_id: trilhaEncontrada.id,
    tipo_feedback: tipoFeedback,
    channel: $input.first().json.channel,
    from: $input.first().json.from,
    tenantId: $input.first().json.tenantId
  }
}];
```

### **9️⃣ Code - Formatar Resposta Feedback**
**Posição:** Após HTTP Request feedback

**JavaScript:**
```javascript
const resultado = $input.first().json;

if (resultado.success) {
  let resposta = `✅ *Feedback Recebido!*\n\n`;
  resposta += `📚 *Trilha:* ${resultado.feedback.trilha_nome}\n`;
  resposta += `📝 *Seu feedback:* ${resultado.feedback.feedback}\n\n`;
  resposta += `🙏 Obrigado pelo seu retorno! `;
  
  if (resultado.feedback.tipo_feedback === 'dificuldade') {
    resposta += `Nossa equipe de RH será notificada para te ajudar.`;
  } else if (resultado.feedback.tipo_feedback === 'sugestao') {
    resposta += `Sua sugestão será analisada pela equipe.`;
  } else {
    resposta += `Continue assim!`;
  }
} else {
  let resposta = `❌ *Erro ao processar feedback*\n\n`;
  resposta += resultado.message || 'Erro desconhecido';
}

return [{
  json: {
    output: resposta,
    channel: $input.first().json.channel,
    from: $input.first().json.from,
    tenantId: $input.first().json.tenantId
  }
}];
```

---

## 🔗 **Conexões a Fazer**

### **1️⃣ Modificar conexão do "Merge":**
- **De:** Merge → BACKEND_URL
- **Para:** Merge → Switch "Tipo de Conversa"

### **2️⃣ Switch "Tipo de Conversa" → 3 saídas:**
- **"Consultar Trilhas"** → HTTP Request trilhas disponíveis
- **"Iniciar Trilha"** → Code extrair trilha → HTTP Request iniciar
- **"Feedback Trilha"** → Code extrair feedback → HTTP Request feedback
- **"Outras conversas"** → BACKEND_URL (fluxo existente)

### **3️⃣ Todas as saídas → Code responder:**
- Todos os nós de formatação conectam ao "Code responder" existente

---

## 📊 **Fluxo Completo**

```
Mensagem (WhatsApp/Telegram)
        ↓
Normalize Message
        ↓
Merge
        ↓
Switch "Tipo de Conversa"
        ├─ Consultar Trilhas → HTTP → Code → Code responder → Decide Canal1
        ├─ Iniciar Trilha → Code → HTTP → Code → Code responder → Decide Canal1  
        ├─ Feedback Trilha → Code → HTTP → Code → Code responder → Decide Canal1
        └─ Outras → BACKEND_URL → (fluxo existente)
```

---

## 🎯 **Vantagens da Integração**

### **✅ Mantém seu fluxo atual:**
- AI Agent existente continua funcionando
- Análise de sentimento mantida
- Webhooks de feedback preservados

### **✅ Adiciona funcionalidades:**
- Consulta de trilhas via conversa
- Início de trilhas via comando
- Feedback contextual sobre trilhas
- Integração completa com APIs

### **✅ Experiência unificada:**
- Colaborador usa um único canal
- Respostas contextualizadas
- Navegação natural entre funcionalidades

---

## 🚀 **Próximos Passos**

1. **Adicionar os 9 nós** no seu N8N
2. **Configurar as conexões** conforme diagrama
3. **Testar cada fluxo** com mensagens de exemplo
4. **Ajustar regex** se necessário
5. **Ativar o workflow**

---

**🎊 Com essa integração, seu colaborador poderá:**
- "Tenho alguma trilha disponível?" → Lista trilhas
- "Quero começar trilha de Segurança" → Inicia trilha  
- "Finalizei a trilha" → Registra feedback
- "Tive dificuldade" → Solicita ajuda

**Tudo via conversa natural no WhatsApp/Telegram!** 🤖
