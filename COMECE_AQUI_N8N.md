# 🚀 COMECE AQUI - n8n para Flowly

## 📋 Checklist Rápido

Use este checklist para configurar o n8n em ordem:

---

### ✅ FASE 1: Configuração Básica (15 min)

- [ ] **1.1** Criar conta no n8n.io → https://n8n.io
- [ ] **1.2** Criar conta no Twilio (para WhatsApp de teste) → https://www.twilio.com/try-twilio
- [ ] **1.3** Ativar WhatsApp Sandbox no Twilio → https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
- [ ] **1.4** Copiar suas credenciais:
  - Account SID: `___________________`
  - Auth Token: `___________________`
  - Número WhatsApp: `whatsapp:+14155238886`

---

### ✅ FASE 2: Criar Primeiro Workflow (20 min)

Siga o guia: **`N8N_INICIO_RAPIDO.md`**

- [ ] **2.1** Importar template `n8n-workflow-template.json` no n8n
- [ ] **2.2** Adicionar credenciais do Twilio no n8n
- [ ] **2.3** Adicionar nodes "Twilio" após cada rota do Switch
- [ ] **2.4** Ativar o workflow (toggle ON)
- [ ] **2.5** Copiar URL do webhook (exemplo: `https://hndll.app.n8n.cloud/webhook/onboarding`)

---

### ✅ FASE 3: Conectar ao Flowly (5 min)

- [ ] **3.1** Entrar no Vercel → https://vercel.com/haendelllopes/policy-agent-poc
- [ ] **3.2** Ir em **Settings** → **Environment Variables**
- [ ] **3.3** Adicionar variável:
  - **Key:** `N8N_WEBHOOK_URL`
  - **Value:** `https://hndll.app.n8n.cloud/webhook/onboarding`
- [ ] **3.4** Salvar e aguardar redeploy (1-2 min)

---

### ✅ FASE 4: Testar End-to-End (10 min)

- [ ] **4.1** Entrar no Flowly → https://navigator-gules.vercel.app
- [ ] **4.2** Login como admin
- [ ] **4.3** Criar uma trilha de teste
- [ ] **4.4** Criar um colaborador de teste (com SEU número WhatsApp)
- [ ] **4.5** Atribuir a trilha ao colaborador
- [ ] **4.6** Como colaborador, iniciar a trilha
- [ ] **4.7** ✅ **VOCÊ DEVE RECEBER MENSAGEM NO WHATSAPP!**

---

### ✅ FASE 5: Adicionar Cron Job de Atrasos (15 min)

Siga o guia: **`N8N_SETUP_COMPLETO.md`** → Workflow 3

- [ ] **5.1** Criar novo workflow: "Flowly - Verificar Atrasos"
- [ ] **5.2** Adicionar node "Schedule Trigger" (todo dia 9h)
- [ ] **5.3** Adicionar node "HTTP Request" para `/api/admin/verificar-atrasos`
- [ ] **5.4** Ativar workflow

---

### ✅ FASE 6: Processar Conteúdo com IA (30 min) - OPCIONAL

Siga o guia: **`N8N_SETUP_COMPLETO.md`** → Workflow 1

⚠️ **Mais avançado!** Faça apenas depois que o básico estiver funcionando.

- [ ] **6.1** Criar OpenAI API Key → https://platform.openai.com/api-keys
- [ ] **6.2** Adicionar credencial OpenAI no n8n
- [ ] **6.3** Criar workflow "Processar Conteúdo"
- [ ] **6.4** Configurar extração de PDF, transcrição de vídeo
- [ ] **6.5** Configurar resumo com OpenAI
- [ ] **6.6** Salvar contexto no Supabase

---

### ✅ FASE 7: Gerar Certificados PDF (20 min) - OPCIONAL

Siga o guia: **`N8N_SETUP_COMPLETO.md`** → Workflow Extra

- [ ] **7.1** Criar conta em serviço de PDF (PDFShift, CloudConvert)
- [ ] **7.2** Adicionar credenciais no n8n
- [ ] **7.3** Criar template HTML do certificado
- [ ] **7.4** Adicionar node de envio de email com PDF anexo

---

## 🎯 Ordem Recomendada

```
1️⃣ Comece com FASE 1-4 (WhatsApp básico)
   ↓
   Teste até funcionar!
   ↓
2️⃣ Adicione FASE 5 (Cron de atrasos)
   ↓
   Deixe rodando por alguns dias
   ↓
3️⃣ Se quiser, adicione FASE 6 (IA)
   ↓
4️⃣ Por último, FASE 7 (Certificados)
```

---

## 📚 Documentos de Apoio

- **Tutorial rápido (15 min):** `N8N_INICIO_RAPIDO.md` ← **COMECE AQUI!**
- **Guia completo (todos os workflows):** `N8N_SETUP_COMPLETO.md`
- **Template para importar:** `n8n-workflow-template.json`
- **Webhooks disponíveis:** `WEBHOOKS.md`

---

## 🆘 Problemas Comuns

### ❌ Webhook não recebe dados
```
✅ Verifique se workflow está ATIVO (toggle ON)
✅ Teste com Postman primeiro
✅ Veja logs em n8n → Executions
```

### ❌ WhatsApp não envia
```
✅ Twilio: Conecte seu número ao Sandbox primeiro
✅ Teste enviando mensagem manual no Twilio Console
✅ Formato do número: +5511999999999 (com +)
```

### ❌ Variável N8N_WEBHOOK_URL não funciona
```
✅ Salve no Vercel e aguarde 1-2 min
✅ Veja os logs do Vercel para confirmar
✅ Tente forçar um redeploy
```

---

## 💡 Dica de Ouro

**NÃO TENTE FAZER TUDO DE UMA VEZ!**

Faça assim:
1. WhatsApp básico primeiro (FASES 1-4)
2. Teste até funcionar perfeitamente
3. Só então adicione mais features

Cada fase funciona independentemente! 🚀

---

## 📱 Contatos

- **n8n Community:** https://community.n8n.io
- **Twilio Support:** https://support.twilio.com
- **Flowly Docs:** Arquivos neste repositório

---

**Última atualização:** 09/10/2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso

