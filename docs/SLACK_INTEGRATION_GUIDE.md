# 📘 Guia de Integração Slack - Navigator

## 🎯 Visão Geral

Este guia explica como integrar o Slack da **empresa cliente** com o sistema Navigator.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    EMPRESA CLIENTE                          │
│                                                             │
│  ┌──────────────┐         ┌──────────────────────┐        │
│  │  Navigator   │────────▶│  Slack Workspace     │        │
│  │  (Dashboard) │         │  (da empresa cliente)│        │
│  └──────────────┘         └──────────────────────┘        │
│         │                            │                      │
│         │                            │                      │
│         ▼                            ▼                      │
│  ┌──────────────────────────────────────────┐              │
│  │         n8n Workflow (Automation)        │              │
│  └──────────────────────────────────────────┘              │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   AI Agent      │
              │  (OpenAI + RAG) │
              └─────────────────┘
```

---

## 📝 PASSO 1: Criar Slack App (Empresa Cliente)

### 1.1 Acessar Slack API
1. Ir para: https://api.slack.com/apps
2. Clicar em **"Create New App"**
3. Escolher **"From scratch"**
4. Preencher:
   - **App Name**: `Navigator Onboarding Bot`
   - **Workspace**: Selecionar o workspace da empresa

### 1.2 Configurar Bot Token Scopes
1. No menu lateral: **OAuth & Permissions**
2. Em **"Bot Token Scopes"**, adicionar:
   ```
   - chat:write          (enviar mensagens)
   - chat:write.public   (enviar em canais públicos)
   - im:write            (enviar DMs)
   - im:history          (ler histórico de DMs)
   - channels:read       (ler canais)
   - users:read          (ler informações de usuários)
   - app_mentions:read   (detectar menções ao bot)
   ```

### 1.3 Instalar App no Workspace
1. Ainda em **OAuth & Permissions**
2. Clicar em **"Install to Workspace"**
3. Autorizar as permissões
4. **COPIAR** o **"Bot User OAuth Token"** (começa com `xoxb-`)
   - ⚠️ **IMPORTANTE**: Guardar este token com segurança

---

## 📝 PASSO 2: Configurar Event Subscriptions

### 2.1 Obter Webhook URL do n8n
1. No n8n, criar workflow **"Slack Integration"**
2. Adicionar trigger **"Webhook"**
3. Método: **POST**
4. Copiar a URL gerada (ex: `https://hndll.app.n8n.cloud/webhook/slack-navigator`)

### 2.2 Configurar no Slack
1. No Slack App, ir em **Event Subscriptions**
2. Ativar: **Enable Events**
3. Em **"Request URL"**, colar a webhook URL do n8n
4. Adicionar **Bot Events**:
   ```
   - message.im          (mensagens diretas para o bot)
   - app_mention         (menções ao bot em canais)
   - message.channels    (mensagens em canais onde o bot está)
   ```
5. Clicar em **"Save Changes"**

### 2.3 Verificação URL Challenge
- O Slack enviará um desafio (challenge) para verificar a URL
- O n8n precisa responder com o mesmo `challenge` recebido

**Exemplo de resposta n8n:**
```javascript
// No nó "Respond to Webhook" do n8n
{
  "challenge": "{{ $json.challenge }}"
}
```

---

## 📝 PASSO 3: Configurar no Navigator

### 3.1 Acessar Configurador
1. Login no Navigator
2. Ir em: **Configurador** (no menu lateral)
3. Seção: **Tipo de Comunicação com o Agente**

### 3.2 Selecionar Slack
1. Clicar no botão **"Slack"**
2. Preencher campos:
   ```
   - Bot Token: xoxb-... (copiado no Passo 1.3)
   - Webhook URL: (URL do n8n do Passo 2.1)
   - Team ID: (ID do workspace Slack)
   ```

### 3.3 Salvar Configuração
- Sistema valida e salva as credenciais
- Integração fica ativa

---

## 📝 PASSO 4: Configurar n8n Workflow

### 4.1 Estrutura do Workflow

```
┌─────────────────────────────────────────────────────────┐
│  Slack Trigger (Webhook)                                │
│  ├─ Recebe mensagens do Slack                           │
│  └─ Extrai: user_id, message, channel, team_id          │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Validate Challenge (Se for verificação URL)            │
│  └─ Responde com challenge para validar webhook         │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Switch: Tipo de Mensagem                               │
│  ├─ 0: Mensagem Direta (DM)                            │
│  ├─ 1: Menção em Canal (@bot)                          │
│  └─ 2: Mensagem em Canal (bot está presente)           │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Normalize Message (Slack)                              │
│  └─ Padroniza dados: from, message, channel            │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  AI Agent                                                │
│  ├─ Busca contexto em documentos (RAG)                  │
│  └─ Gera resposta personalizada                         │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Send to Slack                                           │
│  └─ Envia resposta para o canal/DM correto             │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Nós Específicos para Slack

#### **Nó 1: Slack Trigger**
```javascript
// Configuração
Method: POST
Path: /webhook/slack-navigator
```

#### **Nó 2: Validate Challenge**
```javascript
// Expressão IF
{{ $json.challenge ? true : false }}

// Se TRUE (é challenge), responder:
{
  "challenge": "{{ $json.challenge }}"
}
```

#### **Nó 3: Normalize Message (Slack)**
```javascript
// Extração de dados
{
  "from": "{{ $json.event.user }}",
  "message": "{{ $json.event.text }}",
  "channel": "{{ $json.event.channel }}",
  "team_id": "{{ $json.team_id }}",
  "event_type": "{{ $json.event.type }}"
}
```

#### **Nó 4: Send to Slack**
```javascript
// HTTP Request para Slack API
Method: POST
URL: https://slack.com/api/chat.postMessage
Headers:
  Authorization: Bearer {{ $env.SLACK_BOT_TOKEN }}
  Content-Type: application/json

Body:
{
  "channel": "{{ $json.channel }}",
  "text": "{{ $json.ai_response }}"
}
```

---

## 📝 PASSO 5: Fluxo de Onboarding

### 5.1 Cadastro de Novo Funcionário
```javascript
// Quando RH cadastra funcionário no Navigator

1. Sistema gera link Deep Link Slack:
   slack://user?team={TEAM_ID}&id={BOT_USER_ID}

2. E-mail enviado com:
   - Boas-vindas
   - Link para abrir DM com bot
   - Instruções de uso
```

### 5.2 Template de E-mail
```html
<h2>Bem-vindo(a) à [EMPRESA]!</h2>

<p>Olá {{ nome_funcionario }},</p>

<p>Para facilitar seu onboarding, criamos um assistente virtual no Slack.</p>

<p>
  <a href="slack://user?team={{ team_id }}&id={{ bot_id }}">
    💬 Clique aqui para começar a conversar
  </a>
</p>

<p>Ou use o comando no Slack:</p>
<code>/dm @navigator-bot</code>

<p>Pergunte sobre:</p>
<ul>
  <li>Benefícios e políticas</li>
  <li>Procedimentos internos</li>
  <li>Estrutura da empresa</li>
  <li>E muito mais!</li>
</ul>
```

---

## 🔒 Segurança

### Validação de Requisições Slack
```javascript
// Validar assinatura Slack (recomendado)
const crypto = require('crypto');

function validateSlackRequest(headers, body) {
  const timestamp = headers['x-slack-request-timestamp'];
  const slackSignature = headers['x-slack-signature'];
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  
  // Verificar timestamp (evitar replay attacks)
  const time = Math.floor(new Date().getTime() / 1000);
  if (Math.abs(time - timestamp) > 300) {
    return false; // Request muito antigo
  }
  
  // Calcular assinatura
  const sigBasestring = `v0:${timestamp}:${JSON.stringify(body)}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(slackSignature)
  );
}
```

---

## 📊 Dados Armazenados

### Tabela: `tenant_settings`
```sql
tenant_id | setting_key          | setting_value
----------|----------------------|------------------
uuid-123  | communication_type   | slack
uuid-123  | slack_bot_token      | xoxb-...
uuid-123  | slack_webhook_url    | https://...
uuid-123  | slack_team_id        | T01234567
uuid-123  | slack_bot_user_id    | U01234567
```

---

## 🧪 Testes

### 1. Teste de Conexão
```bash
curl -X POST https://slack.com/api/auth.test \
  -H "Authorization: Bearer xoxb-YOUR-TOKEN"
```

### 2. Teste de Envio de Mensagem
```bash
curl -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer xoxb-YOUR-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "C01234567",
    "text": "Teste de integração Navigator!"
  }'
```

### 3. Teste de Webhook n8n
```bash
curl -X POST https://hndll.app.n8n.cloud/webhook/slack-navigator \
  -H "Content-Type: application/json" \
  -d '{
    "type": "url_verification",
    "challenge": "test123"
  }'
```

---

## 🐛 Troubleshooting

### ❌ Bot não responde
- Verificar se Bot Token está correto
- Confirmar que bot foi adicionado ao canal/DM
- Checar permissões (scopes) do bot
- Validar webhook URL no n8n

### ❌ Erro 404 no webhook
- Verificar se workflow n8n está ativo
- Confirmar URL do webhook no Slack App

### ❌ Assinatura inválida
- Verificar `SLACK_SIGNING_SECRET`
- Confirmar timestamp não expirado

---

## 📚 Referências

- [Slack API Documentation](https://api.slack.com/)
- [Slack Events API](https://api.slack.com/events-api)
- [Slack OAuth Scopes](https://api.slack.com/scopes)
- [n8n Slack Integration](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/)

---

## ✅ Checklist de Implementação

- [ ] Criar Slack App no workspace do cliente
- [ ] Configurar OAuth Scopes
- [ ] Instalar App e copiar Bot Token
- [ ] Criar webhook no n8n
- [ ] Configurar Event Subscriptions no Slack
- [ ] Validar URL Challenge
- [ ] Configurar credenciais no Navigator
- [ ] Testar envio de mensagem
- [ ] Ajustar template de e-mail
- [ ] Implementar validação de assinatura
- [ ] Documentar para cliente
- [ ] Treinar equipe de suporte

---

**Última atualização**: Outubro 2025
**Versão**: 1.0









