class PersonalizationEngine {
  // Detectar URL base baseada no ambiente
  getBaseUrl() {
    // Detectar ambiente de forma mais robusta
    const isProduction = process.env.VERCEL || 
                        process.env.NODE_ENV === 'production' ||
                        process.env.VERCEL_URL ||
                        process.env.VERCEL_ENV === 'production' ||
                        process.env.VERCEL_REGION; // Vercel sempre define isso em produção
    
    console.log('🔍 Detecção de ambiente:', {
      VERCEL: process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_REGION: process.env.VERCEL_REGION,
      isProduction: isProduction
    });
    
    if (isProduction) {
      // Em produção, usar URL completa do Vercel
      console.log('🌐 Usando URL de produção:', 'https://navigator-gules.vercel.app');
      return 'https://navigator-gules.vercel.app';
    }
    
    // Em desenvolvimento, usar localhost
    console.log('🌐 Usando URL de desenvolvimento:', 'http://localhost:3000');
    return 'http://localhost:3000';
  }

  // Usar APIs existentes - NÃO criar novas queries
  async loadUserContext(userId) {
    const axios = require('axios');
    
    try {
      // Detectar ambiente e usar URL apropriada
      const baseUrl = this.getBaseUrl();
      
      const fullUrl = `${baseUrl}/api/agent/trilhas/colaborador/${userId}`;
      console.log('🌐 Fazendo requisição para:', fullUrl);
      
      const response = await axios.get(fullUrl);
      console.log('📦 Contexto carregado:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao carregar contexto:', error);
      
      // Se erro de conexão, tentar com URL absoluta como fallback
      if (error.code === 'ECONNREFUSED' || error.message.includes('localhost')) {
        console.log('🔄 Tentando fallback com URL absoluta...');
        try {
          const fallbackUrl = `https://navigator-gules.vercel.app/api/agent/trilhas/colaborador/${userId}`;
          console.log('🌐 Tentando fallback:', fallbackUrl);
          const response = await axios.get(fallbackUrl);
          return response.data;
        } catch (fallbackError) {
          console.error('❌ Erro no fallback:', fallbackError);
        }
      }
      
      return { 
        id: userId, 
        name: 'Usuário',
        position: 'N/A',
        department: 'N/A',
        gestor_nome: null,
        buddy_nome: null,
        tenant_id: '5978f911-738b-4aae-802a-f037fdac2e64', // Tenant padrão quando há erro
        sentimento_atual: 'neutro',
        sentimento_intensidade: 0.5
      };
    }
  }

  // Carregar histórico de conversas do colaborador
  async loadConversationHistory(userId, limit = 10) {
    const axios = require('axios');
    
    try {
      const baseUrl = this.getBaseUrl();
      const response = await axios.get(`${baseUrl}/api/conversations/history/${userId}?limit=${limit}`);
      return response.data.messages || [];
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
      
      // Fallback para URL absoluta
      if (error.code === 'ECONNREFUSED' || error.message.includes('localhost')) {
        try {
          const fallbackUrl = `https://navigator-gules.vercel.app/api/conversations/history/${userId}?limit=${limit}`;
          const response = await axios.get(fallbackUrl);
          return response.data.messages || [];
        } catch (fallbackError) {
          console.error('❌ Erro no fallback histórico:', fallbackError);
        }
      }
      
      return [];
    }
  }

  // Carregar anotações do agente sobre o colaborador
  async loadAgentNotes(userId, limit = 5) {
    const axios = require('axios');
    
    try {
      const baseUrl = this.getBaseUrl();
      const response = await axios.get(`${baseUrl}/api/agente/anotacoes?colaborador_id=${userId}&limit=${limit}`);
      return response.data.anotacoes || [];
    } catch (error) {
      console.error('❌ Erro ao carregar anotações:', error);
      
      // Fallback para URL absoluta
      if (error.code === 'ECONNREFUSED' || error.message.includes('localhost')) {
        try {
          const fallbackUrl = `https://navigator-gules.vercel.app/api/agente/anotacoes?colaborador_id=${userId}&limit=${limit}`;
          const response = await axios.get(fallbackUrl);
          return response.data.anotacoes || [];
        } catch (fallbackError) {
          console.error('❌ Erro no fallback anotações:', fallbackError);
        }
      }
      
      return [];
    }
  }

  // Carregar histórico de sentimentos
  async loadSentimentHistory(userId, limit = 5) {
    const axios = require('axios');
    
    try {
      const baseUrl = this.getBaseUrl();
      const response = await axios.get(`${baseUrl}/api/sentimentos/history/${userId}?limit=${limit}`);
      return response.data.sentimentos || [];
    } catch (error) {
      console.error('❌ Erro ao carregar histórico de sentimentos:', error);
      
      // Fallback para URL absoluta
      if (error.code === 'ECONNREFUSED' || error.message.includes('localhost')) {
        try {
          const fallbackUrl = `https://navigator-gules.vercel.app/api/sentimentos/history/${userId}?limit=${limit}`;
          const response = await axios.get(fallbackUrl);
          return response.data.sentimentos || [];
        } catch (fallbackError) {
          console.error('❌ Erro no fallback sentimentos:', fallbackError);
        }
      }
      
      return [];
    }
  }

  // Análise de padrões históricos
  async analyzeHistoricalPatterns(userId) {
    try {
      const [conversations, notes, sentiments] = await Promise.all([
        this.loadConversationHistory(userId, 20),
        this.loadAgentNotes(userId, 10),
        this.loadSentimentHistory(userId, 10)
      ]);

      const patterns = {
        // Padrões de sentimento
        sentimentTrend: this.analyzeSentimentTrend(sentiments),
        
        // Padrões de conversa
        commonTopics: this.extractCommonTopics(conversations),
        
        // Padrões de dificuldade
        difficultyPatterns: this.identifyDifficultyPatterns(notes),
        
        // Padrões de engajamento
        engagementLevel: this.calculateEngagementLevel(conversations),
        
        // Insights gerais
        insights: this.generateInsights(conversations, notes, sentiments)
      };

      return patterns;
    } catch (error) {
      console.error('❌ Erro na análise histórica:', error);
      return {
        sentimentTrend: 'neutro',
        commonTopics: [],
        difficultyPatterns: [],
        engagementLevel: 'medio',
        insights: []
      };
    }
  }

  // Analisar tendência de sentimento
  analyzeSentimentTrend(sentiments) {
    if (sentiments.length < 2) return 'neutro';
    
    const recent = sentiments.slice(0, 3);
    const older = sentiments.slice(3, 6);
    
    const recentAvg = this.calculateSentimentAverage(recent);
    const olderAvg = this.calculateSentimentAverage(older);
    
    if (recentAvg > olderAvg + 0.2) return 'melhorando';
    if (recentAvg < olderAvg - 0.2) return 'piorando';
    return 'estavel';
  }

  // Calcular média de sentimento
  calculateSentimentAverage(sentiments) {
    const sentimentValues = {
      'muito_negativo': 0,
      'negativo': 0.25,
      'neutro': 0.5,
      'positivo': 0.75,
      'muito_positivo': 1
    };
    
    const total = sentiments.reduce((sum, s) => sum + (sentimentValues[s.sentimento] || 0.5), 0);
    return total / sentiments.length;
  }

  // Extrair tópicos comuns das conversas
  extractCommonTopics(conversations) {
    const topics = {};
    
    conversations.forEach(msg => {
      const text = msg.text?.toLowerCase() || '';
      
      // Detectar tópicos por palavras-chave
      if (text.includes('trilha') || text.includes('curso')) topics.trilhas = (topics.trilhas || 0) + 1;
      if (text.includes('documento') || text.includes('pdf')) topics.documentos = (topics.documentos || 0) + 1;
      if (text.includes('dúvida') || text.includes('pergunta')) topics.duvidas = (topics.duvidas || 0) + 1;
      if (text.includes('feedback') || text.includes('sugestão')) topics.feedback = (topics.feedback || 0) + 1;
      if (text.includes('problema') || text.includes('dificuldade')) topics.problemas = (topics.problemas || 0) + 1;
    });
    
    return Object.entries(topics)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic, count]) => ({ topic, frequency: count }));
  }

  // Identificar padrões de dificuldade
  identifyDifficultyPatterns(notes) {
    return notes
      .filter(note => note.tipo === 'dificuldade_conteudo' || note.sentimento?.includes('negativo'))
      .map(note => ({
        tipo: note.tipo,
        titulo: note.titulo,
        frequencia: 1,
        ultima_ocorrencia: note.created_at
      }));
  }

  // Calcular nível de engajamento
  calculateEngagementLevel(conversations) {
    if (conversations.length === 0) return 'baixo';
    
    const recentMessages = conversations.slice(0, 5);
    const avgLength = recentMessages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0) / recentMessages.length;
    
    if (avgLength > 50) return 'alto';
    if (avgLength > 20) return 'medio';
    return 'baixo';
  }

  // Gerar insights baseados nos dados históricos
  generateInsights(conversations, notes, sentiments) {
    const insights = [];
    
    // Insight sobre sentimento
    if (sentiments.length > 0) {
      const latestSentiment = sentiments[0];
      if (latestSentiment.sentimento === 'negativo' || latestSentiment.sentimento === 'muito_negativo') {
        insights.push('⚠️ Colaborador demonstrou sentimento negativo recentemente - ofereça suporte extra');
      }
    }
    
    // Insight sobre engajamento
    const engagementLevel = this.calculateEngagementLevel(conversations);
    if (engagementLevel === 'baixo') {
      insights.push('📉 Baixo engajamento detectado - considere abordagem mais interativa');
    }
    
    // Insight sobre dificuldades
    const difficultyNotes = notes.filter(n => n.tipo === 'dificuldade_conteudo');
    if (difficultyNotes.length > 2) {
      insights.push('🔍 Múltiplas dificuldades identificadas - ofereça recursos adicionais');
    }
    
    return insights;
  }

  async generateSystemMessage(userContext, pageContext) {
    const { name, position, department, sentimento_atual, sentimento_intensidade, id, gestor_nome, buddy_nome } = userContext;
    
    // Carregar análise histórica
    const historicalPatterns = await this.analyzeHistoricalPatterns(id);
    
    // Determinar tom baseado no sentimento
    const toneConfig = this.getToneBySentiment(sentimento_atual);
    
    // Construir insights históricos
    const historicalInsights = historicalPatterns.insights.length > 0 
      ? `\n📊 **INSIGHTS HISTÓRICOS:**\n${historicalPatterns.insights.map(insight => `- ${insight}`).join('\n')}`
      : '';
    
    const sentimentTrend = historicalPatterns.sentimentTrend !== 'neutro' 
      ? `\n📈 **TENDÊNCIA DE SENTIMENTO:** ${historicalPatterns.sentimentTrend}`
      : '';
    
    const commonTopics = historicalPatterns.commonTopics.length > 0
      ? `\n🎯 **TÓPICOS FREQUENTES:** ${historicalPatterns.commonTopics.map(t => t.topic).join(', ')}`
      : '';
    
    return `Você é o **Navi**, assistente de onboarding inteligente e proativo.

🎯 **CONTEXTO ATUAL:**
- **Colaborador:** ${name}
- **Cargo:** ${position}
- **Departamento:** ${department}
${gestor_nome ? `- **Gestor:** ${gestor_nome}` : ''}
${buddy_nome ? `- **Buddy:** ${buddy_nome}` : ''}
- **Sentimento:** ${sentimento_atual} (${sentimento_intensidade}%)
- **Página atual:** ${pageContext?.page || 'Dashboard'}
- **Nível de engajamento:** ${historicalPatterns.engagementLevel}

🎭 **TOM DE VOZ:** ${toneConfig.tom} ${toneConfig.emoji}${sentimentTrend}${commonTopics}${historicalInsights}

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
3. finalizar_trilha - Finaliza trilha específica
4. reiniciar_trilha - Reinicia trilha específica
5. registrar_feedback - Registra feedback sobre trilhas
6. buscar_documentos - Busca semântica em documentos corporativos
7. buscar_conteudo_trilhas - Busca semântica inteligente nos conteúdos das trilhas para responder dúvidas específicas
8. criar_anotacao - Cria anotação do agente
9. registrar_sentimento - Registra sentimento do colaborador
10. gerar_melhoria - Gera sugestão de melhoria

SEMPRE use as ferramentas quando apropriado e seja proativo!
Analise padrões históricos e ofereça suporte personalizado!

🎯 **QUANDO USAR CADA FERRAMENTA:**
- **buscar_conteudo_trilhas**: Use quando o colaborador fizer perguntas sobre:
  * Como fazer algo específico ("Como fazer login?", "Como configurar email?")
  * O que significa algo ("O que é onboarding?", "O que é compliance?")
  * Dúvidas sobre processos ou procedimentos
  * Perguntas técnicas sobre sistemas ou ferramentas
- **buscar_documentos**: Use para políticas, procedimentos corporativos, manuais
- **buscar_trilhas_disponiveis**: Use para mostrar trilhas que o colaborador pode fazer
- **registrar_feedback**: Use quando o colaborador der opinião sobre trilhas ou processos`;
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

  // Análise background assíncrona (não bloqueia resposta principal)
  async performBackgroundAnalysis(userId, message, context) {
    try {
      console.log('🔄 Iniciando análise background para usuário:', userId);
      
      // 1. Análise de sentimento (assíncrona)
      await this.analyzeSentimentBackground(userId, message);
      
      // 2. Criação de anotações automáticas (assíncrona)
      await this.createAutomaticNotes(userId, message, context);
      
      // 3. Análise de padrões (assíncrona)
      await this.updatePatternAnalysis(userId, message);
      
      console.log('✅ Análise background concluída para usuário:', userId);
      
    } catch (error) {
      console.error('❌ Erro na análise background:', error);
    }
  }

  // Análise de sentimento em background
  async analyzeSentimentBackground(userId, message) {
    try {
      const axios = require('axios');
      
      // Chamar endpoint de análise de sentimento
      const baseUrl = this.getBaseUrl();
      await axios.post(`${baseUrl}/api/chat-analysis/sentiment`, {
        userId: userId,
        message: message,
        source: 'chat_http'
      });
      
      console.log('📊 Sentimento analisado em background para:', userId);
    } catch (error) {
      console.error('❌ Erro análise sentimento background:', error);
      
      // Fallback para URL absoluta
      if (error.code === 'ECONNREFUSED' || error.message.includes('localhost')) {
        try {
          const fallbackUrl = 'https://navigator-gules.vercel.app/api/chat-analysis/sentiment';
          await axios.post(fallbackUrl, {
            userId: userId,
            message: message,
            source: 'chat_http'
          });
          console.log('📊 Sentimento analisado em background (fallback) para:', userId);
        } catch (fallbackError) {
          console.error('❌ Erro no fallback sentimento background:', fallbackError);
        }
      }
    }
  }

  // Criação automática de anotações
  async createAutomaticNotes(userId, message, context) {
    try {
      const axios = require('axios');
      
      // Detectar se mensagem indica dificuldade ou feedback
      const isDifficulty = this.detectDifficulty(message);
      const isFeedback = this.detectFeedback(message);
      
      if (isDifficulty || isFeedback) {
        const baseUrl = this.getBaseUrl();
        await axios.post(`${baseUrl}/api/chat-analysis/annotations`, {
          userId: userId,
          message: message,
          context: context,
          autoDetected: true,
          type: isDifficulty ? 'dificuldade_conteudo' : 'feedback_colaborador'
        });
        
        console.log('📝 Anotação automática criada para:', userId);
      }
    } catch (error) {
      console.error('❌ Erro criação anotação automática:', error);
      
      // Fallback para URL absoluta
      if (error.code === 'ECONNREFUSED' || error.message.includes('localhost')) {
        try {
          const isDifficulty = this.detectDifficulty(message);
          const isFeedback = this.detectFeedback(message);
          
          if (isDifficulty || isFeedback) {
            const fallbackUrl = 'https://navigator-gules.vercel.app/api/chat-analysis/annotations';
            await axios.post(fallbackUrl, {
              userId: userId,
              message: message,
              context: context,
              autoDetected: true,
              type: isDifficulty ? 'dificuldade_conteudo' : 'feedback_colaborador'
            });
            console.log('📝 Anotação automática criada (fallback) para:', userId);
          }
        } catch (fallbackError) {
          console.error('❌ Erro no fallback anotação automática:', fallbackError);
        }
      }
    }
  }

  // Atualizar análise de padrões
  async updatePatternAnalysis(userId, message) {
    try {
      // Simular atualização de padrões (pode ser expandido)
      console.log('🔍 Padrões atualizados para:', userId);
    } catch (error) {
      console.error('❌ Erro atualização padrões:', error);
    }
  }

  // Detectar dificuldades na mensagem
  detectDifficulty(message) {
    const difficultyKeywords = [
      'dificuldade', 'problema', 'não consigo', 'não entendo', 
      'confuso', 'complicado', 'difícil', 'não sei como'
    ];
    
    const lowerMessage = message.toLowerCase();
    return difficultyKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Detectar feedback na mensagem
  detectFeedback(message) {
    const feedbackKeywords = [
      'feedback', 'sugestão', 'melhorar', 'gostaria', 
      'poderia', 'seria bom', 'acho que', 'sugiro'
    ];
    
    const lowerMessage = message.toLowerCase();
    return feedbackKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

module.exports = PersonalizationEngine;