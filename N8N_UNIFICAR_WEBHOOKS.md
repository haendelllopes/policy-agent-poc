# 🔄 Unificar Webhooks - Solução Integrada

**Problema Identificado:** Temos 2 nós de webhook recebendo no mesmo endpoint, causando conflito.

**Solução:** Unificar em um único webhook com switch inteligente.

---

## 🎯 **ARQUITETURA ATUAL (PROBLEMA):**

```
Webhook Onboarding (ATIVO)
    ↓
If1 (type === 'user_created'?)
    ↓ TRUE
Boas-vindas
    ↓ FALSE
Categorização de documento

Webhook Onboarding2 (DESABILITADO)
    ↓
Switch Tipo Webhook (6 rotas)
    ↓
Feedback de trilhas
```

**Problema:** Ambos recebem no mesmo endpoint `/webhook/onboarding`

---

## ✅ **ARQUITETURA PROPOSTA (SOLUÇÃO):**

```
Webhook Onboarding (ÚNICO)
    ↓
Switch Principal (por campo 'type' ou 'tipo')
    ↓
├─ type: 'user_created' → Boas-vindas
├─ type: 'document_categorization' → Categorização
└─ tipo: 'trilha_*' → Feedback de Trilhas (6 sub-rotas)
```

---

## 🔧 **IMPLEMENTAÇÃO NO N8N:**

### **PASSO 1: Modificar "If1" para "Switch Principal"**

1. **Deletar o nó "If1"** (ou renomear para "Switch Principal")
2. **Adicionar nó "Switch"** após "Webhook Onboarding"
3. **Configurar 3 rotas:**

#### **Rota 1: Boas-Vindas (user_created)**
- **Condition:** `{{ $json.body.type }}` equals `user_created`
- **Output:** Rename to "Boas-Vindas"
- **Conectar:** → Set Welcome

#### **Rota 2: Categorização de Documento**
- **Condition:** `{{ $json.body.type }}` equals `document_categorization`
- **Output:** Rename to "Categorização"
- **Conectar:** → AI Agent - Categorização

#### **Rota 3: Feedback de Trilhas**
- **Condition:** `{{ $json.body.tipo }}` regex `^(trilha_iniciada|quiz_disponivel|trilha_concluida|onboarding_completo|alerta_atraso|alerta_nota_baixa)$`
- **Output:** Rename to "Feedback Trilhas"
- **Conectar:** → Switch Tipo Webhook (já existente)

---

### **PASSO 2: Remover "Webhook Onboarding2"**

1. **Deletar o nó "Webhook Onboarding2"** (não é mais necessário)
2. **Conectar "Switch Principal"** → "Switch Tipo Webhook" (Rota 3)

---

### **PASSO 3: Atualizar Conexões**

#### **Antes:**
```
Webhook Onboarding → If1 → Set Welcome / AI Agent - Categorização
Webhook Onboarding2 → Switch Tipo Webhook → Send messages
```

#### **Depois:**
```
Webhook Onboarding → Switch Principal
    ↓
    ├─ Boas-Vindas → Set Welcome → ...
    ├─ Categorização → AI Agent - Categorização → ...
    └─ Feedback Trilhas → Switch Tipo Webhook → Send messages
```

---

## 📊 **DIAGRAMA VISUAL:**

```
┌─────────────────────────────┐
│   Webhook Onboarding        │
│   POST /webhook/onboarding  │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   Switch Principal          │
│   (type ou tipo)            │
└─────────────┬───────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
┌───────┐ ┌────────┐ ┌──────────────┐
│ Boas  │ │Catego- │ │   Switch     │
│Vindas │ │rização │ │ Tipo Webhook │
└───────┘ └────────┘ └──────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │    │    │   │   │    │    │
              ▼    ▼    ▼   ▼   ▼    ▼    ▼
           Msg1 Msg2 Msg3 Msg4 Msg5 Msg6
           (6 tipos de feedback de trilhas)
```

---

## 🎨 **CONFIGURAÇÃO DETALHADA DO SWITCH PRINCIPAL:**

### **No N8N:**

1. Adicione nó **"Switch"** após "Webhook Onboarding"
2. **Mode:** Rules
3. **Routing Rules:**

#### **Rule 1 - Boas-Vindas:**
```json
Condition 1:
- Left Value: {{ $json.body.type }}
- Operator: equals
- Right Value: user_created
- Output Name: Boas-Vindas
```

#### **Rule 2 - Categorização:**
```json
Condition 1:
- Left Value: {{ $json.body.type }}
- Operator: equals
- Right Value: document_categorization
- Output Name: Categorização
```

#### **Rule 3 - Feedback Trilhas:**
```json
Condition 1:
- Left Value: {{ $json.body.tipo }}
- Operator: regex
- Right Value: ^(trilha_iniciada|quiz_disponivel|trilha_concluida|onboarding_completo|alerta_atraso|alerta_nota_baixa)$
- Output Name: Feedback Trilhas
```

---

## ✅ **BENEFÍCIOS DA UNIFICAÇÃO:**

1. ✅ **Um único webhook** gerencia tudo
2. ✅ **Mais organizado** e fácil de entender
3. ✅ **Escalável** - fácil adicionar novos tipos
4. ✅ **Sem conflitos** entre webhooks
5. ✅ **Manutenção simplificada**

---

## 🧪 **TESTES APÓS UNIFICAÇÃO:**

### **Teste 1: Boas-Vindas (user_created)**
```bash
curl -X POST "https://hndll.app.n8n.cloud/webhook/onboarding" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user_created",
    "tenantId": "5978f911-738b-4aae-802a-f037fdac2e64",
    "tenantName": "Demonstração",
    "name": "João Silva",
    "phone": "556299940476",
    "communication_type": "whatsapp"
  }'
```

**Esperado:** Switch redireciona para "Boas-Vindas" → Mensagem WhatsApp

---

### **Teste 2: Trilha Iniciada**
```bash
curl -X POST "https://hndll.app.n8n.cloud/webhook/onboarding" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-10-11T20:00:00.000Z",
    "tipo": "trilha_iniciada",
    "colaborador": {
      "nome": "Jose",
      "phone": "556299940476"
    },
    "trilha": {
      "nome": "Cultura Organizacional",
      "prazo_dias": 7
    },
    "mensagem_sugerida": "Olá Jose! Nova trilha disponível..."
  }'
```

**Esperado:** Switch redireciona para "Feedback Trilhas" → Switch Tipo → Send message1

---

### **Teste 3: Categorização de Documento**
```bash
curl -X POST "https://hndll.app.n8n.cloud/webhook/onboarding" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "document_categorization",
    "documentId": "123",
    "title": "Política de Férias",
    "category": "Benefícios",
    "content": "Conteúdo do documento..."
  }'
```

**Esperado:** Switch redireciona para "Categorização" → AI Agent - Categorização

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO:**

- [ ] **Backup do Workflow:**
  - [ ] Exportar workflow atual como JSON
  - [ ] Salvar localmente (segurança)

- [ ] **Modificar Switch:**
  - [ ] Adicionar/modificar nó Switch após Webhook Onboarding
  - [ ] Configurar 3 rotas (Boas-Vindas, Categorização, Feedback Trilhas)
  - [ ] Testar cada condição

- [ ] **Atualizar Conexões:**
  - [ ] Conectar Rota 1 → Set Welcome
  - [ ] Conectar Rota 2 → AI Agent - Categorização
  - [ ] Conectar Rota 3 → Switch Tipo Webhook

- [ ] **Remover Webhook Duplicado:**
  - [ ] Deletar nó "Webhook Onboarding2"
  - [ ] Limpar conexões órfãs

- [ ] **Salvar e Testar:**
  - [ ] Salvar workflow
  - [ ] Executar 3 testes (acima)
  - [ ] Verificar logs de execução

---

## 🎯 **ESTRUTURA FINAL DOS PAYLOADS:**

### **Para Backend enviar corretamente:**

#### **Boas-Vindas:**
```json
{
  "type": "user_created",     ← Campo 'type' (singular)
  "tenantId": "...",
  "name": "...",
  "phone": "..."
}
```

#### **Feedback de Trilhas:**
```json
{
  "tipo": "trilha_iniciada",  ← Campo 'tipo' (com 'o')
  "timestamp": "...",
  "colaborador": { ... },
  "trilha": { ... }
}
```

#### **Categorização:**
```json
{
  "type": "document_categorization",
  "documentId": "...",
  "title": "...",
  "content": "..."
}
```

**Importante:** Backend já está enviando corretamente! Só precisa ajustar o N8N.

---

## 🚀 **RESULTADO FINAL:**

### **Um único webhook gerencia 9 tipos de eventos:**

```
✅ 1. user_created (boas-vindas)
✅ 2. document_categorization (IA)
✅ 3. trilha_iniciada
✅ 4. quiz_disponivel
✅ 5. trilha_concluida
✅ 6. onboarding_completo
✅ 7. alerta_atraso
✅ 8. alerta_nota_baixa
```

**Todos no mesmo endpoint, gerenciados por switches inteligentes!**

---

**🎊 Fluxo unificado, organizado e escalável!**




