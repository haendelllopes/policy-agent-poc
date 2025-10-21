const OpenAI = require('openai');
const PersonalizationEngine = require('./personalizationEngine');

class GPTChatService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.personalizationEngine = new PersonalizationEngine();
  }

  getBaseUrl() {
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1';
    
    if (isProduction) {
      return 'https://navigator-gules.vercel.app';
    }
    
    return 'http://localhost:3000';
  }

  async generateResponse(message, userContext, pageContext) {
    // 1. Preparar mensagens para OpenAI
    const systemMessage = await this.personalizationEngine.generateSystemMessage(userContext, pageContext);
    const messages = [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: message
      }
    ];

    // 2. Chamar OpenAI com function calling
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      functions: this.getToolDefinitions(),
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 500
    });

    // 3. Processar resposta e executar ferramentas se necessário
    const result = await this.processResponse(response, userContext);
    
    return result;
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
        name: 'finalizar_trilha',
        description: 'Finaliza uma trilha específica para o colaborador',
        parameters: {
          type: 'object',
          properties: {
            trilha_id: { type: 'string' },
            colaborador_id: { type: 'string' }
          }
        }
      },
      {
        name: 'reiniciar_trilha',
        description: 'Reinicia uma trilha específica para o colaborador',
        parameters: {
          type: 'object',
          properties: {
            trilha_id: { type: 'string' },
            colaborador_id: { type: 'string' }
          }
        }
      },
      {
        name: 'criar_anotacao',
        description: 'Cria uma anotação do agente baseada na conversa',
        parameters: {
          type: 'object',
          properties: {
            colaborador_id: { type: 'string' },
            trilha_id: { type: 'string', optional: true },
            tipo: { type: 'string' },
            titulo: { type: 'string' },
            anotacao: { type: 'string' },
            sentimento: { type: 'string' },
            intensidade_sentimento: { type: 'number' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      {
        name: 'registrar_sentimento',
        description: 'Registra sentimento do colaborador durante a conversa',
        parameters: {
          type: 'object',
          properties: {
            colaborador_id: { type: 'string' },
            sentimento: { type: 'string' },
            intensidade: { type: 'number' },
            origem: { type: 'string' },
            mensagem_analisada: { type: 'string' },
            fatores_detectados: { type: 'object' },
            trilha_id: { type: 'string', optional: true }
          }
        }
      },
      {
        name: 'gerar_melhoria',
        description: 'Gera uma sugestão de melhoria baseada em padrões identificados',
        parameters: {
          type: 'object',
          properties: {
            categoria: { type: 'string' },
            prioridade: { type: 'string' },
            titulo: { type: 'string' },
            descricao: { type: 'string' },
            contexto: { type: 'object' },
            dados_analise: { type: 'object' },
            impacto_estimado: { type: 'string' },
            esforco_estimado: { type: 'string' }
          }
        }
      }
    ];
  }

  // Usar APIs existentes do backend - NÃO criar novas
  async executeTool(toolName, parameters, userContext) {
    const axios = require('axios');
    const baseUrl = this.getBaseUrl();
    
    // Extrair tenant_id do contexto do usuário
    const tenantId = userContext?.tenant_id || '5978f911-738b-4aae-802a-f037fdac2e64'; // Tenant padrão
    
    switch (toolName) {
      case 'buscar_trilhas_disponiveis':
        const trilhasResponse = await axios.get(`${baseUrl}/api/agent/trilhas/disponiveis/${parameters.colaborador_id}?tenant_id=${tenantId}`);
        return trilhasResponse.data;
        
      case 'iniciar_trilha':
        const iniciarResponse = await axios.post(`${baseUrl}/api/agent/trilhas/iniciar?tenant_id=${tenantId}`, {
          trilha_id: parameters.trilha_id,
          colaborador_id: parameters.colaborador_id
        });
        return iniciarResponse.data;
        
      case 'registrar_feedback':
        const feedbackResponse = await axios.post(`${baseUrl}/api/agent/trilhas/feedback`, {
          trilha_id: parameters.trilha_id,
          feedback: parameters.feedback,
          colaborador_id: parameters.colaborador_id
        });
        return feedbackResponse.data;
        
      case 'buscar_documentos':
        const docsResponse = await axios.get(`${baseUrl}/api/documents/search?q=${parameters.query}&colaborador_id=${parameters.colaborador_id}`);
        return docsResponse.data;
        
      case 'finalizar_trilha':
        const finalizarResponse = await axios.post(`${baseUrl}/api/agent/trilhas/finalizar`, {
          trilha_id: parameters.trilha_id,
          colaborador_id: parameters.colaborador_id,
          tenant_id: tenantId
        });
        return finalizarResponse.data;
        
      case 'reiniciar_trilha':
        const reiniciarResponse = await axios.post(`${baseUrl}/api/agent/trilhas/reativar`, {
          trilha_id: parameters.trilha_id,
          colaborador_id: parameters.colaborador_id,
          tenant_id: tenantId
        });
        return reiniciarResponse.data;
        
      case 'criar_anotacao':
        const anotacaoResponse = await axios.post(`${baseUrl}/api/agente/anotacoes`, {
          colaborador_id: parameters.colaborador_id,
          trilha_id: parameters.trilha_id,
          tipo: parameters.tipo,
          titulo: parameters.titulo,
          anotacao: parameters.anotacao,
          sentimento: parameters.sentimento,
          intensidade_sentimento: parameters.intensidade_sentimento,
          tags: parameters.tags,
          contexto: {
            origem: 'websocket_chat',
            momento_onboarding: 'durante_conversa'
          }
        });
        return anotacaoResponse.data;
        
      case 'registrar_sentimento':
        const sentimentoResponse = await axios.post(`${baseUrl}/api/sentimentos`, {
          colaborador_id: parameters.colaborador_id,
          sentimento: parameters.sentimento,
          intensidade: parameters.intensidade,
          origem: parameters.origem,
          mensagem_analisada: parameters.mensagem_analisada,
          fatores_detectados: parameters.fatores_detectados,
          trilha_id: parameters.trilha_id
        });
        return sentimentoResponse.data;
        
      case 'gerar_melhoria':
        const melhoriaResponse = await axios.post(`${baseUrl}/api/ai/improvements`, {
          categoria: parameters.categoria,
          prioridade: parameters.prioridade,
          titulo: parameters.titulo,
          descricao: parameters.descricao,
          contexto: parameters.contexto,
          dados_analise: parameters.dados_analise,
          impacto_estimado: parameters.impacto_estimado,
          esforco_estimado: parameters.esforco_estimado
        });
        return melhoriaResponse.data;
        
      default:
        throw new Error(`Ferramenta não encontrada: ${toolName}`);
    }
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
        message: message.content || 'Ferramentas executadas com sucesso!',
        sentiment: 'neutro',
        toolsUsed: toolResults
      };
    }
    
    return {
      message: message.content,
      sentiment: 'neutro',
      toolsUsed: []
    };
  }
}

module.exports = GPTChatService;
