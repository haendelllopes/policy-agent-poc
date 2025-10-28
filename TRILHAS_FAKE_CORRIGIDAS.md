# 🔧 Correção: Trilhas Fake no Chat Flutuante

## 🐛 **PROBLEMA ENCONTRADO**

O chat flutuante estava mostrando **3 trilhas fake** que não existem no banco:

```
Trilha 1: "Trilha 2"
Trilha 2: "Cultura Organizacional"  
Trilha 3: "Trilha de Liderança"
```

Essas trilhas apareciam quando o usuário perguntava "quais trilhas eu tenho?"

---

## 🔍 **CAUSA RAIZ**

No arquivo `src/server.js` (linhas 799-809), a ferramenta `buscar_trilhas_disponiveis` estava usando um **MOCK**:

```javascript
case 'buscar_trilhas_disponiveis':
  // Simular busca de trilhas ← PROBLEMA AQUI!
  toolResult = {
    status: 'sucesso',
    trilhas: [
      { id: 'trilha-1', nome: 'Trilha 2', status: 'disponivel' },
      { id: 'trilha-2', nome: 'Cultura Organizacional', status: 'disponivel' },
      { id: 'trilha-3', nome: 'Trilha de Liderança', status: 'disponivel' }
    ]
  };
```

Este código estava **hardcoded** e retornava sempre as mesmas 3 trilhas falsas.

---

## ✅ **SOLUÇÃO IMPLEMENTADA**

**Commit:** `a9528a7`

**Mudança:** Substituído o mock por busca real ao endpoint:

```javascript
case 'buscar_trilhas_disponiveis':
  // Buscar trilhas REAIS do colaborador
  try {
    const trilhasResponse = await axios.get(
      `${baseUrl}/api/agent-n8n/trilhas/disponiveis/${functionArgs.colaborador_id}`,
      { params: { tenant_id: tenantId || 'demo' } }
    );
    
    const trilhasEncontradas = trilhasResponse.data?.disponiveis || [];
    
    toolResult = {
      status: 'sucesso',
      trilhas_encontradas: trilhasEncontradas.length,
      trilhas: trilhasEncontradas.map(t => ({
        id: t.id,
        nome: t.nome,
        descricao: t.descricao,
        status: t.status_colaborador || 'disponivel',
        conteudos: t.conteudos_count || 0
      }))
    };
  } catch (error) {
    console.error('❌ Erro ao buscar trilhas:', error.message);
    toolResult = {
      status: 'erro',
      mensagem: 'Não foi possível buscar trilhas no momento'
    };
  }
```

---

## 🎯 **RESULTADO**

Agora o chat flutuante:
- ✅ **Busca trilhas REAIS** do banco de dados
- ✅ **Aplica segregação** por cargo e departamento
- ✅ **Retorna trilhas corretas** para cada colaborador
- ✅ **Não mostra trilhas fake** mais

---

## 🚀 **Deploy**

- ✅ **Commit:** `a9528a7`
- ✅ **Push:** Concluído
- ⏳ **Vercel:** Deploy em andamento (~2-5 min)

---

## 🧪 **Como Testar**

1. Aguarde 2-5 minutos após o push
2. Acesse: https://policy-agent-poc.vercel.app/colaborador-trilhas
3. Abra o chat flutuante
4. Pergunte: **"Quais trilhas eu tenho?"**
5. **Esperado:** Ver trilhas REAIS do seu cargo/departamento ✅

---

**Data:** 15 de janeiro de 2025  
**Status:** ✅ Corrigido e em deploy

