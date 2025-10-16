# 🚀 Guia Passo-a-Passo: Deploy Evolution API no Render

**Status:** ✅ Arquivos prontos, aguardando deploy

## 📋 Pré-requisitos
- ✅ Arquivos criados (`render.evolution.yaml`, `Dockerfile.evolution`)
- ✅ Código backend implementado
- ✅ Documentação completa
- 🔄 Docker instalando (pode pular esta etapa - vamos direto para Render)

---

## 🎯 Deploy no Render (15-20 minutos)

### Passo 1: Preparar repositório
```bash
# Navegar para o diretório do projeto
cd C:\Users\haendell.lopes\Documents\Haendell\policy-agent-poc

# Verificar se os arquivos estão presentes
dir render.evolution.yaml
dir Dockerfile.evolution
dir EVOLUTION_API_CONFIG.md

# Fazer commit dos arquivos (se ainda não fez)
git add .
git commit -m "feat: Evolution API configuration files"
git push origin main
```

### Passo 2: Deploy no Render

1. **Acessar Render:**
   - Abrir: https://render.com
   - Fazer login com sua conta GitHub

2. **Criar novo serviço:**
   - Clicar em **"New"** → **"Web Service"**
   - **"Build and deploy from a Git repository"**
   - **"Connect GitHub account"** (se não conectado)

3. **Conectar repositório:**
   - Selecionar repositório: `policy-agent-poc`
   - Branch: `main`
   - Clicar **"Connect"**

4. **Configurar o serviço:**
   ```
   Name: navigator-evolution-api
   Environment: Docker
   Dockerfile Path: ./Dockerfile.evolution
   Plan: Free
   Region: Ohio (US East)
   ```

5. **Configurações avançadas:**
   - Clicar em **"Advanced"**
   - **"Add from file"** → Selecionar `render.evolution.yaml`
   - Verificar se as variáveis aparecem:
     - `SERVER_URL`
     - `AUTHENTICATION_API_KEY` (será gerada automaticamente)
     - `LOG_LEVEL`
     - `CORS_ORIGIN`
     - `WEBHOOK_GLOBAL_URL`
     - `WEBHOOK_GLOBAL_ENABLED`

6. **Deploy:**
   - Clicar **"Create Web Service"**
   - Aguardar ~5-10 minutos para build e deploy

### Passo 3: Verificar deploy

1. **Aguardar status "Live":**
   - No dashboard Render, aguardar o status mudar para **"Live"**
   - URL será: `https://navigator-evolution-api.onrender.com`

2. **Testar health endpoint:**
   ```bash
   curl https://navigator-evolution-api.onrender.com/manager/health
   ```
   
   Deve retornar:
   ```json
   {"status": "ok", "message": "Evolution API is running"}
   ```

### Passo 4: Salvar credenciais

1. **Obter API Key:**
   - No dashboard Render → Seu serviço → **"Environment"**
   - Copiar valor de `AUTHENTICATION_API_KEY`

2. **Atualizar arquivo de credenciais:**
   - Editar `EVOLUTION_API_CREDENTIALS.txt`
   - Substituir `[Será preenchida após o deploy no Render]` pela API Key real
   - Adicionar URL: `https://navigator-evolution-api.onrender.com`

---

## 🔧 Configurar Instância WhatsApp (10 minutos)

### Passo 5: Criar instância WhatsApp

**Substituir `SUA-API-KEY-DO-RENDER` pela API Key real:**

```bash
curl -X POST https://navigator-evolution-api.onrender.com/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-API-KEY-DO-RENDER" \
  -d '{
    "instanceName": "navigator-whatsapp",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS",
    "webhook": "https://hndll.app.n8n.cloud/webhook/evolution-webhook",
    "webhookByEvents": false,
    "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
  }'
```

### Passo 6: Obter QR Code

```bash
curl -X GET https://navigator-evolution-api.onrender.com/instance/connect/navigator-whatsapp \
  -H "apikey: SUA-API-KEY-DO-RENDER"
```

**Resposta conterá:**
```json
{
  "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "code": "navigator-whatsapp"
}
```

### Passo 7: Criar arquivo HTML para QR Code

Criar arquivo `qr-code-evolution.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>QR Code Evolution API - Navigator</title>
    <style>
        body { text-align: center; padding: 50px; font-family: Arial; }
        img { width: 400px; border: 2px solid #333; }
        h1 { color: #17A2B8; }
    </style>
</head>
<body>
    <h1>🚀 Evolution API - Conectar WhatsApp</h1>
    <img src="COLAR-BASE64-AQUI" alt="QR Code"/>
    <p><strong>Instruções:</strong></p>
    <ol style="text-align: left; max-width: 500px; margin: 0 auto;">
        <li>Abra o WhatsApp no seu celular</li>
        <li>Toque nos 3 pontos → Dispositivos conectados</li>
        <li>Toque em "Conectar um dispositivo"</li>
        <li>Escaneie este QR Code</li>
    </ol>
    <p style="color: #666; margin-top: 30px;">
        Após conectar, feche esta página e continue com os testes.
    </p>
</body>
</html>
```

**Substituir `COLAR-BASE64-AQUI` pelo base64 da resposta da API**

### Passo 8: Verificar conexão

```bash
curl -X GET https://navigator-evolution-api.onrender.com/instance/connectionState/navigator-whatsapp \
  -H "apikey: SUA-API-KEY-DO-RENDER"
```

**Deve retornar:**
```json
{"instance": {"instanceName": "navigator-whatsapp", "state": "open"}}
```

---

## 🔗 Configurar N8N (20-30 minutos)

### Passo 9: Criar credencial no N8N

1. **Acessar N8N:**
   - Abrir: https://hndll.app.n8n.cloud
   - Fazer login

2. **Criar credencial:**
   - **Settings** → **Credentials** → **Add Credential**
   - Tipo: **"HTTP Header Auth"**
   - Nome: `Evolution API Navigator`
   - Header Name: `apikey`
   - Header Value: `SUA-API-KEY-DO-RENDER`
   - **Save**

### Passo 10: Substituir nodes WhatsApp Business

1. **Localizar workflows com WhatsApp:**
   - Procurar por nodes tipo `n8n-nodes-base.whatsApp`
   - Workflows que enviam mensagens WhatsApp

2. **Substituir cada node:**
   - **Deletar** o node WhatsApp Business
   - **Adicionar** novo node **"HTTP Request"**
   - Configurar:
     ```
     Method: POST
     URL: https://navigator-evolution-api.onrender.com/message/sendText/navigator-whatsapp
     Authentication: Evolution API Navigator (credencial criada)
     Headers:
       - Content-Type: application/json
     Body (JSON):
     {
       "number": "={{ $json.phone.replace(/\D/g, '') }}",
       "text": "={{ $json.message || $json.mensagem_sugerida || $json.text }}"
     }
     Options:
       - Timeout: 10000ms
       - Retry on Fail: Yes (3 attempts)
     ```

### Passo 11: Criar webhook para receber mensagens

1. **Criar novo workflow ou adicionar ao existente:**
   - Nome: `Evolution API - Receiver`

2. **Node 1: Webhook**
   - Path: `evolution-webhook`
   - Method: POST
   - Authentication: None

3. **Node 2: Code (Process Evolution Message)**
   ```javascript
   const items = $input.all();
   const results = [];

   for (const item of items) {
     const data = item.json;
     
     // Evolution API envia evento MESSAGES_UPSERT
     if (data.key && data.message) {
       const phoneNumber = data.key.remoteJid.replace('@s.whatsapp.net', '');
       const messageText = data.message.conversation || 
                          data.message.extendedTextMessage?.text || 
                          '';
       
       if (messageText) {
         results.push({
           json: {
             from: phoneNumber,
             phone: phoneNumber,
             message: messageText,
             messageText: messageText,
             timestamp: data.messageTimestamp,
             messageId: data.key.id,
             type: 'whatsapp',
             source: 'evolution-api',
             raw: data
           }
         });
       }
     }
   }

   return results;
   ```

4. **Conectar ao fluxo existente:**
   - Conectar saída do Code Node ao node de processamento de mensagens
   - O fluxo seguirá: Sentiment Analysis → OpenAI Agent → Response

---

## 🔧 Configurar Backend (10 minutos)

### Passo 12: Adicionar variáveis no Vercel

1. **Acessar Vercel:**
   - Abrir: https://vercel.com/seu-projeto
   - **Settings** → **Environment Variables**

2. **Adicionar variáveis:**
   ```
   EVOLUTION_API_URL = https://navigator-evolution-api.onrender.com
   EVOLUTION_API_KEY = SUA-API-KEY-DO-RENDER
   EVOLUTION_INSTANCE_NAME = navigator-whatsapp
   ```

3. **Redeploy:**
   - **Deployments** → **Redeploy** (último deployment)

---

## 🧪 Testes (15 minutos)

### Passo 13: Teste básico de envio

```bash
curl -X POST https://navigator-evolution-api.onrender.com/message/sendText/navigator-whatsapp \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-API-KEY-DO-RENDER" \
  -d '{
    "number": "5562999404760",
    "text": "🚀 Teste Evolution API - Navigator"
  }'
```

### Passo 14: Teste via backend

```bash
curl -X POST https://navigator-gules.vercel.app/api/webhooks/evolution/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+55 62 99940-4760",
    "message": "Teste via backend Vercel"
  }'
```

### Passo 15: Teste de status

```bash
curl https://navigator-gules.vercel.app/api/webhooks/evolution/status
```

### Passo 16: Teste end-to-end

1. **Acessar sistema:**
   - Abrir: https://navigator-gules.vercel.app
   - Login como admin

2. **Criar trilha de teste:**
   - Ir em "Trilhas de Onboarding"
   - Criar trilha "Teste Evolution API"
   - Atribuir a colaborador com seu número WhatsApp

3. **Iniciar trilha:**
   - Colaborador inicia trilha no sistema
   - **Verificar:** Mensagem chegou no WhatsApp

4. **Responder mensagem:**
   - Enviar mensagem de volta pelo WhatsApp
   - **Verificar:** Sistema processou e agente respondeu

---

## ✅ Checklist Final

- [ ] ✅ Arquivos criados e commitados
- [ ] 🔄 Deploy no Render realizado
- [ ] 🔄 API Key obtida e salva
- [ ] 🔄 Instância WhatsApp criada
- [ ] 🔄 QR Code escaneado e WhatsApp conectado
- [ ] 🔄 Credencial Evolution API criada no N8N
- [ ] 🔄 Nodes WhatsApp Business substituídos
- [ ] 🔄 Webhook evolution-webhook criado
- [ ] 🔄 Variáveis adicionadas no Vercel
- [ ] 🔄 Testes realizados
- [ ] 🔄 Sistema funcionando end-to-end

---

## 🚨 Troubleshooting

### Problema: Render não consegue fazer build
- Verificar se `Dockerfile.evolution` está na raiz
- Verificar se `render.evolution.yaml` está correto
- Verificar logs no dashboard Render

### Problema: Evolution API não responde
- Aguardar 30s (Render Free Plan "hiberna")
- Verificar logs no Render Dashboard
- Testar health endpoint

### Problema: WhatsApp não conecta
- QR Code expira em 2 minutos
- Gerar novo QR Code se necessário
- Verificar se WhatsApp está atualizado

### Problema: N8N não processa webhook
- Verificar se webhook está ativo
- Verificar logs N8N executions
- Verificar formato da mensagem

---

## 🎉 Resultado Esperado

Após completar todos os passos:
- ✅ WhatsApp ilimitado e gratuito funcionando
- ✅ Sistema atualizado para usar Evolution API
- ✅ N8N configurado para enviar/receber mensagens
- ✅ Backend com endpoints funcionando
- ✅ Testes end-to-end passando

**Tempo total:** 1-2 horas  
**Status:** Pronto para execução! 🚀
