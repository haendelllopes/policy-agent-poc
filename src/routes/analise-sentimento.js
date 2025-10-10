const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const openaiSentimentService = require('../services/openaiSentimentService');
const { query } = require('../db-pg');

// Middleware para autenticação (mock por enquanto)
const authenticate = (req, res, next) => {
  req.tenantId = req.body.tenantId || req.headers['x-tenant-id'] || 'mock-tenant-id';
  req.userId = req.body.userId || req.headers['x-user-id'] || 'mock-user-id';
  next();
};

/**
 * POST /api/analise-sentimento
 * Analisa sentimento de uma mensagem e registra no banco
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      message, 
      userId,
      phone, 
      context = '', 
      trilhaId = null,
      momentoOnboarding = null,
      diaOnboarding = null 
    } = req.body;

    if (!message) {
      return res.status(400).json({ 
        error: 'Campo obrigatório: message' 
      });
    }

    if (!userId && !phone) {
      return res.status(400).json({ 
        error: 'Informe userId (UUID) ou phone (número de telefone)' 
      });
    }

    // Se recebeu phone, fazer lookup do user_id
    let colaboradorId = userId;
    
    if (!userId && phone) {
      // Normalizar phone (remover caracteres não numéricos)
      const phoneNormalized = phone.replace(/\D/g, '');
      
      const userLookup = await query(
        `SELECT id FROM users WHERE phone LIKE $1 OR phone LIKE $2`,
        [`%${phoneNormalized}`, `%${phone}`]
      );
      
      if (userLookup.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Usuário não encontrado com este telefone',
          phone: phone,
          hint: 'Verifique se o usuário existe no sistema'
        });
      }
      
      colaboradorId = userLookup.rows[0].id;
      console.log(`📞 Lookup: Phone ${phone} → User ID ${colaboradorId}`);
    }

    // 1. Analisar sentimento com OpenAI (ou Gemini como fallback)
    let sentimentAnalysis;
    
    if (openaiSentimentService.isConfigured()) {
      sentimentAnalysis = await openaiSentimentService.analyzeSentiment(message, context);
      console.log('✅ Análise realizada com OpenAI');
    } else if (geminiService.isConfigured()) {
      sentimentAnalysis = await geminiService.analyzeSentiment(message, context);
      console.log('✅ Análise realizada com Gemini');
    } else {
      sentimentAnalysis = await geminiService.analyzeSentiment(message, context);
      console.log('⚠️  Análise realizada com fallback');
    }
    
    // 2. Registrar no banco de dados
    const result = await query(
      `INSERT INTO colaborador_sentimentos (
        tenant_id, colaborador_id, sentimento, intensidade, origem, 
        mensagem_analisada, fatores_detectados, trilha_id, momento_onboarding, dia_onboarding
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.tenantId,
        colaboradorId,
        sentimentAnalysis.sentimento,
        sentimentAnalysis.intensidade,
        'analise_automatica',
        message,
        JSON.stringify(sentimentAnalysis.fatores_detectados),
        trilhaId,
        momentoOnboarding,
        diaOnboarding
      ]
    );

    // 3. Retornar resultado
    res.json({
      success: true,
      sentiment: sentimentAnalysis,
      record: result.rows[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na análise de sentimento:', error);
    res.status(500).json({ 
      error: 'Erro interno na análise de sentimento',
      details: error.message 
    });
  }
});

/**
 * POST /api/analise-sentimento/gerar-anotacao
 * Gera anotação do agente baseada em mensagens recentes
 */
router.post('/gerar-anotacao', authenticate, async (req, res) => {
  try {
    const { userId, messages, userContext } = req.body;

    if (!userId || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: userId, messages (array)' 
      });
    }

    // 1. Gerar anotação com Gemini
    const agentNote = await geminiService.generateAgentNote(messages, userContext);
    
    if (!agentNote) {
      return res.status(500).json({ 
        error: 'Falha ao gerar anotação do agente' 
      });
    }

    // 2. Registrar anotação no banco
    const result = await query(
      `INSERT INTO agente_anotacoes (
        tenant_id, colaborador_id, tipo, titulo, anotacao, 
        sentimento, intensidade_sentimento, tags, relevante
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        req.tenantId,
        userId,
        agentNote.tipo,
        agentNote.titulo,
        agentNote.anotacao,
        agentNote.sentimento,
        agentNote.intensidade_sentimento,
        agentNote.tags,
        agentNote.relevante
      ]
    );

    res.json({
      success: true,
      note: agentNote,
      record: result.rows[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao gerar anotação:', error);
    res.status(500).json({ 
      error: 'Erro interno ao gerar anotação',
      details: error.message 
    });
  }
});

/**
 * POST /api/analise-sentimento/recomendar-trilhas
 * Recomenda trilhas baseado no sentimento do usuário
 */
router.post('/recomendar-trilhas', authenticate, async (req, res) => {
  try {
    const { userId, userSentiment } = req.body;

    if (!userId || !userSentiment) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: userId, userSentiment' 
      });
    }

    // 1. Buscar trilhas disponíveis para o usuário
    const availableTracks = await query(
      `SELECT * FROM buscar_trilhas_por_sentimento($1, $2, 5)`,
      [userId, userSentiment.sentimento]
    );

    if (availableTracks.rows.length === 0) {
      return res.json({
        success: true,
        recommendation: null,
        message: 'Nenhuma trilha disponível no momento'
      });
    }

    // 2. Gerar recomendação personalizada com Gemini
    const recommendation = await geminiService.recommendTracksBySentiment(
      userSentiment, 
      availableTracks.rows
    );

    res.json({
      success: true,
      availableTracks: availableTracks.rows,
      recommendation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na recomendação de trilhas:', error);
    res.status(500).json({ 
      error: 'Erro interno na recomendação de trilhas',
      details: error.message 
    });
  }
});

/**
 * GET /api/analise-sentimento/historico/:userId
 * Busca histórico de sentimentos de um usuário
 */
router.get('/historico/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit || 10;

    const result = await query(
      `SELECT * FROM colaborador_sentimentos 
       WHERE colaborador_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC 
       LIMIT $3`,
      [userId, req.tenantId, limit]
    );

    res.json({
      success: true,
      sentiments: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ 
      error: 'Erro interno ao buscar histórico',
      details: error.message 
    });
  }
});

module.exports = router;
