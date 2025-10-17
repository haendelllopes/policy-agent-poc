# 🚀 Evolution API - Guia de Deploy em Produção

**Data:** 17 de outubro de 2025  
**Status:** 📋 Guia passo a passo para implementação  
**Tempo Total:** ~50 minutos

---

## 📋 PRÉ-REQUISITOS

- [ ] Conta no Render.com (free tier)
- [ ] Conta no N8N Cloud: https://hndll.app.n8n.cloud
- [ ] WhatsApp disponível para conectar
- [ ] Repositório GitHub atualizado

---

## 🎯 ETAPA 1: DEPLOY NO RENDER (10-15 min)

### 1.1 Verificar Arquivos no Repositório

Confirme que estes arquivos existem e estão atualizados:
- ✅ `Dockerfile.evolution` 
- ✅ `render.evolution.yaml`

### 1.2 Deploy no Render

#### Passo 1: Acessar Render
1. Acesse: https://render.com
2. Login com GitHub
3. Clique em **"New +"** → **"Web Service"**

#### Passo 2: Conectar Repositório
1. Conecte sua conta GitHub (se ainda não conectou)
2. Selecione o repositório: **`haendelllopes/policy-agent-poc`**
3. Clique em **"Connect"**

#### Passo 3: Configurar Serviço
Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Name** | `navigator-evolution-api` |
| **Region** | `Ohio (US East)` |
| **Branch** | `main` |
| **Root Directory** | (deixar vazio) |
| **Environment** | `Docker` |
| **Dockerfile Path** | `./Dockerfile.evolution` |
| **Docker Build Context Directory** | (deixar vazio) |

#### Passo 4: Plano e Configurações Avançadas
1. **Plan:** Selecione **"Free"**
2. Clique em **"Advanced"** → **"Add from file"**
3. Selecione o arquivo: `render.evolution.yaml`
4. Verifique que as variáveis foram carregadas:
   - `SERVER_URL`: https://navigator-evolution-api.onrender.com
   - `AUTHENTICATION_API_KEY`: (será gerado automaticamente)
   - `LOG_LEVEL`: ERROR
   - `CORS_ORIGIN`: *
   - `WEBHOOK_GLOBAL_URL`: https://hndll.app.n8n.cloud/webhook/evolution-webhook
   - `WEBHOOK_GLOBAL_ENABLED`: true

#### Passo 5: Criar Web Service
1. Clique em **"Create Web Service"**
2. Aguarde o deploy (5-10 minutos)
3. ✅ Deploy concluído quando ver: **"Live"** (bolinha verde)

#### Passo 6: Salvar API Key
1. No dashboard do serviço, vá em **"Environment"**
2. Encontre `AUTHENTICATION_API_KEY`
3. Clique em **"👁️ Show"** para ver a chave
4. **COPIE E SALVE** essa chave - você vai precisar dela!

**Exemplo:** `evo_api_key_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`

---

## 🔗 ETAPA 2: CONECTAR WHATSAPP (5-10 min)

### 2.1 Criar Instância WhatsApp

Abra um terminal (PowerShell/CMD) e execute:

```powershell
# Substitua [SUA_API_KEY] pela chave que você salvou
$API_KEY = "evo_api_key_abc123..." 

# Criar instância
$body = @{
    instanceName = "navigator-whatsapp"
    qrcode = $true
    integration = "WHATSAPP-BAILEYS"
    webhook = "https://hndll.app.n8n.cloud/webhook/evolution-webhook"
    webhookByEvents = $false
    events = @("MESSAGES_UPSERT", "CONNECTION_UPDATE")
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://navigator-evolution-api.onrender.com/instance/create" `
    -Method POST `
    -Headers @{"apikey"=$API_KEY; "Content-Type"="application/json"} `
    -Body $body

# Ver resposta (contém dados da instância)
$response | ConvertTo-Json -Depth 10
```

### 2.2 Obter QR Code

```powershell
# Obter QR Code para conectar
$qrResponse = Invoke-RestMethod -Uri "https://navigator-evolution-api.onrender.com/instance/connect/navigator-whatsapp" `
    -Method GET `
    -Headers @{"apikey"=$API_KEY}

# Exibir base64 do QR Code
Write-Host "QR Code Base64:"
$qrResponse.base64
```

### 2.3 Converter Base64 para Imagem

**Opção 1: Site Online**
1. Copie o base64 que apareceu (começa com `data:image/png;base64,iVBORw0...`)
2. Acesse: https://base64.guru/converter/decode/image
3. Cole o base64
4. Clique em **"Decode Base64 to Image"**
5. Escaneie o QR Code com WhatsApp

**Opção 2: Salvar arquivo**
```powershell
# Salvar QR Code como imagem
$base64String = $qrResponse.base64.Replace("data:image/png;base64,", "")
$bytes = [Convert]::FromBase64String($base64String)
[System.IO.File]::WriteAllBytes("$PWD\qr-code-navigator.png", $bytes)
Write-Host "QR Code salvo em: $PWD\qr-code-navigator.png"
```

### 2.4 Escanear QR Code com WhatsApp

1. Abra o WhatsApp no celular
2. **Android:** Menu (⋮) → **Dispositivos conectados** → **Conectar um dispositivo**
3. **iPhone:** Configurações → **Dispositivos conectados** → **Conectar um dispositivo**
4. Escaneie o QR Code gerado
5. Aguarde a conexão (~10 segundos)

### 2.5 Verificar Conexão

```powershell
# Verificar status da conexão
$status = Invoke-RestMethod -Uri "https://navigator-evolution-api.onrender.com/instance/connectionState/navigator-whatsapp" `
    -Method GET `
    -Headers @{"apikey"=$API_KEY}

# Exibir status
$status | ConvertTo-Json
```

**Status esperado:**
```json
{
  "instance": {
    "instanceName": "navigator-whatsapp",
    "state": "open"
  }
}
```

✅ Se `state: "open"` → WhatsApp conectado com sucesso!

---

## 🔧 ETAPA 3: CONFIGURAR N8N (20-25 min)

### 3.1 Adicionar Credencial Evolution API

1. Acesse: https://hndll.app.n8n.cloud
2. Clique no ícone de usuário → **"Settings"**
3. Menu lateral → **"Credentials"**
4. Clique em **"+ Add Credential"**
5. Busque por: **"HTTP Header Auth"**
6. Preencha:
   - **Credential Name:** `Evolution API Navigator`
   - **Header Name:** `apikey`
   - **Header Value:** `[SUA_API_KEY]` (a chave do Render)
7. Clique em **"Save"**

### 3.2 Atualizar Workflow Existente

#### Abrir Workflow Navigator

1. No N8N, vá em **"Workflows"**
2. Abra o workflow **"Navigator"** (ID: `uuTVoD6gdaxDhPT2`)

#### Adicionar Webhook para Receber Mensagens

**Adicione um novo nó:**
1. Clique em **"+"** no canvas
2. Busque: **"Webhook"**
3. Configure:
   - **Webhook Name:** `Evolution Webhook Receiver`
   - **Path:** `evolution-webhook`
   - **HTTP Method:** `POST`
   - **Response Mode:** `On Received`
4. Salve o nó

#### Adicionar Processador de Mensagens Evolution

**Adicione um Code node:**
1. Clique em **"+"** após o webhook
2. Busque: **"Code"**
3. Configure:
   - **Node Name:** `Process Evolution Message`
   - **Mode:** `Run Once for All Items`
   - **JavaScript Code:**
   
```javascript
const data = $input.first().json;

if (data.key && data.message) {
  return {
    json: {
      from: data.key.remoteJid.replace('@s.whatsapp.net', ''),
      messageText: data.message.conversation || data.message.extendedTextMessage?.text || '',
      timestamp: data.messageTimestamp,
      messageId: data.key.id,
      type: 'whatsapp',
      source: 'evolution',
      tenantId: 'f37a823e-c4af-4b1b-9e88-1d5ec65326ad' // Ajustar para tenant correto
    }
  };
}

return { json: {} };
```

4. Salve o nó
5. Conecte: `Evolution Webhook Receiver` → `Process Evolution Message`

#### Conectar ao Fluxo Existente

1. Encontre o nó **"Merge"** no workflow
2. Conecte: `Process Evolution Message` → `Merge`
3. Agora mensagens da Evolution chegam no mesmo fluxo!

#### Substituir Envio de Mensagens

**Encontre os nós que enviam mensagens** (ex: "Respond Onboarding", "Code responder")

**Adicione HTTP Request após eles:**
1. Clique em **"+"**
2. Busque: **"HTTP Request"**
3. Configure:
   - **Node Name:** `Send WhatsApp via Evolution`
   - **Method:** `POST`
   - **URL:** `https://navigator-evolution-api.onrender.com/message/sendText/navigator-whatsapp`
   - **Authentication:** Selecione `Evolution API Navigator` (credencial criada)
   - **Send Body:** Ative
   - **Body Content Type:** `JSON`
   - **Specify Body:** `Using Fields Below`
   - **Body Parameters:**
     - **Name:** `number` | **Value:** `={{ $json.phone.replace(/[^0-9]/g, '') }}`
     - **Name:** `text` | **Value:** `={{ $json.message || $json.welcome || $json.resposta }}`

4. Salve o nó
5. Conecte os nós de resposta para este nó de envio

### 3.3 Ativar Workflow

1. Certifique-se que o workflow está **Active** (toggle no topo)
2. Clique em **"Save"**
3. ✅ Workflow atualizado!

---

## 🧪 ETAPA 4: TESTES (10-15 min)

### 4.1 Teste de Envio Manual

```powershell
# Teste básico de envio
$API_KEY = "evo_api_key_abc123..." # Sua chave

$testBody = @{
    number = "5562999940476"  # Seu número (sem + - espaços)
    text = "🧪 Teste Evolution API - Navigator está funcionando!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://navigator-evolution-api.onrender.com/message/sendText/navigator-whatsapp" `
    -Method POST `
    -Headers @{"apikey"=$API_KEY; "Content-Type"="application/json"} `
    -Body $testBody
```

**Resultado esperado:**
- Você recebe a mensagem no WhatsApp em ~2 segundos
- ✅ Teste passou!

### 4.2 Teste de Recebimento

1. No WhatsApp, envie uma mensagem para o número conectado:
   ```
   Olá Navi, teste de recebimento
   ```

2. Verifique no N8N:
   - Vá em **"Executions"**
   - Veja a última execução
   - Deve ter processado a mensagem

3. Você deve receber uma resposta do agente!

### 4.3 Teste de Fluxo de Boas-Vindas

1. Acesse o admin: https://navigator-gules.vercel.app/admin-colaboradores.html
2. Crie um novo colaborador:
   - Nome: João Teste
   - Email: joao.teste@empresa.com
   - Telefone: +55 62 99994-0476 (seu número)
   - Cargo: Desenvolvedor
   - Departamento: TI

3. Aguarde ~5 segundos
4. **Você deve receber mensagem de boas-vindas no WhatsApp!** 🎉

### 4.4 Teste de Conversação com Agente

Envie mensagens de teste:

**Teste 1: Listar Trilhas**
```
Quais trilhas estão disponíveis?
```
**Esperado:** Agente lista trilhas

**Teste 2: Iniciar Trilha**
```
Quero iniciar a trilha 1
```
**Esperado:** Agente confirma início da trilha

**Teste 3: Buscar Documento**
```
Como funciona o plano de saúde?
```
**Esperado:** Agente busca e retorna informações

---

## 📊 ETAPA 5: MONITORAMENTO

### 5.1 Dashboard Evolution API

Acesse: https://navigator-evolution-api.onrender.com/manager

**Recursos disponíveis:**
- Status de instâncias
- Mensagens enviadas/recebidas
- Health check
- Logs de erro

### 5.2 Logs Render

1. Dashboard Render → Seu serviço
2. Aba **"Logs"**
3. Monitore erros em tempo real

### 5.3 N8N Executions

1. N8N → **"Executions"**
2. Filtre por workflow "Navigator"
3. Veja detalhes de cada execução
4. Debug erros se necessário

---

## 🚨 TROUBLESHOOTING

### Problema: QR Code não aparece

**Solução:**
```powershell
# Deletar instância e recriar
Invoke-RestMethod -Uri "https://navigator-evolution-api.onrender.com/instance/delete/navigator-whatsapp" `
    -Method DELETE `
    -Headers @{"apikey"=$API_KEY}

# Recriar (voltar ao passo 2.1)
```

### Problema: WhatsApp desconecta

**Solução:**
1. Verificar se não está conectado no WhatsApp Web em outro lugar
2. Reconectar:
```powershell
Invoke-RestMethod -Uri "https://navigator-evolution-api.onrender.com/instance/connect/navigator-whatsapp" `
    -Method GET `
    -Headers @{"apikey"=$API_KEY}
```

### Problema: Mensagens não chegam

**Checklist:**
- [ ] Evolution API está "Live" no Render?
- [ ] WhatsApp está conectado? (verificar status)
- [ ] Webhook N8N está ativo?
- [ ] Credencial N8N está correta?
- [ ] Workflow N8N está ativo?

**Debug:**
```powershell
# 1. Testar health
Invoke-RestMethod -Uri "https://navigator-evolution-api.onrender.com/manager/health" `
    -Method GET

# 2. Testar status instância
Invoke-RestMethod -Uri "https://navigator-evolution-api.onrender.com/instance/connectionState/navigator-whatsapp" `
    -Method GET `
    -Headers @{"apikey"=$API_KEY}

# 3. Ver logs Render
# Acessar dashboard → Logs
```

### Problema: Cold Start (Serviço dormindo)

**Sintoma:** Primeira mensagem demora ~30-60s

**Solução 1: Ping Automático (Free)**
Criar workflow no N8N:
1. Schedule Trigger: `*/10 * * * *` (a cada 10 min)
2. HTTP Request: GET `https://navigator-evolution-api.onrender.com/manager/health`

**Solução 2: Upgrade Render ($7/mês)**
- Plano Starter elimina cold starts
- Serviço sempre ativo

---

## 🎉 CONCLUSÃO

Após seguir todos os passos:

✅ Evolution API deployada no Render (free)  
✅ WhatsApp conectado e funcionando  
✅ N8N integrado e processando mensagens  
✅ Fluxo de boas-vindas automático  
✅ Agente conversacional com 4 ferramentas  
✅ Sistema 100% cloud e gratuito  

**Custo total:** R$ 0,00 🎊

---

## 📚 PRÓXIMOS PASSOS

1. **Testar com usuários reais** (5-10 colaboradores)
2. **Monitorar performance** (latência, erros)
3. **Ajustar prompts** do agente conforme feedback
4. **Implementar Fase 4.5** (Aprimoramento de Anotações)
5. **Considerar upgrade** se volume aumentar muito

---

**Data de Criação:** 17 de outubro de 2025  
**Última Atualização:** 17 de outubro de 2025  
**Versão:** 1.0.0

