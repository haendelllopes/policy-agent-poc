# 🚀 Integrar Detecção Automática de Anotações no N8N

## 📋 VISÃO GERAL

Este workflow detecta automaticamente quando uma mensagem contém feedback relevante e cria anotações no sistema.

---

## 🔄 COMO INTEGRAR AO WORKFLOW EXISTENTE

### **Opção 1: Adicionar nó no workflow de sentimentos existente**

#### **1. Após o nó "5️⃣ AI Agent":**

Adicionar um nó **"🔍 Detectar Feedback"** que:

```
5️⃣ AI Agent → 🔍 Detectar Feedback → (se detectar) → 💾 Criar Anotação
```

#### **2. Configuração do nó "🔍 Detectar Feedback":**

**Tipo:** Code (JavaScript)

**Código:**
```javascript
// Obter dados dos nós anteriores
const mensagem = $('Merge').item.json.messageText;
const sentimento = $('1️⃣ Analisar Sentimento').item.json.sentiment;
const trilhas = $('4️⃣ Buscar Trilhas').item.json.trilhas || [];
const colaboradorId = $('Merge').item.json.from;

// Palavras-chave que indicam feedback relevante
const palavrasChave = [
  'dificuldade', 'problema', 'não consigo', 'confuso', 'complexo', 
  'difícil', 'não entendo', 'ajuda', 'sugestão', 'melhorar', 
  'melhor', 'ideia', 'recomendo', 'sugiro', 'feedback', 'opinião'
];

// Detectar se mensagem contém feedback
const contemFeedback = palavrasChave.some(palavra => 
  mensagem.toLowerCase().includes(palavra.toLowerCase())
);

// Se contém feedback, preparar dados para anotação
if (contemFeedback) {
  // Determinar tipo de feedback
  let tipo = 'observacao_geral';
  
  if (mensagem.toLowerCase().includes('trilha') || trilhas.length > 0) {
    tipo = 'sentimento_trilha';
  } else if (mensagem.toLowerCase().includes('empresa') || mensagem.toLowerCase().includes('companhia')) {
    tipo = 'sentimento_empresa';
  } else if (mensagem.toLowerCase().includes('conteúdo') || mensagem.toLowerCase().includes('material')) {
    tipo = 'dificuldade_conteudo';
  } else if (mensagem.toLowerCase().includes('sugestão') || mensagem.toLowerCase().includes('recomendo')) {
    tipo = 'sugestao_colaborador';
  }

  // Extrair tags básicas
  const tags = palavrasChave.filter(palavra => 
    mensagem.toLowerCase().includes(palavra.toLowerCase())
  );

  return [{
    json: {
      tem_feedback: true,
      tipo: tipo,
      titulo: `Feedback: ${tipo.replace('_', ' ')}`,
      tags: tags.slice(0, 3), // Máximo 3 tags
      mensagem: mensagem,
      colaborador_id: colaboradorId,
      sentimento: sentimento.sentimento,
      intensidade: sentimento.intensidade,
      trilha_id: trilhas.length > 0 ? trilhas[0].trilha_id : null
    }
  }];
} else {
  return [{
    json: {
      tem_feedback: false,
      mensagem: mensagem
    }
  }];
}
```

#### **3. Nó "💾 Criar Anotação" (HTTP Request):**

**URL:** `https://navigator-gules.vercel.app/api/agente/anotacoes`

**Método:** POST

**Headers:**
```
Content-Type: application/json
x-tenant-id: {{ $('Merge').item.json.tenantId || '5978f911-738b-4aae-802a-f037fdac2e64' }}
```

**Body:**
```json
{
  "colaborador_id": "{{ $json.colaborador_id }}",
  "trilha_id": "{{ $json.trilha_id }}",
  "tipo": "{{ $json.tipo }}",
  "titulo": "{{ $json.titulo }}",
  "anotacao": "{{ $json.mensagem }}",
  "sentimento": "{{ $json.sentimento }}",
  "intensidade_sentimento": "{{ $json.intensidade }}",
  "contexto": "{{ JSON.stringify({ origem: 'whatsapp', momento: 'conversa_agente' }) }}",
  "tags": "{{ $json.tags }}"
}
```

---

## 🎯 **CONDIÇÕES PARA CRIAR ANOTAÇÃO**

### ✅ **Criar anotação quando:**
- Colaborador menciona **dificuldade** ("não consigo", "confuso", "difícil")
- Colaborador dá **feedback sobre trilha** ("trilha muito longa", "não entendi")
- Colaborador **sugere melhoria** ("sugestão", "recomendo", "melhorar")
- Colaborador expressa **sentimento forte** (muito positivo/negativo)
- Colaborador relata **problema técnico** ("não funciona", "erro")

### ❌ **NÃO criar anotação para:**
- Conversas triviais ("oi", "obrigado", "tchau")
- Confirmações simples ("sim", "ok", "entendi")
- Perguntas já respondidas antes
- Mensagens muito curtas (< 10 caracteres)

---

## 🔧 **CONFIGURAÇÃO RÁPIDA**

### **1. Adicionar nó no workflow existente:**

```
WhatsApp → Merge → 1️⃣ Analisar Sentimento → 3️⃣ É Negativo? → 🚨 Alerta RH → 4️⃣ Buscar Trilhas → 5️⃣ AI Agent → 🔍 Detectar Feedback → 💾 Criar Anotação → Resposta
```

### **2. Configurar condição:**

**No nó "🔍 Detectar Feedback":**
- Se `tem_feedback = true` → Criar anotação
- Se `tem_feedback = false` → Continuar normal

---

## 🧪 **TESTE**

### **Mensagens de teste:**

#### ✅ **Devem criar anotação:**
- "Estou com dificuldade na trilha de RH"
- "Sugestão: o conteúdo poderia ser mais claro"
- "Não consigo entender o sistema"
- "A trilha está muito complexa"

#### ❌ **NÃO devem criar anotação:**
- "Oi, tudo bem?"
- "Obrigado!"
- "Sim, entendi"
- "Ok"

---

## 📊 **RESULTADO ESPERADO**

### **Se detectar feedback:**
```
📝 Anotação criada:
- Tipo: dificuldade_conteudo
- Título: Feedback: dificuldade conteudo
- Tags: ["dificuldade", "conteúdo"]
- Sentimento: negativo
- Salvo no banco automaticamente
```

### **Se não detectar:**
```
✅ Fluxo normal continua
❌ Nenhuma anotação criada
```

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Integrar nó no workflow existente**
2. **Testar com mensagens de exemplo**
3. **Verificar anotações criadas no banco**
4. **Ajustar sensibilidade se necessário**

---

**Quer que eu te ajude a integrar no workflow existente?** 🎯

