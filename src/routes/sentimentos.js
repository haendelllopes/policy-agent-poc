const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');

// POST /api/sentimentos - Registrar novo sentimento
router.post('/', async (req, res) => {
  try {
    const {
      colaborador_id,
      sentimento,
      intensidade,
      origem,
      mensagem_analisada,
      fatores_detectados,
      trilha_id,
      momento_onboarding,
      dia_onboarding,
      acao_agente,
      resposta_adaptada
    } = req.body;

    // Validar sentimento
    const sentimentosValidos = ['muito_positivo', 'positivo', 'neutro', 'negativo', 'muito_negativo'];
    if (!sentimentosValidos.includes(sentimento)) {
      return res.status(400).json({ 
        error: `Sentimento inválido. Use: ${sentimentosValidos.join(', ')}` 
      });
    }

    // Buscar tenant_id do colaborador
    const userResult = await query(
      'SELECT tenant_id FROM users WHERE id = $1',
      [colaborador_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    const tenant_id = userResult.rows[0].tenant_id;

    // Inserir sentimento
    const result = await query(`
      INSERT INTO colaborador_sentimentos (
        tenant_id,
        colaborador_id,
        sentimento,
        intensidade,
        origem,
        mensagem_analisada,
        fatores_detectados,
        trilha_id,
        momento_onboarding,
        dia_onboarding,
        acao_agente,
        resposta_adaptada
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      tenant_id,
      colaborador_id,
      sentimento,
      intensidade || 0.5,
      origem,
      mensagem_analisada,
      JSON.stringify(fatores_detectados),
      trilha_id,
      momento_onboarding,
      dia_onboarding,
      acao_agente,
      resposta_adaptada
    ]);

    res.status(201).json({
      success: true,
      sentimento: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao registrar sentimento:', error);
    res.status(500).json({ error: 'Erro ao registrar sentimento' });
  }
});

// GET /api/sentimentos/colaborador/:userId - Histórico de sentimentos
router.get('/colaborador/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const result = await query(`
      SELECT 
        cs.*,
        t.nome as trilha_nome
      FROM colaborador_sentimentos cs
      LEFT JOIN trilhas t ON t.id = cs.trilha_id
      WHERE cs.colaborador_id = $1
      ORDER BY cs.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar histórico de sentimentos:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// GET /api/sentimentos/colaborador/:userId/atual - Sentimento atual
router.get('/colaborador/:userId/atual', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(`
      SELECT 
        sentimento_atual,
        sentimento_atualizado_em
      FROM users
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar sentimento atual:', error);
    res.status(500).json({ error: 'Erro ao buscar sentimento atual' });
  }
});

// GET /api/sentimentos/estatisticas/:tenantId - Estatísticas agregadas
router.get('/estatisticas/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { dias = 30 } = req.query;

    const result = await query(`
      SELECT 
        sentimento,
        COUNT(*) as total,
        AVG(intensidade) as intensidade_media,
        COUNT(DISTINCT colaborador_id) as colaboradores_unicos
      FROM colaborador_sentimentos
      WHERE tenant_id = $1
        AND created_at >= NOW() - INTERVAL '${parseInt(dias)} days'
      GROUP BY sentimento
      ORDER BY 
        CASE sentimento
          WHEN 'muito_positivo' THEN 1
          WHEN 'positivo' THEN 2
          WHEN 'neutro' THEN 3
          WHEN 'negativo' THEN 4
          WHEN 'muito_negativo' THEN 5
        END
    `, [tenantId]);

    // Calcular sentimento médio geral
    const mediaResult = await query(`
      SELECT 
        AVG(CASE 
          WHEN sentimento = 'muito_positivo' THEN 5
          WHEN sentimento = 'positivo' THEN 4
          WHEN sentimento = 'neutro' THEN 3
          WHEN sentimento = 'negativo' THEN 2
          WHEN sentimento = 'muito_negativo' THEN 1
        END) as sentimento_medio_numerico
      FROM colaborador_sentimentos
      WHERE tenant_id = $1
        AND created_at >= NOW() - INTERVAL '${parseInt(dias)} days'
    `, [tenantId]);

    res.json({
      distribuicao: result.rows,
      sentimento_medio: parseFloat(mediaResult.rows[0]?.sentimento_medio_numerico || 3).toFixed(2),
      periodo_dias: parseInt(dias)
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// GET /api/sentimentos/trilha/:trilhaId - Sentimentos de uma trilha
router.get('/trilha/:trilhaId', async (req, res) => {
  try {
    const { trilhaId } = req.params;

    const result = await query(`
      SELECT 
        cs.sentimento,
        COUNT(*) as total,
        AVG(cs.intensidade) as intensidade_media
      FROM colaborador_sentimentos cs
      WHERE cs.trilha_id = $1
      GROUP BY cs.sentimento
      ORDER BY 
        CASE cs.sentimento
          WHEN 'muito_positivo' THEN 1
          WHEN 'positivo' THEN 2
          WHEN 'neutro' THEN 3
          WHEN 'negativo' THEN 4
          WHEN 'muito_negativo' THEN 5
        END
    `, [trilhaId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar sentimentos da trilha:', error);
    res.status(500).json({ error: 'Erro ao buscar sentimentos da trilha' });
  }
});

// GET /api/sentimentos/alertas/:tenantId - Colaboradores com sentimento negativo
router.get('/alertas/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;

    const result = await query(`
      SELECT DISTINCT ON (u.id)
        u.id,
        u.name,
        u.email,
        u.sentimento_atual,
        u.sentimento_atualizado_em,
        cs.mensagem_analisada,
        cs.created_at as ultimo_registro
      FROM users u
      JOIN colaborador_sentimentos cs ON cs.colaborador_id = u.id
      WHERE u.tenant_id = $1
        AND u.sentimento_atual IN ('negativo', 'muito_negativo')
        AND cs.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY u.id, cs.created_at DESC
    `, [tenantId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

module.exports = router;




