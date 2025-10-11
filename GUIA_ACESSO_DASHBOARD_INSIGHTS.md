# 🎯 Guia de Acesso - Dashboard de Insights

## ✅ Status: IMPLEMENTADO E FUNCIONANDO

Data: 11 de outubro de 2025  
Fase 3: **100% COMPLETA**

---

## 📍 Como Acessar

### 1. **Iniciar o Servidor**

```bash
cd policy-agent-poc
npm start
```

O servidor iniciará em: `http://localhost:3000`

### 2. **Acessar o Dashboard**

Abra o navegador e acesse:

```
http://localhost:3000/dashboard.html
```

### 3. **Navegar para Insights**

No menu lateral esquerdo, clique em:

```
💡 Insights
```

O dashboard está posicionado entre "📊 Dashboard" e "👥 Colaboradores".

---

## 🎨 O Que Você Verá

### 📊 **Cards de Estatísticas** (Topo da Página)

4 cards mostrando:
- 📝 **Anotações Capturadas** - Total de feedbacks registrados automaticamente
- 🔍 **Padrões Identificados** - Quantidade de padrões detectados
- 💡 **Melhorias Sugeridas** - Quantas anotações geraram sugestões
- 😊 **Sentimento Médio** - Nota de 1-5 com emoji (😔 😐 😊)

### 📈 **Gráficos** (Meio da Página)

2 gráficos lado a lado:
- 📊 **Distribuição por Tipo** - Barras horizontais mostrando:
  - ❓ Dúvida Frequente
  - 🚧 Dificuldade na Trilha
  - 👍 Feedback Positivo
  - 👎 Feedback Negativo
  - 💡 Sugestão de Melhoria
  - 📝 Observação Geral

- 😊 **Distribuição por Sentimento** - Barras coloridas mostrando:
  - 😍 Muito Positivo (verde)
  - 😊 Positivo (azul)
  - 😐 Neutro (cinza)
  - 😔 Negativo (laranja)
  - 😡 Muito Negativo (vermelho)

### 🔍 **Padrões Identificados**

Seção mostrando:
- 📋 **Por Tipo** - Tipos mais comuns com contagens
- 🏷️ **Tags Mais Frequentes** - Tags em formato de chips
- ⚠️ **Trilhas Problemáticas** - Trilhas com mais feedbacks negativos

### 📝 **Anotações Recentes** (Últimas 20)

Cards detalhados com:
- Badge do tipo de feedback
- Emoji e badge de sentimento
- Título e descrição completos
- Tags relacionadas
- Nome do colaborador
- Data e hora
- Indicador se gerou melhoria (💡)

### 🎛️ **Filtros**

No topo:
- ⏰ **Período**: 7, 30 ou 90 dias
- 🔄 **Botão Atualizar**: Recarrega os dados

Nas anotações:
- 📋 **Por Tipo**: Filtro dropdown com todos os tipos
- 😊 **Por Sentimento**: Filtro dropdown com todos os sentimentos
- Filtros combinados funcionam juntos

---

## 🧪 Testes Realizados

✅ **Todos os 4 testes passaram (100%)**

1. ✅ Listar Anotações (30 dias) - **PASSOU**
2. ✅ Listar Anotações (7 dias) - **PASSOU**
3. ✅ Padrões Identificados (30 dias) - **PASSOU**
4. ✅ Padrões Identificados (7 dias) - **PASSOU**

### Executar Testes Novamente

```bash
cd policy-agent-poc
node teste-dashboard-insights.js
```

---

## 📡 APIs Utilizadas

O dashboard consome as seguintes APIs do backend:

### 1. **Listar Anotações**
```
GET /api/agente/anotacoes/:tenantId?days=30
```

**Resposta:**
```json
{
  "success": true,
  "total": 2,
  "anotacoes": [
    {
      "id": "...",
      "tipo": "observacao_geral",
      "titulo": "...",
      "anotacao": "...",
      "sentimento": "neutro",
      "tags": ["teste"],
      "gerou_melhoria": false,
      "colaborador_name": "...",
      "created_at": "..."
    }
  ]
}
```

### 2. **Padrões Identificados**
```
GET /api/agente/anotacoes/padroes/:tenantId?days=30
```

**Resposta:**
```json
{
  "success": true,
  "periodo_dias": 30,
  "padroes_por_tipo": [
    { "tipo": "duvida_frequente", "total": 5 }
  ],
  "tags_frequentes": [
    { "tag": "trilha", "count": 10 }
  ],
  "trilhas_problematicas": [
    { "trilha_id": "...", "total": 3 }
  ]
}
```

---

## 🎯 Casos de Uso

### **Para o Administrador:**

1. **Identificar Problemas Rapidamente**
   - Veja trilhas com muitos feedbacks negativos
   - Identifique dúvidas frequentes dos colaboradores
   - Detecte padrões de dificuldade

2. **Tomar Decisões Baseadas em Dados**
   - Sentimento médio indica satisfação geral
   - Tipos de feedback mostram áreas de atenção
   - Tags revelam temas recorrentes

3. **Priorizar Melhorias**
   - Veja quais anotações geraram sugestões
   - Trilhas problemáticas precisam de revisão
   - Feedbacks negativos indicam urgência

4. **Monitorar Evolução**
   - Compare períodos (7, 30, 90 dias)
   - Veja tendências ao longo do tempo
   - Acompanhe impacto de mudanças

---

## 💡 Dicas de Uso

### **Filtro por Período**
- **7 dias**: Tendências recentes e problemas urgentes
- **30 dias**: Visão mensal balanceada (padrão)
- **90 dias**: Tendências de longo prazo

### **Filtros de Anotações**
- Combine tipo + sentimento para análise detalhada
- Exemplo: "Dificuldade na Trilha" + "Negativo" = problemas críticos

### **Atenção Especial Para:**
- 🔴 Trilhas com muitos feedbacks negativos
- 🟡 Dúvidas frequentes (podem indicar documentação insuficiente)
- 🟢 Feedbacks positivos (mostre o que está funcionando)

---

## 🔄 Atualização dos Dados

### **Automática**
- Dados são carregados ao acessar a seção "Insights"
- Mudança de período recarrega automaticamente

### **Manual**
- Clique no botão "🔄 Atualizar" no topo
- Recarrega todos os dados instantaneamente

---

## 🚀 Benefícios do Dashboard

✅ **Visibilidade Total**
- Todos os feedbacks capturados automaticamente pelo agente de IA

✅ **Identificação Rápida**
- Padrões e problemas destacados visualmente

✅ **Ação Imediata**
- Trilhas problemáticas identificadas para correção

✅ **Dados em Tempo Real**
- Sem necessidade de relatórios manuais

✅ **Tomada de Decisão**
- Insights baseados em dados reais dos colaboradores

---

## 📊 Exemplo de Fluxo de Uso

1. Admin acessa o dashboard pela manhã
2. Clica em "💡 Insights"
3. Vê 15 novas anotações capturadas ontem
4. Identifica 3 trilhas com feedbacks negativos
5. Filtra por "Dificuldade na Trilha" + "Negativo"
6. Lê os comentários específicos
7. Agenda revisão das trilhas problemáticas
8. Retorna após 7 dias para ver melhoria

---

## 🎉 Fase 3 - COMPLETA!

**Status Geral do Projeto:**

```
✅ Fase 1: Trilhas por Cargo/Departamento    PENDENTE (0%)
✅ Fase 2: Análise de Sentimento            COMPLETA (100%)
✅ Fase 3: Bloco de Notas do Agente         COMPLETA (100%)
```

**Total Implementado: 2 de 3 fases (66,7%)**

---

## 🤝 Suporte

Se encontrar algum problema:

1. Verifique se o servidor está rodando (`npm start`)
2. Abra o console do navegador (F12) para ver logs
3. Execute os testes: `node teste-dashboard-insights.js`
4. Verifique as APIs diretamente:
   - `http://localhost:3000/api/agente/anotacoes/5978f911-738b-4aae-802a-f037fdac2e64?days=30`
   - `http://localhost:3000/api/agente/anotacoes/padroes/5978f911-738b-4aae-802a-f037fdac2e64?days=30`

---

**Parabéns! Dashboard de Insights pronto para uso! 🎉🚀**

