const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');

// GET /api/trilhas-recomendadas/:userId - Buscar trilhas recomendadas para o colaborador
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 3, sentimento } = req.query;

    // Se recebeu phone, fazer lookup do user_id
    let colaboradorId = userId;
    
    // Verificar se é um phone (contém apenas números)
    if (/^\d+$/.test(userId)) {
      const userLookup = await query(
        `SELECT id FROM users WHERE phone LIKE $1`,
        [`%${userId}%`]
      );
      
      if (userLookup.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Usuário não encontrado com este telefone',
          phone: userId
        });
      }
      
      colaboradorId = userLookup.rows[0].id;
      console.log(`📞 Lookup: Phone ${userId} → User ID ${colaboradorId}`);
    }

    // Buscar sentimento atual do usuário ou usar o enviado
    let sentimentoAtual = sentimento;
    
    if (!sentimentoAtual) {
      const userResult = await query(`
        SELECT sentimento_atual
        FROM users
        WHERE id = $1
      `, [colaboradorId]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      sentimentoAtual = userResult.rows[0].sentimento_atual || 'neutro';
    }

    console.log(`🔍 Buscando trilhas para user ${colaboradorId} com sentimento ${sentimentoAtual}`);

    // Buscar trilhas recomendadas - VERSÃO SIMPLIFICADA (sem usar função SQL problemática)
    const result = await query(`
      SELECT 
        t.id as trilha_id,
        t.nome,
        t.descricao,
        t.sentimento_medio,
        t.dificuldade_percebida,
        t.taxa_conclusao,
        t.tempo_medio_conclusao,
        
        -- Score de recomendação
        CASE
          WHEN t.sentimento_medio >= 0.80 AND t.taxa_conclusao >= 80 THEN 100
          WHEN t.sentimento_medio >= 0.70 AND t.taxa_conclusao >= 70 THEN 90
          WHEN t.sentimento_medio >= 0.60 AND t.taxa_conclusao >= 60 THEN 80
          WHEN t.sentimento_medio >= 0.50 AND t.taxa_conclusao >= 50 THEN 70
          ELSE 50
        END as score_recomendacao,
        
        -- Compatibilidade com sentimento
        CASE
          WHEN $2 IN ('muito_negativo', 'negativo') THEN
            CASE
              WHEN t.dificuldade_percebida IN ('muito_facil', 'facil') AND t.sentimento_medio >= 0.70 THEN 100
              WHEN t.dificuldade_percebida = 'media' AND t.sentimento_medio >= 0.75 THEN 80
              ELSE 50
            END
          WHEN $2 = 'neutro' THEN
            CASE
              WHEN t.dificuldade_percebida = 'media' AND t.sentimento_medio >= 0.60 THEN 100
              WHEN t.dificuldade_percebida IN ('facil', 'dificil') THEN 80
              ELSE 60
            END
          WHEN $2 IN ('positivo', 'muito_positivo') THEN
            CASE
              WHEN t.dificuldade_percebida IN ('media', 'dificil') AND t.sentimento_medio >= 0.50 THEN 100
              WHEN t.dificuldade_percebida = 'muito_dificil' AND t.sentimento_medio >= 0.60 THEN 90
              ELSE 70
            END
          ELSE 50
        END as compatibilidade_sentimento,
        
        -- Motivo da recomendação
        CASE
          WHEN $2 IN ('muito_negativo', 'negativo') THEN
            'Trilha mais leve para recuperar confiança'
          WHEN $2 = 'neutro' THEN
            'Trilha equilibrada para seu momento'
          WHEN $2 IN ('positivo', 'muito_positivo') THEN
            'Trilha desafiadora que vai te agregar muito'
          ELSE 'Trilha recomendada'
        END as motivo_recomendacao
        
      FROM trilhas t
      WHERE t.ativo = true
        AND t.id NOT IN (
          SELECT ct.trilha_id 
          FROM colaborador_trilhas ct
          WHERE ct.colaborador_id = $1
            AND ct.status IN ('concluida', 'em_andamento')
        )
      ORDER BY 
        CASE
          WHEN $2 IN ('muito_negativo', 'negativo') THEN
            CASE
              WHEN t.dificuldade_percebida IN ('muito_facil', 'facil') AND t.sentimento_medio >= 0.70 THEN 100
              WHEN t.dificuldade_percebida = 'media' AND t.sentimento_medio >= 0.75 THEN 80
              ELSE 50
            END
          WHEN $2 = 'neutro' THEN
            CASE
              WHEN t.dificuldade_percebida = 'media' AND t.sentimento_medio >= 0.60 THEN 100
              WHEN t.dificuldade_percebida IN ('facil', 'dificil') THEN 80
              ELSE 60
            END
          WHEN $2 IN ('positivo', 'muito_positivo') THEN
            CASE
              WHEN t.dificuldade_percebida IN ('media', 'dificil') AND t.sentimento_medio >= 0.50 THEN 100
              WHEN t.dificuldade_percebida = 'muito_dificil' AND t.sentimento_medio >= 0.60 THEN 90
              ELSE 70
            END
        END DESC,
        CASE
          WHEN t.sentimento_medio >= 0.80 AND t.taxa_conclusao >= 80 THEN 100
          WHEN t.sentimento_medio >= 0.70 AND t.taxa_conclusao >= 70 THEN 90
          ELSE 50
        END DESC
      LIMIT $3
    `, [colaboradorId, sentimentoAtual, parseInt(limit)]);

    console.log(`✅ Encontradas ${result.rows.length} trilhas recomendadas`);

    res.json({
      sentimento_atual: sentimentoAtual,
      total: result.rows.length,
      trilhas: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar trilhas recomendadas:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar trilhas recomendadas',
      details: error.message 
    });
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



