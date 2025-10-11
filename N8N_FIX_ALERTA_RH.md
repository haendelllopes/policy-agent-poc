# 🔧 FIX: Nó "🚨 Enviar Alerta RH"

**Problema:** Mesmo erro de UUID - está enviando phone em vez de UUID.

**Solução:** API atualizada para aceitar `phone` + N8N precisa usar `phone`.

---

## ✅ CORREÇÃO APLICADA NA API

O endpoint `/api/webhooks/alerta-sentimento-negativo` agora aceita:
- ✅ `colaborador_id` (UUID) - para quando você já tem o ID
- ✅ `phone` (string) - para quando você tem só o telefone

---

## 🔧 COMO CORRIGIR NO N8N

### No nó "🚨 Enviar Alerta RH":

**Trocar o JSON Body de:**

❌ **ANTES:**
```json
{
  "colaborador_id": "{{ $('Merge').item.json.from }}",
  "sentimento": "{{ $json.sentiment.sentimento }}",
  "intensidade": {{ $json.sentiment.intensidade }},
  "mensagem": "{{ $('Merge').item.json.messageText }}",
  "canal": "{{ $('Merge').item.json.channel }}",
  "tenant_id": "{{ $('Merge').item.json.tenantId }}"
}
```

✅ **DEPOIS:**
```json
{
  "phone": "{{ $('Merge').item.json.from }}",
  "sentimento": "{{ $json.sentiment.sentimento }}",
  "intensidade": {{ $json.sentiment.intensidade }},
  "mensagem": "{{ $('Merge').item.json.messageText }}",
  "canal": "{{ $('Merge').item.json.channel }}",
  "tenant_id": "{{ $('Merge').item.json.tenantId }}"
}
```

**O que mudou:** `"colaborador_id"` → `"phone"`

---

## 📝 JSON COMPLETO CORRETO:

```json
{
  "phone": "{{ $('Merge').item.json.from }}",
  "sentimento": "{{ $json.sentiment.sentimento }}",
  "intensidade": {{ $json.sentiment.intensidade }},
  "mensagem": "{{ $('Merge').item.json.messageText }}",
  "canal": "{{ $('Merge').item.json.channel }}",
  "tenant_id": "{{ $('Merge').item.json.tenantId }}",
  "timestamp": "{{ new Date().toISOString() }}"
}
```

---

## 🚀 DEPLOY DA CORREÇÃO

Após atualizar o N8N, fazer commit e push:

```bash
git add src/routes/webhooks.js
git commit -m "fix: Endpoint de alertas aceita phone como alternativa a colaborador_id"
git push origin main
```

Aguardar deploy no Vercel (~2 min).

---

## 🧪 TESTE

### 1. Atualizar JSON no N8N
### 2. Salvar workflow
### 3. Executar com mensagem negativa:
```
"Não estou conseguindo usar o sistema, está muito confuso"
```

### 4. Logs esperados no Vercel:
```
📞 Lookup: Phone 556291708483 → User ID a1b2c3d4-...
🚨 ALERTA: Sentimento negativo detectado!
===============================================
🔴 ALERTA: Sentimento negativo detectado
👤 Colaborador: Usuário WhatsApp
...
```

---

## ✅ CHECKLIST

- [ ] Atualizar JSON do nó "🚨 Enviar Alerta RH" (usar `phone`)
- [ ] Salvar workflow no N8N
- [ ] Fazer commit e push da correção
- [ ] Aguardar deploy no Vercel
- [ ] Testar com mensagem negativa
- [ ] Verificar logs do alerta

---

**Problema resolvido!** 🎉

