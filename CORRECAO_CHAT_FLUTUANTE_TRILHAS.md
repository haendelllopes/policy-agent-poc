# 🔧 Correção: Chat Flutuante Não Reconhecia Trilhas

## 🐛 Problema Identificado

O chat flutuante (não o N8N) estava respondendo que **não vê trilhas** mesmo quando elas estavam visíveis no dashboard.

**Exemplo observado:**
- **Dashboard mostra:** "O que é o onboarding" (1 conteúdo)
- **Chatbot responde:** "Atualmente, não vejo uma trilha nomeada 'O que é o onboarding?'"

## 🔍 Causa Raiz

O endpoint `/api/chat` no arquivo `src/server.js` era responsável pelo chat flutuante, mas:
- ❌ Mencionava as ferramentas (buscar_trilhas, iniciar_trilha, etc.)
- ❌ **MAS NÃO incluía as trilhas disponíveis no contexto do system message**
- ❌ Resultado: Chatbot não tinha conhecimento das trilhas antes de usar as ferramentas

## ✅ Solução Implementada

Atualizei o código em `src/server.js` para:

1. **Buscar trilhas automaticamente** do colaborador ANTES de gerar o system message
2. **Incluir informações das trilhas** diretamente no contexto do chatbot
3. **Formatar as trilhas** de forma legível com nome, ID, descrição e conteúdos

### Mudanças Realizadas:

#### 1. Busca de Trilhas (Linhas 350-396)

```javascript
// 2.1. BUSCAR TRILHAS DISPONÍVEIS PARA O USUÁRIO
console.log('📚 Buscando trilhas disponíveis para o usuário...');
let trilhasInfo = '';
try {
  // Obter tenant_id do contexto ou usar padrão
  const tenantId = context?.tenant_id || process.env.SUPABASE_TENANT_ID;
  
  if (tenantId && realUserId && userId !== 'admin-demo') {
    // Buscar trilhas apenas para colaboradores (não para admins)
    const axios = require('axios');
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    
    const response = await axios.get(
      `${baseUrl}/api/agent-n8n/trilhas/disponiveis/${realUserId}`,
      { 
        params: { tenant_id: tenantId },
        timeout: 5000
      }
    );
    
    if (response.data?.disponiveis && response.data.disponiveis.length > 0) {
      const trilhas = response.data.disponiveis;
      
      trilhasInfo = '\n\n📚 **TRILHAS DISPONÍVEIS PARA ESTE COLABORADOR:**\n\n';
      
      trilhas.forEach((trilha, index) => {
        trilhasInfo += `${index + 1}. **${trilha.nome}** (ID: ${trilha.id})\n`;
        if (trilha.descricao) {
          trilhasInfo += `   Descrição: ${trilha.descricao}\n`;
        }
        if (trilha.conteudos_count) {
          trilhasInfo += `   Conteúdos: ${trilha.conteudos_count}\n`;
        }
        trilhasInfo += '\n';
      });
      
      trilhasInfo += '\n**IMPORTANTE:** Você conhece estas trilhas e pode usá-las para responder perguntas e iniciar trilhas quando solicitado.';
      
      console.log('✅ Trilhas encontradas:', trilhas.length);
    }
  }
} catch (error) {
  console.log('⚠️ Não foi possível buscar trilhas:', error.message);
  trilhasInfo = '\n\n⚠️ **NOTA:** Use a ferramenta buscar_trilhas_disponiveis quando o usuário perguntar sobre trilhas.';
}
```

#### 2. Inclusão no System Message (Linha 428)

```javascript
const systemMessage = `Você é o **Navi**, assistente de onboarding inteligente e proativo.

🎯 **CONTEXTO ATUAL:**
- **Usuário:** ${userContext.profile.name}
...

${trilhasInfo}  // ← ADICIONADO AQUI!

📝 **HISTÓRICO DE CONVERSAS:** ${conversationHistory.length} mensagens anteriores
...
```

### O System Message Agora Inclui:

```
Você é o **Navi**, assistente de onboarding inteligente e proativo.

🎯 **CONTEXTO ATUAL:**
- **Usuário:** Colaborador
- **Cargo:** Desenvolvedor
- **Departamento:** Tecnologia
...

📚 **TRILHAS DISPONÍVEIS PARA ESTE COLABORADOR:**

1. **O que é o onboarding** (ID: abc123...)
   Descrição: Introdução ao onboarding
   Conteúdos: 1

2. **Onboarding Desenvolvedor** (ID: def456...)
   Descrição: Trilha completa de integração para desenvolvedores
   Conteúdos: 4

**IMPORTANTE:** Você conhece estas trilhas e pode usá-las para responder perguntas e iniciar trilhas quando solicitado.

📝 **HISTÓRICO DE CONVERSAS:** ...
```

## 🎯 Resultado Esperado

Agora o chatbot do chat flutuante vai:
- ✅ **Reconhecer imediatamente** as trilhas do colaborador
- ✅ **Responder corretamente** quando perguntado sobre trilhas específicas
- ✅ **Usar o ID correto** ao iniciar trilhas
- ✅ **Não dizer "não vejo trilha"** quando elas existem

## 🚀 Como Testar

1. **Faça deploy no Vercel** (ou rode localmente com `npm start`)
2. **Acesse o dashboard** como colaborador
3. **Abra o chat flutuante** (botão Navi no canto inferior direito)
4. **Envie mensagem:** "e a trilha O que é o onboarding?"
5. **Resultado esperado:** Chatbot reconhece a trilha e oferece para iniciá-la

## 📝 Notas Técnicas

- **Endpoint usado:** `/api/agent-n8n/trilhas/disponiveis/:colaborador_id`
- **Fallback:** Se não conseguir buscar trilhas, o chatbot usa a ferramenta `buscar_trilhas_disponiveis`
- **Formato:** Trilhas são formatadas com nome, ID, descrição e contagem de conteúdos
- **Só para colaboradores:** Admins (`admin-demo`) não recebem trilhas no contexto

## 🔄 Diferença: Chat Flutuante vs N8N

| Aspecto | Chat Flutuante | N8N Workflow |
|---------|----------------|--------------|
| **Arquivo** | `src/server.js` | `CODIGO_PREPARE_SYSTEM_MESSAGE_ULTRA_SIMPLES.js` |
| **Endpoint** | `/api/chat` | OpenAI Message a Model |
| **Integração** | Direto com GPT-4o | Com ferramentas HTTP Request |
| **Status** | ✅ **Corrigido agora** | ✅ Já estava corrigido |

---

**Data:** 2025-01-15  
**Arquivo:** `src/server.js` (linhas 350-396, 428)  
**Status:** ✅ Corrigido - Aguardando deploy

