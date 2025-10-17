# 🚀 Comandos Evolution API - Navigator

**Data:** 17 de outubro de 2025
**Status:** ✅ Configuração corrigida

---

## 🎯 **COMANDOS RÁPIDOS**

### **1. Instalar Evolution API (Versão Simples)**
```bash
cd policy-agent-poc
docker-compose -f docker-compose.evolution-simple.yml up -d
```

> ✅ **Nota:** Aviso sobre `version` obsoleto foi corrigido

### **2. Verificar se está funcionando**
```bash
curl http://localhost:8080/manager/health
```

### **3. Criar instância WhatsApp**
```bash
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: navigator-evolution-key-2025-secure" \
  -d '{
    "instanceName": "navigator-whatsapp",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

### **4. Obter QR Code**
```bash
curl -X GET http://localhost:8080/instance/connect/navigator-whatsapp \
  -H "apikey: navigator-evolution-key-2025-secure"
```

### **5. Testar envio de mensagem**
```bash
curl -X POST http://localhost:8080/message/sendText/navigator-whatsapp \
  -H "Content-Type: application/json" \
  -H "apikey: navigator-evolution-key-2025-secure" \
  -d '{
    "number": "556299940476",
    "text": "🚀 Teste Evolution API Navigator!"
  }'
```

---

## 🔧 **COMANDOS DE MANUTENÇÃO**

### **Parar Evolution API**
```bash
docker-compose -f docker-compose.evolution-simple.yml down
```

### **Ver logs**
```bash
docker-compose -f docker-compose.evolution-simple.yml logs -f
```

### **Reiniciar**
```bash
docker-compose -f docker-compose.evolution-simple.yml restart
```

### **Limpar tudo**
```bash
docker-compose -f docker-compose.evolution-simple.yml down
docker system prune -f
```

---

## 🧪 **TESTE COMPLETO**

### **Script automatizado:**
```bash
cd policy-agent-poc
chmod +x scripts/evolution-setup-simple.sh
./scripts/evolution-setup-simple.sh
```

### **Teste manual:**
```bash
# 1. Iniciar
docker-compose -f docker-compose.evolution-simple.yml up -d

# 2. Aguardar 30 segundos
sleep 30

# 3. Verificar saúde
curl http://localhost:8080/manager/health

# 4. Criar instância
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: navigator-evolution-key-2025-secure" \
  -d '{"instanceName": "test", "qrcode": true}'

# 5. Obter QR Code
curl -X GET http://localhost:8080/instance/connect/test \
  -H "apikey: navigator-evolution-key-2025-secure"
```

---

## 🚨 **TROUBLESHOOTING**

### **Se der erro de porta:**
```bash
# Verificar se porta 8080 está em uso
netstat -an | grep 8080

# Usar porta diferente
# Editar docker-compose.evolution-simple.yml:
# ports:
#   - "8081:8080"  # Usar 8081 no lugar de 8080
```

### **Se não conectar:**
```bash
# Verificar se container está rodando
docker ps | grep evolution

# Ver logs de erro
docker-compose -f docker-compose.evolution-simple.yml logs | grep ERROR
```

### **Se QR Code não aparecer:**
```bash
# Verificar status da instância
curl -X GET http://localhost:8080/instance/connectionState/navigator-whatsapp \
  -H "apikey: navigator-evolution-key-2025-secure"
```

---

## 📱 **INTEGRAÇÃO COM N8N**

### **URLs importantes:**
- **Evolution API:** `http://localhost:8080`
- **API Key:** `navigator-evolution-key-2025-secure`
- **Instância:** `navigator-whatsapp`
- **Webhook N8N:** `https://hndll.app.n8n.cloud/webhook/evolution-webhook`

### **Configurar N8N:**
1. Adicionar credencial HTTP Header Auth
2. Header: `apikey` = `navigator-evolution-key-2025-secure`
3. Node HTTP Request: `http://localhost:8080/message/sendText/navigator-whatsapp`

---

## ✅ **CHECKLIST DE FUNCIONAMENTO**

- [ ] Evolution API rodando na porta 8080
- [ ] Health check retornando OK
- [ ] Instância criada com sucesso
- [ ] QR Code obtido e escaneado
- [ ] WhatsApp conectado
- [ ] Mensagem de teste enviada
- [ ] N8N configurado com Evolution API
- [ ] Webhook funcionando

---

**Criado em:** 17 de outubro de 2025
**Status:** ✅ Configuração corrigida e validada
**Próximo passo:** Executar instalação
