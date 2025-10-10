const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');

// GET /api/trilhas-recomendadas/:userId - Buscar trilhas recomendadas para o colaborador
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 3 } = req.query;

    // Buscar sentimento atual do usuário
    const userResult = await query(`
      SELECT sentimento_atual
      FROM users
      WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const sentimentoAtual = userResult.rows[0].sentimento_atual || 'neutro';

    // Buscar trilhas recomendadas usando a função SQL
    const result = await query(`
      SELECT * FROM buscar_trilhas_por_sentimento($1, $2, $3)
    `, [userId, sentimentoAtual, parseInt(limit)]);

    res.json({
      sentimento_atual: sentimentoAtual,
      total: result.rows.length,
      trilhas: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar trilhas recomendadas:', error);
    res.status(500).json({ error: 'Erro ao buscar trilhas recomendadas' });
  }
});

// GET /api/trilhas-recomendadas/metricas/:trilhaId - Métricas de uma trilha
router.get('/metricas/:trilhaId', async (req, res) => {
  try {
    const { trilhaId } = req.params;

    const result = await query(`
      SELECT 
        t.id,
        t.nome,
        t.descricao,
        t.sentimento_medio,
        t.dificuldade_percebida,
        t.taxa_conclusao,
        t.tempo_medio_conclusao,
        t.total_avaliacoes,
        t.recomendada_para_iniciantes,
        t.sentimento_atualizado_em,
        
        -- Contar feedbacks
        (SELECT COUNT(*) FROM colaborador_sentimentos cs WHERE cs.trilha_id = t.id) as total_feedbacks,
        
        -- Contar conclusões
        (SELECT COUNT(*) FROM colaborador_trilhas ct WHERE ct.trilha_id = t.id AND ct.status = 'concluida') as total_conclusoes,
        
        -- Contar em andamento
        (SELECT COUNT(*) FROM colaborador_trilhas ct WHERE ct.trilha_id = t.id AND ct.status = 'em_andamento') as total_em_andamento,
        
        -- Distribuição de sentimentos
        (
          SELECT json_agg(row_to_json(dist))
          FROM (
            SELECT 
              sentimento,
              COUNT(*) as quantidade
            FROM colaborador_sentimentos
            WHERE trilha_id = t.id
            GROUP BY sentimento
          ) dist
        ) as distribuicao_sentimentos
        
      FROM trilhas t
      WHERE t.id = $1
    `, [trilhaId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar métricas da trilha:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// GET /api/trilhas-recomendadas/ranking/:tenantId - Ranking de trilhas
router.get('/ranking/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { orderBy = 'sentimento' } = req.query;

    let orderClause = 'tr.sentimento_medio DESC NULLS LAST';
    
    if (orderBy === 'conclusao') {
      orderClause = 'tr.taxa_conclusao DESC NULLS LAST';
    } else if (orderBy === 'score') {
      orderClause = 'tr.score_recomendacao DESC';
    }

    const result = await query(`
      SELECT 
        tr.*
      FROM trilhas_recomendadas tr
      WHERE tr.tenant_id = $1
      ORDER BY ${orderClause}
      LIMIT 20
    `, [tenantId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
});

// POST /api/trilhas-recomendadas/recalcular/:trilhaId - Recalcular métricas
router.post('/recalcular/:trilhaId', async (req, res) => {
  try {
    const { trilhaId } = req.params;

    // Executar função de recálculo
    await query(`
      SELECT calcular_sentimento_trilha($1)
    `, [trilhaId]);

    // Buscar trilha atualizada
    const result = await query(`
      SELECT 
        sentimento_medio,
        dificuldade_percebida,
        taxa_conclusao,
        tempo_medio_conclusao,
        total_avaliacoes,
        sentimento_atualizado_em
      FROM trilhas
      WHERE id = $1
    `, [trilhaId]);

    res.json({
      success: true,
      message: 'Métricas recalculadas com sucesso',
      metricas: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao recalcular métricas:', error);
    res.status(500).json({ error: 'Erro ao recalcular métricas' });
  }
});

// GET /api/trilhas-recomendadas/problematicas/:tenantId - Trilhas que precisam atenção
router.get('/problematicas/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;

    const result = await query(`
      SELECT 
        tr.*,
        (
          SELECT json_agg(row_to_json(feedback))
          FROM (
            SELECT 
              cs.mensagem_analisada,
              cs.sentimento,
              cs.created_at
            FROM colaborador_sentimentos cs
            WHERE cs.trilha_id = tr.id
              AND cs.sentimento IN ('negativo', 'muito_negativo')
            ORDER BY cs.created_at DESC
            LIMIT 5
          ) feedback
        ) as feedbacks_negativos_recentes
      FROM trilhas_recomendadas tr
      WHERE tr.tenant_id = $1
        AND (
          tr.sentimento_medio < 0.50 
          OR tr.taxa_conclusao < 50
          OR tr.nivel_recomendacao = 'precisa_atencao'
        )
      ORDER BY tr.sentimento_medio ASC NULLS LAST
    `, [tenantId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar trilhas problemáticas:', error);
    res.status(500).json({ error: 'Erro ao buscar trilhas problemáticas' });
  }
});

module.exports = router;



