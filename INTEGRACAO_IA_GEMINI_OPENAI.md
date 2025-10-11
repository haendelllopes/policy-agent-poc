# 🤖 Integração de IA - Gemini vs OpenAI

**Data:** 10 de outubro de 2025  
**Versão:** 1.0

---

## 🎯 Opções de IA Disponíveis

### 1. **Google Gemini** (Recomendado) ⭐
### 2. **OpenAI (GPT-4/GPT-3.5)**
### 3. **Ambos em Conjunto** (Best of Both Worlds)

---

## 📊 Comparação Rápida

| Aspecto | Google Gemini | OpenAI GPT-4 |
|---------|--------------|--------------|
| **Custo** | 💰💰 Mais barato | 💰💰💰 Mais caro |
| **Velocidade** | ⚡⚡⚡ Muito rápido | ⚡⚡ Médio |
| **Qualidade** | ⭐⭐⭐⭐ Excelente | ⭐⭐⭐⭐⭐ Top |
| **Contexto** | 1M tokens (Gemini 1.5) | 128K tokens (GPT-4) |
| **Multimodal** | ✅ Nativo (texto+imagem+vídeo) | ✅ Texto + imagem |
| **Idiomas** | ✅ Excelente em PT-BR | ✅ Muito bom em PT-BR |
| **N8N** | ✅ Nó nativo | ✅ Nó nativo |
| **API** | Google Cloud / AI Studio | OpenAI Platform |
| **Grátis** | ✅ Tier gratuito generoso | ❌ Só pago |

---

## 💰 Comparação de Custos

### Análise de Sentimento (tarefa típica)

**Cenário:** 1000 colaboradores, 20 mensagens/dia cada, 30 dias

**Total:** 600.000 mensagens/mês

#### Com Google Gemini 1.5 Flash (Recomendado)

```
Input: ~100 tokens/mensagem
Output: ~50 tokens/resposta

Custo Gemini 1.5 Flash:
- Input: $0.075 / 1M tokens
- Output: $0.30 / 1M tokens

Cálculo:
- Input: (600k × 100) / 1M × $0.075 = $4.50
- Output: (600k × 50) / 1M × $0.30 = $9.00

Total: ~$13.50/mês ✅
```

#### Com OpenAI GPT-3.5 Turbo

```
Custo GPT-3.5 Turbo:
- Input: $0.50 / 1M tokens
- Output: $1.50 / 1M tokens

Cálculo:
- Input: (600k × 100) / 1M × $0.50 = $30.00
- Output: (600k × 50) / 1M × $1.50 = $45.00

Total: ~$75/mês ⚠️
```

#### Com OpenAI GPT-4o

```
Custo GPT-4o:
- Input: $2.50 / 1M tokens
- Output: $10.00 / 1M tokens

Cálculo:
- Input: (600k × 100) / 1M × $2.50 = $150.00
- Output: (600k × 50) / 1M × $10.00 = $300.00

Total: ~$450/mês 💸
```

**Resultado:** Gemini é **5-30x mais barato!** 🎉

---

## 🎯 Recomendação de Uso

### **Opção 1: 100% Gemini** (Mais barato) 💰

```
Todas as tarefas com Gemini:
✅ Análise de sentimento → Gemini 1.5 Flash
✅ Geração de respostas → Gemini 1.5 Flash
✅ Extração de contexto → Gemini 1.5 Flash
✅ Análise de padrões → Gemini 1.5 Pro
✅ Geração de melhorias → Gemini 1.5 Pro

Custo estimado: $15-30/mês
```

---

### **Opção 2: Híbrido (Gemini + OpenAI)** (Equilíbrio) ⚖️

```
Tarefas simples → Gemini 1.5 Flash (barato e rápido)
✅ Análise de sentimento
✅ Extração de tags
✅ Detecção de intenção

Tarefas complexas → GPT-4o (mais preciso)
✅ Geração de melhorias complexas
✅ Análise de padrões sofisticados
✅ Respostas muito contextualizadas

Custo estimado: $40-80/mês
```

---

### **Opção 3: 100% OpenAI** (Mais qualidade) ⭐

```
Todas as tarefas com OpenAI:
✅ Análise de sentimento → GPT-3.5 Turbo
✅ Geração de respostas → GPT-4o
✅ Análise de padrões → GPT-4o
✅ Geração de melhorias → GPT-4o

Custo estimado: $200-500/mês
```

---

## 🔧 Implementação no N8N

### 1. Análise de Sentimento com Gemini

#### Passo 1: Criar Credencial do Gemini

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma API Key
3. No N8N: Credentials → Add → Google Gemini
4. Cole a API Key

#### Passo 2: Node do Gemini no N8N

```
┌────────────────────────────────────────┐
│  Google Gemini Chat Model             │
├────────────────────────────────────────┤
│  Model: gemini-1.5-flash               │
│  Messages:                             │
│    System: Você é um analisador...    │
│    User: {{ $json.mensagem }}         │
│  Options:                              │
│    Temperature: 0.3                    │
│    Max Tokens: 150                     │
│    Response Format: JSON               │
└────────────────────────────────────────┘
```

#### Prompt para Análise de Sentimento

```javascript
// System Message
`Você é um analisador de sentimentos especializado em onboarding.

Analise a mensagem do colaborador e retorne um JSON com:
- sentimento: "muito_positivo" | "positivo" | "neutro" | "negativo" | "muito_negativo"
- intensidade: número de 0.00 a 1.00
- fatores_detectados: {
    palavras_chave: array de strings,
    tom: string,
    emojis: array de emojis encontrados
  }

Seja preciso e considere o contexto de onboarding empresarial.`

// User Message
`Mensagem do colaborador: "${mensagem}"`

// Resposta esperada (JSON)
{
  "sentimento": "negativo",
  "intensidade": 0.72,
  "fatores_detectados": {
    "palavras_chave": ["difícil", "não sei", "conseguir"],
    "tom": "inseguro",
    "emojis": ["😕"]
  }
}
```

---

### 2. Geração de Respostas com Gemini

```javascript
// System Message
`Você é o assistente virtual Flowly, especializado em onboarding.

Você deve:
- Ser empático e acolhedor
- Adaptar o tom baseado no sentimento do colaborador
- Ser objetivo e claro
- Usar emojis moderadamente

Sentimento atual do colaborador: ${sentimento}

Regras por sentimento:
- muito_negativo: Muito empático, oferecer ajuda imediata
- negativo: Compreensivo, dar suporte
- neutro: Profissional padrão
- positivo: Motivador, reconhecer esforço
- muito_positivo: Celebrativo, parabenizar`

// User Message
`Colaborador perguntou: "${mensagem}"

${trilhasRecomendadas ? `Trilhas disponíveis: ${JSON.stringify(trilhas)}` : ''}`

// Resposta será gerada pelo Gemini
```

---

### 3. Workflow N8N Completo com Gemini

```
┌─────────────────────────────────────────────────────────┐
│                  WORKFLOW: Conversa IA                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1️⃣ Webhook Trigger                                     │
│     ↓                                                    │
│  2️⃣ HTTP Request - Buscar Dados do Usuário             │
│     GET /api/users/{{$json.user_id}}                    │
│     ↓                                                    │
│  3️⃣ Google Gemini - Análise de Sentimento              │
│     Model: gemini-1.5-flash                             │
│     Prompt: Analisar sentimento da mensagem             │
│     ↓                                                    │
│  4️⃣ Code - Parse JSON do Gemini                        │
│     ↓                                                    │
│  5️⃣ HTTP Request - Salvar Sentimento                   │
│     POST /api/sentimentos                               │
│     ↓                                                    │
│  6️⃣ Switch - Detectar Intenção                         │
│     ├─ Pediu trilhas → 7A                              │
│     ├─ Dúvida → 7B                                     │
│     └─ Feedback → 7C                                   │
│     ↓                                                    │
│  7A️⃣ HTTP Request - Buscar Trilhas Recomendadas        │
│     GET /api/trilhas/recomendadas/{{user_id}}          │
│     ↓                                                    │
│  8️⃣ Google Gemini - Gerar Resposta                     │
│     Model: gemini-1.5-flash                             │
│     Context: Sentimento + Trilhas                       │
│     ↓                                                    │
│  9️⃣ WhatsApp - Enviar Mensagem                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 Código de Integração

### Gemini via API REST (alternativa ao N8N)

```javascript
// src/services/gemini-service.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  
  async analisarSentimento(mensagem) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Analise o sentimento desta mensagem de onboarding e retorne JSON:
      
      Mensagem: "${mensagem}"
      
      Formato de resposta:
      {
        "sentimento": "muito_positivo|positivo|neutro|negativo|muito_negativo",
        "intensidade": 0.00-1.00,
        "fatores_detectados": {
          "palavras_chave": [],
          "tom": "",
          "emojis": []
        }
      }
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Resposta inválida do Gemini');
  }
  
  async gerarResposta({ mensagem, sentimento, contexto }) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const systemPrompt = `
      Você é o assistente Flowly de onboarding.
      Sentimento do colaborador: ${sentimento}
      Adapte o tom conforme o sentimento.
    `;
    
    const userPrompt = `
      ${systemPrompt}
      
      Colaborador: "${mensagem}"
      
      ${contexto.trilhas ? `Trilhas disponíveis: ${JSON.stringify(contexto.trilhas)}` : ''}
      
      Gere uma resposta empática e útil.
    `;
    
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    
    return response.text();
  }
  
  async extrairTags(anotacao) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Extraia tags relevantes desta anotação de onboarding:
      
      "${anotacao}"
      
      Retorne um array JSON de tags (máx 5):
      ["tag1", "tag2", "tag3"]
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  }
  
  async analisarPadroes(anotacoes) {
    const model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro" // Pro para análises mais complexas
    });
    
    const prompt = `
      Analise estes feedbacks de onboarding e identifique padrões:
      
      ${anotacoes.map(a => `- ${a.titulo}: ${a.anotacao}`).join('\n')}
      
      Retorne JSON com:
      {
        "padroes_identificados": [
          {
            "titulo": "",
            "descricao": "",
            "frequencia": 0,
            "impacto": "baixo|medio|alto"
          }
        ],
        "sugestoes_melhoria": [
          {
            "titulo": "",
            "descricao": "",
            "prioridade": "baixa|media|alta|critica",
            "impacto_estimado": "baixo|medio|alto|muito_alto"
          }
        ]
      }
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Resposta inválida do Gemini');
  }
}

module.exports = GeminiService;
```

### Uso no Backend

```javascript
// src/routes/ai.js

const GeminiService = require('../services/gemini-service');
const gemini = new GeminiService();

router.post('/api/ai/conversa', async (req, res) => {
  const { user_id, mensagem } = req.body;
  
  try {
    // 1. Analisar sentimento
    const sentimento = await gemini.analisarSentimento(mensagem);
    
    // 2. Salvar sentimento no banco
    await db.query(`
      INSERT INTO colaborador_sentimentos (...)
      VALUES (...)
    `, [user_id, sentimento.sentimento, sentimento.intensidade]);
    
    // 3. Buscar trilhas recomendadas
    const trilhas = await db.query(`
      SELECT * FROM buscar_trilhas_por_sentimento($1, $2, 3)
    `, [user_id, sentimento.sentimento]);
    
    // 4. Gerar resposta
    const resposta = await gemini.gerarResposta({
      mensagem,
      sentimento: sentimento.sentimento,
      contexto: { trilhas: trilhas.rows }
    });
    
    res.json({
      resposta,
      sentimento: sentimento.sentimento,
      trilhas: trilhas.rows
    });
    
  } catch (error) {
    console.error('Erro ao processar conversa:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem' });
  }
});
```

---

## 📦 Dependências

### Para usar Gemini no Node.js

```bash
npm install @google/generative-ai
```

```javascript
// package.json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0"
  }
}
```

### Variáveis de Ambiente

```bash
# .env
GEMINI_API_KEY=AIzaSy...
```

---

## 🎯 Estratégia Híbrida (Recomendado)

### Usar Gemini para:
✅ **Análise de Sentimento** (rápido e barato)  
✅ **Geração de Respostas Simples** (conversas do dia a dia)  
✅ **Extração de Tags** (processamento rápido)  
✅ **Classificação de Intenção** (simples)  

### Usar OpenAI para:
✅ **Análise de Padrões Complexos** (quando precisar de mais contexto)  
✅ **Geração de Melhorias Detalhadas** (mais criativo)  
✅ **Respostas Muito Contextualizadas** (casos especiais)  

### Código de Decisão

```javascript
class AIRouter {
  constructor() {
    this.gemini = new GeminiService();
    this.openai = new OpenAIService();
  }
  
  async analisarSentimento(mensagem) {
    // Sempre usar Gemini (mais barato)
    return await this.gemini.analisarSentimento(mensagem);
  }
  
  async gerarResposta({ mensagem, sentimento, complexidade }) {
    // Se simples → Gemini
    if (complexidade === 'simples' || complexidade === 'media') {
      return await this.gemini.gerarResposta({ mensagem, sentimento });
    }
    
    // Se complexa → OpenAI
    return await this.openai.gerarResposta({ mensagem, sentimento });
  }
  
  async analisarPadroes(anotacoes) {
    // Se poucas anotações → Gemini
    if (anotacoes.length < 10) {
      return await this.gemini.analisarPadroes(anotacoes);
    }
    
    // Se muitas anotações → OpenAI (contexto maior)
    return await this.openai.analisarPadroes(anotacoes);
  }
}
```

---

## 🔒 Segurança

### Gemini
```javascript
// Proteger API Key
process.env.GEMINI_API_KEY

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100 // max 100 requests por minuto
});
```

### OpenAI
```javascript
// Proteger API Key
process.env.OPENAI_API_KEY

// Mesmas práticas de rate limiting
```

---

## 📊 Monitoramento de Custos

### Dashboard de Uso

```javascript
// src/services/ai-usage-tracker.js

class AIUsageTracker {
  async track(provider, operation, tokens) {
    await db.query(`
      INSERT INTO ai_usage_log (
        provider, operation, tokens_used, cost_usd, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
    `, [
      provider, // 'gemini' ou 'openai'
      operation, // 'sentiment', 'response', 'pattern'
      tokens,
      this.calculateCost(provider, tokens)
    ]);
  }
  
  calculateCost(provider, tokens) {
    const costs = {
      'gemini-flash': 0.075 / 1000000, // por token
      'gemini-pro': 1.25 / 1000000,
      'gpt-3.5': 0.50 / 1000000,
      'gpt-4o': 2.50 / 1000000
    };
    
    return tokens * costs[provider];
  }
  
  async getMonthlyReport() {
    const result = await db.query(`
      SELECT 
        provider,
        SUM(tokens_used) as total_tokens,
        SUM(cost_usd) as total_cost,
        COUNT(*) as total_requests
      FROM ai_usage_log
      WHERE created_at >= DATE_TRUNC('month', NOW())
      GROUP BY provider
    `);
    
    return result.rows;
  }
}
```

---

## ✅ Recomendação Final

### **Para o Flowly: Use Gemini!** 🎯

**Motivos:**
1. ✅ **Custo 5-30x menor**
2. ✅ **Qualidade excelente** para as tarefas necessárias
3. ✅ **Português nativo** muito bom
4. ✅ **Contexto gigante** (1M tokens no Gemini 1.5)
5. ✅ **Tier gratuito** para testar
6. ✅ **Integração fácil** com N8N

### Setup Inicial Recomendado:

```
🎯 Análise de Sentimento: Gemini 1.5 Flash
🎯 Geração de Respostas: Gemini 1.5 Flash  
🎯 Extração de Tags: Gemini 1.5 Flash
🎯 Análise de Padrões: Gemini 1.5 Pro

Custo estimado: $15-30/mês
Performance: Excelente
Qualidade: Muito boa
```

### Se precisar de mais qualidade depois:
Adicione OpenAI GPT-4o para casos específicos (análises muito complexas).

---

**Criado por:** Haendell Lopes + AI Assistant  
**Data:** 10 de outubro de 2025  
**Status:** ✅ Pronto para Implementação




