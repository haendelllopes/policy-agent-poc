# 🏗️ Arquitetura do Agente IA - Flowly

**Versão:** 1.0  
**Data:** 10 de outubro de 2025

---

## 🎯 Duas Abordagens

### Abordagem 1: **Agente no N8N** (Atual - Fases 1-3)
### Abordagem 2: **Agente no Produto** (Futuro - Fase 4+)

---

## 📍 Onde Estamos Agora?

**Situação Atual:**
- ✅ N8N recebe mensagens do WhatsApp/Telegram
- ✅ N8N processa e responde
- ✅ Backend apenas fornece dados (API REST)

**Para as Melhorias (Fases 1-3):**
- 🎯 **Continuar usando N8N como agente principal**
- 🎯 Backend adiciona novas tabelas e queries
- 🎯 N8N usa essas queries para tomar decisões

---

## 🔄 Fase 1-3: Agente no N8N

### Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                     COMUNICAÇÃO                          │
│  WhatsApp │ Telegram │ (futuro: Web Chat via N8N)      │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    N8N WORKFLOWS                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Workflow: Análise de Sentimento                 │  │
│  │  1. Recebe mensagem                              │  │
│  │  2. Chama OpenAI API                             │  │
│  │  3. Salva em colaborador_sentimentos (via API)   │  │
│  │  4. Atualiza users.sentimento_atual              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Workflow: Recomendação de Trilhas               │  │
│  │  1. Busca sentimento_atual do user               │  │
│  │  2. Consulta API: GET /trilhas/recomendadas/:id  │  │
│  │  3. Monta mensagem personalizada                 │  │
│  │  4. Envia ao colaborador                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Workflow: Criação de Anotações                  │  │
│  │  1. Detecta feedback relevante                   │  │
│  │  2. Chama OpenAI para extrair contexto           │  │
│  │  3. Salva em agente_anotacoes (via API)          │  │
│  │  4. Tags automáticas                             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Workflow Agendado: Análise de Padrões (1x/sem)  │  │
│  │  1. Busca anotações relevantes                   │  │
│  │  2. Agrupa por tipo/trilha                       │  │
│  │  3. Identifica padrões (≥3 ocorrências)          │  │
│  │  4. Gera melhorias via OpenAI                    │  │
│  │  5. Salva em onboarding_improvements             │  │
│  │  6. Notifica admins                              │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                 BACKEND FLOWLY (Express)                 │
│                                                          │
│  API Endpoints:                                          │
│  ├─ POST /api/sentimentos                               │
│  ├─ GET  /api/trilhas/recomendadas/:userId              │
│  ├─ POST /api/agente/anotacoes                          │
│  ├─ GET  /api/agente/insights/:tenantId                 │
│  └─ POST /api/improvements                              │
│                                                          │
│  Funções SQL Especializadas:                            │
│  ├─ buscar_trilhas_por_sentimento()                     │
│  ├─ calcular_sentimento_trilha()                        │
│  └─ colaborador_tem_acesso_trilha()                     │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (PostgreSQL)                 │
│                                                          │
│  Tabelas Principais:                                     │
│  ├─ users (+ sentimento_atual)                          │
│  ├─ trilhas (+ sentimento_medio, dificuldade)           │
│  ├─ colaborador_sentimentos                             │
│  ├─ agente_anotacoes                                    │
│  └─ onboarding_improvements                             │
│                                                          │
│  Views e Funções:                                        │
│  ├─ trilhas_recomendadas (view)                         │
│  └─ buscar_trilhas_por_sentimento() (function)          │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Exemplo: Recomendação de Trilha

```
1. 👤 Colaborador: "Quais trilhas posso fazer?"

2. 📱 N8N recebe via WhatsApp webhook

3. 🔍 N8N: Nó "Buscar Dados do Usuário"
   GET /api/users/123
   → { id: 123, sentimento_atual: "negativo" }

4. 🧠 N8N: Nó "Buscar Trilhas Recomendadas"
   GET /api/trilhas/recomendadas/123
   (Backend executa: buscar_trilhas_por_sentimento(123, 'negativo', 3))
   → [
       { nome: "Cultura", sentimento: 0.88, dificuldade: "facil" },
       { nome: "Benefícios", sentimento: 0.75, dificuldade: "muito_facil" }
     ]

5. 💬 N8N: Nó "Montar Resposta"
   Template baseado em sentimento "negativo":
   "Entendo que está um pouco difícil 💙
   Que tal trilhas mais leves para recuperar confiança?
   
   1️⃣ Cultura da Empresa (muito bem avaliada!)
   2️⃣ Benefícios (rápida e fácil)
   
   Qual você prefere?"

6. 📤 N8N: Envia via WhatsApp API

7. 👤 Colaborador recebe mensagem personalizada
```

---

## 🚀 Fase 4+: Migração para o Produto

### Por Que Migrar?

**Limitações do N8N:**
- ⚠️ Overhead de comunicação (HTTP entre N8N e Backend)
- ⚠️ Dificulta Web Chat nativo (tudo passa pelo N8N)
- ⚠️ Escalabilidade limitada
- ⚠️ Debugar workflows complexos é mais difícil
- ⚠️ Versioning de workflows não é ideal

**Vantagens de ter no Produto:**
- ✅ Mais rápido (sem HTTP overhead)
- ✅ Web Chat nativo no frontend
- ✅ Melhor controle sobre IA
- ✅ Debugging mais fácil
- ✅ Testes unitários
- ✅ Versionamento com Git

### Nova Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                     COMUNICAÇÃO                          │
│  WhatsApp │ Telegram │ Web Chat │ API Direta           │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              N8N (apenas orquestrador)                   │
│                                                          │
│  ├─ Recebe mensagens WhatsApp/Telegram                  │
│  ├─ Envia para Backend Flowly                           │
│  └─ Retorna resposta ao canal                           │
│                                                          │
│  (Lógica de IA migrou para o Backend!)                  │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│            BACKEND FLOWLY - Módulo de IA                 │
│                                                          │
│  src/services/ai-agent/                                  │
│  ├─ sentiment-analyzer.js                               │
│  │   └─ analisarSentimento(mensagem)                    │
│  │                                                       │
│  ├─ trail-recommender.js                                │
│  │   └─ recomendarTrilhas(userId, sentimento)           │
│  │                                                       │
│  ├─ note-taker.js                                       │
│  │   └─ criarAnotacao(feedback, contexto)               │
│  │                                                       │
│  ├─ pattern-analyzer.js                                 │
│  │   └─ analisarPadroes(tenantId)                       │
│  │                                                       │
│  └─ response-generator.js                               │
│      └─ gerarResposta(mensagem, contexto, sentimento)   │
│                                                          │
│  API Endpoints (novos):                                  │
│  └─ POST /api/ai/conversa                               │
│      {                                                   │
│        "user_id": "123",                                 │
│        "mensagem": "Quais trilhas posso fazer?",        │
│        "canal": "whatsapp"                              │
│      }                                                   │
│      → Processa TUDO e retorna resposta completa        │
└─────────────────────────────────────────────────────────┘
```

### Código de Exemplo

```javascript
// src/services/ai-agent/index.js

class AIAgent {
  constructor(db, gemini) {
    this.db = db;
    this.gemini = gemini;
    this.sentimentAnalyzer = new SentimentAnalyzer(gemini);
    this.trailRecommender = new TrailRecommender(db);
    this.responsGenerator = new ResponseGenerator(gemini);
  }
  
  async processarMensagem({ userId, mensagem, canal }) {
    // 1. Analisar sentimento
    const sentimento = await this.sentimentAnalyzer.analisar(mensagem);
    
    // 2. Salvar sentimento
    await this.db.query(`
      INSERT INTO colaborador_sentimentos (
        colaborador_id, sentimento, intensidade, origem, mensagem_analisada
      ) VALUES ($1, $2, $3, $4, $5)
    `, [userId, sentimento.tipo, sentimento.intensidade, 'durante_conversa', mensagem]);
    
    // 3. Determinar intenção
    const intencao = await this.detectarIntencao(mensagem);
    
    // 4. Processar baseado na intenção
    let contexto = {};
    
    if (intencao === 'pedir_trilhas') {
      const trilhas = await this.trailRecommender.recomendar(userId, sentimento.tipo);
      contexto.trilhas = trilhas;
    }
    
    // 5. Gerar resposta personalizada
    const resposta = await this.responsGenerator.gerar({
      mensagem,
      sentimento: sentimento.tipo,
      intencao,
      contexto
    });
    
    // 6. Retornar
    return {
      resposta,
      sentimento: sentimento.tipo,
      metadados: contexto
    };
  }
  
  async detectarIntencao(mensagem) {
    // Usa Google Gemini ou regex simples
    const prompt = `
      Detecte a intenção da mensagem:
      
      Mensagem: "${mensagem}"
      
      Intenções possíveis:
      - pedir_trilhas
      - duvida_conteudo
      - feedback
      - saudacao
      - outros
      
      Retorne apenas a intenção.
    `;
    
    const resultado = await this.gemini.complete(prompt);
    return resultado.trim();
  }
}

// Uso no endpoint
router.post('/api/ai/conversa', async (req, res) => {
  const { user_id, mensagem, canal } = req.body;
  
  const agent = new AIAgent(db, gemini);
  const resultado = await agent.processarMensagem({
    userId: user_id,
    mensagem,
    canal
  });
  
  res.json(resultado);
});
```

---

## 📊 Comparação

| Aspecto | N8N (Fase 1-3) | Produto (Fase 4+) |
|---------|---------------|-------------------|
| **Velocidade de Dev** | ⚡⚡⚡ Muito rápido | ⚡⚡ Médio |
| **Performance** | ⚡⚡ Médio (HTTP overhead) | ⚡⚡⚡ Rápido |
| **Escalabilidade** | ⚡⚡ Limitada | ⚡⚡⚡ Alta |
| **Debugging** | ⚡⚡ Workflows visuais | ⚡⚡⚡ Logs + testes |
| **Versionamento** | ⚡ JSON exports | ⚡⚡⚡ Git nativo |
| **Web Chat** | ⚡ Difícil | ⚡⚡⚡ Nativo |
| **Manutenção** | ⚡⚡ Requer conhecer N8N | ⚡⚡⚡ JavaScript padrão |
| **Custo** | ⚡⚡ Servidor N8N separado | ⚡⚡⚡ Mesmo servidor |

---

## 🎯 Recomendação Final

### **Agora (Fases 1-3): N8N** ✅

**Implementar no N8N porque:**
1. Mais rápido de validar as ideias
2. Fácil de ajustar prompts e lógica
3. Menor risco
4. Aproveita infraestrutura existente

### **Depois (Fase 4): Migrar para Produto** 🚀

**Migrar quando:**
1. Features validadas e funcionando
2. Precisar de Web Chat nativo
3. Precisar escalar muito
4. Quiser reduzir custos de infraestrutura

---

## 🔄 Plano de Migração (quando chegar a hora)

### Passo 1: Criar Módulo de IA no Backend
```bash
src/services/ai-agent/
├── index.js (classe principal)
├── sentiment-analyzer.js
├── trail-recommender.js
├── note-taker.js
├── pattern-analyzer.js
└── response-generator.js
```

### Passo 2: Migrar Workflow por Workflow
1. **Semana 1:** Análise de Sentimento
2. **Semana 2:** Recomendação de Trilhas
3. **Semana 3:** Criação de Anotações
4. **Semana 4:** Análise de Padrões

### Passo 3: Testar em Paralelo
- N8N continua funcionando (fallback)
- Backend processa em paralelo
- Comparar resultados

### Passo 4: Switchover
- Redirecionar 10% do tráfego → Backend
- Monitorar 1 semana
- Aumentar para 100%
- Desligar workflows N8N

---

## 💡 Conclusão

**Para as melhorias que documentamos:**
- ✅ **Tudo será implementado no N8N primeiro**
- ✅ Backend fornece dados via API
- ✅ N8N é o "cérebro" que toma decisões
- ✅ Migração para produto é opcional e futura

**Documentação já considera isso:**
- Todos os fluxos mostram N8N como protagonista
- APIs backend são complementares
- Foco em velocidade de implementação

---

**Criado por:** Haendell Lopes + AI Assistant  
**Data:** 10 de outubro de 2025  
**Status:** ✅ Arquitetura Definida

