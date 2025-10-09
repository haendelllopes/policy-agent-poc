# 🚀 n8n - Início Rápido (15 minutos)

Se você nunca usou n8n, comece por aqui! Este guia vai te fazer criar o primeiro workflow funcionando em 15 minutos.

---

## 📝 Pré-requisitos

- [ ] Conta no n8n.io (gratuita): https://n8n.io
- [ ] Número de WhatsApp Business (ou Twilio gratuito para testes)
- [ ] OpenAI API Key (para gerar quizzes)

---

## 🎯 WORKFLOW MÍNIMO (apenas WhatsApp)

Vamos começar só com o envio de mensagens WhatsApp. PDF e certificados vêm depois.

---

## 🔧 Passo 1: Criar Workflow no n8n

1. Entre no n8n: https://hndll.app.n8n.cloud
2. Clique em **"+ New Workflow"**
3. Nomeie: **"Flowly - WhatsApp Notifications"**

---

## 📥 Passo 2: Adicionar Webhook (Trigger)

1. Clique no **"+"** para adicionar node
2. Busque: **"Webhook"**
3. Clique em **"Webhook"**

**Configurações:**
- **HTTP Method:** POST
- **Path:** `onboarding`
- **Response Mode:** Last Node

4. Clique em **"Listen for Test Event"**
5. Copie a URL (algo como: `https://hndll.app.n8n.cloud/webhook/onboarding`)

---

## 🧪 Passo 3: Testar Webhook

Abra o Postman (ou use curl) e envie:

```bash
curl -X POST https://hndll.app.n8n.cloud/webhook/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "trilha_iniciada",
    "colaborador": {
      "nome": "João Silva",
      "phone": "+5511999999999"
    },
    "mensagem_sugerida": "Olá João! Você tem uma nova trilha de onboarding."
  }'
```

Se funcionou, você verá os dados aparecerem no n8n! ✅

---

## 🔀 Passo 4: Adicionar Switch (para diferentes tipos)

1. Clique no **"+"** após o Webhook
2. Busque: **"Switch"**
3. Configure:
   - **Mode:** Rules
   - **Value:** `{{ $json.tipo }}`

4. Adicione 4 rotas:
   - **Rota 1:** `trilha_iniciada`
   - **Rota 2:** `quiz_disponivel`
   - **Rota 3:** `trilha_concluida`
   - **Rota 4:** `onboarding_completo`

---

## 📱 Passo 5: Enviar WhatsApp (Método Simples - Twilio)

### Opção A: Usar Twilio (mais fácil para começar)

1. Crie conta grátis: https://www.twilio.com/try-twilio
2. Ative WhatsApp Sandbox: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
3. No n8n, adicione node **"Twilio"** depois de cada rota do Switch

**Configurações do Node Twilio:**
- **Credential:** Crie nova (Account SID + Auth Token do Twilio)
- **Resource:** Message
- **Operation:** Send
- **From:** `whatsapp:+14155238886` (número sandbox do Twilio)
- **To:** `whatsapp:{{ $json.colaborador.phone }}`
- **Message:** `{{ $json.mensagem_sugerida }}`

### Opção B: Usar Evolution API (melhor para produção)

Se você já tem Evolution API rodando:

1. Adicione node **"HTTP Request"** após cada rota
2. Configure:
   - **Method:** POST
   - **URL:** `https://sua-evolution-api.com/message/sendText/INSTANCE_NAME`
   - **Headers:**
     - `apikey`: `sua-api-key`
   - **Body:**
   ```json
   {
     "number": "{{ $json.colaborador.phone.replace('+', '') }}",
     "text": "{{ $json.mensagem_sugerida }}"
   }
   ```

---

## ✅ Passo 6: Ativar Workflow

1. Clique em **"Save"** (canto superior direito)
2. Toggle **"Active"** para ON (canto superior direito)

Pronto! Seu webhook está ativo! 🎉

---

## 🔗 Passo 7: Conectar ao Flowly (Vercel)

1. Entre no Vercel: https://vercel.com
2. Abra o projeto **"policy-agent-poc"**
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   - **Key:** `N8N_WEBHOOK_URL`
   - **Value:** `https://hndll.app.n8n.cloud/webhook/onboarding`
5. Clique em **Save**
6. Faça um novo deploy (ou espere o próximo)

---

## 🧪 Passo 8: Testar End-to-End

1. Entre no Flowly: https://navigator-gules.vercel.app
2. Faça login como **admin**
3. Vá em **"Trilhas de Onboarding"**
4. Crie uma trilha e atribua a um colaborador
5. O colaborador deve iniciar a trilha
6. **Você deve receber uma mensagem no WhatsApp!** 🎉

---

## 📊 Visualização do Workflow

```
┌──────────────────┐
│   📥 Webhook     │  ← Recebe dados do Flowly
│   /onboarding    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   🔀 Switch      │  ← Identifica tipo
│   (tipo)         │
└─┬──┬──┬──┬──────┘
  1  2  3  4
  │  │  │  │
  ▼  ▼  ▼  ▼
┌────────────────────┐
│ 📱 Enviar WhatsApp │  ← Envia mensagem
│ (Twilio/Evolution)│
└────────────────────┘
```

---

## 🎯 Próximos Passos (depois que isso funcionar)

1. ✅ **Adicionar Cron Job** para verificar atrasos (5 min)
2. ✅ **Processar PDFs** com OpenAI (20 min)
3. ✅ **Gerar Certificados** PDF (15 min)

---

## 🆘 Problemas Comuns

### ❌ "Webhook não recebe dados"
- Verifique se o workflow está **Active** (toggle ON)
- Teste enviando POST manualmente com Postman
- Veja os logs no n8n (menu Executions)

### ❌ "WhatsApp não envia"
- **Twilio:** Verifique se ativou o Sandbox e conectou seu número
- **Evolution API:** Teste a API direto com Postman primeiro

### ❌ "Variável N8N_WEBHOOK_URL não funciona"
- Certifique-se de salvar no Vercel
- Faça um novo deploy ou force redeploy
- Pode levar 1-2 minutos para propagar

---

## 📚 Recursos

- **Tutorial n8n (vídeo):** https://www.youtube.com/watch?v=1MwSoB0gnM4
- **Twilio WhatsApp Sandbox:** https://www.twilio.com/docs/whatsapp/sandbox
- **Evolution API Docs:** https://doc.evolution-api.com

---

## 💡 Dica Pro

Depois que o básico funcionar, você pode adicionar:
- **Logs no Supabase** para rastrear mensagens enviadas
- **Retry logic** se o WhatsApp falhar
- **Templates de mensagem** personalizados por empresa (tenant)

---

**Tempo estimado:** 15 minutos  
**Dificuldade:** ⭐⭐ (Fácil)  

**Deu certo?** Avance para `N8N_SETUP_COMPLETO.md` para implementar o resto! 🚀


