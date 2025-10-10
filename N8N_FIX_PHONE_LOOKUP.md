# 🔧 FIX: N8N - Usar Phone em vez de UUID

**Problema:** N8N estava enviando o número de telefone do WhatsApp como `userId`, mas a API esperava UUID.

**Solução:** API agora aceita `phone` como alternativa ao `userId`!

---

## ✅ CORREÇÃO APLICADA NA API

A API `/api/analise-sentimento` agora aceita:
- ✅ `userId` (UUID) - para quando você já tem o ID do usuário
- ✅ `phone` (string) - para quando você tem só o telefone do WhatsApp

Se enviar `phone`, a API faz lookup automático do `user_id` no banco!

---

## 🔧 COMO CORRIGIR NO N8N

### Opção 1: Alterar o Nó "Analisar Sentimento" ⭐ RECOMENDADO

No seu nó **"1️⃣ Analisar Sentimento"** (ou "Analyze Sentiment (Gemini)"), altere o JSON Body de:

#### ❌ ANTES (ERRADO):
```json
{
  "message": "{{ $json.message }}",
  "userId": "{{ $json.userId }}",
  "context": "Mensagem via WhatsApp durante onboarding",
  "tenantId": "{{ $json.tenantId }}",
  "momentoOnboarding": "conversa_agente",
  "diaOnboarding": 1
}
```

#### ✅ DEPOIS (CORRETO):
```json
{
  "message": "{{ $json.message }}",
  "phone": "{{ $json.userId }}",
  "context": "Mensagem via WhatsApp durante onboarding",
  "tenantId": "{{ $json.tenantId }}",
  "momentoOnboarding": "conversa_agente",
  "diaOnboarding": 1
}
```

**O que mudou:** `"userId"` → `"phone"`

---

### Opção 2: Criar Lookup de User ID (Avançado)

Se preferir manter a estrutura original, crie um nó de lookup antes:

**Novo Nó: "Buscar User ID"**
```json
{
  "name": "Buscar User ID por Phone",
  "type": "n8n-nodes-base.httpRequest",
  "method": "POST",
  "url": "{{ $('BACKEND_URL').json.url }}/api/users/lookup-by-phone",
  "body": {
    "phone": "{{ $json.from }}",
    "tenantId": "{{ $json.tenantId }}"
  }
}
```

Mas isso requer criar o endpoint `/api/users/lookup-by-phone`.

---

## 📝 ATUALIZAÇÃO DO WORKFLOW

### No seu workflow atual:

1. **Localize o nó "Normalize Message Data"**
   - Ele está pegando `userId: "={{ $json.messages[0].from }}"`
   - Isso está correto! O `from` é o phone do WhatsApp

2. **Localize o nó "Analyze Sentiment (Gemini)"**
   - URL: `http://localhost:3000/api/analise-sentimento`
   - Altere o JSON Body conforme acima (use `phone` em vez de `userId`)

3. **Salvar e Testar!**

---

## 🧪 TESTE

### 1. No N8N:
Execute o workflow manualmente com uma mensagem de teste

### 2. Verifique os logs:
Deve aparecer:
```
📞 Lookup: Phone 556291708483 → User ID a1b2c3d4-e5f6-7890-abcd-ef1234567890
✅ Análise realizada com OpenAI
```

### 3. Resposta esperada:
```json
{
  "success": true,
  "sentiment": {
    "sentimento": "positivo",
    "intensidade": 0.85,
    "fatores_detectados": {...}
  },
  "record": {...},
  "timestamp": "2025-10-10T20:30:00.000Z"
}
```

---

## ⚠️ IMPORTANTE: USUÁRIO PRECISA EXISTIR

Para o lookup funcionar, o usuário com esse telefone **precisa existir** na tabela `users`.

### Verificar se existe:
```sql
SELECT id, name, phone 
FROM users 
WHERE phone LIKE '%556291708483%';
```

### Se não existir, criar:
```sql
INSERT INTO users (
  id, 
  tenant_id, 
  name, 
  email,
  phone,
  position,
  role,
  department,
  created_at
) VALUES (
  gen_random_uuid(),
  '5978f911-738b-4aae-802a-f037fdac2e64',
  'Usuário WhatsApp',
  'whatsapp@flowly.com',
  '+556291708483',
  'Colaborador',
  'colaborador',
  'Geral',
  NOW()
);
```

---

## 📊 NORMALIZAÇÃO DE TELEFONE

A API normaliza o telefone automaticamente:
- `556291708483` → busca `%556291708483%`
- `+55 62 99170-8483` → remove não-numéricos → busca `%5562991708483%`
- `(62) 99170-8483` → remove não-numéricos → busca `%62991708483%`

---

## ✅ CHECKLIST DE CORREÇÃO

- [ ] Alterar JSON Body do nó "Analyze Sentiment" (usar `phone`)
- [ ] Salvar workflow no N8N
- [ ] Verificar se usuário existe no banco
- [ ] Testar com mensagem de WhatsApp real
- [ ] Verificar logs do servidor
- [ ] Confirmar que sentimento foi salvo

---

## 🚀 DEPLOY DA CORREÇÃO

Após testar localmente, fazer deploy:

```bash
git add src/routes/analise-sentimento.js
git commit -m "fix: Aceitar phone como alternativa a userId na análise de sentimento"
git push origin main
```

Aguardar deploy no Vercel (~2 min) e atualizar a URL no N8N:
```
http://localhost:3000 → https://seu-projeto.vercel.app
```

---

**Problema resolvido!** 🎉

