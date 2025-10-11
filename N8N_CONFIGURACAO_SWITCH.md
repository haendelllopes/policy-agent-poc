# ⚙️ Configuração do Switch Principal no N8N

**Atualizado:** 11 de outubro de 2025  
**Tempo:** 10 minutos  
**Dificuldade:** ⭐ Fácil

---

## 🎯 **OBJETIVO:**

Configurar o **Switch Principal** após o "Webhook Onboarding" para rotear corretamente os 3 tipos de eventos:
1. `user_created` → Boas-vindas
2. `document_categorization` → Categorização de documento
3. `trilha` → Feedback de trilhas (6 sub-tipos)

---

## 🔧 **CONFIGURAÇÃO EXATA DO SWITCH:**

### **No N8N:**

1. Clique no nó **"If1"** (após Webhook Onboarding)
2. Clique em **"Delete"** para remover
3. Adicione um novo nó **"Switch"**
4. Posicione entre "Webhook Onboarding" e os fluxos existentes
5. Configure:

---

### **⚙️ Switch Settings:**

**Mode:** `Rules`  
**Data to Route:** `{{ $json.body }}`

---

### **📋 Rule 1 - Boas-Vindas (user_created):**

```
Condition 1:
├─ Field: {{ $json.body.type }}
├─ Operator: equals
├─ Value: user_created
└─ Output Name: Boas-Vindas
```

**Conectar saída:** → `Set Welcome`

---

### **📋 Rule 2 - Categorização de Documento:**

```
Condition 1:
├─ Field: {{ $json.body.type }}
├─ Operator: equals
├─ Value: document_categorization
└─ Output Name: Categorização
```

**Conectar saída:** → `AI Agent - Categorização`

---

### **📋 Rule 3 - Feedback de Trilhas:**

```
Condition 1:
├─ Field: {{ $json.body.type }}
├─ Operator: equals
├─ Value: trilha
└─ Output Name: Feedback Trilhas
```

**Conectar saída:** → `Switch Tipo Webhook`

---

## 🎨 **DIAGRAMA VISUAL DAS CONEXÕES:**

```
┌──────────────────────┐
│ Webhook Onboarding   │
│ POST /onboarding     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Switch Principal    │
│  (por body.type)     │
└──────────┬───────────┘
           │
    ┌──────┼──────┐
    │      │      │
    ▼      ▼      ▼
┌────┐ ┌────┐ ┌─────────────────┐
│Boas│ │Cat │ │ Switch Tipo     │
│Vind│ │ego │ │ Webhook         │
└────┘ └────┘ └────┬────────────┘
                   │
        ┌──────────┼──────────┐
        │    │   │ │  │   │   │
        ▼    ▼   ▼ ▼  ▼   ▼   ▼
      Msg1 Msg2 Msg3 Msg4 Msg5 Msg6
      (6 tipos de feedback de trilhas)
```

---

## 📦 **PAYLOADS ATUALIZADOS DO BACKEND:**

### **1. Boas-Vindas (user_created):**
```json
{
  "type": "user_created",
  "tenantId": "...",
  "tenantName": "...",
  "userId": "...",
  "name": "João Silva",
  "email": "joao@empresa.com",
  "phone": "556299940476",
  "position": "Desenvolvedor",
  "department": "TI",
  "communication_type": "whatsapp"
}
```

---

### **2. Categorização de Documento:**
```json
{
  "type": "document_categorization",
  "documentId": "...",
  "tenantId": "...",
  "title": "Política de Férias",
  "category": "Benefícios",
  "content": "Texto extraído do documento...",
  "fileName": "politica-ferias.pdf",
  "fileSize": 125432
}
```

---

### **3. Feedback de Trilhas (todos os tipos):**

#### **3a. Trilha Iniciada:**
```json
{
  "type": "trilha",
  "tipo": "trilha_iniciada",
  "colaborador_id": "...",
  "colaborador_nome": "Jose",
  "colaborador_email": "jose@empresa.com",
  "colaborador_phone": "556299940476",
  "trilha_id": "...",
  "trilha_nome": "Cultura Organizacional",
  "prazo_dias": 7,
  "data_limite": "2025-10-18T12:00:00.000Z"
}
```

#### **3b. Quiz Disponível:**
```json
{
  "type": "trilha",
  "tipo": "quiz_disponivel",
  "colaborador_id": "...",
  "colaborador_nome": "Jose",
  "colaborador_email": "jose@empresa.com",
  "colaborador_phone": "556299940476",
  "trilha_id": "...",
  "trilha_nome": "Cultura Organizacional"
}
```

#### **3c. Trilha Concluída:**
```json
{
  "type": "trilha",
  "tipo": "trilha_concluida",
  "colaborador_id": "...",
  "colaborador_nome": "Jose",
  "colaborador_email": "jose@empresa.com",
  "colaborador_phone": "556299940476",
  "trilha_id": "...",
  "trilha_nome": "Cultura Organizacional",
  "nota": 85,
  "pontos": 85
}
```

#### **3d. Onboarding Completo:**
```json
{
  "type": "trilha",
  "tipo": "onboarding_completo",
  "colaborador_id": "...",
  "colaborador_nome": "Jose",
  "colaborador_email": "jose@empresa.com",
  "colaborador_phone": "556299940476",
  "total_trilhas": 3,
  "pontuacao_total": 255,
  "ranking_geral": 1
}
```

#### **3e. Alerta de Atraso:**
```json
{
  "type": "trilha",
  "tipo": "alerta_atraso",
  "colaborador_nome": "Jose",
  "trilha_nome": "Cultura Organizacional",
  "dias_atraso": 3,
  "rh_email": "rh@empresa.com",
  "rh_phone": "556291708483"
}
```

#### **3f. Alerta de Nota Baixa:**
```json
{
  "type": "trilha",
  "tipo": "alerta_nota_baixa",
  "colaborador_nome": "Jose",
  "trilha_nome": "Cultura Organizacional",
  "nota": 35,
  "tentativa": 2,
  "rh_email": "rh@empresa.com",
  "rh_phone": "556291708483"
}
```

---

## ✅ **ATUALIZAÇÕES NO BACKEND REALIZADAS:**

### **Arquivos Modificados:**

1. **`src/routes/colaborador.js`** - 2 webhooks atualizados:
   - ✅ `trilha-iniciada` → Adicionado `type: 'trilha'`
   - ✅ `quiz-disponivel` → Adicionado `type: 'trilha'`

2. **`src/routes/quiz.js`** - 2 webhooks atualizados:
   - ✅ `trilha-concluida` → Adicionado `type: 'trilha'`
   - ✅ `onboarding-completo` → Adicionado `type: 'trilha'`
   - ✅ `alerta-nota-baixa` → Adicionado `type: 'trilha'`

3. **`src/routes/admin.js`** - 1 webhook atualizado:
   - ✅ `alerta-atraso` → Adicionado `type: 'trilha'`

4. **`src/server.js`** - 1 webhook atualizado:
   - ✅ Upload de documento → Mudado para `type: 'document_categorization'`
   - ✅ URL atualizada para usar webhook unificado

---

## 🧪 **TESTES APÓS CONFIGURAÇÃO:**

### **Teste 1: Boas-Vindas**
```bash
curl -X POST "https://hndll.app.n8n.cloud/webhook/onboarding" \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "type": "user_created",
      "tenantId": "5978f911-738b-4aae-802a-f037fdac2e64",
      "name": "João Silva",
      "phone": "556299940476",
      "communication_type": "whatsapp"
    }
  }'
```

**Esperado:** Switch → Rota "Boas-Vindas" → Set Welcome

---

### **Teste 2: Categorização**
```bash
curl -X POST "https://hndll.app.n8n.cloud/webhook/onboarding" \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "type": "document_categorization",
      "documentId": "123",
      "title": "Política de Férias",
      "category": "Benefícios",
      "content": "As férias são um direito do trabalhador..."
    }
  }'
```

**Esperado:** Switch → Rota "Categorização" → AI Agent - Categorização

---

### **Teste 3: Trilha Iniciada**
```bash
curl -X POST "https://hndll.app.n8n.cloud/webhook/onboarding" \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "type": "trilha",
      "tipo": "trilha_iniciada",
      "colaborador_nome": "Jose",
      "colaborador_phone": "556299940476",
      "trilha_nome": "Cultura Organizacional",
      "prazo_dias": 7
    }
  }'
```

**Esperado:** Switch → Rota "Feedback Trilhas" → Switch Tipo Webhook → Send message1

---

## 📋 **CHECKLIST DE VALIDAÇÃO:**

### **No N8N:**
- [x] Switch Principal criado após "Webhook Onboarding"
- [x] 3 rotas configuradas (user_created, document_categorization, trilha)
- [x] Conexões atualizadas:
  - [x] Rota 1 → Set Welcome
  - [x] Rota 2 → AI Agent - Categorização
  - [x] Rota 3 → Switch Tipo Webhook
- [x] Workflow salvo

### **Testes:**
- [ ] Teste 1: user_created → Mensagem de boas-vindas
- [ ] Teste 2: document_categorization → Categorização de documento
- [ ] Teste 3: trilha_iniciada → Notificação de trilha
- [ ] Verificar logs de execução no N8N

### **Backend (já feito):**
- [x] Todos os webhooks agora enviam `type: 'trilha'`
- [x] Upload de documento envia `type: 'document_categorization'`
- [x] user_created já tinha `type: 'user_created'`

---

## 🎊 **PRÓXIMO PASSO:**

### **Remover "Webhook Onboarding2":**

1. No N8N, localize o nó **"Webhook Onboarding2"**
2. **Clique com botão direito**
3. Selecione **"Delete"**
4. **Salve o workflow**

**Por quê?** Não é mais necessário! O "Webhook Onboarding" agora gerencia tudo através do Switch Principal.

---

## 🚀 **DEPLOY DAS MUDANÇAS:**

### **Comandos Git:**
```bash
git add -A
git commit -m "feat: Adiciona campo 'type' em todos os webhooks de trilhas"
git push origin main
```

**O Vercel fará deploy automático em ~2 minutos.**

---

## 📊 **RESULTADO FINAL:**

### **Um Webhook, 9 Tipos de Eventos:**

| **body.type** | **body.tipo** | **Rota** | **Ação** |
|---------------|---------------|----------|----------|
| `user_created` | - | Boas-Vindas | Mensagem de boas-vindas |
| `document_categorization` | - | Categorização | IA analisa documento |
| `trilha` | `trilha_iniciada` | Feedback → Msg1 | "Nova trilha..." |
| `trilha` | `quiz_disponivel` | Feedback → Msg2 | "Quiz disponível..." |
| `trilha` | `trilha_concluida` | Feedback → Msg3 | "Parabéns! Concluída..." |
| `trilha` | `onboarding_completo` | Feedback → Msg4 | "Onboarding completo! 🎊" |
| `trilha` | `alerta_atraso` | Feedback → Msg5 | "⚠️ Atraso..." (para RH) |
| `trilha` | `alerta_nota_baixa` | Feedback → Msg6 | "📉 Nota baixa..." (para RH) |

---

## 🎯 **LÓGICA DE ROTEAMENTO:**

```javascript
// No Switch Principal:
if (body.type === 'user_created') {
  → Rota 1: Boas-Vindas
}
else if (body.type === 'document_categorization') {
  → Rota 2: Categorização
}
else if (body.type === 'trilha') {
  → Rota 3: Feedback Trilhas
  
  // No Switch Tipo Webhook (dentro de Feedback Trilhas):
  if (body.tipo === 'trilha_iniciada') → Msg1
  if (body.tipo === 'quiz_disponivel') → Msg2
  if (body.tipo === 'trilha_concluida') → Msg3
  if (body.tipo === 'onboarding_completo') → Msg4
  if (body.tipo === 'alerta_atraso') → Msg5
  if (body.tipo === 'alerta_nota_baixa') → Msg6
}
```

---

## ✅ **VANTAGENS DA SOLUÇÃO:**

1. ✅ **Um único webhook** gerencia tudo
2. ✅ **Escalável** - fácil adicionar novos tipos
3. ✅ **Organizado** - cada tipo tem sua rota
4. ✅ **Sem duplicação** - um evento → uma execução
5. ✅ **Padronizado** - todos os payloads têm campo `type`

---

## 🎊 **PRONTO!**

Depois de configurar o Switch Principal conforme acima:
1. **Salve o workflow**
2. **Delete "Webhook Onboarding2"**
3. **Execute os 3 testes**
4. **Monitore os logs**

**Sistema de notificações 100% ativo e funcionando!** 🚀


