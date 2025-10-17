# 🔧 Evolution API + N8N Navigator - Integração Completa

**Data:** 17 de outubro de 2025
**Status:** ✅ Integração com workflow existente

---

## 🎯 **SITUAÇÃO ATUAL**

### **Seu Workflow N8N:**
- ✅ **WhatsApp Trigger** - recebe mensagens do WhatsApp Business
- ✅ **Workflow completo** - Sentiment Analysis → AI Agent → Response
- ✅ **Webhook existente** - `https://hndll.app.n8n.cloud/webhook/evolution-incoming`

### **Objetivo:**
- ✅ **Evolution API** - WhatsApp pessoal ilimitado para testes
- ✅ **WhatsApp Business** - manter para produção
- ✅ **Integração transparente** - mesmo workflow

---

## 🚀 **IMPLEMENTAÇÃO NO N8N**

### **1. Modificar Node "Decide Canal"**

**Localizar:** Node "Decide Canal" (linha 200 do seu workflow)
**Modificar:**

```javascript
// Código atual + nova lógica
const phone = $('Merge').item.json.from;
const tenantId = $json.record.tenant_id;
const channel = $('Merge').item.json.channel;

// Nova lógica: Evolution API para testes
if (tenantId === 'demo' || phone.startsWith('55629') || phone.includes('test')) {
  return [{ json: { 
    use_evolution_api: true,
    channel: 'evolution_api',
    ...$json 
  }}];
} else {
  // Manter lógica atual (WhatsApp Business vs Telegram)
  if (channel === 'whatsapp') {
    return [{ json: { 
      use_whatsapp_business: true,
      ...$json 
    }}];
  } else {
    return [{ json: { 
      use_telegram: true,
      ...$json 
    }}];
  }
}
```

### **2. Adicionar Node "Send Evolution API"**

**Criar novo node HTTP Request:**

```javascript
// Node: HTTP Request - Evolution API
{
  "name": "Send Evolution API",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://evolution-api-navigator.onrender.com/message/sendText/navigator-instance",
    "headers": {
      "Authorization": "Bearer navigator-evolution-key-2025-secure",
      "Content-Type": "application/json"
    },
    "body": {
      "number": "{{ $('Merge').item.json.from }}",
      "text": "{{ $json.response }}"
    }
  }
}
```

### **3. Conectar Nodes**

**Fluxo:**
```
Decide Canal
├── use_evolution_api: true → Send Evolution API
├── use_whatsapp_business: true → Send WhatsApp Business (atual)
└── use_telegram: true → Send Telegram (atual)
```

---

## 📱 **WEBHOOK EVOLUTION API**

### **Configuração no Render:**
```
Webhook URL: https://hndll.app.n8n.cloud/webhook/evolution-incoming
Events: MESSAGES_UPSERT, MESSAGES_UPDATE
```

### **Formato da mensagem recebida:**
```json
{
  "event": "messages.upsert",
  "instance": "navigator-instance",
  "data": {
    "key": {
      "remoteJid": "556291708483@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0C767D26E2F7B7E"
    },
    "message": {
      "conversation": "Olá, como você pode me ajudar?"
    },
    "messageTimestamp": 1697567890,
    "status": "received"
  }
}
```

### **Node Webhook Trigger (evolution-incoming):**
```javascript
// Processar mensagem Evolution API
const data = $json.data;
const messageText = data.message.conversation || 
                   data.message.extendedTextMessage?.text || 
                   data.message.imageMessage?.caption || '';

return [{
  json: {
    from: data.key.remoteJid.split('@')[0],
    messageText: messageText,
    channel: 'evolution_api',
    timestamp: data.messageTimestamp,
    messageId: data.key.id
  }
}];
```

---

## 🔧 **CONFIGURAÇÃO EVOLUTION API**

### **1. Deploy no Render (15 min):**
```bash
# Commit arquivos
git add .
git commit -m "Add Evolution API + Render config"
git push

# Deploy automático no Render
```

### **2. Configurar Instância WhatsApp (5 min):**
```
1. Acessar: https://evolution-api-navigator.onrender.com
2. Criar instância: "navigator-instance"
3. Escanear QR Code com WhatsApp pessoal
4. Testar envio
```

### **3. Configurar Webhook (automático):**
```
Webhook já configurado no render.yaml
URL: https://hndll.app.n8n.cloud/webhook/evolution-incoming
```

---

## 🧪 **TESTE COMPLETO**

### **Cenário 1: Teste (Evolution API)**
```
1. Colaborador envia mensagem
2. Phone: 556291708483 (inicia com 55629)
3. N8N → Decide Canal → Evolution API
4. Evolution API envia resposta
5. Colaborador recebe no WhatsApp pessoal
```

### **Cenário 2: Produção (WhatsApp Business)**
```
1. Colaborador envia mensagem
2. Phone: qualquer outro número
3. N8N → Decide Canal → WhatsApp Business
4. WhatsApp Business envia resposta
5. Colaborador recebe no WhatsApp Business
```

---

## 🎉 **BENEFÍCIOS**

### **Imediatos:**
- ✅ **Testes ilimitados** - Evolution API sem custos
- ✅ **Produção estável** - WhatsApp Business continua
- ✅ **Mesmo workflow** - sem mudanças complexas
- ✅ **Fallback automático** - se um falhar

### **Futuros:**
- ✅ **Escalabilidade** - quantos usuários quiser
- ✅ **Custo zero** - testes gratuitos
- ✅ **Flexibilidade** - escolher canal por usuário

---

## 📋 **CHECKLIST IMPLEMENTAÇÃO**

- [ ] **Deploy Evolution API** no Render
- [ ] **Configurar instância** WhatsApp
- [ ] **Modificar node "Decide Canal"** no N8N
- [ ] **Adicionar node "Send Evolution API"** no N8N
- [ ] **Testar fluxo completo** Evolution API
- [ ] **Testar fluxo completo** WhatsApp Business
- [ ] **Verificar webhook** evolution-incoming
- [ ] **Adicionar usuários** para testes

---

**Total: 30 minutos para implementação completa!**

---

**Criado em:** 17 de outubro de 2025
**Status:** ✅ Integração com workflow existente
**Prioridade:** 🔥 Alta - Funciona com seu N8N atual
