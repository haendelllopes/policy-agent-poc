# 🚀 Deploy Evolution API no Render.com

**Data:** 17 de outubro de 2025
**Status:** ✅ Solução cloud gratuita

---

## 🎯 **POR QUE RENDER?**

### **Vantagens:**
- ✅ **100% gratuito** - plano free disponível
- ✅ **24/7 disponível** - sem dependência da sua máquina
- ✅ **Docker nativo** - suporte completo
- ✅ **HTTPS automático** - SSL incluído
- ✅ **Banco PostgreSQL** - gratuito incluído
- ✅ **Webhooks funcionam** - perfeito para N8N

### **Limitações do Plano Free:**
- ⚠️ **Sleep após 15 min** - primeiro request pode demorar
- ⚠️ **750 horas/mês** - mais que suficiente
- ⚠️ **512MB RAM** - suficiente para Evolution API

---

## 📋 **PASSOS PARA DEPLOY:**

### **1. Preparar Arquivos (5 min)**

**Arquivos já criados:**
- ✅ `render.yaml` - configuração do Render
- ✅ `evolution-api/` - código da Evolution API

### **2. Criar Conta Render (2 min)**

```
1. Acessar: https://render.com
2. Sign up with GitHub
3. Conectar repositório
```

### **3. Deploy Automático (10 min)**

```
1. Render detecta render.yaml automaticamente
2. Cria PostgreSQL database
3. Build e deploy Evolution API
4. Configura HTTPS e webhooks
```

### **4. Configurar Instância (5 min)**

```
1. Acessar: https://evolution-api-navigator.onrender.com
2. Criar instância: "navigator-instance"
3. Escanear QR Code WhatsApp
4. Testar envio
```

---

## 🔧 **CONFIGURAÇÃO N8N:**

### **URLs Atualizadas:**
```
Evolution API: https://evolution-api-navigator.onrender.com
Webhook N8N: https://hndll.app.n8n.cloud/webhook/evolution-webhook
API Key: navigator-evolution-key-2025-secure
```

### **Node HTTP Request:**
```javascript
{
  "method": "POST",
  "url": "https://evolution-api-navigator.onrender.com/message/sendText/navigator-instance",
  "headers": {
    "Authorization": "Bearer navigator-evolution-key-2025-secure",
    "Content-Type": "application/json"
  },
  "body": {
    "number": "{{ $json.colaborador.phone }}",
    "text": "{{ $json.mensagem_sugerida }}"
  }
}
```

---

## 🎉 **BENEFÍCIOS FINAIS:**

### **Imediatos:**
- ✅ **Funciona 24/7** - sem sua máquina ligada
- ✅ **Testes ilimitados** - quantos usuários quiser
- ✅ **Zero custos** - completamente gratuito
- ✅ **HTTPS seguro** - webhooks funcionam

### **Produção:**
- ✅ **Escalável** - upgrade para plano pago se necessário
- ✅ **Estável** - uptime 99.9%
- ✅ **Backup automático** - banco protegido
- ✅ **Logs centralizados** - fácil debug

---

## 🚀 **FLUXO FINAL:**

```
Backend Navigator
    ↓ (webhook)
N8N Workflow
    ↓ (Code: escolher canal)
    ├── Evolution API (Render) → WhatsApp Pessoal (testes ilimitados)
    └── WhatsApp Business → WhatsApp Business (produção)
```

---

## 📱 **PRÓXIMOS PASSOS:**

1. **Commit arquivos** no GitHub
2. **Conectar Render** com repositório
3. **Deploy automático** (15 minutos)
4. **Configurar instância** WhatsApp
5. **Testar integração** N8N
6. **Adicionar usuários** para testes

**Total: 30 minutos para ter WhatsApp ilimitado funcionando 24/7!**

---

**Criado em:** 17 de outubro de 2025
**Status:** ✅ Solução cloud gratuita pronta
**Prioridade:** 🔥 Alta - Funciona 24/7 sem custos
