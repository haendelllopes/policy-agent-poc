const WebSocket = require('ws');
const OpenAI = require('openai');

class ChatWebSocketServer {
  constructor(server) {
    // Criar WebSocket em rota independente - NÃO interfere com N8N
    this.wss = new WebSocket.Server({ 
      server: server,
      path: '/ws/chat'  // ← NOVA rota, não afeta N8N
    });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.activeConnections = new Map();
    
    this.setupEventHandlers();
    console.log('🛡️ WebSocket Server criado em /ws/chat (independente do N8N)');
  }

  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      console.log('🔌 Nova conexão WebSocket estabelecida (Chat Flutuante)');
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('❌ Erro ao processar mensagem:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Erro interno do servidor' 
          }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 Conexão WebSocket fechada');
        this.activeConnections.delete(ws);
      });
    });
  }

  async handleMessage(ws, message) {
    const { type, userId, text, context } = message;
    
    if (type === 'chat') {
      // 1. Carregar contexto do usuário (usando APIs existentes)
      const userContext = await this.loadUserContext(userId);
      
      // 2. Gerar resposta personalizada (GPT-4o direto)
      const response = await this.generatePersonalizedResponse(text, userContext, context);
      
      // 3. Enviar resposta
      ws.send(JSON.stringify({
        type: 'response',
        message: response.message,
        sentiment: response.sentiment,
        toolsUsed: response.toolsUsed
      }));
      
      // 4. Análise local (não bloqueia resposta)
      this.analyzeLocally(text, userId, userContext);
      
      // 5. Análise background (assíncrona - Fase 3)
      this.performBackgroundAnalysis(userId, text, context)
        .catch(error => console.error('❌ Erro análise background:', error));
    }
  }

  // Usar APIs existentes do backend - NÃO criar novas
  async loadUserContext(userId) {
    const axios = require('axios');
    try {
      const response = await axios.get(`http://localhost:3000/api/agent/trilhas/colaborador/${userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao carregar contexto:', error);
      return { id: userId, name: 'Usuário' };
    }
  }

  async generatePersonalizedResponse(text, userContext, context) {
    // Implementação GPT-4o direta - independente do N8N
    const messages = [
      {
        role: 'system',
        content: this.generateSystemMessage(userContext, context)
      },
      {
        role: 'user',
        content: text
      }
    ];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      functions: this.getToolDefinitions(),
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 500
    });

    return await this.processResponse(response, userContext);
  }

  // Análise local - não depende do N8N
  async analyzeLocally(text, userId, userContext) {
    setImmediate(async () => {
      try {
        // Análise completa de sentimento local (mantém personalização)
        const sentiment = await this.analyzeSentimentLocal(text);
        
        // Salvar no banco usando APIs existentes
        await this.saveSentimentLocal(userId, text, sentiment);
        
        console.log('✅ Análise local concluída:', sentiment);
      } catch (error) {
        console.error('❌ Erro na análise local:', error);
      }
    });
  }

  // Análise de sentimento local completa (mantém personalização)
  async analyzeSentimentLocal(text) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: `Analise o sentimento da mensagem e determine se precisa de anotação.
        
        Responda em JSON:
        {
          "sentimento": "muito_positivo|positivo|neutro|negativo|muito_negativo",
          "intensidade": 0.85,
          "urgencia": "baixa|media|alta|critica",
          "requiresNote": true/false,
          "categoria": "feedback_trilha|dificuldade|sugestao|observacao",
          "tags": ["tag1", "tag2"]
        }`
      }, {
        role: 'user',
        content: text
      }],
      temperature: 0
    });
    
    return JSON.parse(response.choices[0].message.content);
  }

  // Salvar sentimento local (mantém personalização)
  async saveSentimentLocal(userId, text, sentiment) {
    const axios = require('axios');
    
    try {
      // Usar API existente para salvar sentimento
      await axios.post('http://localhost:3000/api/agent/sentiment', {
        colaborador_id: userId,
        mensagem: text,
        sentimento: sentiment.sentimento,
        intensidade: sentiment.intensidade,
        urgencia: sentiment.urgencia,
        raw_analysis: JSON.stringify(sentiment)
      });
      
      // Atualizar sentimento atual do usuário
      await axios.put(`http://localhost:3000/api/users/${userId}/sentiment`, {
        sentimento_atual: sentiment.sentimento,
        sentimento_intensidade: sentiment.intensidade
      });
      
    } catch (error) {
      console.error('❌ Erro ao salvar sentimento local:', error);
    }
  }

  generateSystemMessage(userContext, pageContext) {
    const { name, position, department, sentimento_atual, sentimento_intensidade } = userContext;
    
    // Determinar tom baseado no sentimento
    const toneConfig = this.getToneBySentiment(sentimento_atual);
    
    return `Você é o **Navi**, assistente de onboarding inteligente e proativo.

🎯 **CONTEXTO ATUAL:**
- **Colaborador:** ${name}
- **Cargo:** ${position}
- **Departamento:** ${department}
- **Sentimento:** ${sentimento_atual} (${sentimento_intensidade}%)
- **Página atual:** ${pageContext?.page || 'Dashboard'}

🎭 **TOM DE VOZ:** ${toneConfig.tom} ${toneConfig.emoji}

${sentimento_atual?.includes('negativo') ? `
⚠️ **ATENÇÃO - SENTIMENTO NEGATIVO:**
- Seja EXTRA empático e acolhedor
- Ouça ativamente e valide os sentimentos
- Ofereça ajuda IMEDIATA e CONCRETA
` : ''}

🔧 **SUAS FERRAMENTAS:**
1. buscar_trilhas_disponiveis - Lista trilhas do colaborador
2. iniciar_trilha - Inicia trilha específica
3. registrar_feedback - Registra feedback sobre trilhas
4. buscar_documentos - Busca semântica em documentos

SEMPRE use as ferramentas quando apropriado e seja proativo!`;
  }

  getToneBySentiment(sentimento) {
    const tones = {
      'muito_positivo': { tom: 'ENTUSIASMADO e CELEBRATIVO', emoji: '🎉' },
      'positivo': { tom: 'MOTIVADOR e ENCORAJADOR', emoji: '👏' },
      'neutro': { tom: 'PROFISSIONAL, CLARO e PRESTATIVO', emoji: '✨' },
      'negativo': { tom: 'EMPÁTICO e COMPREENSIVO', emoji: '🤝' },
      'muito_negativo': { tom: 'EXTREMAMENTE EMPÁTICO e ACOLHEDOR', emoji: '💙' }
    };
    return tones[sentimento] || tones['neutro'];
  }

  getToolDefinitions() {
    return [
      {
        name: 'buscar_trilhas_disponiveis',
        description: 'Busca trilhas disponíveis para o colaborador',
        parameters: {
          type: 'object',
          properties: {
            colaborador_id: { type: 'string' }
          }
        }
      },
      {
        name: 'iniciar_trilha',
        description: 'Inicia uma trilha específica para o colaborador',
        parameters: {
          type: 'object',
          properties: {
            trilha_id: { type: 'string' },
            colaborador_id: { type: 'string' }
          }
        }
      },
      {
        name: 'registrar_feedback',
        description: 'Registra feedback sobre trilhas',
        parameters: {
          type: 'object',
          properties: {
            trilha_id: { type: 'string' },
            feedback: { type: 'string' },
            colaborador_id: { type: 'string' }
          }
        }
      },
      {
        name: 'buscar_documentos',
        description: 'Busca semântica em documentos corporativos',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            colaborador_id: { type: 'string' }
          }
        }
      }
    ];
  }

  async processResponse(response, userContext) {
    const message = response.choices[0].message;
    
    // Se há function calls, executar as ferramentas
    if (message.function_calls) {
      const toolResults = [];
      
      for (const toolCall of message.function_calls) {
        try {
          const result = await this.executeTool(toolCall.function.name, JSON.parse(toolCall.function.arguments), userContext);
          toolResults.push({
            tool: toolCall.function.name,
            result: result
          });
        } catch (error) {
          console.error(`❌ Erro ao executar ferramenta ${toolCall.function.name}:`, error);
        }
      }
      
      return {
        text: message.content || 'Ferramentas executadas com sucesso!',
        sentiment: 'neutro',
        toolsUsed: toolResults
      };
    }
    
    return {
      text: message.content,
      sentiment: 'neutro',
      toolsUsed: []
    };
  }

  // Usar APIs existentes do backend - NÃO criar novas
  async executeTool(toolName, parameters, userContext) {
    const axios = require('axios');
    
    switch (toolName) {
      case 'buscar_trilhas_disponiveis':
        const trilhasResponse = await axios.get(`http://localhost:3000/api/agent/trilhas/disponiveis/${parameters.colaborador_id}`);
        return trilhasResponse.data;
        
      case 'iniciar_trilha':
        const iniciarResponse = await axios.post('http://localhost:3000/api/agent/trilhas/iniciar', {
          trilha_id: parameters.trilha_id,
          colaborador_id: parameters.colaborador_id
        });
        return iniciarResponse.data;
        
      case 'registrar_feedback':
        const feedbackResponse = await axios.post('http://localhost:3000/api/agent/trilhas/feedback', {
          trilha_id: parameters.trilha_id,
          feedback: parameters.feedback,
          colaborador_id: parameters.colaborador_id
        });
        return feedbackResponse.data;
        
      case 'buscar_documentos':
        const docsResponse = await axios.get(`http://localhost:3000/api/documents/search?q=${parameters.query}&colaborador_id=${parameters.colaborador_id}`);
        return docsResponse.data;
        
      default:
        throw new Error(`Ferramenta não encontrada: ${toolName}`);
    }
  }

  /**
   * Análise background assíncrona - Fase 3
   * Chama o endpoint de análise background sem bloquear a resposta
   */
  async performBackgroundAnalysis(userId, message, context) {
    try {
      const axios = require('axios');
      
      console.log(`🔍 Iniciando análise background para ${userId}`);
      
      await axios.post('http://localhost:3000/api/chat/analyze-background', {
        message,
        userId,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
          source: 'websocket_chat'
        }
      }, {
        timeout: 10000, // 10 segundos timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Análise background concluída para ${userId}`);
    } catch (error) {
      console.error(`❌ Erro na análise background para ${userId}:`, error.message);
      // Não re-throw para não quebrar o fluxo principal
    }
  }
}

module.exports = ChatWebSocketServer;