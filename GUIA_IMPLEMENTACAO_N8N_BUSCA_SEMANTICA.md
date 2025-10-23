# 🚀 Guia de Implementação - Busca Semântica no N8N

**Data:** 23 de outubro de 2025  
**Objetivo:** Adicionar ferramenta de busca semântica no workflow N8N do Navigator

---

## 📋 **PRÉ-REQUISITOS**

✅ **Backend implementado** - Endpoint `/api/agent-n8n/trilhas/buscar-conteudo/:colaborador_id`  
✅ **Sistema de embeddings** funcionando  
✅ **Conteúdos processados** no banco de dados  

---

## 🎯 **IMPLEMENTAÇÃO NO N8N**

### **PASSO 1: Adicionar Nova Ferramenta no Agente Conversacional**

#### **1.1. Localizar o Nó "OpenAI Conversational Agent"**
- Abrir workflow principal do Navigator
- Encontrar o nó "OpenAI Conversational Agent"
- Clicar para editar

#### **1.2. Adicionar Nova Ferramenta**
No campo **"Tools"**, adicionar:

```json
{
  "name": "Buscar_conteudo_trilhas",
  "description": "Busca semântica inteligente nos conteúdos das trilhas para responder dúvidas específicas sobre processos, procedimentos e conceitos",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Pergunta ou dúvida sobre conteúdo das trilhas (ex: 'Como fazer login?', 'O que é onboarding?')"
      },
      "colaborador_id": {
        "type": "string",
        "description": "ID do colaborador que está fazendo a pergunta"
      },
      "trilha_id": {
        "type": "string",
        "description": "ID da trilha específica para buscar (opcional)"
      },
      "limit": {
        "type": "number",
        "description": "Número máximo de resultados (padrão: 5)"
      }
    },
    "required": ["query", "colaborador_id"]
  }
}
```

---

### **PASSO 2: Criar Nó HTTP Request para Busca Semântica**

#### **2.1. Adicionar Novo Nó HTTP Request**
- Nome: `Buscar_conteudo_trilhas`
- Tipo: `HTTP Request`
- Método: `GET`

#### **2.2. Configurar URL**
```
{{ $json.colaborador_id ? 'http://localhost:3000/api/agent-n8n/trilhas/buscar-conteudo/' + $json.colaborador_id : 'http://localhost:3000/api/agent-n8n/trilhas/buscar-conteudo/test-user-id' }}
```

#### **2.3. Configurar Query Parameters**
```json
{
  "query": "{{ $json.query }}",
  "limit": "{{ $json.limit || 5 }}",
  "trilha_id": "{{ $json.trilha_id || '' }}"
}
```

#### **2.4. Configurar Headers**
```json
{
  "Content-Type": "application/json"
}
```

---

### **PASSO 3: Processar Resposta da Busca Semântica**

#### **3.1. Adicionar Nó Code para Formatar Resposta**
Nome: `Formatar_resposta_busca_semantica`

```javascript
// Processar resposta da busca semântica
const response = $input.all()[0].json;

if (!response.success) {
  return {
    error: true,
    message: "Erro na busca semântica: " + (response.error || "Erro desconhecido")
  };
}

if (!response.results || response.results.length === 0) {
  return {
    success: true,
    message: "Não encontrei conteúdo específico sobre sua pergunta nas trilhas disponíveis.",
    query: response.query,
    total: 0,
    suggestions: [
      "Tente reformular sua pergunta",
      "Use palavras-chave diferentes",
      "Verifique se há trilhas relacionadas ao seu departamento"
    ]
  };
}

// Formatar resultados encontrados
const resultados = response.results.map((item, index) => {
  const conteudo = item.conteudo_info;
  return {
    posicao: index + 1,
    titulo: conteudo?.titulo || "Conteúdo sem título",
    trilha: conteudo?.trilha_nome || "Trilha desconhecida",
    tipo: conteudo?.tipo || "texto",
    url: conteudo?.url || null,
    similaridade: Math.round(item.similarity_score * 100) + "%",
    resumo: item.resumo || item.conteudo_extraido?.substring(0, 200) + "...",
    tags: item.tags || [],
    categoria: item.categoria_sugerida || "Geral",
    nivel_dificuldade: item.nivel_dificuldade || "Médio"
  };
});

// Criar resposta estruturada
const resposta = {
  success: true,
  message: `Encontrei ${response.total} conteúdo(s) relevante(s) sobre "${response.query}":`,
  query: response.query,
  total: response.total,
  resultados: resultados,
  recomendacoes: []
};

// Adicionar recomendações baseadas nos resultados
if (resultados.length > 0) {
  const trilhasUnicas = [...new Set(resultados.map(r => r.trilha))];
  resposta.recomendacoes.push(`Considere fazer a trilha: ${trilhasUnicas.join(", ")}`);
  
  const categorias = [...new Set(resultados.map(r => r.categoria))];
  if (categorias.length > 1) {
    resposta.recomendacoes.push(`Conteúdo encontrado em categorias: ${categorias.join(", ")}`);
  }
}

return resposta;
```

---

### **PASSO 4: Integrar com Resposta do Agente**

#### **4.1. Conectar ao Merge Node**
- Conectar saída do nó `Formatar_resposta_busca_semantica` ao Merge Node existente
- Garantir que a resposta seja incluída no contexto do agente

#### **4.2. Atualizar System Message (Opcional)**
Se necessário, atualizar o System Message para incluir instruções sobre a nova ferramenta:

```
Você agora tem acesso à ferramenta "Buscar_conteudo_trilhas" que permite buscar informações específicas nos conteúdos das trilhas.

Use esta ferramenta quando o colaborador:
- Perguntar "Como fazer algo específico"
- Quiser saber "O que significa algo"
- Tiver dúvidas sobre processos ou procedimentos
- Fizer perguntas técnicas sobre sistemas

Sempre apresente os resultados de forma clara e organizada, destacando:
- O título do conteúdo encontrado
- A trilha onde está localizado
- O nível de relevância (similaridade)
- Um resumo do conteúdo
- Recomendações de próximos passos
```

---

## 🧪 **TESTES NO N8N**

### **Teste 1: Busca Básica**
```json
{
  "query": "Como fazer login no sistema?",
  "colaborador_id": "test-user-id"
}
```

### **Teste 2: Busca com Filtro**
```json
{
  "query": "O que é onboarding?",
  "colaborador_id": "test-user-id",
  "trilha_id": "trilha-onboarding-id",
  "limit": 3
}
```

### **Teste 3: Busca sem Resultados**
```json
{
  "query": "Como voar para a lua?",
  "colaborador_id": "test-user-id"
}
```

---

## 📊 **VALIDAÇÃO**

### **✅ Checklist de Implementação:**
- [ ] Ferramenta adicionada no OpenAI Conversational Agent
- [ ] Nó HTTP Request configurado corretamente
- [ ] URL do endpoint funcionando
- [ ] Query parameters corretos
- [ ] Nó Code para formatação implementado
- [ ] Conexão com Merge Node estabelecida
- [ ] Testes básicos funcionando
- [ ] Resposta formatada corretamente

### **🔍 Logs para Verificar:**
```
🔍 N8N Busca Semântica: "Como fazer login?" para colaborador test-user-id
✅ N8N encontrou 3 conteúdos relevantes
```

---

## 🚀 **RESULTADO ESPERADO**

Após a implementação, o agente N8N poderá:

1. **🔍 Buscar conteúdo específico** quando colaborador fizer perguntas
2. **📚 Encontrar informações relevantes** nas trilhas processadas
3. **🎯 Responder com precisão** baseado no conteúdo real
4. **📈 Sugerir trilhas** relacionadas às dúvidas
5. **⚡ Ser mais útil** para colaboradores com dúvidas específicas

---

## 🆘 **TROUBLESHOOTING**

### **Problema: "Erro 404 - Colaborador não encontrado"**
**Solução:** Verificar se o `colaborador_id` está correto ou usar um ID válido

### **Problema: "Erro 500 - Erro interno do servidor"**
**Solução:** Verificar se o servidor está rodando e se há conteúdos processados

### **Problema: "Nenhum resultado encontrado"**
**Solução:** Verificar se há conteúdos com embeddings no banco de dados

### **Problema: "Timeout na requisição"**
**Solução:** Aumentar timeout do nó HTTP Request para 30 segundos

---

## 📝 **NOTAS IMPORTANTES**

1. **Performance:** A busca semântica pode levar 2-5 segundos devido à geração de embeddings
2. **Custos:** Cada busca gera um embedding via OpenAI (custo mínimo)
3. **Fallback:** O sistema tem fallback para casos sem embeddings
4. **Logs:** Sempre verificar logs para debugging
5. **Testes:** Testar com diferentes tipos de perguntas

---

**🎉 Implementação concluída! O agente N8N agora tem acesso ao conhecimento das trilhas através de busca semântica inteligente!**

