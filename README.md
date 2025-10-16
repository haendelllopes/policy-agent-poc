# Flowly 🚀

**AI-powered employee onboarding via WhatsApp**

Flowly é uma plataforma SaaS que automatiza o processo de onboarding de colaboradores através de um agente de IA que se comunica via WhatsApp. A plataforma permite gerenciar documentos corporativos e políticas internas, facilitando a integração de novos funcionários.

## ✨ Funcionalidades

- 🤖 **Agente de IA via WhatsApp** - Comunicação direta com colaboradores
- 📄 **Gestão de Documentos** - Upload e organização de políticas internas
- 🔍 **Busca Inteligente** - IA para encontrar informações relevantes
- 👥 **Gestão de Colaboradores** - Cadastro e acompanhamento de funcionários
- 🏢 **Multi-tenant** - Suporte a múltiplas empresas
- 🔗 **Integração n8n** - Webhook automático para automação
- 📱 **Evolution API** - WhatsApp ilimitado e gratuito via Render

## 🚀 Como usar

### 1. Acesse a plataforma
```
https://flowly.onrender.com/
```

### 2. Crie sua empresa
- Clique em "Começar Agora"
- Preencha os dados da empresa e administrador
- Escolha um subdomain único

### 3. Configure colaboradores
- No dashboard, vá para "Colaboradores"
- Cadastre novos funcionários
- O webhook será enviado automaticamente para n8n

### 4. Upload de documentos
- Vá para "Documentos"
- Faça upload de políticas, benefícios, etc.
- A IA poderá responder perguntas baseadas nesses documentos

## 🔧 Desenvolvimento Local

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação
```bash
# Clone o repositório
git clone https://github.com/haendelllopes/flowly.git
cd flowly

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Inicie o servidor
npm run dev
```

### Estrutura do projeto
```
flowly/
├── src/
│   ├── server.js      # Servidor Express
│   └── db.js          # Camada de banco de dados
├── public/
│   ├── landing.html    # Landing page
│   └── dashboard.html # Dashboard admin
├── data/
│   └── db.sqlite      # Banco SQLite local
└── package.json
```

## 📡 API Endpoints

### Health Check
```http
GET /health
```

### Tenants (Empresas)
```http
GET /tenants
POST /tenants
```

### Usuários (Colaboradores)
```http
GET /users
POST /users
```

### Documentos
```http
POST /documents/upload
```

### Busca de Políticas
```http
POST /search/policy
```

## 🔗 Integração n8n

### Webhook de Onboarding
- **URL:** `https://hndll.app.n8n.cloud/webhook/onboarding`
- **Método:** POST
- **Payload:** Dados do colaborador criado

### Configuração no n8n
1. Configure o webhook para receber dados
2. Use os dados para enviar mensagem de boas-vindas
3. Configure o agente de IA para responder perguntas

## 🛠️ Tecnologias

- **Backend:** Node.js + Express
- **Banco:** SQLite (local) / PostgreSQL (produção)
- **Frontend:** HTML + CSS + JavaScript
- **IA:** Embeddings + Busca semântica
- **Deploy:** Render
- **Integração:** n8n + WhatsApp Cloud API

## 📝 Licença

ISC

## 📱 Evolution API - WhatsApp Ilimitado

O Flowly usa a Evolution API hospedada no Render para enviar mensagens WhatsApp de forma gratuita e ilimitada.

### Configuração
- **API URL:** https://navigator-evolution-api.onrender.com
- **Documentação:** Ver [EVOLUTION_API_CONFIG.md](./EVOLUTION_API_CONFIG.md)
- **Deploy:** Configurado via `render.evolution.yaml` e `Dockerfile.evolution`

### Vantagens
- ✅ **Gratuito** - Sem custos de mensagem
- ✅ **Ilimitado** - Sem limites de envio
- ✅ **Brasileiro** - Suporte em português
- ✅ **Auto-hospedado** - Controle total dos dados
- ✅ **Webhooks** - Integração fácil com N8N

### Endpoints Backend
```bash
# Enviar mensagem
POST /api/webhooks/evolution/send-message
{
  "phone": "+5562999404760",
  "message": "Mensagem de teste"
}

# Verificar status
GET /api/webhooks/evolution/status
```

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

---

**Flowly** - Transformando onboarding em uma experiência fluida e inteligente! 🚀
