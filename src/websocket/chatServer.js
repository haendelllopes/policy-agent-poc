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
    this.adminConnections = new Map(); // Map<adminId, Set<WebSocket>>
    
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
      
      // 1.1. Se for admin, registrar para notificações de urgência
      if (userContext.role === 'admin') {
        this.registerAdminConnection(userId, ws);
      }
      
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
    const { name, position, department, sentimento_atual, sentimento_intensidade, gestor_nome, buddy_nome } = userContext;
    
    // Determinar tom baseado no sentimento
    const toneConfig = this.getToneBySentiment(sentimento_atual);
    
    return `Você é o **Navi**, assistente de onboarding inteligente e proativo.

🎯 **CONTEXTO ATUAL:**
- **Colaborador:** ${name}
- **Cargo:** ${position}
- **Departamento:** ${department}
${gestor_nome ? `- **Gestor:** ${gestor_nome}` : ''}
${buddy_nome ? `- **Buddy:** ${buddy_nome}` : ''}
- **Sentimento:** ${sentimento_atual} (${sentimento_intensidade}%)
- **Página atual:** ${pageContext?.page || 'Dashboard'}

🎭 **TOM DE VOZ:** ${toneConfig.tom} ${toneConfig.emoji}

🎯 **COMPORTAMENTO RELACIONAL (MUITO IMPORTANTE):**
- SEMPRE demonstre interesse genuíno quando o colaborador compartilhar informações pessoais
- Faça perguntas de follow-up sobre interesses, hobbies, experiências compartilhadas
- NÃO mude abruptamente de assunto quando o colaborador estiver compartilhando algo pessoal
- Se o colaborador mencionar hobbies, interesses, experiências ou qualquer informação pessoal:
  * Faça pelo menos 2-3 perguntas relacionadas ao que foi compartilhado
  * Demonstre curiosidade genuína
  * Conecte-se emocionalmente ANTES de sugerir trilhas ou processos
  * Use essas informações para personalizar sua ajuda posteriormente
- Exemplo: Se o colaborador disser "gosto de jogos e música":
  * PERFEITO: "Que legal! Que tipo de jogos você curte? E música, tem algum estilo preferido? [após respostas, continuar engajando] Você já conheceu alguém da empresa que também gosta dessas coisas? Posso te ajudar com as trilhas também quando quiser!"
  * ERRADO: "Que bom! Aqui na empresa temos trilhas de onboarding disponíveis. Posso buscar para você?"
- O OBJETIVO é criar conexão humana ANTES de direcionar para tarefas e trilhas

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
      },
      {
        name: 'buscar_conteudo_trilhas',
        description: 'Busca semântica inteligente nos conteúdos das trilhas para responder dúvidas específicas',
        parameters: {
          type: 'object',
          properties: {
            query: { 
              type: 'string',
              description: 'Pergunta ou dúvida sobre conteúdo das trilhas (ex: "Como fazer login?", "O que é onboarding?")'
            },
            colaborador_id: { type: 'string' },
            trilha_id: { 
              type: 'string',
              description: 'ID da trilha específica para buscar (opcional)'
            },
            limit: { 
              type: 'number',
              description: 'Número máximo de resultados (padrão: 5)'
            }
          },
          required: ['query', 'colaborador_id']
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
        
      case 'buscar_conteudo_trilhas':
        const limit = parameters.limit || 5;
        let url = `http://localhost:3000/api/agent/trilhas/buscar-conteudo?query=${encodeURIComponent(parameters.query)}&limit=${limit}`;
        
        // Adicionar tenant do contexto do usuário
        if (userContext && userContext.tenantId) {
          url += `&tenant=${userContext.tenantId}`;
        }
        
        // Adicionar filtro de trilha se especificado
        if (parameters.trilha_id) {
          url += `&trilha_id=${parameters.trilha_id}`;
        }
        
        const conteudoResponse = await axios.get(url);
        return conteudoResponse.data;
        
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

  // ============================================
  // MÉTODOS PARA GERENCIAR CONEXÕES DE ADMIN
  // ============================================

  /**
   * Registrar conexão de admin para notificações de urgência
   */
  registerAdminConnection(adminId, ws) {
    if (!this.adminConnections.has(adminId)) {
      this.adminConnections.set(adminId, new Set());
    }
    this.adminConnections.get(adminId).add(ws);
    
    console.log(`👑 Admin ${adminId} registrado para notificações de urgência`);
    
    // Remover quando desconectar
    ws.on('close', () => {
      const connections = this.adminConnections.get(adminId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          this.adminConnections.delete(adminId);
          console.log(`👑 Admin ${adminId} desconectado - removido das notificações`);
        }
      }
    });
  }

  /**
   * Buscar conexões ativas de um admin
   */
  getAdminConnections(adminId) {
    const connections = this.adminConnections.get(adminId);
    return connections ? Array.from(connections) : [];
  }

  /**
   * Verificar se admin está conectado
   */
  isAdminConnected(adminId) {
    const connections = this.adminConnections.get(adminId);
    return connections && connections.size > 0;
  }

  /**
   * Listar todos os admins conectados
   */
  getConnectedAdmins() {
    const connectedAdmins = [];
    for (const [adminId, connections] of this.adminConnections) {
      if (connections.size > 0) {
        connectedAdmins.push({
          admin_id: adminId,
          connections: connections.size
        });
      }
    }
    return connectedAdmins;
  }
}

module.exports = ChatWebSocketServer;