# 🧪 TESTES PRÉ-DEPLOY VERCEL

## 🎯 Objetivo

Garantir que **TUDO** está funcionando perfeitamente antes de fazer push para produção.

---

## ✅ CHECKLIST DE TESTES

### 📊 FASE 1: Validação Local (OBRIGATÓRIA)

#### 1.1 Servidor Local Funcionando
- [ ] Servidor roda sem erros: `npm run dev`
- [ ] Porta 3000 acessível
- [ ] Logs sem erros no console
- [ ] Banco de dados conectado

#### 1.2 APIs Existentes (NÃO PODEM QUEBRAR)
- [ ] GET `/api/health` - Status 200
- [ ] GET `/api/trilhas` - Retorna trilhas
- [ ] GET `/api/colaborador/trilhas?colaborador_id=UUID`
- [ ] POST `/api/webhooks/trilha-iniciada`
- [ ] GET `/api/admin/tenants`
- [ ] GET `/api/admin/departments`
- [ ] GET `/api/admin/positions`
- [ ] GET `/api/admin/categories`

#### 1.3 Nova API - Análise de Sentimento
- [ ] POST `/api/analise-sentimento` - Com OpenAI
- [ ] POST `/api/analise-sentimento` - Com Gemini (se configurado)
- [ ] POST `/api/analise-sentimento` - Fallback (sem API keys)
- [ ] GET `/api/analise-sentimento/historico/:userId`
- [ ] POST `/api/analise-sentimento/gerar-anotacao`
- [ ] POST `/api/analise-sentimento/recomendar-trilhas`

#### 1.4 Frontend
- [ ] `http://localhost:3000/dashboard.html` - Carrega
- [ ] `http://localhost:3000/admin-trilhas.html` - Carrega
- [ ] `http://localhost:3000/colaborador-trilhas.html` - Carrega
- [ ] Navegação entre páginas funciona
- [ ] Dados do backend aparecem no frontend

#### 1.5 Banco de Dados
- [ ] Tabela `users` existe e tem dados
- [ ] Tabela `trilhas` existe e tem dados
- [ ] Tabela `colaborador_sentimentos` existe
- [ ] Foreign keys funcionando
- [ ] Dados sendo salvos corretamente

---

### 🌐 FASE 2: Testes de Produção Simulados

#### 2.1 Variáveis de Ambiente
- [ ] `.env` tem todas as variáveis necessárias
- [ ] `DATABASE_URL` configurado
- [ ] `OPENAI_API_KEY` configurado
- [ ] Variáveis opcionais documentadas

#### 2.2 Fallbacks
- [ ] Sistema funciona SEM `OPENAI_API_KEY`
- [ ] Sistema funciona SEM `GOOGLE_GEMINI_API_KEY`
- [ ] Sistema funciona SEM ambas (fallback simples)

#### 2.3 Performance
- [ ] Análise de sentimento responde em < 5s
- [ ] APIs respondem em < 2s
- [ ] Sem memory leaks visíveis

#### 2.4 Erros
- [ ] Erros retornam JSON estruturado
- [ ] Status codes corretos (400, 404, 500)
- [ ] Mensagens de erro claras

---

### 🚀 FASE 3: Preparação para Vercel

#### 3.1 Verificar Configuração Vercel
- [ ] Arquivo `vercel.json` existe e está correto
- [ ] Build commands configurados
- [ ] Variáveis de ambiente listadas

#### 3.2 Dependências
- [ ] `package.json` tem todas as dependências
- [ ] Versões compatíveis
- [ ] Sem dependências dev em production

#### 3.3 Arquivos Estáticos
- [ ] Pasta `public/` será servida corretamente
- [ ] Frontend acessível via Vercel

---

## 🧪 SCRIPTS DE TESTE

### Teste Completo Automatizado

Vou criar um script que testa TUDO de uma vez:

```javascript
// teste-pre-deploy.js
```

---

## 📋 CHECKLIST FINAL PRÉ-PUSH

### Antes de fazer `git push`:

1. [ ] ✅ Todos os testes da Fase 1 passaram
2. [ ] ✅ Sistema funciona com e sem API keys
3. [ ] [ ] README atualizado (se necessário)
4. [ ] [ ] CHANGELOG atualizado (se necessário)
5. [ ] ✅ Commit criado com mensagem clara
6. [ ] [ ] Sem arquivos sensíveis (.env não vai!)
7. [ ] [ ] Frontend testado localmente
8. [ ] [ ] APIs validadas (14/14 OK)

### Variáveis no Vercel (Configurar ANTES do deploy)

```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-proj-...
GOOGLE_GEMINI_API_KEY=AIza...  (opcional)
N8N_WEBHOOK_URL=https://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
PORT=3000
NODE_ENV=production
```

---

## ⚠️ ATENÇÃO - CHECKLIST CRÍTICO

### NÃO FAZER PUSH se:
- ❌ Tiver erros no console local
- ❌ APIs existentes não funcionarem
- ❌ Banco de dados não conectar
- ❌ Testes não passarem

### OK FAZER PUSH se:
- ✅ Servidor roda localmente sem erros
- ✅ APIs existentes funcionam (14/14)
- ✅ Nova funcionalidade funciona
- ✅ Validação completa passou

---

## 🎯 STATUS ATUAL

Com base nos testes anteriores:

✅ **Servidor Local:** Funcionando  
✅ **APIs Existentes:** 14/14 OK  
✅ **Nova API:** Funcionando com OpenAI  
✅ **Banco de Dados:** Conectado  
✅ **Frontend:** 30 páginas prontas  
✅ **Commit:** Criado (hash 2b895cf)  

**FALTA APENAS:** Rodar teste final completo antes do push!

---

Quer que eu crie um script de teste final completo?

