const WebSocket = require('ws');
const OpenAI = require('openai');
const axios = require('axios');
const PersonalizationEngine = require('./personalizationEngine');
const AdminTools = require('./adminTools');

class ChatWebSocketServer {
  constructor(server) {
    // Criar WebSocket em rota independente - NÃO interfere com N8N
    this.wss = new WebSocket.Server({ 
      server: server,
      path: '/ws/chat'  // ← NOVA rota, não afeta N8N
    });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.personalizationEngine = new PersonalizationEngine();
    this.adminTools = new AdminTools();
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
        message: response.text,
        sentiment: response.sentiment,
        toolsUsed: response.toolsUsed
      }));
      
      // 4. Análise local (não bloqueia resposta)
      this.analyzeLocally(text, userId, userContext);
    }
  }

  // Usar Personalization Engine para carregar contexto completo
  async loadUserContext(userId, pageContext = {}) {
    return await this.personalizationEngine.generateFullUserContext(userId, pageContext);
  }

  async generatePersonalizedResponse(text, userContext, context) {
    // Implementação GPT-4o direta - independente do N8N
    const messages = [
      {
        role: 'system',
        content: this.personalizationEngine.generateSystemMessage(userContext.profile, context)
      },
      // Adicionar histórico de conversas se disponível
      ...userContext.conversationHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message
      })),
      {
        role: 'user',
        content: text
      }
    ];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      tools: this.getToolDefinitions(),
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 500
    });

    return await this.processResponse(response, userContext);
  }

  getToolDefinitions() {
    return [
      // ===== FERRAMENTAS PARA COLABORADORES =====
      {
        type: 'function',
        function: {
          name: 'buscar_trilhas_disponiveis',
          description: 'Busca trilhas disponíveis para o colaborador',
          parameters: {
            type: 'object',
            properties: {
              colaborador_id: { type: 'string' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'iniciar_trilha',
          description: 'Inicia uma trilha específica para o colaborador',
          parameters: {
            type: 'object',
            properties: {
              trilha_id: { type: 'string' },
              colaborador_id: { type: 'string' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
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
        }
      },
      {
        type: 'function',
        function: {
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
      },
      
      // ===== FERRAMENTAS PARA ADMINISTRADORES (FASE 5) =====
      {
        type: 'function',
        function: {
          name: 'analisar_performance_colaboradores',
          description: 'Analisa performance e identifica colaboradores em risco de evasão',
          parameters: {
            type: 'object',
            properties: {
              departamento: { type: 'string', description: 'Departamento específico (opcional)' },
              periodo: { type: 'string', description: 'Período de análise (7d, 30d, 90d)', default: '30d' },
              criterios: { type: 'array', description: 'Critérios específicos de análise' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'gerar_relatorio_onboarding',
          description: 'Gera relatórios automáticos de onboarding (executivo, operacional, departamental)',
          parameters: {
            type: 'object',
            properties: {
              tipo_relatorio: { type: 'string', enum: ['executivo', 'operacional', 'departamental'], default: 'operacional' },
              periodo: { type: 'string', description: 'Período do relatório (7d, 30d, 90d)', default: '30d' },
              formato: { type: 'string', enum: ['resumo', 'detalhado', 'dashboard'], default: 'resumo' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'criar_alertas_personalizados',
          description: 'Cria sistema de alertas inteligentes para monitoramento proativo',
          parameters: {
            type: 'object',
            properties: {
              tipo_alerta: { type: 'string', enum: ['risco_evasao', 'trilha_atrasada', 'sentimento_negativo', 'performance_baixa'] },
              criterios: { type: 'object', description: 'Critérios específicos para o alerta' },
              frequencia: { type: 'string', enum: ['imediato', 'diario', 'semanal'], default: 'diario' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'identificar_gargalos_trilhas',
          description: 'Identifica gargalos e pontos de dificuldade em trilhas de onboarding',
          parameters: {
            type: 'object',
            properties: {
              trilha_id: { type: 'string', description: 'ID da trilha específica (opcional)' },
              analise_profunda: { type: 'boolean', description: 'Realizar análise detalhada', default: false }
            }
          }
        }
      }
    ];
  }

  async processResponse(response, userContext) {
    const responseMessage = response.choices[0].message;
    
    // Se o modelo quer usar ferramentas (nova API)
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCalls = responseMessage.tool_calls;
      const toolResults = [];
      
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        try {
          console.log(`🔧 Executando ferramenta: ${functionName}`, functionArgs);
          const toolResult = await this.executeTool(functionName, functionArgs, userContext);
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify(toolResult)
          });
        } catch (error) {
          console.error(`❌ Erro ao executar ferramenta ${functionName}:`, error);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify({ error: `Erro ao executar ${functionName}: ${error.message}` })
          });
        }
      }
      
      // Gerar resposta final com os resultados das ferramentas
      const finalResponse = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.personalizationEngine.generateSystemMessage(userContext.profile, {})
          },
          {
            role: 'user',
            content: `Resultados das ferramentas: ${JSON.stringify(toolResults)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      
      return {
        text: finalResponse.choices[0].message.content,
        sentiment: userContext.profile.sentimento_atual || 'neutro',
        toolsUsed: toolCalls.map(tc => tc.function.name)
      };
    }
    
    // Resposta direta sem ferramentas
    return {
      text: responseMessage.content,
      sentiment: userContext.profile.sentimento_atual || 'neutro',
      toolsUsed: []
    };
  }

  // Usar APIs existentes do backend - NÃO criar novas
  async executeTool(toolName, parameters, userContext) {
    switch (toolName) {
      // ===== FERRAMENTAS PARA COLABORADORES =====
      case 'buscar_trilhas_disponiveis':
        const trilhasResponse = await axios.get(`http://localhost:3000/api/agent-trilhas/colaborador/${parameters.colaborador_id}`);
        return trilhasResponse.data;
        
      case 'iniciar_trilha':
        const iniciarResponse = await axios.post('http://localhost:3000/api/agent-trilhas/iniciar', {
          trilha_id: parameters.trilha_id,
          colaborador_id: parameters.colaborador_id
        });
        return iniciarResponse.data;
        
      case 'registrar_feedback':
        const feedbackResponse = await axios.post('http://localhost:3000/api/agent-trilhas/feedback', {
          trilha_id: parameters.trilha_id,
          feedback: parameters.feedback,
          colaborador_id: parameters.colaborador_id
        });
        return feedbackResponse.data;
        
      case 'buscar_documentos':
        const docsResponse = await axios.get(`http://localhost:3000/api/documents/search?q=${parameters.query}&colaborador_id=${parameters.colaborador_id}`);
        return docsResponse.data;
        
      // ===== FERRAMENTAS PARA ADMINISTRADORES (FASE 5) =====
      case 'analisar_performance_colaboradores':
        return await this.adminTools.analisarPerformanceColaboradores(parameters);
        
      case 'gerar_relatorio_onboarding':
        return await this.adminTools.gerarRelatorioOnboarding(parameters);
        
      case 'criar_alertas_personalizados':
        return await this.adminTools.criarAlertasPersonalizados(parameters);
        
      case 'identificar_gargalos_trilhas':
        return await this.adminTools.identificarGargalosTrilhas(parameters);
        
      default:
        throw new Error(`Ferramenta não encontrada: ${toolName}`);
    }
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
    const response = await this.openai.chat.completions.create({
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
    try {
      // Usar API existente para salvar sentimento
      await axios.post('http://localhost:3000/api/sentimentos', {
        colaborador_id: userId,
        mensagem: text,
        sentimento: sentiment.sentimento,
        intensidade: sentiment.intensidade,
        urgencia: sentiment.urgencia,
        raw_analysis: JSON.stringify(sentiment)
      });
      
      // Atualizar sentimento atual do usuário
      await axios.put(`http://localhost:3000/api/users/${userId}`, {
        sentimento_atual: sentiment.sentimento,
        sentimento_intensidade: sentiment.intensidade
      });
      
    } catch (error) {
      console.error('❌ Erro ao salvar sentimento local:', error);
    }
  }
}

module.exports = ChatWebSocketServer;
