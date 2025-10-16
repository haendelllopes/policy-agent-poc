# 📱 Normalização de Telefone Internacional - Navigator

**Versão:** 1.0  
**Data:** 16 de outubro de 2025  
**Status:** ✅ Implementado

---

## 📋 Visão Geral

O sistema Navigator agora suporta números de telefone internacionais com normalização automática, incluindo o tratamento especial do 9º dígito para números brasileiros.

---

## 🌍 Países Suportados

| País | Código | Formato DDD/Área | Formato Número | Exemplo Completo |
|------|--------|------------------|----------------|------------------|
| 🇧🇷 Brasil | +55 | 2 dígitos | 8-9 dígitos | +55 62 991708483 |
| 🇨🇴 Colômbia | +57 | 3 dígitos | 7 dígitos | +57 301 6639375 |
| 🇦🇷 Argentina | +54 | 2-4 dígitos | 6-8 dígitos | +54 11 12345678 |
| 🇨🇱 Chile | +56 | 1 dígito | 8 dígitos | +56 9 12345678 |
| 🇵🇪 Peru | +51 | 1 dígito | 7-8 dígitos | +51 1 1234567 |

---

## 🇧🇷 Regra Especial: 9º Dígito Brasileiro

### Contexto Histórico

Em 2015, o Brasil adicionou um 9º dígito aos números de celular. Números antigos têm 8 dígitos, números novos têm 9 dígitos.

### Normalização Automática

O sistema **automaticamente** adiciona o 9º dígito quando necessário:

```
Input:  55 62 91708483  (8 dígitos)
Output: 5562991708483   (9 dígitos - 9 adicionado)

Input:  55 62 991708483 (9 dígitos)
Output: 5562991708483   (mantido como está)
```

### Lógica Implementada

```javascript
// Se é número brasileiro E tem 8 dígitos E não começa com 9
if (codigo === '55' && numero.length === 8 && !numero.startsWith('9')) {
  numero = '9' + numero; // Adiciona o 9
}
```

---

## 📥 Formato de Entrada

### Frontend (Cadastro de Colaboradores)

O formulário possui 3 campos separados:

1. **País** (dropdown): Brasil +55, Colômbia +57, etc.
2. **DDD/Área** (input): 2-3 dígitos dependendo do país
3. **Número** (input): 7-9 dígitos dependendo do país

**Exemplo - Brasil:**
```
País: 🇧🇷 Brasil +55
DDD:  62
Número: 91708483

→ Sistema adiciona automaticamente o 9: 5562991708483
```

**Exemplo - Colômbia:**
```
País: 🇨🇴 Colômbia +57
Área: 301
Número: 6639375

→ Formato final: 573016639375
```

---

## 💾 Formato de Armazenamento

### Banco de Dados

Os números são armazenados com `+` no início:

```sql
-- Formato na coluna "phone" da tabela "users"
+5562991708483  -- Brasil
+573016639375   -- Colômbia
```

### WhatsApp Business API

O N8N e WhatsApp Business API recebem **sem** o `+`:

```javascript
// Payload para WhatsApp
{
  "to": "5562991708483",  // SEM o +
  "message": "Olá!"
}
```

---

## 🔍 Busca de Usuários por Telefone

### Query SQL Robusta

As queries de busca foram melhoradas para encontrar usuários com múltiplas variações:

```sql
SELECT id FROM users WHERE 
  REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') = $1 OR
  REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') = $2
```

**Parâmetros:**
- `$1`: Número normalizado (ex: `5562991708483`)
- `$2`: Número com 9º dígito adicionado se necessário

### Exemplo de Lookup

```javascript
// N8N envia: 556291708483 (sem 9º dígito)
phoneNormalized = "556291708483"
phoneWithBrazilDigit = "5562991708483" // 9 adicionado automaticamente

// Busca encontra o usuário mesmo se no banco estiver: +5562991708483
```

---

## 🛠️ Funções Helper

### `normalizePhone(phone)`

Normaliza telefone para salvar no banco (com `+`).

```javascript
normalizePhone('5562991708483')  // → '+5562991708483'
normalizePhone('573016639375')   // → '+573016639375'
```

### `normalizePhoneForWhatsApp(phone)`

Normaliza telefone para WhatsApp (sem `+`, apenas números).

```javascript
normalizePhoneForWhatsApp('+55 62 99170-8483')  // → '5562991708483'
normalizePhoneForWhatsApp('+57 301 6639375')    // → '573016639375'
```

### `addBrazilianNinthDigit(phone)`

Adiciona 9º dígito em números brasileiros se necessário.

```javascript
addBrazilianNinthDigit('556291708483')   // → '5562991708483' (9 adicionado)
addBrazilianNinthDigit('5562991708483')  // → '5562991708483' (mantido)
addBrazilianNinthDigit('573016639375')   // → '573016639375' (não é Brasil)
```

---

## ✅ Validações

### Brasil (+55)
- ✅ DDD: Exatamente 2 dígitos (ex: 11, 21, 62)
- ✅ Número: 8 ou 9 dígitos
- ✅ Formato final: 13 dígitos (55 + DDD + número)

### Colômbia (+57)
- ✅ Área: Exatamente 3 dígitos (ex: 301, 310, 320)
- ✅ Número: Exatamente 7 dígitos
- ✅ Formato final: 12 dígitos (57 + área + número)

### Outros Países
- ✅ Área: 1-4 dígitos
- ✅ Número: 6-9 dígitos

---

## 📝 Exemplos de Uso

### 1. Criar Colaborador no Frontend

```javascript
// Usuário preenche:
País: Brasil (+55)
DDD: 62
Número: 91708483

// Sistema processa:
formatPhoneForDatabase('55', '62', '91708483')
// → '5562991708483' (9 adicionado automaticamente)

// Backend salva:
// → '+5562991708483'
```

### 2. Buscar Colaborador pelo Telefone (API)

```javascript
// N8N envia mensagem do WhatsApp
// wa_id do WhatsApp: 556291708483

POST /api/analise-sentimento
{
  "phone": "556291708483",
  "message": "Olá!"
}

// Backend processa:
phoneNormalized = "556291708483"
phoneWithBrazilDigit = "5562991708483"

// Query encontra o usuário no banco
// Mesmo que esteja salvo como: +5562991708483
```

---

## 🐛 Troubleshooting

### Problema 1: Usuário não encontrado

**Sintoma:** API retorna `404 - Usuário não encontrado`

**Causa:** Número no banco não corresponde ao número recebido

**Solução:**
1. Verificar formato no banco:
   ```sql
   SELECT phone FROM users WHERE email = 'usuario@email.com';
   ```
2. Verificar número recebido nos logs:
   ```
   📞 Lookup: Phone 556291708483 → Normalized 556291708483 / 5562991708483
   ```
3. Se necessário, atualizar manualmente:
   ```sql
   UPDATE users SET phone = '+5562991708483' WHERE id = '...';
   ```

### Problema 2: WhatsApp não envia mensagem

**Sintoma:** Mensagem não chega no WhatsApp do colaborador

**Causa:** Formato incorreto enviado para WhatsApp Business API

**Solução:**
1. Verificar que o número **NÃO** tem `+`:
   ```javascript
   // ✅ CORRETO
   "to": "5562991708483"
   
   // ❌ ERRADO
   "to": "+5562991708483"
   ```

2. Verificar se o 9º dígito está presente (Brasil):
   ```javascript
   // ✅ CORRETO (9 dígitos)
   "to": "5562991708483"
   
   // ❌ ERRADO (8 dígitos)
   "to": "556291708483"
   ```

### Problema 3: Número colombiano não funciona

**Sintoma:** Colaborador colombiano não recebe mensagens

**Causa:** Formato do código de área incorreto

**Solução:**
1. Verificar que o código de área tem 3 dígitos:
   ```
   ✅ CORRETO: 573016639375 (301 + 6639375)
   ❌ ERRADO: 5716639375   (sem código de área)
   ```

2. Verificar que o número tem 7 dígitos:
   ```
   ✅ CORRETO: 6639375 (7 dígitos)
   ❌ ERRADO: 66393750 (8 dígitos)
   ```

---

## 📊 Arquivos Modificados

### Backend
- ✅ `src/utils/helpers.js` - Funções de normalização
- ✅ `src/server.js` - Endpoint de criação de usuários
- ✅ `src/routes/users.js` - Rotas de usuários
- ✅ `src/routes/analise-sentimento.js` - Busca por telefone
- ✅ `src/routes/webhooks.js` - Busca por telefone
- ✅ `src/routes/conversations.js` - Busca por telefone (3x)
- ✅ `src/routes/agent-trilhas.js` - Busca por telefone (3x)

### Frontend
- ✅ `public/funcionarios.html` - Formulário com 3 campos

---

## 🧪 Testes Recomendados

### Teste 1: Número Brasileiro com 8 Dígitos
```
Input Frontend:
  País: Brasil (+55)
  DDD: 62
  Número: 91708483

Esperado no Banco:
  +5562991708483 (9 adicionado)

Teste WhatsApp:
  Enviar mensagem deve funcionar
```

### Teste 2: Número Brasileiro com 9 Dígitos
```
Input Frontend:
  País: Brasil (+55)
  DDD: 62
  Número: 991708483

Esperado no Banco:
  +5562991708483 (mantido)

Teste WhatsApp:
  Enviar mensagem deve funcionar
```

### Teste 3: Número Colombiano
```
Input Frontend:
  País: Colômbia (+57)
  Área: 301
  Número: 6639375

Esperado no Banco:
  +573016639375

Teste WhatsApp:
  Enviar mensagem deve funcionar
```

### Teste 4: Busca por Telefone
```
Cenário:
  1. Criar usuário com: +5562991708483
  2. WhatsApp envia mensagem de: 556291708483 (sem 9)
  3. API deve encontrar o usuário

Validação:
  ✅ Lookup deve retornar o user_id correto
  ✅ Mensagem deve ser salva na tabela correta
```

---

## 🔒 Segurança

- ✅ Validação de formato no frontend (JavaScript)
- ✅ Validação de formato no backend (Zod schema)
- ✅ Sanitização de entrada (remove caracteres especiais)
- ✅ Queries SQL parametrizadas (previne SQL injection)

---

## 📚 Referências

- [E.164 - Formato Internacional de Números](https://en.wikipedia.org/wiki/E.164)
- [9º Dígito no Brasil - ANATEL](https://www.gov.br/anatel)
- [WhatsApp Business API - Formato de Números](https://developers.facebook.com/docs/whatsapp)

---

## 📞 Contato

Para dúvidas sobre a implementação, consulte:
- Documentação técnica: `CHECKLIST_IMPLEMENTACAO_MELHORIAS.md`
- Histórico de mudanças: `HISTORICO_IMPLEMENTACOES.md`

---

*Última atualização: 16 de outubro de 2025*

