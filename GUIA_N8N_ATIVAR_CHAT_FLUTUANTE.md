# 🚨 Workflow N8N - Ativar Chat Flutuante para Urgência Crítica

**Objetivo:** Modificar o workflow de detecção de urgência para ativar o chat flutuante quando detectar urgência crítica.

---

## 📋 **INSTRUÇÕES DE IMPLEMENTAÇÃO NO N8N:**

### **PASSO 1: Localizar o Workflow de Detecção de Urgência**

1. **Abrir N8N**
2. **Localizar workflow:** "Detecção de Urgência" ou "Fase 4.5.2"
3. **Encontrar o nó:** "🚨 Analisar Urgência" (IF Node)

### **PASSO 2: Modificar Branch CRÍTICA**

**No branch "CRÍTICA" do IF Node, após notificar admin, adicionar:**

#### **2.1. Novo Nó HTTP Request: "Buscar Dados Colaborador"**

**Configuração:**
- **Nome:** `Buscar Dados Colaborador`
- **Tipo:** HTTP Request
- **Método:** `GET`
- **URL:** `https://navigator-gules.vercel.app/api/users/{{ $('Webhook').item.json.body.colaborador_id }}`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

#### **2.2. Novo Nó HTTP Request: "Ativar Chat Flutuante Admin"**

**Configuração:**
- **Nome:** `Ativar Chat Flutuante Admin`
- **Tipo:** HTTP Request
- **Método:** `POST`
- **URL:** `https://navigator-gules.vercel.app/api/websocket/notify-admin`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "admin_id": "{{ $('Buscar Admin').item.json.admin_id }}",
  "tenant_id": "{{ $('Buscar Dados Colaborador').item.json.tenant_id }}",
  "tipo": "urgencia_critica",
  "colaborador_nome": "{{ $('Buscar Dados Colaborador').item.json.name }}",
  "problema": "{{ $('Webhook').item.json.body.titulo }}",
  "urgencia": "{{ $('Webhook').item.json.body.urgencia }}",
  "categoria": "{{ $('Webhook').item.json.body.categoria }}",
  "acao_sugerida": "{{ $('Webhook').item.json.body.acao_sugerida }}",
  "anotacao_id": "{{ $('Webhook').item.json.body.anotacao_id }}"
}
```

### **PASSO 3: Conectar os Nós**

**Fluxo atual:**
```
💾 Salvar Anotação
    ↓
🚨 Analisar Urgência
    ├─ CRÍTICA → Notificar Admin → [NOVO] Ativar Chat Flutuante
    ├─ ALTA → Notificar Admin
    ├─ MÉDIA → Continuar
    └─ BAIXA → Continuar
```

**Novo fluxo:**
```
💾 Salvar Anotação
    ↓
🚨 Analisar Urgência
    ├─ CRÍTICA → Notificar Admin → Buscar Dados Colaborador → Ativar Chat Flutuante → Continuar
    ├─ ALTA → Notificar Admin
    ├─ MÉDIA → Continuar
    └─ BAIXA → Continuar
```

### **PASSO 4: Configurar Tratamento de Erro**

**Adicionar nó "Tratar Erro Chat Flutuante":**

- **Tipo:** Code Node
- **Nome:** `Tratar Erro Chat Flutuante`
- **Código:**
```javascript
// Tratar erro se chat flutuante não conseguir notificar
try {
  const result = $input.all()[0].json;
  
  if (result.success) {
    console.log('✅ Chat flutuante ativado com sucesso:', result.notified_connections);
    return {
      json: {
        ...result,
        chat_flutuante_status: 'success',
        message: 'Admin notificado via chat flutuante'
      }
    };
  } else {
    console.log('⚠️ Chat flutuante não conseguiu notificar:', result.message);
    return {
      json: {
        ...result,
        chat_flutuante_status: 'failed',
        message: 'Admin não estava conectado ao chat flutuante'
      }
    };
  }
} catch (error) {
  console.error('❌ Erro ao processar resultado do chat flutuante:', error);
  return {
    json: {
      chat_flutuante_status: 'error',
      error: error.message,
      message: 'Erro ao processar notificação do chat flutuante'
    }
  };
}
```

---

## 🧪 **TESTE DO WORKFLOW:**

### **Teste Manual:**

1. **Executar workflow** com dados de teste
2. **Verificar logs** do nó "Ativar Chat Flutuante Admin"
3. **Confirmar** que admin recebe notificação no chat flutuante

### **Dados de Teste:**

```json
{
  "admin_id": "admin-uuid-here",
  "tenant_id": "demo",
  "colaborador_nome": "João Silva",
  "problema": "Estou a 2 dias sem conseguir acessar a plataforma",
  "urgencia": "critica",
  "categoria": "tecnico",
  "acao_sugerida": "Contatar TI imediatamente"
}
```

---

## 📊 **RESULTADO ESPERADO:**

### **Quando urgência crítica for detectada:**

1. ✅ **Notificação normal** para admin (como já faz)
2. ✅ **Chat flutuante ativado** automaticamente
3. ✅ **Modal de urgência** aparece na tela do admin
4. ✅ **Som de alerta** reproduzido
5. ✅ **Admin pode responder** diretamente no chat

### **Logs esperados:**

```
🚨 ALERTA CRÍTICO DETECTADO
👤 Colaborador: João Silva
⚠️ Problema: Estou a 2 dias sem conseguir acessar a plataforma
🔴 Urgência: critica
📂 Categoria: tecnico
💡 Ação Sugerida: Contatar TI imediatamente
⏰ Detectado em: 23/10/2025, 15:30:00
```

---

## 🔧 **CONFIGURAÇÕES ADICIONAIS:**

### **Timeout do HTTP Request:**
- **Timeout:** 30 segundos
- **Retry:** 2 tentativas

### **Headers Adicionais (se necessário):**
```json
{
  "Content-Type": "application/json",
  "User-Agent": "N8N-Workflow/1.0"
}
```

---

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO:**

- [ ] Localizar workflow "Detecção de Urgência"
- [ ] Encontrar branch "CRÍTICA" do IF Node
- [ ] Adicionar nó "Buscar Dados Colaborador"
- [ ] Configurar URL do endpoint /api/users/{colaborador_id}
- [ ] Adicionar nó "Ativar Chat Flutuante Admin"
- [ ] Configurar URL e Body corretamente
- [ ] Conectar nós: Notificar Admin → Buscar Dados → Ativar Chat
- [ ] Adicionar nó "Tratar Erro Chat Flutuante"
- [ ] Testar com dados de exemplo
- [ ] Verificar logs de execução
- [ ] Confirmar notificação no chat flutuante

---

## 🎯 **BENEFÍCIOS:**

1. **Proatividade**: Admin é alertado imediatamente
2. **Visibilidade**: Modal de urgência garante atenção
3. **Ação**: Admin pode responder diretamente
4. **Integração**: Usa infraestrutura existente
5. **Automação**: Sem necessidade de intervenção manual

---

**🚀 Após implementar, o sistema estará 100% automatizado para urgências críticas!**
