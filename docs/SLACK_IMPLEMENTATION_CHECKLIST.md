# ✅ Checklist de Implementação - Slack Integration

## 📋 Visão Geral

Este checklist guia a implementação completa da integração Slack no Navigator, do ponto de vista do **fornecedor SaaS**.

---

## 🏗️ FASE 1: Backend (Navigator)

### 1.1 Database Schema
- [ ] Validar tabela `tenant_settings` existe
- [ ] Adicionar campos específicos Slack:
  ```sql
  -- Já existente:
  - communication_type (VARCHAR) ✓
  
  -- Adicionar se necessário:
  - slack_bot_token (TEXT, encrypted)
  - slack_team_id (VARCHAR)
  - slack_bot_user_id (VARCHAR)
  - slack_webhook_url (TEXT)
  - slack_signing_secret (TEXT, encrypted)
  ```

### 1.2 API Endpoints
- [ ] Criar endpoint: `GET /api/slack/config?tenant={id}`
  - Retorna configurações Slack do tenant
- [ ] Criar endpoint: `POST /api/slack/config?tenant={id}`
  - Salva configurações Slack do tenant
- [ ] Criar endpoint: `POST /api/slack/validate-token`
  - Valida Bot Token com Slack API
- [ ] Criar endpoint: `GET /api/slack/deep-link?userId={id}`
  - Gera deep link Slack para DM com bot

### 1.3 Slack Deep Link Generator
```javascript
// src/slack-helper.js
function generateSlackDeepLink(teamId, botUserId) {
  return `slack://user?team=${teamId}&id=${botUserId}`;
}

function generateSlackWebLink(teamId, botUserId) {
  return `https://slack.com/app_redirect?team=${teamId}&channel=${botUserId}`;
}
```

- [ ] Criar helper para geração de links
- [ ] Integrar com endpoint de comunicação

### 1.4 Email Template
- [ ] Criar template específico para Slack
- [ ] Incluir Deep Link
- [ ] Incluir QR Code (opcional)
- [ ] Incluir instruções de uso

```html
<!-- templates/email-slack-onboarding.html -->
<h2>Bem-vindo(a) à {{ empresa_nome }}!</h2>
<p>Olá {{ funcionario_nome }},</p>
<p>Configure seu acesso conversando com nosso assistente no Slack:</p>
<a href="{{ slack_deep_link }}">💬 Abrir conversa no Slack</a>
```

- [ ] Testar envio de email
- [ ] Validar links funcionam

---

## 🔧 FASE 2: Frontend (Configurador)

### 2.1 Interface de Configuração
- [ ] Adicionar campos no Configurador:
  ```html
  <div id="slackConfig" style="display: none;">
    <input id="slackBotToken" placeholder="Bot Token (xoxb-...)">
    <input id="slackTeamId" placeholder="Team ID (T012345...)">
    <input id="slackBotUserId" placeholder="Bot User ID (U012345...)">
    <button onclick="validateSlackToken()">Validar Token</button>
    <button onclick="saveSlackConfig()">Salvar</button>
  </div>
  ```

### 2.2 Validação de Token
```javascript
async function validateSlackToken() {
  const token = document.getElementById('slackBotToken').value;
  
  const response = await fetch('https://slack.com/api/auth.test', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  if (data.ok) {
    document.getElementById('slackTeamId').value = data.team_id;
    document.getElementById('slackBotUserId').value = data.user_id;
    alert('Token válido! ✓');
  } else {
    alert('Token inválido: ' + data.error);
  }
}
```

- [ ] Implementar validação em tempo real
- [ ] Mostrar feedback visual
- [ ] Auto-preencher Team ID e Bot User ID

### 2.3 Salvar Configuração
- [ ] Chamar API: `POST /api/slack/config`
- [ ] Criptografar token antes de salvar
- [ ] Mostrar mensagem de sucesso
- [ ] Atualizar status de comunicação

---

## 🌐 FASE 3: n8n Workflow

### 3.1 Criar Workflow "Slack Integration"
- [ ] Criar novo workflow no n8n
- [ ] Nome: `Slack - Navigator Integration`
- [ ] Ativar workflow

### 3.2 Nós do Workflow

#### Nó 1: Slack Webhook Trigger
```json
{
  "name": "Slack Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "slack-navigator",
    "responseMode": "responseNode"
  }
}
```
- [ ] Criar webhook trigger
- [ ] Copiar URL gerada
- [ ] Testar recebimento

#### Nó 2: URL Verification (Challenge)
```json
{
  "name": "URL Verification",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "string": [
        {
          "value1": "={{ $json.challenge }}",
          "operation": "exists"
        }
      ]
    }
  }
}
```
- [ ] Verificar se é challenge
- [ ] Responder com challenge
- [ ] Validar Slack aceita

#### Nó 3: Extract Message Data
```javascript
// Function node
const event = $input.item.json.event;
const teamId = $input.item.json.team_id;

return {
  from: event.user,
  message: event.text,
  channel: event.channel,
  team_id: teamId,
  event_type: event.type
};
```
- [ ] Extrair dados da mensagem
- [ ] Normalizar formato
- [ ] Passar para próximo nó

#### Nó 4: Identify Tenant
```javascript
// HTTP Request para API Navigator
// GET /api/tenant/by-slack-team?teamId={{ $json.team_id }}
```
- [ ] Buscar tenant pelo team_id
- [ ] Validar tenant existe
- [ ] Obter tenant_id e configurações

#### Nó 5: AI Agent
```json
{
  "name": "AI Agent",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "parameters": {
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "={{ $json.message }}"
  }
}
```
- [ ] Configurar AI Agent
- [ ] Conectar com Vector Store
- [ ] Buscar documentos do tenant
- [ ] Gerar resposta contextualizada

#### Nó 6: Send to Slack
```javascript
// HTTP Request
{
  method: 'POST',
  url: 'https://slack.com/api/chat.postMessage',
  headers: {
    'Authorization': 'Bearer {{ $json.slack_bot_token }}',
    'Content-Type': 'application/json'
  },
  body: {
    channel: '{{ $json.channel }}',
    text: '{{ $json.ai_response }}'
  }
}
```
- [ ] Enviar resposta para Slack
- [ ] Usar token do tenant correto
- [ ] Tratar erros

### 3.3 Testes do Workflow
- [ ] Testar URL verification
- [ ] Testar mensagem direta (DM)
- [ ] Testar menção em canal
- [ ] Testar múltiplos tenants
- [ ] Validar isolamento de dados

---

## 📱 FASE 4: Configuração Slack (Cliente)

### 4.1 Documentação para Cliente
- [ ] Criar guia passo a passo
- [ ] Incluir screenshots
- [ ] Disponibilizar em `/docs/slack-setup`
- [ ] Criar vídeo tutorial (opcional)

### 4.2 Instruções de Criação do App
```markdown
1. Acesse: https://api.slack.com/apps
2. "Create New App" → "From scratch"
3. Nome: "Navigator Onboarding Bot"
4. Workspace: Selecione seu workspace
5. "Create App"
```
- [ ] Documentar criação do app
- [ ] Listar OAuth Scopes necessários:
  - `chat:write`
  - `chat:write.public`
  - `im:write`
  - `im:history`
  - `channels:read`
  - `users:read`
  - `app_mentions:read`

### 4.3 Event Subscriptions
- [ ] Documentar configuração de eventos
- [ ] Fornecer webhook URL do n8n
- [ ] Listar eventos necessários:
  - `message.im`
  - `app_mention`
  - `message.channels`

### 4.4 Obter Credenciais
- [ ] Instruir onde copiar Bot Token
- [ ] Instruir onde copiar Team ID
- [ ] Instruir onde copiar Bot User ID
- [ ] Instruir onde copiar Signing Secret

---

## 🔒 FASE 5: Segurança

### 5.1 Validação de Requisições Slack
```javascript
// Validar assinatura Slack
function validateSlackSignature(headers, body, signingSecret) {
  const timestamp = headers['x-slack-request-timestamp'];
  const signature = headers['x-slack-signature'];
  
  // Evitar replay attacks (5 min window)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > 300) {
    return false;
  }
  
  // Calcular HMAC
  const sigBasestring = `v0:${timestamp}:${JSON.stringify(body)}`;
  const hmac = crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');
  
  const computedSignature = `v0=${hmac}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}
```
- [ ] Implementar validação de assinatura
- [ ] Adicionar no workflow n8n
- [ ] Rejeitar requests inválidas
- [ ] Logar tentativas suspeitas

### 5.2 Criptografia de Tokens
```javascript
// Criptografar tokens antes de salvar
const crypto = require('crypto');

function encryptToken(token) {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptToken(encrypted) {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```
- [ ] Implementar criptografia AES-256
- [ ] Salvar tokens criptografados
- [ ] Descriptografar apenas quando necessário
- [ ] Rotacionar chave de criptografia periodicamente

### 5.3 Rate Limiting
- [ ] Implementar rate limit por tenant
- [ ] Limite: 60 mensagens/minuto por tenant
- [ ] Retornar erro 429 se exceder
- [ ] Logar abusos

---

## 🧪 FASE 6: Testes

### 6.1 Testes Unitários
- [ ] Testar geração de deep links
- [ ] Testar validação de tokens
- [ ] Testar criptografia/descriptografia
- [ ] Testar identificação de tenant

### 6.2 Testes de Integração
- [ ] Testar fluxo completo de onboarding
- [ ] Testar múltiplos tenants simultaneamente
- [ ] Testar isolamento de dados
- [ ] Testar fallback de erros

### 6.3 Testes de Carga
- [ ] Simular 100 mensagens/segundo
- [ ] Validar tempo de resposta < 3s
- [ ] Verificar uso de memória
- [ ] Monitorar taxa de erro

### 6.4 Testes de Segurança
- [ ] Tentar replay attack
- [ ] Validar assinatura inválida
- [ ] Testar acesso cross-tenant
- [ ] Verificar exposição de tokens

---

## 📊 FASE 7: Monitoramento

### 7.1 Métricas
- [ ] Total de mensagens processadas
- [ ] Tempo médio de resposta
- [ ] Taxa de erro por tenant
- [ ] Uso de API Slack (rate limits)
- [ ] Custo de AI (tokens OpenAI)

### 7.2 Logs
- [ ] Logar todas as mensagens recebidas
- [ ] Logar respostas enviadas
- [ ] Logar erros e exceções
- [ ] Logar tentativas de acesso inválido

### 7.3 Alertas
- [ ] Alerta se taxa de erro > 5%
- [ ] Alerta se tempo de resposta > 5s
- [ ] Alerta se tenant atingir rate limit
- [ ] Alerta se Slack API retornar erro 429

---

## 📚 FASE 8: Documentação

### 8.1 Documentação Técnica
- [ ] Arquitetura geral
- [ ] Fluxo de dados
- [ ] API endpoints
- [ ] Configuração n8n
- [ ] Troubleshooting

### 8.2 Documentação para Cliente
- [ ] Guia de configuração inicial
- [ ] Como criar Slack App
- [ ] Como obter credenciais
- [ ] FAQ
- [ ] Vídeo tutorial

### 8.3 Documentação de Suporte
- [ ] Problemas comuns e soluções
- [ ] Como debug workflows n8n
- [ ] Como verificar logs
- [ ] Contatos de emergência

---

## 🚀 FASE 9: Deploy

### 9.1 Staging
- [ ] Deploy em ambiente de staging
- [ ] Testar com 1 cliente piloto
- [ ] Coletar feedback
- [ ] Ajustar conforme necessário

### 9.2 Production
- [ ] Deploy em produção
- [ ] Ativar monitoramento
- [ ] Configurar alertas
- [ ] Comunicar aos clientes

### 9.3 Rollout
- [ ] Liberar para 10% dos clientes
- [ ] Monitorar por 1 semana
- [ ] Liberar para 50% dos clientes
- [ ] Monitorar por 1 semana
- [ ] Liberar para 100% dos clientes

---

## 📈 FASE 10: Pós-Deploy

### 10.1 Suporte
- [ ] Treinar equipe de suporte
- [ ] Criar playbook de atendimento
- [ ] Definir SLA de resposta
- [ ] Canal de comunicação com clientes

### 10.2 Melhorias Contínuas
- [ ] Coletar feedback dos usuários
- [ ] Analisar métricas de uso
- [ ] Identificar oportunidades de melhoria
- [ ] Planejar próximas features

### 10.3 Manutenção
- [ ] Revisar logs semanalmente
- [ ] Atualizar dependências mensalmente
- [ ] Auditar segurança trimestralmente
- [ ] Revisar custos mensalmente

---

## ✅ Checklist Final

- [ ] Todos os testes passando
- [ ] Documentação completa
- [ ] Equipe treinada
- [ ] Monitoramento ativo
- [ ] Clientes comunicados
- [ ] Plano de contingência definido
- [ ] Backup configurado
- [ ] DR (Disaster Recovery) testado

---

**Estimativa de tempo total: 2-3 semanas**

**Prioridade:**
1. ⚡ Alta: Backend, n8n, Segurança
2. 🔶 Média: Frontend, Documentação
3. 🔵 Baixa: Testes de carga, Vídeos tutoriais

---

**Status:** 📋 Planejamento concluído - Pronto para implementação!








