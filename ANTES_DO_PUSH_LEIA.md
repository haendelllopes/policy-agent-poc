# ⚠️ ANTES DE FAZER PUSH - LEIA ISTO!

## 🔴 IMPORTANTE: Configure Variáveis no Vercel PRIMEIRO!

### ❗ SE NÃO CONFIGURAR, O DEPLOY VAI FALHAR!

Antes de fazer `git push`, você **DEVE** configurar as variáveis de ambiente no Vercel:

---

## 📋 PASSO A PASSO (FAÇA AGORA!)

### 1. Acesse o Vercel Dashboard
https://vercel.com/dashboard

### 2. Selecione o Projeto Flowly

### 3. Vá em Settings → Environment Variables

### 4. Adicione ESTAS variáveis (OBRIGATÓRIAS):

```
DATABASE_URL
Valor: [sua connection string do Supabase]

OPENAI_API_KEY  
Valor: [sua chave da OpenAI - comece com sk-proj-...]

PGHOST
Valor: [do seu .env]

PGUSER
Valor: [do seu .env]

PGPASSWORD
Valor: [do seu .env]

PGDATABASE
Valor: postgres

PGPORT
Valor: 5432

NODE_ENV
Valor: production

SUPABASE_URL
Valor: [do seu .env]

SUPABASE_ANON_KEY
Valor: [do seu .env]
```

### 5. Variáveis Opcionais (Mas Recomendadas):

```
GOOGLE_GEMINI_API_KEY
N8N_WEBHOOK_URL
N8N_AI_WEBHOOK_URL
VERCEL_URL (será preenchido automaticamente)
```

---

## ⚠️ ATENÇÃO: NÃO COMETA ESTES ERROS

### ❌ NÃO fazer push sem configurar variáveis
**Resultado:** Deploy vai falhar, app não vai rodar

### ❌ NÃO colocar .env no Git
**Resultado:** Suas senhas ficam públicas!

### ❌ NÃO fazer push --force
**Resultado:** Pode perder código do time

---

## ✅ DEPOIS DE CONFIGURAR NO VERCEL

Aí sim pode fazer push:

```bash
git push origin main
```

O Vercel vai:
1. Detectar o push
2. Iniciar build automático
3. Fazer deploy
4. URL estará disponível em ~2 minutos

---

## 🧪 APÓS O DEPLOY, TESTAR:

```bash
# Substitua pela sua URL do Vercel
curl https://seu-projeto.vercel.app/api/health

# Deve retornar:
{"ok":true,"env":"vercel",...}
```

---

## 📞 SE DER ERRO NO DEPLOY

### 1. Ver Logs no Vercel
- Dashboard → Deployments → Clique no deploy
- Veja os logs de erro

### 2. Erros Comuns

**Erro: "Cannot connect to database"**
→ DATABASE_URL não configurada ou incorreta

**Erro: "Module not found"**  
→ Dependência faltando no package.json

**Erro: "Timeout"**
→ Função rodando muito tempo (limite Vercel)

---

## ✅ CONFIGUROU AS VARIÁVEIS NO VERCEL?

- [ ] SIM → **Pode fazer push!** 🚀
- [ ] NÃO → **Configure PRIMEIRO!** ⚠️

**Não pule este passo! É CRÍTICO!**

