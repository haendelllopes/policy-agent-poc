# 🔧 Tutorial: Configurar n8n para Slack

## 📋 PASSO 1: Criar Workflow no n8n

### 1.1 Acessar n8n
1. Abra: **https://hndll.app.n8n.cloud**
2. Faça login
3. Clique em: **"+ Create Workflow"** ou **"New"**

### 1.2 Nomear Workflow
1. No topo da tela, clique no nome padrão
2. Renomeie para: **"Slack Integration - Navigator"**
3. Salve (Ctrl+S ou Cmd+S)

---

## 📡 PASSO 2: Adicionar Webhook (Receber do Slack)

### 2.1 Adicionar Nó Webhook
1. Clique no **"+"** no canvas
2. Busque por: **"Webhook"**
3. Selecione: **"Webhook"** (trigger node)

### 2.2 Configurar Webhook
1. Em **"HTTP Method"**: Selecione **"POST"**
2. Em **"Path"**: Digite **`slack-navigator`**
3. Em **"Response Mode"**: Selecione **"Last Node"**
4. Clique em **"Execute Node"**

### 2.3 Copiar Webhook URL
1. Após executar, você verá: **"Production URL"**
2. Copie a URL completa:
   ```
   https://hndll.app.n8n.cloud/webhook/slack-navigator
   ```
3. **GUARDE ESTA URL** - vai usar no Slack!

---

## 🔄 PASSO 3: Adicionar URL Verification (Challenge)

### 3.1 Adicionar Nó IF
1. Conecte do Webhook
2. Adicione nó: **"IF"**
3. Nomeie: **"Is Challenge?"**

### 3.2 Configurar Condição
1. Em **"Conditions"**: 
   - **Value 1**: `{{ $json.challenge }}`
   - **Operation**: **"exists"**

### 3.3 Adicionar Nó de Resposta (TRUE)
1. Na saída **"true"** do IF
2. Adicione: **"Respond to Webhook"**
3. Nomeie: **"Return Challenge"**
4. Em **"Response Body"**: Modo **"JSON"**
5. Cole:
```json
{
  "challenge": "={{ $json.challenge }}"
}
```

---

## 📨 PASSO 4: Processar Mensagem do Slack

### 4.1 Adicionar Nó Function (FALSE)
1. Na saída **"false"** do IF
2. Adicione: **"Code"** ou **"Function"**
3. Nomeie: **"Extract Slack Data"**

### 4.2 Código de Extração
```javascript
// Extrair dados da mensagem Slack
const event = $input.item.json.event || {};
const teamId = $input.item.json.team_id;

// Se não tem evento, retorna vazio
if (!event.type) {
  return [];
}

// Extrair dados
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

---

## 🔍 PASSO 5: Identificar Tenant

### 5.1 Adicionar HTTP Request
1. Conecte do "Extract Slack Data"
2. Adicione: **"HTTP Request"**
3. Nomeie: **"Get Tenant Config"**

### 5.2 Configurar Request
1. **Method**: **GET**
2. **URL**: 
   ```
   https://navigator-gules.vercel.app/api/tenant/by-slack-team
   ```
3. **Query Parameters**:
   - **Name**: `teamId`
   - **Value**: `{{ $json.team_id }}`

4. **Authentication**: None (por enquanto)

---

## 🤖 PASSO 6: Adicionar AI Agent

### 6.1 Adicionar AI Agent
1. Conecte do "Get Tenant Config"
2. Adicione: **"AI Agent"** (ou "Basic LLM Chain")
3. Nomeie: **"AI Assistant"**

### 6.2 Configurar AI Agent
1. **Chat Model**: Selecione **OpenAI Chat Model**
2. **Credentials**: Adicione sua API Key OpenAI
3. **Prompt**: 
```
Você é um assistente de onboarding corporativo.

Responda a pergunta do funcionário baseado no contexto fornecido:

Pergunta: {{ $('Extract Slack Data').item.json.message }}

Seja objetivo, claro e amigável.
```

### 6.3 Conectar Vector Store (Opcional - se tiver)
1. Se tiver Vector Store configurado
2. Adicione como **"Memory"** ou **"Retriever"**
3. Isso permite buscar em documentos

---

## 📤 PASSO 7: Enviar Resposta para Slack

### 7.1 Adicionar HTTP Request (Enviar)
1. Conecte do "AI Assistant"
2. Adicione: **"HTTP Request"**
3. Nomeie: **"Send to Slack"**

### 7.2 Configurar Request
1. **Method**: **POST**
2. **URL**: `https://slack.com/api/chat.postMessage`
3. **Authentication**: **Generic Credential Type**
   - **Type**: **Header Auth**
   - **Name**: `Authorization`
   - **Value**: `Bearer {{ $('Get Tenant Config').item.json.slack_bot_token }}`

4. **Body Content Type**: **JSON**
5. **Body**:
```json
{
  "channel": "={{ $('Extract Slack Data').item.json.channel }}",
  "text": "={{ $('AI Assistant').item.json.output }}"
}
```

---

## 📋 PASSO 8: Estrutura Final do Workflow

```
┌─────────────────┐
│  Slack Webhook  │ (Recebe mensagem)
└────────┬────────┘
         │
         ▼
   ┌─────────────┐
   │ Is Challenge?│ (IF)
   └──────┬──────┘
          │
    ┌─────┴─────┐
    │           │
  TRUE        FALSE
    │           │
    ▼           ▼
┌────────┐  ┌───────────────────┐
│Return  │  │Extract Slack Data │
│Challenge│  └─────────┬─────────┘
└────────┘            │
                      ▼
              ┌──────────────────┐
              │Get Tenant Config │
              └────────┬─────────┘
                       │
                       ▼
               ┌──────────────┐
               │ AI Assistant │
               └──────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │Send to Slack  │
              └───────────────┘
```

---

## ✅ PASSO 9: Testar Workflow

### 9.1 Ativar Workflow
1. Clique no toggle no topo: **"Active"** (ON)
2. Salve o workflow (Ctrl+S)

### 9.2 Obter Webhook URL Final
1. Clique no nó "Slack Webhook"
2. Copie a **"Production URL"**
3. Exemplo:
   ```
   https://hndll.app.n8n.cloud/webhook/slack-navigator
   ```

---

## 🔙 PASSO 10: Voltar ao Slack e Completar

### 10.1 Adicionar Webhook URL no Slack
1. Volte para: **https://api.slack.com/apps**
2. Selecione seu app: **"Navigator Bot"**
3. Clique em: **"Event Subscriptions"**
4. Em **"Request URL"**, cole a webhook URL do n8n
5. Aguarde a verificação ✅ (deve ficar verde)
6. Clique em: **"Save Changes"**

### 10.2 Reinstalar App (se necessário)
1. Se o Slack pedir, vá em: **"OAuth & Permissions"**
2. Clique em: **"Reinstall App"**
3. Autorize novamente

---

## 🧪 PASSO 11: Testar Integração

### 11.1 Testar no Slack
1. Abra seu Slack workspace
2. Clique em **"Direct Messages"**
3. Clique em **"+"** para nova DM
4. Busque por: **"Navigator Bot"**
5. Envie mensagem: **"Olá!"**

### 11.2 Verificar no n8n
1. Vá para n8n
2. Abra a aba **"Executions"**
3. Você deve ver uma nova execução
4. Clique para ver detalhes
5. Verifique se passou por todos os nós

### 11.3 Verificar Resposta no Slack
1. Volte para o Slack
2. O bot deve ter respondido
3. Se respondeu, **FUNCIONOU!** 🎉

---

## 🐛 Troubleshooting

### ❌ Webhook não verificou no Slack
- Verifique se workflow está **Active**
- Teste o webhook manualmente:
  ```bash
  curl -X POST https://hndll.app.n8n.cloud/webhook/slack-navigator \
    -H "Content-Type: application/json" \
    -d '{"challenge":"test123"}'
  ```
- Deve retornar: `{"challenge":"test123"}`

### ❌ Bot não responde
- Verifique Bot Token no nó "Send to Slack"
- Verifique se AI Agent está configurado
- Veja logs de execução no n8n

### ❌ Erro 403 no Slack
- Verifique scopes (permissões) do bot
- Reinstale o app no workspace

---

## 📊 Variáveis de Ambiente (Opcional)

Para produção, configure variáveis no n8n:

1. **Settings** → **Variables**
2. Adicione:
   ```
   SLACK_BOT_TOKEN = xoxb-...
   OPENAI_API_KEY = sk-...
   NAVIGATOR_API_URL = https://navigator-gules.vercel.app
   ```

3. Use no workflow: `{{ $env.SLACK_BOT_TOKEN }}`

---

## ✅ Checklist Final

- [ ] Workflow criado e nomeado
- [ ] Webhook configurado
- [ ] URL Challenge funcionando
- [ ] Extração de dados OK
- [ ] AI Agent configurado
- [ ] Envio para Slack OK
- [ ] Workflow ativo
- [ ] Slack configurado com webhook URL
- [ ] Teste manual passou
- [ ] Bot respondendo no Slack

---

## 🎉 Próximo Passo

Agora que a integração básica funciona:

1. **Adicionar autenticação real** (buscar token do tenant)
2. **Integrar com Vector Store** (documentos)
3. **Melhorar prompt da IA**
4. **Adicionar logging**
5. **Configurar no Navigator** (frontend)

---

**Status**: ✅ Workflow básico funcionando!  
**Tempo estimado**: 30-45 minutos





