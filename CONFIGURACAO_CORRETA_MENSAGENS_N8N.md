# ✅ Configuração Correta das Mensagens no OpenAI Conversational Agent

## 📋 Você precisa ter 2 mensagens configuradas:

### **MENSAGEM 1: System**
- **Prompt/Content:** `{{ $('Prepare System Message').item.json.systemMessage.content }}`
- **Role:** `System`

### **MENSAGEM 2: User**
- **Prompt/Content:** `{{ $('Prepare System Message').item.json.userMessage.content }}`
- **Role:** `User`

---

## 🎯 Explicação

O nó "Prepare System Message" retorna:
```json
{
  "systemMessage": {
    "role": "system",
    "content": "Você é o Navi..."
  },
  "userMessage": {
    "role": "user", 
    "content": "Olá"
  }
}
```

Para a **Mensagem System** (Role: System):
- Use: `.systemMessage.content`
- Isso pega: "Você é o Navi..."

Para a **Mensagem User** (Role: User):
- Use: `.userMessage.content`
- Isso pega: "Olá"

---

## ❌ O Que Você Mostrou na Imagem

Na imagem, você tem:
- **Prompt:** `{{ $json.systemMessage.content }}` ← Conteúdo do System
- **Role:** "User" ← Mas está configurado como User!

**Isso está ERRADO porque:**
- `systemMessage.content` é o conteúdo do SYSTEM
- Mas a Role está como User

---

## ✅ Correção

Existem **2 opções**:

### **Opção 1: Usar com Node Name**
Se você tem o nó conectado "Prepare System Message":

**Mensagem System:**
```
{{ $('Prepare System Message').item.json.systemMessage.content }}
```

**Mensagem User:**
```
{{ $('Prepare System Message').item.json.userMessage.content }}
```

### **Opção 2: Usar $json (mais simples)**
Se o nó anterior está passando os dados:

**Mensagem System:**
```
{{ $json.systemMessage.content }}
```

**Mensagem User:**
```
{{ $json.userMessage.content }}
```

---

## 🎯 O Que Fazer Agora

1. **Verifique quantas mensagens você tem configuradas**
2. **Se tem apenas UMA mensagem:**
   - Adicione mais uma mensagem clicando em "Add Message"
   - Configure como mostrado acima

3. **Se tem DUAS mensagens mas ambas com Role "User":**
   - Altere a primeira para Role "System"
   - Use o prompt correto para cada uma

---

## 💡 Dica

O Navî está configurado para criar mensagens com estrutura:
```javascript
return {
  systemMessage: { role: 'system', content: '...' },
  userMessage: { role: 'user', content: '...' }
}
```

Então você **PRECISA** dessas 2 mensagens para o workflow funcionar corretamente!

