const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');
const openaiSentimentService = require('../services/openaiSentimentService');

/**
 * POST /api/chat/analyze-background
 * Análise de sentimento em background para casos críticos
 */
router.post('/analyze-background', async (req, res) => {
  try {
    const { message, userId, context } = req.body;
    
    console.log(`🔍 Iniciando análise background para usuário ${userId}`);
    
    // 1. Analisar sentimento com OpenAI
    const sentiment = await analyzeSentimentWithOpenAI(message);
    
    // 2. Salvar sentimento no banco
    await saveSentimentAnalysis(userId, message, sentiment);
    
    // 3. Detectar se precisa de anotação
    if (sentiment.requiresNote) {
      await createAgentNote(userId, message, sentiment, context);
    }
    
    // 4. Enviar para N8N se necessário (análise adicional) - OPCIONAL
    if (sentiment.urgency === 'high' || sentiment.urgency === 'critical') {
      await sendToN8NForAnalysis(userId, message, sentiment);
    }
    
    console.log(`✅ Análise background concluída para ${userId} - Sentimento: ${sentiment.sentimento}, Urgência: ${sentiment.urgency}`);
    
    res.json({ success: true, sentiment });
  } catch (error) {
    console.error('❌ Erro na análise background:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

/**
 * Analisa sentimento com OpenAI e adiciona campos extras
 */
async function analyzeSentimentWithOpenAI(message) {
  try {
    const sentiment = await openaiSentimentService.analyzeSentiment(message);
    
    // Adicionar campos extras para análise background
    return {
      ...sentiment,
      urgency: determineUrgency(sentiment),
      requiresNote: shouldCreateNote(sentiment),
      categoria: categorizeSentiment(sentiment),
      tags: extractTags(sentiment)
    };
  } catch (error) {
    console.error('❌ Erro na análise de sentimento:', error);
    // Fallback para análise simples
    return {
      sentimento: 'neutro',
      intensidade: 0.5,
      fatores_detectados: { palavras_chave: [], tom: 'neutro', indicadores: ['fallback'] },
      urgency: 'baixa',
      requiresNote: false,
      categoria: 'observacao_geral',
      tags: ['fallback']
    };
  }
}

/**
 * Salva análise de sentimento no banco de dados
 */
async function saveSentimentAnalysis(userId, message, sentiment) {
  try {
    // Buscar tenant_id
    const userResult = await query('SELECT tenant_id FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      throw new Error(`Usuário ${userId} não encontrado`);
    }
    
    const tenant_id = userResult.rows[0].tenant_id;
    
    // Inserir sentimento com campos corretos da tabela colaborador_sentimentos
    await query(`
      INSERT INTO colaborador_sentimentos 
      (tenant_id, colaborador_id, sentimento, intensidade, origem, mensagem_analisada, fatores_detectados, raw_analysis, provider, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `, [
      tenant_id, 
      userId, 
      sentiment.sentimento, 
      sentiment.intensidade, 
      'analise_automatica', // origem válida
      message, 
      JSON.stringify(sentiment.fatores_detectados),
      JSON.stringify(sentiment), // raw_analysis completo
      'websocket_background' // provider personalizado
    ]);
    
    // Atualizar sentimento atual do usuário
    await query(`
      UPDATE users 
      SET sentimento_atual = $1, sentimento_atualizado_em = NOW()
      WHERE id = $2
    `, [sentiment.sentimento, userId]);
    
    console.log(`💾 Sentimento salvo no banco: ${sentiment.sentimento} (${sentiment.intensidade})`);
  } catch (error) {
    console.error('❌ Erro ao salvar sentimento:', error);
    throw error;
  }
}

/**
 * Cria anotação do agente se necessário
 */
async function createAgentNote(userId, message, sentiment, context) {
  try {
    // Buscar tenant_id
    const userResult = await query('SELECT tenant_id FROM users WHERE id = $1', [userId]);
    const tenant_id = userResult.rows[0].tenant_id;
    
    // Usar campos que existem na tabela agente_anotacoes
    await query(`
      INSERT INTO agente_anotacoes 
      (tenant_id, colaborador_id, tipo, titulo, anotacao, sentimento, intensidade_sentimento, contexto, tags, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `, [
      tenant_id,
      userId,
      'observacao_geral', // tipo válido
      `Chat Background: ${sentiment.categoria || 'análise'}`,
      message,
      sentiment.sentimento,
      sentiment.intensidade,
      JSON.stringify({
        ...context,
        source: 'websocket_background',
        sentiment_analysis: sentiment,
        urgency: sentiment.urgency,
        requiresNote: sentiment.requiresNote
      }),
      sentiment.tags || []
    ]);
    
    console.log(`📝 Anotação criada: ${sentiment.categoria} - ${sentiment.sentimento}`);
  } catch (error) {
    console.error('❌ Erro ao criar anotação:', error);
    throw error;
  }
}

/**
 * Envia análise crítica para N8N
 */
async function sendToN8NForAnalysis(userId, message, sentiment) {
  try {
    const axios = require('axios');
    
    const n8nPayload = {
      type: 'chat_sentiment_critical',
      userId: userId,
      message: message,
      sentiment: sentiment,
      timestamp: new Date().toISOString(),
      urgency: sentiment.urgency,
      categoria: sentiment.categoria
    };
    
    await axios.post('https://hndll.app.n8n.cloud/webhook/chat-analysis-critical', n8nPayload, {
      timeout: 5000, // 5 segundos timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`🚨 Alerta crítico enviado para N8N: ${sentiment.urgency} - ${sentiment.sentimento}`);
  } catch (error) {
    console.error('⚠️ Erro ao enviar para N8N (não crítico):', error.message);
    // Não re-throw para não quebrar o fluxo principal
  }
}

/**
 * Determina urgência baseada no sentimento
 */
function determineUrgency(sentiment) {
  if (sentiment.sentimento === 'muito_negativo' && sentiment.intensidade > 0.8) return 'critica';
  if (sentiment.sentimento === 'negativo' && sentiment.intensidade > 0.7) return 'alta';
  if (sentiment.sentimento === 'muito_positivo' && sentiment.intensidade > 0.9) return 'media';
  return 'baixa';
}

/**
 * Determina se deve criar anotação
 */
function shouldCreateNote(sentiment) {
  return sentiment.sentimento === 'muito_negativo' || 
         sentiment.sentimento === 'negativo' || 
         sentiment.intensidade > 0.8;
}

/**
 * Categoriza o sentimento
 */
function categorizeSentiment(sentiment) {
  if (sentiment.sentimento.includes('positivo')) return 'feedback_positivo';
  if (sentiment.sentimento.includes('negativo')) return 'dificuldade_relatada';
  return 'observacao_geral';
}

/**
 * Extrai tags do sentimento
 */
function extractTags(sentiment) {
  const tags = [];
  if (sentiment.fatores_detectados?.palavras_chave) {
    tags.push(...sentiment.fatores_detectados.palavras_chave.slice(0, 3));
  }
  tags.push(sentiment.sentimento);
  return tags;
}

module.exports = router;
