# 🏗️ Arquitetura de Integração Slack - Navigator

## 📊 Diagrama de Arquitetura

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         INFRAESTRUTURA FORNECEDOR                        ║
║                              (Você - Navigator)                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║   ┌─────────────────────────────────────────────────────────────┐      ║
║   │              NAVIGATOR - SISTEMA SAAS                        │      ║
║   │                                                               │      ║
║   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │      ║
║   │  │   Dashboard  │  │  API Backend │  │  PostgreSQL DB   │  │      ║
║   │  │   (Frontend) │  │   (Node.js)  │  │  (Supabase)      │  │      ║
║   │  └──────────────┘  └──────────────┘  └──────────────────┘  │      ║
║   │         │                   │                   │            │      ║
║   │         └───────────────────┴───────────────────┘            │      ║
║   │                             │                                │      ║
║   │                             ▼                                │      ║
║   │                   ┌─────────────────┐                        │      ║
║   │                   │  tenant_settings │                        │      ║
║   │                   ├─────────────────┤                        │      ║
║   │                   │ • slack_token   │                        │      ║
║   │                   │ • slack_webhook │                        │      ║
║   │                   │ • team_id       │                        │      ║
║   │                   └─────────────────┘                        │      ║
║   └─────────────────────────────────────────────────────────────┘      ║
║                                                                          ║
║   ┌─────────────────────────────────────────────────────────────┐      ║
║   │                    n8n WORKFLOW ENGINE                        │      ║
║   │                                                               │      ║
║   │  ┌──────────────────────────────────────────────────────┐   │      ║
║   │  │  Slack Webhook  →  Normalize  →  AI Agent  →  Send  │   │      ║
║   │  └──────────────────────────────────────────────────────┘   │      ║
║   │         │                                            │        │      ║
║   │         │                                            │        │      ║
║   │         ▼                                            ▼        │      ║
║   │  ┌─────────────┐                          ┌─────────────┐   │      ║
║   │  │  Recebe de  │                          │  Envia para │   │      ║
║   │  │  Slack ⬇️   │                          │  Slack ⬆️   │   │      ║
║   │  └─────────────┘                          └─────────────┘   │      ║
║   └─────────────────────────────────────────────────────────────┘      ║
║                                                                          ║
║   ┌─────────────────────────────────────────────────────────────┐      ║
║   │                      AI AGENT (OpenAI)                        │      ║
║   │                                                               │      ║
║   │  • Busca semântica em documentos (RAG)                       │      ║
║   │  • Geração de respostas contextualizadas                     │      ║
║   │  • Memória de conversação                                    │      ║
║   └─────────────────────────────────────────────────────────────┘      ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
                                   ▲
                                   │
                                   │ HTTPS
                                   │
╔══════════════════════════════════╩══════════════════════════════════════╗
║                       INFRAESTRUTURA CLIENTE                             ║
║                        (Empresa que comprou Navigator)                   ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║   ┌─────────────────────────────────────────────────────────────┐      ║
║   │                   SLACK WORKSPACE DO CLIENTE                  │      ║
║   │                                                               │      ║
║   │  ┌──────────────┐         ┌─────────────────────────────┐   │      ║
║   │  │  Slack App   │         │    Funcionários (Usuários)  │   │      ║
║   │  │  "Navigator" │◄────────│                             │   │      ║
║   │  │              │         │  • João (RH)                │   │      ║
║   │  │  Bot Token   │         │  • Maria (TI)               │   │      ║
║   │  │  Webhooks    │         │  • Pedro (Vendas)           │   │      ║
║   │  └──────────────┘         │  • Ana (Marketing)          │   │      ║
║   │         │                  └─────────────────────────────┘   │      ║
║   │         │                                                     │      ║
║   │         ▼                                                     │      ║
║   │  ┌─────────────────────────────────────────────────┐        │      ║
║   │  │  Event Subscriptions (Slack API)                │        │      ║
║   │  │  • message.im (DMs para o bot)                  │        │      ║
║   │  │  • app_mention (Menções ao bot)                 │        │      ║
║   │  │  • message.channels (Mensagens em canais)       │        │      ║
║   │  └─────────────────────────────────────────────────┘        │      ║
║   └─────────────────────────────────────────────────────────────┘      ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## 🔄 Fluxo de Dados Detalhado

### **FASE 1: Configuração Inicial (Uma única vez)**

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENTE configura integração no Navigator                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣ Admin acessa Dashboard → Configurador                      │
│  2️⃣ Seleciona tipo de comunicação: "Slack"                     │
│  3️⃣ Preenche campos:                                           │
│     • Bot Token (xoxb-...)                                     │
│     • Team ID (T012345...)                                     │
│     • Webhook URL do n8n                                       │
│  4️⃣ Navigator salva em tenant_settings                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **FASE 2: Onboarding de Novo Funcionário**

```
┌─────────────────────────────────────────────────────────────────┐
│  RH CADASTRA novo funcionário                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣ RH acessa Navigator → Funcionários → Adicionar            │
│  2️⃣ Preenche dados:                                            │
│     • Nome: João Silva                                         │
│     • Email: joao@empresa.com                                  │
│     • Departamento: TI                                         │
│     • Cargo: Desenvolvedor                                     │
│  3️⃣ Clica em "Salvar"                                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │  BACKEND PROCESSA                                    │      │
│  ├─────────────────────────────────────────────────────┤      │
│  │  • Salva funcionário no DB                          │      │
│  │  • Busca configuração do tenant:                    │      │
│  │    - communication_type = 'slack'                   │      │
│  │    - slack_bot_token = 'xoxb-...'                   │      │
│  │    - slack_team_id = 'T012345...'                   │      │
│  │  • Gera Deep Link Slack:                            │      │
│  │    slack://user?team=T012345&id=U067890             │      │
│  │  • Gera QR Code (opcional)                          │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                 │
│  4️⃣ Navigator envia E-MAIL para joao@empresa.com              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │  📧 TEMPLATE DO E-MAIL                              │      │
│  ├─────────────────────────────────────────────────────┤      │
│  │  Olá João,                                          │      │
│  │                                                      │      │
│  │  Bem-vindo à [EMPRESA]!                             │      │
│  │                                                      │      │
│  │  Para facilitar seu onboarding, criamos um          │      │
│  │  assistente virtual no Slack.                       │      │
│  │                                                      │      │
│  │  [💬 Clique aqui para começar]                      │      │
│  │   (Link: slack://user?team=T012345&id=U067890)      │      │
│  │                                                      │      │
│  │  Ou escaneie o QR Code:                             │      │
│  │  [QR CODE IMAGE]                                    │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **FASE 3: Funcionário Conversa com o Bot**

```
┌─────────────────────────────────────────────────────────────────┐
│  FUNCIONÁRIO interage com o bot                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣ João recebe e-mail                                         │
│  2️⃣ Clica no link → Slack abre automaticamente                │
│  3️⃣ DM com @navigator-bot é aberto                             │
│  4️⃣ João digita: "Quais são os benefícios da empresa?"        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │  SLACK ENVIA EVENTO                                 │      │
│  ├─────────────────────────────────────────────────────┤      │
│  │  POST https://hndll.app.n8n.cloud/webhook/slack     │      │
│  │  {                                                   │      │
│  │    "event": {                                        │      │
│  │      "type": "message",                             │      │
│  │      "channel": "D01234567",                        │      │
│  │      "user": "U9876543",                            │      │
│  │      "text": "Quais são os benefícios?"             │      │
│  │    },                                                │      │
│  │    "team_id": "T012345"                             │      │
│  │  }                                                   │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                 │
│  5️⃣ n8n RECEBE e PROCESSA                                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │  WORKFLOW n8n                                        │      │
│  ├─────────────────────────────────────────────────────┤      │
│  │  1. Webhook recebe evento Slack                     │      │
│  │  2. Normaliza dados:                                │      │
│  │     {                                                │      │
│  │       "from": "U9876543",                           │      │
│  │       "message": "Quais são os benefícios?",        │      │
│  │       "channel": "D01234567",                       │      │
│  │       "team_id": "T012345"                          │      │
│  │     }                                                │      │
│  │  3. Identifica tenant pelo team_id                  │      │
│  │  4. Busca documentos do tenant                      │      │
│  │  5. Chama AI Agent com contexto                     │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                 │
│  6️⃣ AI AGENT PROCESSA                                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │  AI AGENT (OpenAI + RAG)                            │      │
│  ├─────────────────────────────────────────────────────┤      │
│  │  1. Gera embedding da pergunta                      │      │
│  │  2. Busca semântica em documentos:                  │      │
│  │     SELECT * FROM documents                         │      │
│  │     WHERE tenant_id = '...'                         │      │
│  │     ORDER BY embedding <=> query_embedding          │      │
│  │     LIMIT 5                                          │      │
│  │  3. Encontra: "Benefícios Bem-Estar.pdf"            │      │
│  │  4. Monta contexto + pergunta                       │      │
│  │  5. OpenAI gera resposta:                           │      │
│  │     "Nossa empresa oferece:                         │      │
│  │      • Vale-refeição R$ 45/dia                      │      │
│  │      • Plano de saúde Unimed                        │      │
│  │      • Vale-transporte                              │      │
│  │      • Gympass..."                                  │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                 │
│  7️⃣ n8n ENVIA RESPOSTA para Slack                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │  HTTP REQUEST                                        │      │
│  ├─────────────────────────────────────────────────────┤      │
│  │  POST https://slack.com/api/chat.postMessage        │      │
│  │  Headers:                                            │      │
│  │    Authorization: Bearer xoxb-...                   │      │
│  │  Body:                                               │      │
│  │    {                                                 │      │
│  │      "channel": "D01234567",                        │      │
│  │      "text": "Nossa empresa oferece:..."            │      │
│  │    }                                                 │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                 │
│  8️⃣ João VÊ A RESPOSTA no Slack                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Modelo de Segurança Multi-Tenant

### **Isolamento por Tenant**

```sql
-- Cada empresa (tenant) tem seus próprios dados isolados

┌─────────────────────────────────────────────────────────┐
│  Tenant: EMPRESA A (ID: uuid-aaa)                       │
├─────────────────────────────────────────────────────────┤
│  Slack Config:                                          │
│    • team_id: T012345                                   │
│    • bot_token: xoxb-111...                            │
│  Documentos:                                            │
│    • Benefícios_EmpresaA.pdf                           │
│    • Manual_EmpresaA.docx                              │
│  Funcionários:                                          │
│    • João, Maria, Pedro                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Tenant: EMPRESA B (ID: uuid-bbb)                       │
├─────────────────────────────────────────────────────────┤
│  Slack Config:                                          │
│    • team_id: T678901                                   │
│    • bot_token: xoxb-222...                            │
│  Documentos:                                            │
│    • Politicas_EmpresaB.pdf                            │
│    • Onboarding_EmpresaB.pdf                           │
│  Funcionários:                                          │
│    • Ana, Carlos, Beatriz                              │
└─────────────────────────────────────────────────────────┘
```

### **Fluxo de Identificação do Tenant**

```javascript
// Quando recebe mensagem do Slack

1. Extrair team_id da mensagem: "T012345"

2. Buscar tenant no banco:
   SELECT * FROM tenant_settings 
   WHERE setting_key = 'slack_team_id' 
   AND setting_value = 'T012345'
   
3. Obter tenant_id: "uuid-aaa"

4. Buscar documentos APENAS deste tenant:
   SELECT * FROM documents 
   WHERE tenant_id = 'uuid-aaa'
   
5. AI responde com contexto APENAS da Empresa A
```

---

## 📦 Responsabilidades

### **🏢 FORNECEDOR (Você - Navigator)**

| Componente | Descrição |
|-----------|-----------|
| **Dashboard** | Interface web para configuração |
| **API Backend** | Processa cadastros e configurações |
| **Banco de Dados** | Armazena dados de todos os tenants (isolados) |
| **n8n Workflow** | Orquestra comunicação com Slack |
| **AI Agent** | Processa perguntas e gera respostas |
| **Documentação** | Guias de integração para clientes |
| **Suporte** | Ajuda clientes na configuração |

### **🏢 CLIENTE (Empresa que compra)**

| Componente | Descrição |
|-----------|-----------|
| **Slack Workspace** | Workspace próprio da empresa |
| **Slack App** | Criar app "Navigator Bot" no workspace |
| **Bot Token** | Gerar e fornecer para Navigator |
| **Permissões** | Configurar scopes necessários |
| **Documentos** | Upload de PDFs/DOCs no Navigator |
| **Usuários** | Cadastro de funcionários no Navigator |

---

## ✅ Vantagens desta Arquitetura

1. **🔒 Isolamento Total**: Cada cliente tem dados 100% separados
2. **🚀 Escalável**: Suporta milhares de empresas simultaneamente
3. **🔧 Configuração Simples**: Cliente configura uma vez e pronto
4. **💰 SaaS Real**: Infraestrutura centralizada, multi-tenant
5. **🎯 Zero Manutenção**: Cliente não precisa gerenciar servidores
6. **📊 Analytics Centralizados**: Você vê métricas de todos os clientes
7. **🔄 Atualizações Automáticas**: Melhoria beneficia todos

---

## 🎯 Resumo Executivo

**Para o FORNECEDOR (Você):**
- Mantém 1 infraestrutura para N clientes
- Cobra mensalidade por tenant (empresa)
- Controla toda a IA e processamento
- Escala horizontalmente

**Para o CLIENTE:**
- Paga mensalidade SaaS
- Usa Slack próprio da empresa
- Configura uma vez
- Funcionários interagem naturalmente
- Zero infraestrutura própria necessária

**Modelo de Negócio:**
```
Cliente paga: R$ 499/mês
  ↓
Acesso ao Navigator
  ↓
Integra com Slack próprio
  ↓
Funcionários conversam com bot
  ↓
IA responde com documentos da empresa
```

---

**Este é o modelo SaaS perfeito para onboarding empresarial!** 🚀

