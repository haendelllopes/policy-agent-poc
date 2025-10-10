const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('⚠️  GOOGLE_GEMINI_API_KEY não configurada! Crie um arquivo .env com a chave da API.');
      this.genAI = null;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }
  }
  
  /**
   * Verifica se o serviço está configurado corretamente
   */
  isConfigured() {
    return this.genAI !== null && this.model !== null;
  }

  /**
   * Analisa o sentimento de uma mensagem
   * @param {string} message - Mensagem para analisar
   * @param {string} context - Contexto adicional (opcional)
   * @returns {Object} - { sentimento, intensidade, fatores_detectados }
   */
  async analyzeSentiment(message, context = '') {
    // Verificar se o serviço está configurado
    if (!this.isConfigured()) {
      console.warn('⚠️  Gemini não configurado, usando análise fallback');
      return this.fallbackSentimentAnalysis(message);
    }
    
    try {
      const prompt = `
Analise o sentimento da seguinte mensagem de um colaborador durante o onboarding:

Mensagem: "${message}"
Contexto: "${context}"

Responda APENAS em JSON válido com esta estrutura:
{
  "sentimento": "muito_positivo|positivo|neutro|negativo|muito_negativo",
  "intensidade": 0.85,
  "fatores_detectados": {
    "palavras_chave": ["palavra1", "palavra2"],
    "tom": "empolgado|satisfeito|neutro|preocupado|frustrado",
    "indicadores": ["emoji", "pontuação", "expressões"]
  }
}

Considere:
- Palavras positivas: "ótimo", "perfeito", "gostei", "fácil", "ajudou"
- Palavras negativas: "difícil", "confuso", "não entendo", "problema", "erro"
- Emojis: 😊😄👍 = positivo, 😞😕👎 = negativo
- Pontuação: muitos pontos de exclamação = intensidade alta
- Contexto de onboarding: primeira semana, aprendendo, adaptando-se

Seja preciso e objetivo.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Limpar e extrair JSON
      let jsonString = text.trim();
      if (jsonString.includes('```json')) {
        jsonString = jsonString.split('```json')[1].split('```')[0];
      } else if (jsonString.includes('```')) {
        jsonString = jsonString.split('```')[1].split('```')[0];
      }
      
      const sentimentData = JSON.parse(jsonString);
      
      // Validar estrutura
      if (!sentimentData.sentimento || !sentimentData.intensidade) {
        throw new Error('Resposta inválida do Gemini');
      }
      
      return sentimentData;
    } catch (error) {
      console.error('Erro na análise de sentimento:', error);
      
      // Fallback para análise simples
      return this.fallbackSentimentAnalysis(message);
    }
  }

  /**
   * Analisa padrões para gerar anotações do agente
   * @param {Array} messages - Array de mensagens recentes
   * @param {Object} userContext - Contexto do usuário
   * @returns {Object} - { tipo, titulo, anotacao, sentimento, tags }
   */
  async generateAgentNote(messages, userContext) {
    // Verificar se o serviço está configurado
    if (!this.isConfigured()) {
      console.warn('⚠️  Gemini não configurado, não é possível gerar anotação');
      return null;
    }
    
    try {
      const recentMessages = messages.slice(-5).map(m => m.text).join('\n');
      
      const prompt = `
Analise as seguintes mensagens de um colaborador e gere uma anotação para o agente IA:

Mensagens recentes:
${recentMessages}

Contexto do usuário:
- Nome: ${userContext.name || 'N/A'}
- Cargo: ${userContext.position || 'N/A'}
- Departamento: ${userContext.department || 'N/A'}
- Dias no onboarding: ${userContext.daysOnboarding || 'N/A'}

Responda APENAS em JSON válido:
{
  "tipo": "sentimento_trilha|sentimento_empresa|dificuldade_conteudo|sugestao_colaborador|padrao_identificado|observacao_geral",
  "titulo": "Título resumido da observação",
  "anotacao": "Descrição detalhada do padrão observado",
  "sentimento": "muito_positivo|positivo|neutro|negativo|muito_negativo",
  "intensidade_sentimento": 0.75,
  "tags": ["tag1", "tag2", "tag3"],
  "relevante": true
}

Tipos de anotação:
- sentimento_trilha: Como o colaborador se sente sobre as trilhas
- sentimento_empresa: Como se sente sobre a empresa/cultura
- dificuldade_conteudo: Problemas com conteúdo específico
- sugestao_colaborador: Sugestões ou feedback explícito
- padrao_identificado: Padrões de comportamento recorrentes
- observacao_geral: Outras observações importantes

Seja objetivo e focado em insights acionáveis.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let jsonString = text.trim();
      if (jsonString.includes('```json')) {
        jsonString = jsonString.split('```json')[1].split('```')[0];
      } else if (jsonString.includes('```')) {
        jsonString = jsonString.split('```')[1].split('```')[0];
      }
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Erro ao gerar anotação do agente:', error);
      return null;
    }
  }

  /**
   * Recomenda trilhas baseado no sentimento
   * @param {Object} userSentiment - Sentimento atual do usuário
   * @param {Array} availableTracks - Trilhas disponíveis
   * @returns {Object} - Recomendação personalizada
   */
  async recommendTracksBySentiment(userSentiment, availableTracks) {
    // Verificar se o serviço está configurado
    if (!this.isConfigured()) {
      console.warn('⚠️  Gemini não configurado, não é possível gerar recomendação');
      return null;
    }
    
    try {
      const prompt = `
Com base no sentimento atual do colaborador, recomende trilhas de onboarding:

Sentimento atual:
- Sentimento: ${userSentiment.sentimento}
- Intensidade: ${userSentiment.intensidade}
- Contexto: ${userSentiment.context || 'N/A'}

Trilhas disponíveis:
${availableTracks.map(t => `- ${t.nome}: ${t.descricao} (Dificuldade: ${t.dificuldade_percebida})`).join('\n')}

Responda APENAS em JSON:
{
  "recomendacao": {
    "trilha_principal": "ID da trilha recomendada",
    "trilhas_alternativas": ["ID1", "ID2"],
    "motivo": "Explicação da recomendação baseada no sentimento",
    "tom_resposta": "empático|motivador|neutro|encorajador"
  },
  "sugestao_mensagem": "Mensagem personalizada para o colaborador"
}

Considere:
- Sentimento negativo: trilhas mais fáceis, tom empático
- Sentimento positivo: trilhas desafiadoras, tom motivador
- Sentimento neutro: trilhas equilibradas, tom profissional
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      let jsonString = text.trim();
      if (jsonString.includes('```json')) {
        jsonString = jsonString.split('```json')[1].split('```')[0];
      } else if (jsonString.includes('```')) {
        jsonString = jsonString.split('```')[1].split('```')[0];
      }
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Erro na recomendação de trilhas:', error);
      return null;
    }
  }

  /**
   * Análise de sentimento simples como fallback
   * @param {string} message - Mensagem para analisar
   * @returns {Object} - Sentimento básico
   */
  fallbackSentimentAnalysis(message) {
    const positiveWords = ['ótimo', 'bom', 'gostei', 'perfeito', 'fácil', 'ajudou', 'obrigado', '👍', '😊', '😄'];
    const negativeWords = ['difícil', 'confuso', 'problema', 'erro', 'não entendo', 'complicado', '👎', '😞', '😕'];
    
    const lowerMessage = message.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerMessage.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) negativeCount++;
    });
    
    let sentimento = 'neutro';
    let intensidade = 0.5;
    
    if (positiveCount > negativeCount) {
      sentimento = positiveCount > 2 ? 'positivo' : 'neutro';
      intensidade = 0.6 + (positiveCount * 0.1);
    } else if (negativeCount > positiveCount) {
      sentimento = negativeCount > 2 ? 'negativo' : 'neutro';
      intensidade = 0.6 + (negativeCount * 0.1);
    }
    
    return {
      sentimento,
      intensidade: Math.min(intensidade, 1.0),
      fatores_detectados: {
        palavras_chave: [],
        tom: sentimento === 'neutro' ? 'neutro' : sentimento,
        indicadores: ['análise_simples']
      }
    };
  }
}

module.exports = new GeminiService();
