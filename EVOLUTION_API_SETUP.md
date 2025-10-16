# 🚀 Evolution API - Setup Completo

**Objetivo:** Implementar WhatsApp ilimitado e gratuito para o Navigator
**Data:** 17 de outubro de 2025

---

## 📦 **INSTALAÇÃO VIA DOCKER**

### **Passo 1: Criar arquivo docker-compose.yml**

```yaml
version: '3.8'

services:
  evolution-api:
    image: evolutionapi/evolution-api:latest
    container_name: evolution-api
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      # Configurações básicas
      SERVER_URL: http://localhost:8080
      AUTHENTICATION_API_KEY: sua-chave-super-secreta-aqui-123456
      
      # Banco de dados (opcional - usa SQLite por padrão)
      # DATABASE_ENABLED: true
      # DATABASE_CONNECTION_URI: postgresql://user:pass@host:port/db
      
      # Redis (opcional - para cache)
      # REDIS_ENABLED: true
      # REDIS_URI: redis://localhost:6379
      
      # Logs
      LOG_LEVEL: ERROR
      
      # Configurações de segurança
      CORS_ORIGIN: "*"
      
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store
    networks:
      - evolution-network

volumes:
  evolution_instances:
  evolution_store:

networks:
  evolution-network:
    driver: bridge
```

### **Passo 2: Executar a instalação**

```bash
# 1. Criar diretório do projeto
mkdir evolution-api-navigator
cd evolution-api-navigator

# 2. Criar o arquivo docker-compose.yml (copiar conteúdo acima)

# 3. Executar
docker-compose up -d

# 4. Verificar se está rodando
docker-compose ps
docker-compose logs -f evolution-api
```

### **Passo 3: Verificar instalação**

```bash
# Testar se a API está respondendo
curl http://localhost:8080/manager/health

# Deve retornar:
# {"status": "ok", "message": "Evolution API is running"}
```

---

## 🔧 **CONFIGURAÇÃO INICIAL**

### **Passo 4: Criar instância WhatsApp**

```bash
# Criar instância para o Navigator
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: sua-chave-super-secreta-aqui-123456" \
  -d '{
    "instanceName": "navigator-whatsapp",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS",
    "webhook": "https://hndll.app.n8n.cloud/webhook/evolution-webhook",
    "webhookByEvents": false,
    "events": ["MESSAGES_UPSERT"],
    "rejectCall": true,
    "msgRetryCounterCache": true,
    "userAgent": "Evolution API"
  }'
```

### **Passo 5: Conectar WhatsApp**

```bash
# Obter QR Code para conectar
curl -X GET http://localhost:8080/instance/connect/navigator-whatsapp \
  -H "apikey: sua-chave-super-secreta-aqui-123456"

# Retorna JSON com base64 do QR Code
{
  "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "code": "navigator-whatsapp"
}
```

### **Passo 6: Verificar status**

```bash
# Verificar se está conectado
curl -X GET http://localhost:8080/instance/connectionState/navigator-whatsapp \
  -H "apikey: sua-chave-super-secreta-aqui-123456"

# Deve retornar: {"instance": {"instanceName": "navigator-whatsapp", "state": "open"}}
```

---

## 🔗 **INTEGRAÇÃO COM N8N**

### **Passo 7: Atualizar N8N Workflow**

#### **Substituir node WhatsApp atual por:**

```javascript
// Node: HTTP Request
{
  "method": "POST",
  "url": "http://localhost:8080/message/sendText/navigator-whatsapp",
  "headers": {
    "Content-Type": "application/json",
    "apikey": "sua-chave-super-secreta-aqui-123456"
  },
  "body": {
    "number": "{{ $json.colaborador.phone.replace('+', '') }}",
    "text": "{{ $json.mensagem_sugerida }}"
  }
}
```

#### **Configurar webhook para receber mensagens:**

```javascript
// Node: Webhook para receber mensagens
{
  "name": "Evolution Webhook",
  "url": "https://hndll.app.n8n.cloud/webhook/evolution-webhook",
  "method": "POST",
  "authentication": "none"
}
```

### **Passo 8: Atualizar backend do Navigator**

#### **Adicionar endpoint para Evolution API:**

```javascript
// Adicionar em src/server.js
app.post('/api/evolution/send-message', async (req, res) => {
  try {
    const { phone, message, instance = 'navigator-whatsapp' } = req.body;
    
    const response = await axios.post(`http://localhost:8080/message/sendText/${instance}`, {
      number: phone.replace('+', ''),
      text: message
    }, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY
      }
    });
    
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Erro ao enviar mensagem Evolution:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});
```

---

## 🔐 **CONFIGURAÇÃO DE SEGURANÇA**

### **Passo 9: Variáveis de ambiente**

```bash
# Adicionar ao .env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-chave-super-secreta-aqui-123456
EVOLUTION_INSTANCE_NAME=navigator-whatsapp
```

### **Passo 10: Firewall e proxy reverso (opcional)**

```nginx
# nginx.conf para expor Evolution API externamente
server {
    listen 80;
    server_name evolution.navigator.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 🧪 **TESTES**

### **Passo 11: Teste básico**

```bash
# Teste 1: Enviar mensagem
curl -X POST http://localhost:8080/message/sendText/navigator-whatsapp \
  -H "Content-Type: application/json" \
  -H "apikey: sua-chave-super-secreta-aqui-123456" \
  -d '{
    "number": "556299940476",
    "text": "Teste Evolution API - Navigator 🚀"
  }'
```

### **Passo 12: Teste via N8N**

1. Ativar workflow no N8N
2. Enviar webhook de teste
3. Verificar se mensagem chega no WhatsApp

---

## 📊 **MONITORAMENTO**

### **Passo 13: Dashboard Evolution API**

```bash
# Acessar dashboard (se habilitado)
# http://localhost:8080/dashboard

# Métricas via API
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: sua-chave-super-secreta-aqui-123456"
```

### **Passo 14: Logs**

```bash
# Ver logs em tempo real
docker-compose logs -f evolution-api

# Logs específicos
docker exec evolution-api tail -f /evolution/logs/evolution.log
```

---

## 🚨 **TROUBLESHOOTING**

### **Problemas Comuns:**

#### **1. Instância não conecta**
```bash
# Verificar se WhatsApp está conectado
curl -X GET http://localhost:8080/instance/connectionState/navigator-whatsapp \
  -H "apikey: sua-chave-super-secreta-aqui-123456"

# Reconectar se necessário
curl -X GET http://localhost:8080/instance/connect/navigator-whatsapp \
  -H "apikey: sua-chave-super-secreta-aqui-123456"
```

#### **2. Mensagens não chegam**
```bash
# Verificar status da instância
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: sua-chave-super-secreta-aqui-123456"

# Verificar logs
docker-compose logs evolution-api | grep ERROR
```

#### **3. Webhook não funciona**
```bash
# Testar webhook manualmente
curl -X POST https://hndll.app.n8n.cloud/webhook/evolution-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

---

## 📈 **VANTAGENS DA EVOLUTION API**

✅ **Gratuita** - Sem custos de mensagem
✅ **Ilimitada** - Sem limites de envio
✅ **Brasileira** - Suporte em português
✅ **Open Source** - Código aberto
✅ **Flexível** - Múltiplas instâncias
✅ **Webhooks** - Integração fácil
✅ **Baileys** - Protocolo WhatsApp oficial
✅ **Auto-reconexão** - Reconecta automaticamente

---

## 🔄 **MIGRAÇÃO DO WHATSAPP BUSINESS**

### **Passo 15: Migração gradual**

1. **Manter WhatsApp Business** para produção atual
2. **Usar Evolution API** para testes em massa
3. **Migrar gradualmente** conforme estabilidade
4. **Monitorar performance** de ambas as soluções

### **Passo 16: Fallback inteligente**

```javascript
// Implementar fallback no N8N
// Tentar Evolution API primeiro, WhatsApp Business como backup
if (evolution_api_fails) {
  send_via_whatsapp_business();
}
```

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Instalar Evolution API** (30 min)
2. **Configurar instância** (15 min)
3. **Integrar com N8N** (20 min)
4. **Testar com 5-10 pessoas** (15 min)
5. **Escalar para mais usuários** (conforme necessário)

**Tempo total estimado:** ~1h30min
**Custo:** R$ 0,00 (gratuito)
**Limite:** Ilimitado

---

**Criado em:** 17 de outubro de 2025
**Status:** 📋 Pronto para implementação
**Prioridade:** 🔥 Alta - Solução imediata para testes em massa

