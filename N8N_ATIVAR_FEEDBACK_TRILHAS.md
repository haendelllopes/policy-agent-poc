# 🎯 INSTRUÇÕES PRÁTICAS - Ativar Feedback de Trilhas no N8N

**Tempo estimado:** 15 minutos  
**Dificuldade:** ⭐ Fácil  
**Status:** Pronto para ativação

---

## ✅ **BOM SABER ANTES DE COMEÇAR:**

Tudo já está implementado e pronto:
- ✅ Backend com 6 webhooks funcionando
- ✅ N8N com workflow "Navigator" configurado
- ✅ Nó "Webhook Onboarding2" criado (apenas desabilitado)
- ✅ Switch com 6 rotas configuradas
- ✅ 6 nós de envio de mensagem prontos

**Você só precisa:**
1. Habilitar 1 nó no N8N (1 clique)
2. Configurar 1 variável no Vercel
3. Testar com curl

---

## 📝 **PASSO 1: HABILITAR O NÓ NO N8N** (2 minutos)

### **Acesse o N8N:**
1. Vá em: https://hndll.app.n8n.cloud
2. Abra o workflow **"Navigator"**
3. Localize o nó **"Webhook Onboarding2"** (está cinza/desabilitado)

### **Habilite o nó:**
1. **Clique com botão direito** no nó "Webhook Onboarding2"
2. Clique em **"Enable"** (ou "Habilitar")
3. O nó ficará colorido ✅

### **Copie a URL do Webhook:**
1. Clique no nó "Webhook Onboarding2"
2. Na aba "Parameters", veja a **"Production URL"**
3. Copie a URL completa:
   ```
   https://hndll.app.n8n.cloud/webhook/onboarding
   ```

### **Salve o Workflow:**
1. Clique em **"Save"** (no topo direito)
2. O workflow está ativo! ✅

---

## 🔧 **PASSO 2: CONFIGURAR VARIÁVEL NO VERCEL** (3 minutos)

### **Acesse o Vercel:**
1. Vá em: https://vercel.com
2. Entre no projeto **"navigator"** ou similar
3. Clique em **"Settings"**
4. Clique em **"Environment Variables"**

### **Adicione a variável:**
1. Clique em **"Add New"**
2. **Name:** `N8N_WEBHOOK_URL`
3. **Value:** `https://hndll.app.n8n.cloud/webhook/onboarding`
4. **Environments:** Selecione **Production**
5. Clique em **"Save"**

### **Redeploy do projeto:**
1. Volte para a aba **"Deployments"**
2. Clique nos **"..."** do último deployment
3. Clique em **"Redeploy"**
4. Aguarde 1-2 minutos para o deploy concluir

---

## 🧪 **PASSO 3: TESTAR OS WEBHOOKS** (10 minutos)

### **Teste 1: Trilha Iniciada** 🚀

Abra o terminal e execute:

```bash
curl -X POST "https://navigator-gules.vercel.app/api/webhooks/trilha-iniciada?tenant=demo" \
  -H "Content-Type: application/json" \
  -d '{
    "colaborador_id": "321e7f26-a5fc-470d-88d0-7d6bfde35b9b",
    "colaborador_nome": "Jose",
    "colaborador_email": "haendell@hotmail.com",
    "colaborador_phone": "556299940476",
    "trilha_id": "279326bb-6051-4d43-ab38-431714a937ce",
    "trilha_nome": "Cultura Organizacional",
    "prazo_dias": 7,
    "data_limite": "2025-10-18T12:00:00.000Z"
  }'
```

**Esperado:**
- ✅ Retorna: `{"success": true, "message": "Webhook disparado"}`
- ✅ WhatsApp recebe: "Olá Jose! 👋 Você tem uma nova trilha..."

---

### **Teste 2: Quiz Disponível** ✍️

```bash
curl -X POST "https://navigator-gules.vercel.app/api/webhooks/quiz-disponivel?tenant=demo" \
  -H "Content-Type: application/json" \
  -d '{
    "colaborador_id": "321e7f26-a5fc-470d-88d0-7d6bfde35b9b",
    "colaborador_nome": "Jose",
    "colaborador_email": "haendell@hotmail.com",
    "colaborador_phone": "556299940476",
    "trilha_id": "279326bb-6051-4d43-ab38-431714a937ce",
    "trilha_nome": "Cultura Organizacional"
  }'
```

**Esperado:**
- ✅ WhatsApp recebe: "Parabéns Jose! 🎉 Quiz disponível..."

---

### **Teste 3: Trilha Concluída** 🎉

```bash
curl -X POST "https://navigator-gules.vercel.app/api/webhooks/trilha-concluida?tenant=demo" \
  -H "Content-Type: application/json" \
  -d '{
    "colaborador_id": "321e7f26-a5fc-470d-88d0-7d6bfde35b9b",
    "colaborador_nome": "Jose",
    "colaborador_email": "haendell@hotmail.com",
    "colaborador_phone": "556299940476",
    "trilha_id": "279326bb-6051-4d43-ab38-431714a937ce",
    "trilha_nome": "Cultura Organizacional",
    "nota": 85,
    "pontos": 85
  }'
```

**Esperado:**
- ✅ WhatsApp recebe: "Parabéns Jose! 🏆 Trilha concluída com 85%..."

---

### **Teste 4: Onboarding Completo** 🏆

```bash
curl -X POST "https://navigator-gules.vercel.app/api/webhooks/onboarding-completo?tenant=demo" \
  -H "Content-Type: application/json" \
  -d '{
    "colaborador_id": "321e7f26-a5fc-470d-88d0-7d6bfde35b9b",
    "colaborador_nome": "Jose",
    "colaborador_email": "haendell@hotmail.com",
    "colaborador_phone": "556299940476",
    "total_trilhas": 3,
    "pontos_totais": 255
  }'
```

**Esperado:**
- ✅ WhatsApp recebe: "Parabéns Jose! 🎊 Onboarding completo! 3 trilhas..."

---

### **Teste 5: Alerta de Atraso** ⚠️

```bash
curl -X POST "https://navigator-gules.vercel.app/api/webhooks/alerta-atraso?tenant=demo" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_alerta": "atraso",
    "colaborador_nome": "Jose",
    "trilha_nome": "Cultura Organizacional",
    "dias_atraso": 3,
    "destinatario": {
      "email": "haendell@hotmail.com",
      "phone": "556291708483"
    }
  }'
```

**Esperado:**
- ✅ WhatsApp envia para RH: "⚠️ ALERTA DE ATRASO - Jose..."

---

### **Teste 6: Alerta de Nota Baixa** 📉

```bash
curl -X POST "https://navigator-gules.vercel.app/api/webhooks/alerta-nota-baixa?tenant=demo" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_alerta": "nota_baixa",
    "colaborador_nome": "Jose",
    "trilha_nome": "Cultura Organizacional",
    "nota": 35,
    "tentativa": 2,
    "destinatario": {
      "email": "haendell@hotmail.com",
      "phone": "556291708483"
    }
  }'
```

**Esperado:**
- ✅ WhatsApp envia para RH: "📉 ALERTA DE DESEMPENHO - Jose..."

---

## ✅ **PASSO 4: VERIFICAR LOGS NO N8N**

### **Ver Execuções:**
1. No N8N, clique em **"Executions"** (menu lateral)
2. Veja a lista de execuções recentes
3. Clique em uma execução para ver detalhes
4. Verifique cada nó:
   - ✅ Webhook recebeu dados
   - ✅ Switch direcionou para rota correta
   - ✅ Send message executou com sucesso

### **Debug de Erros:**
- Se houver erro vermelho, clique no nó
- Veja a mensagem de erro
- Corrija conforme necessário

---

## 🎨 **PASSO 5: PERSONALIZAR MENSAGENS (OPCIONAL)**

Se quiser alterar as mensagens automáticas:

### **No N8N:**
1. Abra o workflow "Navigator"
2. Clique no nó **"Send message1"** (Trilha Iniciada)
3. No campo **"Message"**, edite:

```
Olá {{ $json.body.colaborador_nome }}! 👋

Você tem uma nova trilha de onboarding: *{{ $json.body.trilha_nome }}*

⏰ Prazo: {{ $json.body.prazo_dias }} dias

📚 Acesse: navigator-gules.vercel.app/colaborador-trilhas

Bons estudos! 💪
```

4. Repita para os outros 5 nós (Send message2-6)
5. **Salve o workflow**

---

## ⏰ **PASSO 6: CRIAR CRON JOB PARA ATRASOS**

### **Criar Novo Workflow no N8N:**

1. Clique em **"+ New Workflow"**
2. Nome: **"Verificar Atrasos - Diário"**

### **Adicionar Schedule Trigger:**

1. Adicione nó **"Schedule Trigger"**
2. Configure:
   - **Trigger Times:** Cron
   - **Cron Expression:** `0 9 * * *` (todo dia às 9h da manhã)
   - **Timezone:** America/Sao_Paulo

### **Adicionar HTTP Request:**

1. Adicione nó **"HTTP Request"**
2. Configure:
   - **Method:** POST
   - **URL:** `https://navigator-gules.vercel.app/api/admin/verificar-atrasos?tenant=demo`
   - **Headers:** `Content-Type: application/json`

3. Conecte: Schedule Trigger → HTTP Request

### **Ativar Workflow:**

1. No topo, mude o toggle de **"Inactive"** para **"Active"**
2. **Salve o workflow**

**Pronto!** Todo dia às 9h o sistema verificará trilhas atrasadas automaticamente.

---

## 📊 **RESULTADO FINAL:**

### **O que acontece agora automaticamente:**

```
✅ Colaborador inicia trilha
   → WhatsApp: "Olá! Nova trilha disponível..."

✅ Colaborador aceita todos os conteúdos
   → WhatsApp: "Parabéns! Quiz disponível..."

✅ Colaborador é aprovado no quiz
   → WhatsApp: "Parabéns! Trilha concluída..."

✅ Colaborador completa todas as trilhas
   → WhatsApp: "Parabéns! Onboarding completo! 🎊"

✅ Todo dia às 9h da manhã
   → Sistema verifica atrasos
   → Se houver, RH recebe: "⚠️ Alerta de atraso..."

✅ Colaborador reprova quiz com nota < 40%
   → RH recebe: "📉 Alerta de desempenho..."
```

---

## 🎯 **CHECKLIST DE ATIVAÇÃO:**

- [ ] **N8N - Workflow Navigator:**
  - [ ] Habilitar nó "Webhook Onboarding2"
  - [ ] Copiar Production URL
  - [ ] Salvar workflow
  
- [ ] **Vercel:**
  - [ ] Adicionar variável `N8N_WEBHOOK_URL`
  - [ ] Redeploy do projeto
  - [ ] Aguardar deploy concluir (~2 min)

- [ ] **Testes:**
  - [ ] Teste 1: trilha_iniciada
  - [ ] Teste 2: quiz_disponivel
  - [ ] Teste 3: trilha_concluida
  - [ ] Teste 4: onboarding_completo
  - [ ] Teste 5: alerta_atraso
  - [ ] Teste 6: alerta_nota_baixa

- [ ] **N8N - Cron Job:**
  - [ ] Criar workflow "Verificar Atrasos - Diário"
  - [ ] Adicionar Schedule Trigger (9h diário)
  - [ ] Adicionar HTTP Request
  - [ ] Ativar workflow

- [ ] **Monitoramento:**
  - [ ] Verificar Executions no N8N
  - [ ] Verificar logs no Vercel
  - [ ] Confirmar mensagens WhatsApp

---

## 💡 **DICAS IMPORTANTES:**

### **Telefones de Teste:**
- Use seus próprios telefones para testar
- Formato: `556299940476` (sem + e sem espaços)
- WhatsApp deve estar registrado no número

### **Tenant:**
- Use `?tenant=demo` para testes
- Depois configure para cada tenant real

### **Mensagens:**
- Limite WhatsApp: 4096 caracteres
- Use emojis moderadamente
- Teste antes de ativar em produção

---

## 🚨 **TROUBLESHOOTING RÁPIDO:**

| **Problema** | **Solução** |
|--------------|-------------|
| Webhook não chega no N8N | Verificar variável `N8N_WEBHOOK_URL` no Vercel |
| Mensagem não chega no WhatsApp | Verificar credencial WhatsApp API no N8N |
| Switch não funciona | Verificar se campo `body.tipo` está correto |
| Erro 404 no webhook | Verificar se nó está habilitado e workflow ativo |

---

## 📊 **LOGS PARA MONITORAR:**

### **N8N:**
- Menu: Executions
- Filtrar por workflow "Navigator"
- Ver execuções com sucesso/erro

### **Vercel:**
- Dashboard → Logs
- Filtrar por "webhook"
- Ver requisições POST

### **WhatsApp Business:**
- Meta Business Manager
- WhatsApp → Mensagens
- Ver histórico de envios

---

## 🎉 **APÓS ATIVAÇÃO:**

Você terá um sistema **100% automatizado** de notificações:

- ✅ Colaboradores recebem lembretes automáticos
- ✅ RH é alertado sobre problemas (atrasos, notas baixas)
- ✅ Engajamento aumenta
- ✅ Menos trilhas esquecidas
- ✅ Melhor experiência de onboarding

---

**🚀 Siga os 3 passos acima e o fluxo estará ativo em 15 minutos!**

**⏰ Próximo passo:** Monitorar por 1 semana e ajustar mensagens conforme feedback.


