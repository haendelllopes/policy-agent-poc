# 🤖 Tutorial: Criar Bot Slack para Navigator

## 📋 PASSO 1: Criar Slack App

### 1.1 Acessar Slack API
1. Abra: **https://api.slack.com/apps**
2. Faça login com sua conta Slack
3. Clique em **"Create New App"**

### 1.2 Escolher Método de Criação
1. Selecione: **"From scratch"**
2. Preencha:
   - **App Name**: `Navigator Bot` (ou qualquer nome)
   - **Pick a workspace**: Selecione seu workspace de teste
3. Clique em **"Create App"**

---

## 🔑 PASSO 2: Configurar OAuth & Permissions

### 2.1 Adicionar Scopes (Permissões)
1. No menu lateral esquerdo, clique em: **"OAuth & Permissions"**
2. Role até a seção: **"Bot Token Scopes"**
3. Clique em **"Add an OAuth Scope"**
4. Adicione os seguintes scopes:

```
✅ chat:write              (Enviar mensagens)
✅ chat:write.public       (Enviar em canais públicos)
✅ im:write                (Enviar DMs)
✅ im:history              (Ler histórico de DMs)
✅ channels:read           (Ler canais)
✅ users:read              (Ler informações de usuários)
✅ app_mentions:read       (Detectar menções ao bot)
```

### 2.2 Instalar App no Workspace
1. Role para o topo da página "OAuth & Permissions"
2. Clique em: **"Install to Workspace"**
3. Revise as permissões
4. Clique em: **"Allow"**

### 2.3 Copiar Bot Token
1. Após instalar, você verá: **"Bot User OAuth Token"**
2. Ele começa com: `xoxb-`
3. **COPIAR ESTE TOKEN** - você vai usar no n8n!

```
Formato: xoxb-[NÚMEROS]-[NÚMEROS]-[LETRAS E NÚMEROS]
```

⚠️ **IMPORTANTE**: Guarde este token com segurança! Nunca compartilhe publicamente.

---

## 📡 PASSO 3: Configurar Event Subscriptions

### 3.1 Obter Webhook URL do n8n (faremos depois)
```
Por enquanto, ANOTE que você precisará:
- URL do webhook n8n
- Formato: https://hndll.app.n8n.cloud/webhook/XXXX
```

### 3.2 Ativar Event Subscriptions
1. No menu lateral, clique em: **"Event Subscriptions"**
2. Ative o toggle: **"Enable Events"** (ON)
3. Em **"Request URL"**: Deixe em branco por enquanto
   - ⏳ Vamos adicionar depois que criar o webhook no n8n

### 3.3 Adicionar Bot Events
1. Role até: **"Subscribe to bot events"**
2. Clique em: **"Add Bot User Event"**
3. Adicione os seguintes eventos:

```
✅ message.im              (Mensagens diretas para o bot)
✅ app_mention             (Menções ao bot em canais)
```

4. **NÃO SALVE AINDA** (porque falta a URL do webhook)

---

## 📝 PASSO 4: Obter Informações Importantes

### 4.1 Team ID
1. No menu lateral, clique em: **"Basic Information"**
2. Role até: **"App Credentials"**
3. Procure: **"Team ID"**
4. Copie o valor (ex: `T01234567`)

### 4.2 Bot User ID
1. No menu lateral, clique em: **"OAuth & Permissions"**
2. Role até o topo
3. Procure: **"Bot User ID"** (ou vai aparecer depois de instalar)
4. Copie o valor (ex: `U9876543`)

### 4.3 Signing Secret
1. No menu lateral, clique em: **"Basic Information"**
2. Role até: **"App Credentials"**
3. Procure: **"Signing Secret"**
4. Clique em: **"Show"**
5. Copie o valor

---

## ✅ Checklist do que você tem agora:

- [ ] Bot Token (`xoxb-...`)
- [ ] Team ID (`T...`)
- [ ] Bot User ID (`U...`) - pode aparecer depois
- [ ] Signing Secret (para validação)
- [ ] Event Subscriptions configurado (mas sem URL ainda)

---

## ⏭️ PRÓXIMO PASSO: Configurar n8n

Agora vamos para o n8n criar o workflow e obter a webhook URL!

---

**Arquivo criado**: ✅  
**Próximo arquivo**: `TUTORIAL_N8N_SLACK.md`

