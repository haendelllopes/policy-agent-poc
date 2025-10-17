# 🚨 Evolution API - Troubleshooting

**Data:** 17 de outubro de 2025
**Problema:** Erros de build TypeScript/Prisma

---

## 🔍 **ANÁLISE DO ERRO**

### **Erro Encontrado:**
```
error TS2339: Property 'message' does not exist on type 'PrismaRepository'
error TS2339: Property 'webhook' does not exist on type 'PrismaRepository'
error TS2339: Property 'instance' does not exist on type 'PrismaRepository'
```

### **Causa Raiz:**
- Problemas de compatibilidade entre versões do Prisma
- TypeScript não reconhece propriedades do PrismaRepository
- Build da Evolution API falha devido a inconsistências

---

## 🛠️ **SOLUÇÕES ALTERNATIVAS**

### **OPÇÃO 1: Evolution API Imagem Oficial (RECOMENDADO)**

#### **Passo 1: Usar imagem pré-compilada**
```bash
# Parar build atual
docker-compose -f docker-compose.evolution.yml down

# Usar imagem oficial estável
docker-compose -f docker-compose.evolution.yml up -d
```

#### **Passo 2: Verificar se funcionou**
```bash
# Verificar se está rodando
curl http://localhost:8080/manager/health

# Deve retornar: {"status": "ok", "message": "Evolution API is running"}
```

---

### **OPÇÃO 2: WhatsApp Simples com Baileys**

#### **Passo 1: Instalar dependências**
```bash
cd scripts
npm install
```

#### **Passo 2: Executar WhatsApp simples**
```bash
node whatsapp-simple-setup.js
```

#### **Passo 3: Escanear QR Code**
- QR Code aparecerá no terminal
- Escaneie com WhatsApp
- Teste envio de mensagem

**Vantagens:**
- ✅ Sem problemas de build
- ✅ Mais leve e simples
- ✅ Mesma funcionalidade
- ✅ Integração direta com N8N

---

### **OPÇÃO 3: Evolution API Versão Estável**

#### **Passo 1: Usar versão específica**
```bash
# Editar docker-compose.evolution.yml
# Alterar linha:
image: evolutionapi/evolution-api:1.0.0
# Para:
image: evolutionapi/evolution-api:1.2.0
```

#### **Passo 2: Rebuild**
```bash
docker-compose -f docker-compose.evolution.yml down
docker-compose -f docker-compose.evolution.yml pull
docker-compose -f docker-compose.evolution.yml up -d
```

---

## 🎯 **RECOMENDAÇÃO ESPECÍFICA**

### **Para seu caso, recomendo:**

**1. Tentar OPÇÃO 1 primeiro** (imagem oficial)
- Mais rápido
- Menos configuração
- Funciona na maioria dos casos

**2. Se falhar, usar OPÇÃO 2** (Baileys simples)
- Zero problemas de build
- Funcionalidade completa
- Integração direta com N8N

**3. OPÇÃO 3 como último recurso**
- Versão específica estável
- Pode resolver problemas de compatibilidade

---

## 📋 **COMANDOS RÁPIDOS**

### **Limpar e reiniciar:**
```bash
# Parar tudo
docker-compose -f docker-compose.evolution.yml down
docker system prune -f

# Tentar novamente
docker-compose -f docker-compose.evolution.yml up -d
```

### **Verificar logs:**
```bash
# Ver logs detalhados
docker-compose -f docker-compose.evolution.yml logs -f

# Ver apenas erros
docker-compose -f docker-compose.evolution.yml logs | grep ERROR
```

### **Testar conectividade:**
```bash
# Testar API
curl http://localhost:8080/manager/health

# Testar criação de instância
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: navigator-evolution-key-2025-secure" \
  -d '{"instanceName": "test", "qrcode": true}'
```

---

## 🔄 **ALTERNATIVA DEFINITIVA**

### **Se todas as opções falharem:**

**Usar WhatsApp Business + Twilio como fallback:**

```javascript
// No N8N, implementar fallback inteligente
if (evolution_api_fails) {
  // Usar Twilio WhatsApp (gratuito para testes)
  sendViaTwilioWhatsApp();
} else if (twilio_fails) {
  // Usar WhatsApp Business (atual)
  sendViaWhatsAppBusiness();
}
```

**Vantagens:**
- ✅ 100% confiável
- ✅ Sem problemas de build
- ✅ Múltiplas opções
- ✅ Fallback automático

---

## 📞 **SUPORTE**

### **Se precisar de ajuda:**
1. **Tentar OPÇÃO 2** (Baileys simples) - mais confiável
2. **Usar WhatsApp Business atual** - já funciona
3. **Implementar fallback** - solução robusta

### **Logs importantes:**
```bash
# Salvar logs para análise
docker-compose -f docker-compose.evolution.yml logs > evolution-logs.txt

# Verificar espaço em disco
df -h

# Verificar memória
free -h
```

---

**Criado em:** 17 de outubro de 2025
**Status:** 🚨 Resolvendo problema de build
**Prioridade:** 🔥 Alta - Alternativas funcionais prontas
