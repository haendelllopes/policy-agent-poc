/**
 * Serviço de Análise de Sentimento usando OpenAI
 * Alternativa ao GeminiService
 */

const OpenAI = require('openai');

class OpenAISentimentService {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('⚠️  OPENAI_API_KEY não configurada!');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: apiKey
      });
      console.log('✅ OpenAI inicializada para análise de sentimento');
    }
  }
  
  /**
   * Verifica se o serviço está configurado
   */
  isConfigured() {
    return this.openai !== null;
  }

  /**
   * Analisa o sentimento de uma mensagem usando OpenAI
   * @param {string} message - Mensagem para analisar
   * @param {string} context - Contexto adicional
   * @returns {Object} - { sentimento, intensidade, fatores_detectados }
   */
  async analyzeSentiment(message, context = '') {
    if (!this.isConfigured()) {
      console.warn('⚠️  OpenAI não configurada, usando análise fallback');
      return this.fallbackSentimentAnalysis(message);
    }
    
    try {
      const prompt = `Analise o sentimento da seguinte mensagem de um colaborador durante o onboarding:

Mensagem: "${message}"
Contexto: "${context}"

Responda APENAS com um JSON válido neste formato exato:
{
  "sentimento": "muito_positivo",
  "intensidade": 0.85,
  "fatores_detectados": {
    "palavras_chave": ["palavra1", "palavra2"],
    "tom": "empolgado",
    "indicadores": ["emoji", "pontuação"]
  }
}

Regras:
- sentimento: muito_positivo, positivo, neutro, negativo, muito_negativo
- intensidade: número entre 0 e 1
- tom: empolgado, satisfeito, neutro, preocupado, frustrado
- Retorne APENAS o JSON, sem texto adicional`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é um assistente especializado em análise de sentimento. Sempre responda apenas com JSON válido, sem formatação markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      const responseText = completion.choices[0].message.content.trim();
      
      // Limpar possível formatação markdown
      let jsonString = responseText;
      if (jsonString.includes('```json')) {
        jsonString = jsonString.split('```json')[1].split('```')[0];
      } else if (jsonString.includes('```')) {
        jsonString = jsonString.split('```')[1].split('```')[0];
      }
      
      const sentimentData = JSON.parse(jsonString.trim());
      
      // Validar estrutura
      if (!sentimentData.sentimento || !sentimentData.intensidade) {
        throw new Error('Resposta inválida da OpenAI');
      }
      
      return sentimentData;
      
    } catch (error) {
      console.error('Erro na análise com OpenAI:', error.message);
      
      // Fallback em caso de erro
      return this.fallbackSentimentAnalysis(message);
    }
  }

  /**
   * Análise de sentimento simples como fallback
   */
  fallbackSentimentAnalysis(message) {
    const positiveWords = ['ótimo', 'bom', 'gostei', 'perfeito', 'fácil', 'ajudou', 'obrigado', 'adorando', 'empolgante', 'inspirador', '👍', '😊', '😄', '🎉'];
    const negativeWords = ['difícil', 'confuso', 'problema', 'erro', 'não entendo', 'complicado', 'ruim', '👎', '😞', '😕'];
    
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
      sentimento = positiveCount >= 3 ? 'muito_positivo' : 'positivo';
      intensidade = Math.min(0.6 + (positiveCount * 0.1), 1.0);
    } else if (negativeCount > positiveCount) {
      sentimento = negativeCount >= 3 ? 'muito_negativo' : 'negativo';
      intensidade = Math.min(0.6 + (negativeCount * 0.1), 1.0);
    }
    
    return {
      sentimento,
      intensidade,
      fatores_detectados: {
        palavras_chave: [],
        tom: sentimento === 'neutro' ? 'neutro' : sentimento.replace('muito_', ''),
        indicadores: ['análise_simples']
      }
    };
  }
}

module.exports = new OpenAISentimentService();

