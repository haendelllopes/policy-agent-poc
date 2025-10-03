# 🚀 Flowly - Configuração Supabase

## ✅ Credenciais Salvas
- **Senha:** `qJ5Ddh?.4yv-yH.`
- **Arquivo:** `SUPABASE_CREDENTIALS.md`

## 📋 Próximos Passos

### 1. Criar arquivo .env
Crie um arquivo `.env` na raiz do projeto com:

```env
# Supabase Database Configuration
DATABASE_URL=postgresql://postgres:qJ5Ddh?.4yv-yH.@db.[PROJECT_ID].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=[SUA_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SUA_SERVICE_ROLE_KEY]

# Application Configuration
NODE_ENV=development
PORT=3000

# n8n Webhook Configuration
N8N_WEBHOOK_URL=https://hndll.app.n8n.cloud/webhook/onboarding
```

### 2. Encontrar PROJECT_ID
1. Acesse seu projeto no Supabase
2. Vá em **Settings > Database**
3. Copie a **Connection string**
4. O PROJECT_ID está na URL (ex: `db.abcdefgh.supabase.co`)

### 3. Encontrar API Keys
1. Vá em **Settings > API**
2. Copie **anon/public** key
3. Copie **service_role** key (se necessário)

### 4. Testar Localmente
```bash
# Instalar dependências
npm install

# Iniciar servidor
npm run dev
```

### 5. Deploy na Render
1. Configure as variáveis de ambiente na Render
2. Faça deploy
3. Teste a aplicação

## 🔧 Código Atualizado
- ✅ PostgreSQL driver instalado (`pg`)
- ✅ Fallback para SQLite
- ✅ Migrações automáticas
- ✅ Pool de conexões otimizado

## 🎯 Status
- ✅ Credenciais salvas
- ✅ Código migrado para PostgreSQL
- ⏳ Aguardando PROJECT_ID e API Keys
- ⏳ Teste local
- ⏳ Deploy na Render
