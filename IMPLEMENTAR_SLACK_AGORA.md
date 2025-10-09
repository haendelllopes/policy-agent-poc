# 🚀 Implementar Slack AGORA - Passo a Passo

## 📋 Visão Geral

Você vai criar:
1. ✅ Bot no Slack (10 min)
2. ✅ Workflow no n8n (20 min)
3. ✅ Conectar tudo (5 min)

**Tempo total: ~35 minutos**

---

## 🎯 FASE 1: Criar Bot no Slack (10 min)

### 1. Criar App
```
https://api.slack.com/apps
↓
"Create New App" → "From scratch"
↓
Nome: Navigator Bot
Workspace: [Seu workspace de teste]
↓
"Create App" ✅
```

### 2. Adicionar Permissões
```
Menu lateral: "OAuth & Permissions"
↓
Seção: "Bot Token Scopes"
↓
Adicionar scopes:
  ✅ chat:write
  ✅ chat:write.public
  ✅ im:write
  ✅ im:history
  ✅ app_mentions:read
```

### 3. Instalar App
```
Ainda em "OAuth & Permissions"
↓
"Install to Workspace"
↓
"Allow" ✅
```

### 4. Copiar Bot Token
```
Após instalar, copie:
"Bot User OAuth Token"
↓
Começa com: xoxb-...
↓
📋 COLE AQUI TEMPORARIAMENTE:
_________________________________
```

### 5. Copiar Team ID
```
Menu lateral: "Basic Information"
↓
Seção: "App Credentials"
↓
Copie: "Team ID"
↓
📋 COLE AQUI:
_________________________________
```

---

## 🔧 FASE 2: Criar Workflow n8n (20 min)

### 1. Novo Workflow
```
https://hndll.app.n8n.cloud
↓
"+ New Workflow"
↓
Nome: "Slack Integration - Navigator"
↓
Salvar (Ctrl+S)
```

### 2. Adicionar Nó 1: Webhook
```
Clicar no "+"
↓
Buscar: "Webhook"
↓
Configurar:
  • HTTP Method: POST
  • Path: slack-navigator
  • Response Mode: Last Node
↓
"Execute Node"
↓
📋 COPIAR "Production URL":
_________________________________
```

### 3. Adicionar Nó 2: IF (Challenge)
```
Conectar do Webhook
↓
Buscar: "IF"
↓
Renomear: "Is Challenge?"
↓
Configurar:
  • Modo: Rules
  • Rule 1:
    - Field: {{ $json.challenge }}
    - Operation: exists
```

### 4. Adicionar Nó 3: Return Challenge (TRUE)
```
Conectar da saída TRUE do IF
↓
Buscar: "Respond to Webhook"
↓
Renomear: "Return Challenge"
↓
Configurar:
  • Response Mode: Using Fields Below
  • Response Body: JSON
  • JSON:
```

```json
{
  "challenge": "={{ $json.challenge }}"
}
```

### 5. Adicionar Nó 4: Extract Data (FALSE)
```
Conectar da saída FALSE do IF
↓
Buscar: "Code"
↓
Renomear: "Extract Slack Data"
↓
Cole este código:
```

```javascript
const event = $input.item.json.event || {};
const teamId = $input.item.json.team_id;

if (!event.type) {
  return [];
}

return {
  json: {
    from: event.user,
    message: event.text,
    channel: event.channel,
    team_id: teamId,
    event_type: event.type,
    timestamp: event.ts
  }
};
```

### 6. Adicionar Nó 5: Set Mock Response (TEMPORÁRIO)
```
Conectar do "Extract Slack Data"
↓
Buscar: "Set"
↓
Renomear: "Mock AI Response"
↓
Configurar:
  • Mode: Manual Mapping
  • Fields to Set:
    - Name: output
    - Value: Olá! Sou o Navigator Bot. Como posso ajudar?
```

### 7. Adicionar Nó 6: Send to Slack
```
Conectar do "Mock AI Response"
↓
Buscar: "HTTP Request"
↓
Renomear: "Send to Slack"
↓
Configurar:
  • Method: POST
  • URL: https://slack.com/api/chat.postMessage
  • Authentication: None (vamos adicionar header manual)
  • Send Headers: ON
  • Headers:
    - Name: Authorization
    - Value: Bearer [COLAR SEU BOT TOKEN AQUI]
    - Name: Content-Type
    - Value: application/json
  • Send Body: ON
  • Body Content Type: JSON
  • Specify Body: Using JSON
  • JSON:
```

```json
{
  "channel": "={{ $('Extract Slack Data').item.json.channel }}",
  "text": "={{ $('Mock AI Response').item.json.output }}"
}
```

### 8. Ativar Workflow
```
Toggle no topo: "Inactive" → "Active" ✅
↓
Salvar (Ctrl+S)
```

---

## 🔗 FASE 3: Conectar Slack → n8n (5 min)

### 1. Adicionar Webhook URL no Slack
```
Voltar para: https://api.slack.com/apps
↓
Selecionar: "Navigator Bot"
↓
Menu lateral: "Event Subscriptions"
↓
Toggle: "Enable Events" (ON)
↓
Request URL: [COLAR URL DO WEBHOOK N8N]
↓
Aguardar ✅ verde
```

### 2. Adicionar Bot Events
```
Ainda em "Event Subscriptions"
↓
Seção: "Subscribe to bot events"
↓
"Add Bot User Event":
  ✅ message.im
  ✅ app_mention
↓
"Save Changes"
```

### 3. Reinstalar App (se pedir)
```
Menu lateral: "OAuth & Permissions"
↓
"Reinstall App" (se aparecer)
↓
"Allow"
```

---

## 🧪 FASE 4: TESTAR! (2 min)

### 1. Abrir Slack
```
Abrir seu workspace de teste
↓
Clicar em "Direct Messages"
↓
Clicar no "+"
↓
Buscar: "Navigator Bot"
↓
Enviar mensagem: "Olá!"
```

### 2. Verificar Resposta
```
Bot deve responder:
"Olá! Sou o Navigator Bot. Como posso ajudar?"
```

### ✅ SE FUNCIONOU:
**PARABÉNS!** 🎉 Integração básica está funcionando!

### ❌ SE NÃO FUNCIONOU:
1. Verificar n8n Executions (aba Executions)
2. Ver se workflow executou
3. Ver onde parou/errou
4. Verificar logs

---

## 📊 Estrutura Visual do Workflow

```
┌──────────────┐
│    Webhook   │ ← Slack envia mensagem
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Is Challenge? │ (IF)
└──────┬───────┘
       │
   ┌───┴───┐
   │       │
 TRUE    FALSE
   │       │
   ▼       ▼
┌──────┐ ┌─────────────────┐
│Return│ │Extract Slack    │
│Chall.│ │Data             │
└──────┘ └────────┬────────┘
                  │
                  ▼
         ┌────────────────┐
         │Mock AI Response│ ← Resposta fixa (por enquanto)
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │Send to Slack   │ ← Envia resposta
         └────────────────┘
```

---

## 🐛 Troubleshooting Rápido

### ❌ Webhook não verifica no Slack
```
1. Workflow está "Active"?
2. Path é "slack-navigator"?
3. Response Mode é "Last Node"?
4. Testar URL manualmente:
   curl -X POST [URL DO WEBHOOK] \
     -H "Content-Type: application/json" \
     -d '{"challenge":"test"}'
   
   Deve retornar: {"challenge":"test"}
```

### ❌ Bot não responde
```
1. Verificar n8n Executions
2. Workflow executou?
3. Bot Token correto no nó "Send to Slack"?
4. Scopes corretos no Slack App?
```

### ❌ Erro "not_in_channel"
```
1. Bot precisa estar no canal
2. Para DMs, não precisa adicionar
3. Para canais, adicionar bot: /invite @Navigator Bot
```

---

## ✅ Checklist de Sucesso

- [ ] Bot criado no Slack
- [ ] Bot Token copiado
- [ ] Workflow criado no n8n
- [ ] Webhook configurado
- [ ] Challenge respondendo
- [ ] Extract Data OK
- [ ] Mock Response OK
- [ ] Send to Slack configurado
- [ ] Workflow ativo
- [ ] Slack Event Subscriptions configurado
- [ ] Teste: Bot respondeu! ✅

---

## 🎯 Próximos Passos (Depois que funcionar)

1. **Substituir Mock por AI Agent real**
   - Adicionar nó AI Agent
   - Configurar OpenAI
   - Conectar com documentos

2. **Adicionar busca de Tenant**
   - HTTP Request para Navigator API
   - Buscar config por team_id
   - Usar token correto do tenant

3. **Integrar com Vector Store**
   - Adicionar documentos
   - Configurar RAG
   - Busca semântica

4. **Melhorar respostas**
   - Prompt engineering
   - Contexto melhor
   - Formatação de mensagens

---

## 📞 Precisa de Ajuda?

**Logs n8n:**
1. Aba "Executions"
2. Clicar na execução
3. Ver cada nó
4. Verificar Input/Output

**Logs Slack:**
1. https://api.slack.com/apps
2. Seu app
3. "Event Subscriptions"
4. Ver "Recent deliveries"

---

## 🎉 Status Atual

```
┌─────────────────────────────────────┐
│  ✅ Bot Slack criado                │
│  ⏳ Workflow n8n (fazendo agora)    │
│  ⏳ Conectar (depois do workflow)   │
│  ⏳ Testar (quase lá!)              │
└─────────────────────────────────────┘
```

---

**AGORA É SUA VEZ!** 🚀

**Comece pela FASE 1 e vá seguindo passo a passo.**

**Qualquer dúvida, me avise!** 💬





