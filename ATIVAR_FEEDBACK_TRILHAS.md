# 🚀 Guia de Ativação - Fluxo de Feedback de Trilhas

**Data:** 11 de outubro de 2025  
**Status:** ✅ Pronto para ativação  
**Tempo estimado:** 30-60 minutos

---

## 📋 **RESUMO:**

Este guia ativa o fluxo de notificações automáticas quando eventos de trilhas acontecem, como:
- 🚀 Trilha iniciada
- ✅ Quiz disponível
- 🎉 Trilha concluída
- 🏆 Onboarding completo
- ⚠️ Alerta de atraso
- 📉 Alerta de nota baixa

---

## ✅ **PRÉ-REQUISITOS (JÁ IMPLEMENTADOS):**

- [x] Backend com endpoints de webhook funcionando
- [x] N8N Workflow "Navigator" configurado
- [x] Nó "Webhook Onboarding2" criado (mas desabilitado)
- [x] Nó "Switch Tipo Webhook" configurado
- [x] 6 nós "Send message" prontos
- [x] WhatsApp API configurada

---

## 🔧 **PASSO 1: HABILITAR O NÓ NO N8N**

### **No N8N:**

1. Abra o workflow "Navigator"
2. Localize o nó **"Webhook Onboarding2"**
3. **Clique com botão direito** no nó
4. Selecione **"Enable"** (Habilitar)
5. O nó ficará colorido (não mais cinza)

### **Verificar Webhook URL:**

1. Clique no nó "Webhook Onboarding2"
2. Clique em **"Test URL"** ou **"Production URL"**
3. Copie a URL (deve ser algo como):
   ```
   https://hndll.app.n8n.cloud/webhook/onboarding
   ```

---

## 🔧 **PASSO 2: CONFIGURAR VARIÁVEL DE AMBIENTE NO VERCEL**

### **No Vercel Dashboard:**

1. Acesse: https://vercel.com/haendelllopes-projects/navigator
2. Vá em **Settings** → **Environment Variables**
3. Adicione nova variável:
   - **Name:** `N8N_WEBHOOK_URL`
   - **Value:** `https://hndll.app.n8n.cloud/webhook/onboarding`
   - **Environment:** Production
4. Clique em **Save**
5. **Redeploy** o projeto (necessário para aplicar a variável)

---

## 🧪 **PASSO 3: TESTAR O FLUXO**

### **Teste 1: Trilha Iniciada**

Execute no terminal ou Postman:

```bash
curl -X POST https://navigator-gules.vercel.app/api/webhooks/trilha-iniciada?tenant=demo \
  -H "Content-Type: application/json" \
  -d '{
    "colaborador_id": "321e7f26-a5fc-470d-88d0-7d6bfde35b9b",
    "colaborador_nome": "Jose",
    "colaborador_email": "haendell@hotmail.com",
    "colaborador_phone": "+556299940476",
    "trilha_id": "279326bb-6051-4d43-ab38-431714a937ce",
    "trilha_nome": "Cultura Organizacional",
    "prazo_dias": 7,
    "data_limite": "2025-10-18T12:00:00.000Z"
  }'
```

**Resultado esperado:**
- ✅ N8N recebe o webhook
- ✅ Switch redireciona para "trilha_iniciada"
- ✅ WhatsApp envia mensagem para o colaborador
- ✅ Mensagem: "Olá Jose! 👋 Você tem uma nova trilha..."

---

### **Teste 2: Quiz Disponível**

```bash
curl -X POST https://navigator-gules.vercel.app/api/webhooks/quiz-disponivel?tenant=demo \
  -H "Content-Type: application/json" \
  -d '{
    "colaborador_id": "321e7f26-a5fc-470d-88d0-7d6bfde35b9b",
    "colaborador_nome": "Jose",
    "colaborador_email": "haendell@hotmail.com",
    "colaborador_phone": "+556299940476",
    "trilha_id": "279326bb-6051-4d43-ab38-431714a937ce",
    "trilha_nome": "Cultura Organizacional"
  }'
```

**Resultado esperado:**
- ✅ WhatsApp envia: "Parabéns Jose! 🎉 Você concluiu todos os conteúdos..."

---

### **Teste 3: Trilha Concluída**

```bash
curl -X POST https://navigator-gules.vercel.app/api/webhooks/trilha-concluida?tenant=demo \
  -H "Content-Type: application/json" \
  -d '{
    "colaborador_id": "321e7f26-a5fc-470d-88d0-7d6bfde35b9b",
    "colaborador_nome": "Jose",
    "colaborador_email": "haendell@hotmail.com",
    "colaborador_phone": "+556299940476",
    "trilha_id": "279326bb-6051-4d43-ab38-431714a937ce",
    "trilha_nome": "Cultura Organizacional",
    "nota": 85,
    "pontos": 85
  }'
```

**Resultado esperado:**
- ✅ WhatsApp envia: "Parabéns Jose! 🏆 Você concluiu a trilha..."

---

### **Teste 4: Onboarding Completo**

```bash
curl -X POST https://navigator-gules.vercel.app/api/webhooks/onboarding-completo?tenant=demo \
  -H "Content-Type: application/json" \
  -d '{
    "colaborador_id": "321e7f26-a5fc-470d-88d0-7d6bfde35b9b",
    "colaborador_nome": "Jose",
    "colaborador_email": "haendell@hotmail.com",
    "colaborador_phone": "+556299940476",
    "total_trilhas": 3,
    "pontos_totais": 255
  }'
```

**Resultado esperado:**
- ✅ WhatsApp envia: "Parabéns Jose! 🎊 Você concluiu TODO o onboarding..."

---

### **Teste 5: Alerta de Atraso**

```bash
curl -X POST https://navigator-gules.vercel.app/api/webhooks/alerta-atraso?tenant=demo \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_alerta": "atraso",
    "colaborador_nome": "Jose",
    "trilha_nome": "Cultura Organizacional",
    "dias_atraso": 3,
    "destinatario": {
      "email": "rh@empresa.com",
      "phone": "+556291708483"
    }
  }'
```

**Resultado esperado:**
- ✅ WhatsApp envia para RH: "⚠️ ALERTA DE ATRASO..."

---

### **Teste 6: Alerta de Nota Baixa**

```bash
curl -X POST https://navigator-gules.vercel.app/api/webhooks/alerta-nota-baixa?tenant=demo \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_alerta": "nota_baixa",
    "colaborador_nome": "Jose",
    "trilha_nome": "Cultura Organizacional",
    "nota": 35,
    "tentativa": 2,
    "destinatario": {
      "email": "rh@empresa.com",
      "phone": "+556291708483"
    }
  }'
```

**Resultado esperado:**
- ✅ WhatsApp envia para RH: "📉 ALERTA DE DESEMPENHO..."

---

## 🔍 **PASSO 4: VERIFICAR LOGS NO N8N**

### **No N8N:**

1. Vá em **"Executions"** (no menu lateral)
2. Verifique as execuções recentes
3. Clique em uma execução para ver detalhes
4. Verifique:
   - ✅ Webhook recebido
   - ✅ Switch funcionou
   - ✅ WhatsApp enviado
   - ✅ Sem erros

### **Possíveis Erros e Soluções:**

| **Erro** | **Causa** | **Solução** |
|----------|-----------|-------------|
| Webhook 404 | Nó desabilitado | Habilitar nó no N8N |
| WhatsApp falha | Credencial inválida | Revalidar WhatsApp API |
| Switch não funciona | Tipo errado | Verificar campo `body.tipo` |
| Mensagem não chega | Phone incorreto | Validar formato +55... |

---

## 📊 **PASSO 5: INTEGRAÇÃO AUTOMÁTICA**

### **Eventos Disparados Automaticamente pelo Backend:**

✅ **Já implementado:**
- `POST /api/colaborador/trilhas/:id/iniciar` → Dispara `trilha_iniciada`
- `POST /api/quiz/submeter` (aprovado) → Dispara `trilha_concluida`
- `POST /api/quiz/submeter` (reprovado <40%) → Dispara `alerta_nota_baixa`

⏳ **Faltam implementar:**
- [ ] Disparar `quiz_disponivel` quando todos os conteúdos forem aceitos
- [ ] Disparar `onboarding_completo` quando todas as trilhas forem concluídas
- [ ] Cron job para `alerta_atraso` (verificação diária)

---

## 🔧 **PASSO 6: IMPLEMENTAR EVENTOS FALTANTES**

### **1. Quiz Disponível**

Adicionar no endpoint `POST /api/colaborador/conteudos/:id/aceitar`:

```javascript
// Após aceitar conteúdo, verificar se todos foram aceitos
const todosAceitosResult = await query(`
  SELECT COUNT(*) as total, COUNT(ct.id) as aceitos
  FROM conteudos c
  LEFT JOIN colaborador_trilha_conteudo ct ON ct.conteudo_id = c.id AND ct.colaborador_trilha_id = $1
  WHERE c.trilha_id = $2
`, [colaboradorTrilhaId, trilhaId]);

if (todosAceitosResult.rows[0].total === todosAceitosResult.rows[0].aceitos) {
  // Disparar webhook quiz_disponivel
  await fetch(`${process.env.N8N_WEBHOOK_URL}?tenant=${req.tenantSubdomain}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      tipo: 'quiz_disponivel',
      colaborador: { /* dados */ },
      trilha: { /* dados */ },
      mensagem_sugerida: `Parabéns ${nome}! 🎉\n\nVocê concluiu todos os conteúdos...`
    })
  });
}
```

---

### **2. Onboarding Completo**

Já implementado em `POST /api/quiz/submeter` (linhas 338-365):

```javascript
// Verificar se todas as trilhas foram concluídas
if (stats.total_trilhas === parseInt(stats.trilhas_concluidas)) {
  // Disparar webhook onboarding-completo
  await fetch(`${req.protocol}://${req.get('host')}/api/webhooks/onboarding-completo?tenant=${req.tenantSubdomain}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      colaborador_id: tentativa.colaborador_id,
      colaborador_nome: dados.name,
      colaborador_email: dados.email,
      colaborador_phone: dados.phone,
      total_trilhas: stats.total_trilhas,
      pontos_totais: pontosTotais
    })
  });
}
```

✅ **Status:** JÁ IMPLEMENTADO

---

### **3. Alerta de Atraso (Cron Job)**

Criar endpoint de verificação diária:

**Arquivo:** `src/routes/admin.js`

```javascript
router.post('/verificar-atrasos', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    
    // Buscar trilhas atrasadas
    const atrasadas = await query(`
      SELECT 
        u.id as colaborador_id,
        u.name as colaborador_nome,
        u.email as colaborador_email,
        u.phone as colaborador_phone,
        t.id as trilha_id,
        t.nome as trilha_nome,
        ct.data_limite,
        EXTRACT(DAY FROM (NOW() - ct.data_limite)) as dias_atraso
      FROM colaborador_trilhas ct
      JOIN users u ON u.id = ct.colaborador_id
      JOIN trilhas t ON t.id = ct.trilha_id
      WHERE ct.status = 'em_andamento'
        AND ct.data_limite < NOW()
        AND u.tenant_id = $1
    `, [tenant.id]);
    
    // Disparar webhook para cada trilha atrasada
    for (const trilha of atrasadas.rows) {
      // Buscar gestor/RH do tenant
      const gestorResult = await query(`
        SELECT phone, email FROM users 
        WHERE tenant_id = $1 AND role = 'admin' 
        LIMIT 1
      `, [tenant.id]);
      
      if (gestorResult.rows.length > 0) {
        const gestor = gestorResult.rows[0];
        
        await fetch(`${process.env.N8N_WEBHOOK_URL}?tenant=${req.tenantSubdomain}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            tipo: 'alerta_atraso',
            tipo_alerta: 'atraso',
            colaborador_nome: trilha.colaborador_nome,
            trilha_nome: trilha.trilha_nome,
            dias_atraso: trilha.dias_atraso,
            destinatario: {
              email: gestor.email,
              phone: gestor.phone
            },
            mensagem_sugerida: `⚠️ ALERTA DE ATRASO\n\nColaborador: ${trilha.colaborador_nome}\nTrilha: ${trilha.trilha_nome}\nAtraso: ${trilha.dias_atraso} dias`
          })
        });
      }
    }
    
    res.json({ 
      message: `${atrasadas.rows.length} alertas enviados`,
      alertas: atrasadas.rows 
    });
  } catch (error) {
    console.error('Erro ao verificar atrasos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
```

---

## ⏰ **PASSO 4: CRIAR CRON JOB NO N8N**

### **Criar Novo Workflow:**

1. No N8N, crie um novo workflow: **"Verificar Atrasos - Diário"**
2. Adicione nó **"Schedule Trigger"**:
   - **Trigger Times:** Cron
   - **Cron Expression:** `0 9 * * *` (todo dia às 9h)
3. Adicione nó **"HTTP Request"**:
   - **Method:** POST
   - **URL:** `https://navigator-gules.vercel.app/api/admin/verificar-atrasos?tenant=demo`
   - **Headers:** `Content-Type: application/json`
4. **Ative o workflow**

---

## 🎯 **PASSO 5: PERSONALIZAR MENSAGENS (OPCIONAL)**

### **Editar Mensagens no N8N:**

Você pode personalizar as mensagens em cada nó "Send message1-6":

**Exemplo - Send message1 (Trilha Iniciada):**

```
Olá {{ $json.body.colaborador.nome }}! 👋

Você tem uma nova trilha de onboarding: *{{ $json.body.trilha.nome }}*

⏰ Prazo: {{ $json.body.trilha.prazo_dias }} dias (até {{ $json.body.trilha.data_limite }})

Acesse aqui: navigator-gules.vercel.app/colaborador-trilhas?colaborador_id={{ $json.body.colaborador.id }}

Bons estudos! 📚
```

---

## ✅ **CHECKLIST DE ATIVAÇÃO:**

### **N8N:**
- [ ] Habilitar nó "Webhook Onboarding2"
- [ ] Copiar Webhook URL
- [ ] Testar webhook manualmente
- [ ] Verificar Switch está funcionando
- [ ] Testar cada tipo de mensagem (1-6)

### **Vercel:**
- [ ] Adicionar variável `N8N_WEBHOOK_URL`
- [ ] Redeploy do projeto
- [ ] Verificar variável está ativa

### **Backend:**
- [ ] Implementar endpoint `/api/admin/verificar-atrasos`
- [ ] Adicionar disparo de `quiz_disponivel`
- [ ] Testar todos os webhooks

### **N8N - Cron Job:**
- [ ] Criar workflow "Verificar Atrasos - Diário"
- [ ] Configurar Schedule Trigger
- [ ] Ativar workflow

### **Testes End-to-End:**
- [ ] Criar colaborador de teste
- [ ] Iniciar trilha → Verificar WhatsApp
- [ ] Aceitar conteúdos → Verificar quiz disponível
- [ ] Fazer quiz → Verificar conclusão
- [ ] Esperar atraso → Verificar alerta RH

---

## 📊 **MONITORAMENTO:**

### **N8N Executions:**
- Acessar: https://hndll.app.n8n.cloud/executions
- Filtrar por workflow "Navigator"
- Verificar status: Success/Error
- Ver logs detalhados

### **Backend Logs:**
- Vercel Dashboard → Logs
- Filtrar por "webhook"
- Verificar requisições POST
- Verificar erros 404/500

---

## 🎉 **RESULTADO ESPERADO:**

### **Fluxo Completo Ativado:**

```
1. Colaborador inicia trilha
   → Backend dispara webhook
   → N8N recebe e processa
   → WhatsApp envia: "Olá! Você tem uma nova trilha..."

2. Colaborador aceita todos os conteúdos
   → Backend dispara webhook
   → N8N envia: "Parabéns! Quiz disponível..."

3. Colaborador faz quiz (aprovado)
   → Backend dispara webhook
   → N8N envia: "Parabéns! Trilha concluída..."

4. Colaborador conclui todas as trilhas
   → Backend dispara webhook
   → N8N envia: "Parabéns! Onboarding completo..."

5. Trilha está atrasada
   → Cron job verifica diariamente
   → N8N envia alerta para RH

6. Colaborador reprova quiz
   → Backend dispara webhook
   → N8N envia alerta para RH
```

---

## 🚨 **TROUBLESHOOTING:**

### **Problema: Mensagem não chega no WhatsApp**

**Verificar:**
1. Phone ID está correto? `854548744399899`
2. Telefone está no formato correto? `+556299940476`
3. Credencial WhatsApp está válida?
4. Quota de mensagens não esgotou?

**Solução:**
- Revalidar credencial no N8N
- Verificar logs do Meta Business

---

### **Problema: N8N não recebe webhook**

**Verificar:**
1. Variável `N8N_WEBHOOK_URL` está configurada?
2. URL está correta?
3. Nó está habilitado?
4. Workflow está ativo?

**Solução:**
- Testar webhook manualmente com curl
- Verificar logs do Vercel
- Verificar Executions no N8N

---

## 📝 **PRÓXIMOS PASSOS APÓS ATIVAÇÃO:**

1. **Monitorar por 1 semana** (verificar estabilidade)
2. **Ajustar mensagens** conforme feedback dos usuários
3. **Adicionar mais eventos** se necessário
4. **Criar dashboard** de métricas de notificações
5. **Implementar retry automático** para falhas

---

## 🎊 **BENEFÍCIOS DA ATIVAÇÃO:**

- ✅ **Engajamento:** Colaboradores recebem lembretes automáticos
- ✅ **RH Informado:** Alertas de atrasos e notas baixas
- ✅ **Automação Total:** Sem necessidade de enviar mensagens manualmente
- ✅ **Experiência Melhor:** Notificações em tempo real
- ✅ **Redução de Churn:** Menos colaboradores esquecidos

---

**🚀 Pronto para ativar! Siga os passos acima e o fluxo estará operacional.**


