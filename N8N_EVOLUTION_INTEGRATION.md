# 🔗 Integração Evolution API + N8N

**Objetivo:** Integrar Evolution API com workflow N8N existente
**Data:** 17 de outubro de 2025

---

## 📋 **CONFIGURAÇÃO N8N**

### **Passo 1: Adicionar credencial Evolution API**

1. **Acesse N8N:** https://hndll.app.n8n.cloud
2. **Vá em:** Settings → Credentials
3. **Clique em:** Add Credential
4. **Escolha:** HTTP Header Auth
5. **Configure:**
   - **Name:** `Evolution API Navigator`
   - **Header Name:** `apikey`
   - **Header Value:** `navigator-evolution-key-2025-secure`

### **Passo 2: Atualizar workflow existente**

#### **Substituir node "Send Message (WhatsApp/Telegram)" por:**

```javascript
// Node: HTTP Request
{
  "name": "Send WhatsApp via Evolution",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1,
  "position": [1200, 300],
  "parameters": {
    "method": "POST",
    "url": "http://localhost:8080/message/sendText/navigator-whatsapp",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "number",
          "value": "={{ $json.colaborador.phone.replace('+', '') }}"
        },
        {
          "name": "text",
          "value": "={{ $json.mensagem_sugerida }}"
        }
      ]
    },
    "options": {
      "timeout": 10000,
      "retry": {
        "enabled": true,
        "maxAttempts": 3
      }
    }
  }
}
```

### **Passo 3: Adicionar webhook para receber mensagens**

```javascript
// Node: Webhook
{
  "name": "Evolution Webhook Receiver",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "position": [100, 100],
  "parameters": {
    "path": "evolution-webhook",
    "httpMethod": "POST",
    "responseMode": "responseNode",
    "options": {}
  }
}
```

### **Passo 4: Processar mensagens recebidas**

```javascript
// Node: Code (Process Evolution Message)
{
  "name": "Process Evolution Message",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [300, 100],
  "parameters": {
    "jsCode": "// Processar mensagem recebida da Evolution API\nconst inputData = $input.all();\n\nfor (const item of inputData) {\n  const data = item.json;\n  \n  // Extrair dados da mensagem\n  if (data.key && data.message) {\n    const messageData = {\n      from: data.key.remoteJid.replace('@s.whatsapp.net', ''),\n      text: data.message.conversation || data.message.extendedTextMessage?.text || '',\n      timestamp: data.messageTimestamp,\n      messageId: data.key.id,\n      type: 'whatsapp',\n      source: 'evolution'\n    };\n    \n    return [messageData];\n  }\n}\n\nreturn [];"
  }
}
```

---

## 🔄 **WORKFLOW COMPLETO ATUALIZADO**

### **Fluxo de envio:**
```
WhatsApp/Telegram Trigger → Merge → Sentiment Analysis → 
Process Data → Save Sentiment → OpenAI Agent → 
Save Conversation → Send WhatsApp via Evolution
```

### **Fluxo de recebimento:**
```
Evolution Webhook → Process Evolution Message → 
Normalize Message → Merge → Backend URL → 
Sentiment Analysis → OpenAI Agent → 
Save Conversation → Send WhatsApp via Evolution
```

---

## 🧪 **TESTES DE INTEGRAÇÃO**

### **Teste 1: Envio de mensagem**

```bash
# Via N8N webhook
curl -X POST https://hndll.app.n8n.cloud/webhook/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "trilha_iniciada",
    "colaborador": {
      "phone": "+556299940476",
      "nome": "João Silva"
    },
    "mensagem_sugerida": "🚀 Nova trilha disponível! Acesse o Navigator para começar."
  }'
```

### **Teste 2: Recebimento de mensagem**

```bash
# Simular mensagem recebida
curl -X POST https://hndll.app.n8n.cloud/webhook/evolution-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "key": {
      "remoteJid": "556299940476@s.whatsapp.net",
      "id": "test-message-id"
    },
    "message": {
      "conversation": "Olá, preciso de ajuda com o onboarding"
    },
    "messageTimestamp": 1697558400
  }'
```

---

## 🔧 **CONFIGURAÇÕES AVANÇADAS**

### **Fallback para WhatsApp Business**

```javascript
// Node: Code (Fallback Logic)
{
  "name": "Evolution or WhatsApp Business",
  "type": "n8n-nodes-base.code",
  "parameters": {
    "jsCode": "// Tentar Evolution API primeiro, WhatsApp Business como fallback\nconst evolutionResponse = $input.first();\n\nif (evolutionResponse.json.error) {\n  // Evolution API falhou, usar WhatsApp Business\n  return [{\n    json: {\n      use_whatsapp_business: true,\n      original_data: $input.first().json\n    }\n  }];\n} else {\n  // Evolution API funcionou\n  return [{\n    json: {\n      use_whatsapp_business: false,\n      evolution_response: evolutionResponse.json\n    }\n  }];\n}"
  }
}
```

### **Monitoramento de status**

```javascript
// Node: HTTP Request (Check Evolution Status)
{
  "name": "Check Evolution Status",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "http://localhost:8080/instance/connectionState/navigator-whatsapp",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth"
  }
}
```

---

## 📊 **MÉTRICAS E MONITORAMENTO**

### **Dashboard Evolution API**

```bash
# Verificar status da instância
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: navigator-evolution-key-2025-secure"

# Verificar mensagens enviadas
curl -X GET http://localhost:8080/chat/findMessages/navigator-whatsapp \
  -H "apikey: navigator-evolution-key-2025-secure"
```

### **Logs N8N**

```bash
# Verificar executions no N8N
# Acesse: https://hndll.app.n8n.cloud/executions

# Filtrar por:
# - Status: Success/Error
# - Workflow: Navigator
# - Data: Hoje
```

---

## 🚨 **TROUBLESHOOTING**

### **Problema: Evolution API não responde**

```bash
# Verificar se está rodando
docker ps | grep evolution

# Verificar logs
docker logs evolution-api-navigator

# Reiniciar se necessário
docker-compose -f docker-compose.evolution.yml restart
```

### **Problema: Mensagens não chegam**

1. **Verificar conexão WhatsApp:**
```bash
curl -X GET http://localhost:8080/instance/connectionState/navigator-whatsapp \
  -H "apikey: navigator-evolution-key-2025-secure"
```

2. **Verificar webhook N8N:**
```bash
curl -X POST https://hndll.app.n8n.cloud/webhook/evolution-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

3. **Verificar logs Evolution:**
```bash
docker logs evolution-api-navigator | grep ERROR
```

### **Problema: N8N não processa webhook**

1. **Verificar se webhook está ativo**
2. **Verificar formato da mensagem**
3. **Verificar logs N8N executions**

---

## 🎯 **PRÓXIMOS PASSOS**

1. **✅ Configurar Evolution API** (30 min)
2. **✅ Atualizar N8N workflow** (20 min)
3. **✅ Testar envio/recebimento** (15 min)
4. **🔄 Testar com usuários reais** (conforme necessário)
5. **📊 Monitorar performance** (contínuo)

---

**Criado em:** 17 de outubro de 2025
**Status:** 📋 Pronto para implementação
**Prioridade:** 🔥 Alta - Solução imediata para testes em massa



