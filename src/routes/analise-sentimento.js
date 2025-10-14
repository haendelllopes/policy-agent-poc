const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const openaiSentimentService = require('../services/openaiSentimentService');
const { query } = require('../db-pg');

// Middleware para autenticação (mock por enquanto)
const authenticate = async (req, res, next) => {
  // Usa tenant padrão se não especificado
  const DEFAULT_TENANT_ID = '5978f911-738b-4aae-802a-f037fdac2e64'; // Tenant Demonstração
  
  // Busca tenantId em query params (GET), body (POST), params (URL) ou headers
  req.tenantId = req.query.tenantId || req.params.tenantId || req.body?.tenantId || req.headers['x-tenant-id'] || DEFAULT_TENANT_ID;
  req.userId = req.query.userId || req.params.userId || req.body?.userId || req.headers['x-user-id'] || 'mock-user-id';
  
  // Verificar se tenant existe
  try {
    const tenantCheck = await query('SELECT id FROM tenants WHERE id = $1', [req.tenantId]);
    
    if (tenantCheck.rows.length === 0) {
      console.warn(`⚠️  Tenant ${req.tenantId} não existe! Usando tenant padrão.`);
      req.tenantId = DEFAULT_TENANT_ID;
    }
  } catch (error) {
    console.error('Erro ao verificar tenant:', error);
    // Continua com tenant padrão
    req.tenantId = DEFAULT_TENANT_ID;
  }
  
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
      diaOnboarding = null,
      // NOVOS CAMPOS para Sentiment Analysis do N8N
      sentimento = null,
      intensidade = null,
      fatores_detectados = null,
      raw_analysis = null,
      provider = null
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

    // Verificar se a análise já foi feita no N8N (dados pré-analisados)
    let sentimentAnalysis;
    let providerUsed;
    
    if (sentimento && intensidade !== null) {
      // Dados já analisados pelo N8N Sentiment Analysis
      sentimentAnalysis = {
        sentimento,
        intensidade,
        fatores_detectados: fatores_detectados || {}
      };
      providerUsed = provider || 'n8n_sentiment_analysis';
      console.log('✅ Usando análise pré-processada do N8N');
    } else {
      // Fallback: Analisar sentimento com OpenAI/Gemini (comportamento antigo)
      if (openaiSentimentService.isConfigured()) {
        sentimentAnalysis = await openaiSentimentService.analyzeSentiment(message, context);
        providerUsed = 'backend_openai';
        console.log('✅ Análise realizada com OpenAI (backend)');
      } else if (geminiService.isConfigured()) {
        sentimentAnalysis = await geminiService.analyzeSentiment(message, context);
        providerUsed = 'backend_gemini';
        console.log('✅ Análise realizada com Gemini (backend)');
      } else {
        sentimentAnalysis = await geminiService.analyzeSentiment(message, context);
        providerUsed = 'backend_fallback';
        console.log('⚠️  Análise realizada com fallback (backend)');
      }
    }
    
    // 2. Registrar no banco de dados (com novos campos)
    const result = await query(
      `INSERT INTO colaborador_sentimentos (
        tenant_id, colaborador_id, sentimento, intensidade, origem, 
        mensagem_analisada, fatores_detectados, trilha_id, momento_onboarding, dia_onboarding,
        provider, raw_analysis
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        diaOnboarding,
        providerUsed,
        raw_analysis ? JSON.stringify(raw_analysis) : null
      ]
    );

    // 3. Retornar resultado
    res.json({
      success: true,
      sentiment: sentimentAnalysis,
      provider: providerUsed,
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

/**
 * GET /api/analise-sentimento/estatisticas/:tenantId
 * Retorna estatísticas agregadas de sentimentos de um tenant
 */
router.get('/estatisticas/:tenantId', authenticate, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const days = req.query.days || 30;

    // Total de análises
    const totalResult = await query(
      `SELECT COUNT(*) as total_analises 
       FROM colaborador_sentimentos 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'`,
      [tenantId]
    );

    // Distribuição por sentimento
    const distribuicaoResult = await query(
      `SELECT 
        sentimento, 
        COUNT(*) as total,
        ROUND(AVG(intensidade), 2) as intensidade_media
       FROM colaborador_sentimentos 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY sentimento
       ORDER BY total DESC`,
      [tenantId]
    );

    // Sentimento médio geral
    const mediaResult = await query(
      `SELECT 
        ROUND(AVG(
          CASE sentimento
            WHEN 'muito_positivo' THEN 5
            WHEN 'positivo' THEN 4
            WHEN 'neutro' THEN 3
            WHEN 'negativo' THEN 2
            WHEN 'muito_negativo' THEN 1
            ELSE 3
          END
        ), 2) as sentimento_medio_numerico,
        ROUND(AVG(intensidade), 2) as intensidade_media
       FROM colaborador_sentimentos 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'`,
      [tenantId]
    );

    // Top colaboradores com análises
    const topColaboradoresResult = await query(
      `SELECT 
        cs.colaborador_id,
        u.name as colaborador_nome,
        COUNT(*) as total_analises,
        ROUND(AVG(intensidade), 2) as intensidade_media
       FROM colaborador_sentimentos cs
       LEFT JOIN users u ON u.id = cs.colaborador_id
       WHERE cs.tenant_id = $1 AND cs.created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY cs.colaborador_id, u.name
       ORDER BY total_analises DESC
       LIMIT 10`,
      [tenantId]
    );

    // Evolução temporal (últimos 7 dias)
    const evolucaoResult = await query(
      `SELECT 
        DATE(created_at) as data,
        COUNT(*) as total_analises,
        ROUND(AVG(
          CASE sentimento
            WHEN 'muito_positivo' THEN 5
            WHEN 'positivo' THEN 4
            WHEN 'neutro' THEN 3
            WHEN 'negativo' THEN 2
            WHEN 'muito_negativo' THEN 1
            ELSE 3
          END
        ), 2) as sentimento_medio
       FROM colaborador_sentimentos 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY data DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      periodo_dias: parseInt(days),
      total_analises: parseInt(totalResult.rows[0].total_analises),
      sentimento_medio_numerico: parseFloat(mediaResult.rows[0].sentimento_medio_numerico || 3),
      intensidade_media: parseFloat(mediaResult.rows[0].intensidade_media || 0),
      distribuicao_sentimentos: distribuicaoResult.rows,
      top_colaboradores: topColaboradoresResult.rows,
      evolucao_temporal: evolucaoResult.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro interno ao buscar estatísticas',
      details: error.message 
    });
  }
});

module.exports = router;
