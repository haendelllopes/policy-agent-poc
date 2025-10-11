const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');

// Middleware de autenticação básica
const authenticate = async (req, res, next) => {
  // Usa tenant padrão se não especificado
  const DEFAULT_TENANT_ID = '5978f911-738b-4aae-802a-f037fdac2e64'; // Tenant Demonstração

  req.tenantId = req.body.tenantId || req.headers['x-tenant-id'] || DEFAULT_TENANT_ID;
  req.userId = req.body.userId || req.headers['x-user-id'] || 'mock-user-id';

  next();
};

/**
 * POST /api/agente/anotacoes
 * Criar nova anotação do agente
 */
router.post('/anotacoes', authenticate, async (req, res) => {
  try {
    const {
      colaborador_id,
      trilha_id,
      tipo,
      titulo,
      anotacao,
      sentimento,
      intensidade_sentimento,
      contexto,
      tags
    } = req.body;

    // Validações obrigatórias
    if (!tipo || !titulo || !anotacao) {
      return res.status(400).json({
        error: 'Campos obrigatórios: tipo, titulo, anotacao'
      });
    }

    // Validar tipo
    const tiposValidos = ['sentimento_trilha', 'sentimento_empresa', 'dificuldade_conteudo', 'sugestao_colaborador', 'padrao_identificado', 'observacao_geral'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        error: `Tipo inválido. Tipos válidos: ${tiposValidos.join(', ')}`
      });
    }

    // Inserir anotação
    const result = await query(`
      INSERT INTO agente_anotacoes (
        tenant_id,
        colaborador_id,
        trilha_id,
        tipo,
        titulo,
        anotacao,
        sentimento,
        intensidade_sentimento,
        contexto,
        tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      req.tenantId,
      colaborador_id,
      trilha_id,
      tipo,
      titulo,
      anotacao,
      sentimento,
      intensidade_sentimento,
      contexto ? JSON.stringify(contexto) : null,
      tags
    ]);

    console.log(`📝 Nova anotação criada: ${tipo} - ${titulo}`);

    res.status(201).json({
      success: true,
      anotacao: result.rows[0],
      message: 'Anotação criada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar anotação:', error);
    res.status(500).json({
      error: 'Erro interno ao criar anotação',
      details: error.message
    });
  }
});

/**
 * GET /api/agente/anotacoes/:tenantId
 * Listar anotações do tenant
 */
router.get('/anotacoes/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { tipo, sentimento, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE aa.tenant_id = $1 AND aa.relevante = true';
    let queryParams = [tenantId];
    let paramIndex = 2;

    if (tipo) {
      whereClause += ` AND aa.tipo = $${paramIndex}`;
      queryParams.push(tipo);
      paramIndex++;
    }

    if (sentimento) {
      whereClause += ` AND aa.sentimento = $${paramIndex}`;
      queryParams.push(sentimento);
      paramIndex++;
    }

    const result = await query(`
      SELECT 
        aa.*,
        u.name as colaborador_name,
        u.email as colaborador_email,
        t.nome as trilha_nome
      FROM agente_anotacoes aa
      LEFT JOIN users u ON u.id = aa.colaborador_id
      LEFT JOIN trilhas t ON t.id = aa.trilha_id
      ${whereClause}
      ORDER BY aa.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      total: result.rows.length,
      anotacoes: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar anotações:', error);
    res.status(500).json({
      error: 'Erro interno ao buscar anotações',
      details: error.message
    });
  }
});

/**
 * GET /api/agente/anotacoes/colaborador/:userId
 * Anotações de um colaborador específico
 */
router.get('/anotacoes/colaborador/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const result = await query(`
      SELECT 
        aa.*,
        t.nome as trilha_nome
      FROM agente_anotacoes aa
      LEFT JOIN trilhas t ON t.id = aa.trilha_id
      WHERE aa.colaborador_id = $1 AND aa.relevante = true
      ORDER BY aa.created_at DESC
      LIMIT $2
    `, [userId, parseInt(limit)]);

    res.json({
      success: true,
      colaborador_id: userId,
      total: result.rows.length,
      anotacoes: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar anotações do colaborador:', error);
    res.status(500).json({
      error: 'Erro interno ao buscar anotações do colaborador',
      details: error.message
    });
  }
});

/**
 * GET /api/agente/anotacoes/trilha/:trilhaId
 * Anotações de uma trilha específica
 */
router.get('/anotacoes/trilha/:trilhaId', async (req, res) => {
  try {
    const { trilhaId } = req.params;
    const { limit = 20 } = req.query;

    const result = await query(`
      SELECT 
        aa.*,
        u.name as colaborador_name,
        u.email as colaborador_email
      FROM agente_anotacoes aa
      LEFT JOIN users u ON u.id = aa.colaborador_id
      WHERE aa.trilha_id = $1 AND aa.relevante = true
      ORDER BY aa.created_at DESC
      LIMIT $2
    `, [trilhaId, parseInt(limit)]);

    res.json({
      success: true,
      trilha_id: trilhaId,
      total: result.rows.length,
      anotacoes: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar anotações da trilha:', error);
    res.status(500).json({
      error: 'Erro interno ao buscar anotações da trilha',
      details: error.message
    });
  }
});

/**
 * GET /api/agente/anotacoes/padroes/:tenantId
 * Identificar padrões nas anotações
 */
router.get('/anotacoes/padroes/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { days = 30 } = req.query;

    // Buscar padrões por tipo e sentimento
    const padroesTipo = await query(`
      SELECT 
        tipo,
        sentimento,
        COUNT(*) as quantidade,
        AVG(intensidade_sentimento) as intensidade_media,
        array_agg(DISTINCT tags) as tags_comuns
      FROM agente_anotacoes
      WHERE tenant_id = $1 
        AND relevante = true
        AND created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY tipo, sentimento
      HAVING COUNT(*) >= 3
      ORDER BY quantidade DESC
    `, [tenantId]);

    // Buscar tags mais frequentes
    const tagsFrequentes = await query(`
      SELECT 
        unnest(tags) as tag,
        COUNT(*) as frequencia
      FROM agente_anotacoes
      WHERE tenant_id = $1 
        AND relevante = true
        AND tags IS NOT NULL
        AND created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY unnest(tags)
      HAVING COUNT(*) >= 2
      ORDER BY frequencia DESC
      LIMIT 10
    `, [tenantId]);

    // Buscar trilhas com mais feedback
    const trilhasFeedback = await query(`
      SELECT 
        t.nome as trilha_nome,
        aa.trilha_id,
        COUNT(*) as total_anotacoes,
        COUNT(CASE WHEN aa.sentimento IN ('negativo', 'muito_negativo') THEN 1 END) as anotacoes_negativas,
        AVG(aa.intensidade_sentimento) as intensidade_media
      FROM agente_anotacoes aa
      JOIN trilhas t ON t.id = aa.trilha_id
      WHERE aa.tenant_id = $1 
        AND aa.relevante = true
        AND aa.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY t.nome, aa.trilha_id
      HAVING COUNT(*) >= 2
      ORDER BY anotacoes_negativas DESC, total_anotacoes DESC
    `, [tenantId]);

    res.json({
      success: true,
      periodo_dias: parseInt(days),
      padroes_por_tipo: padroesTipo.rows,
      tags_frequentes: tagsFrequentes.rows,
      trilhas_com_feedback: trilhasFeedback.rows,
      total_padroes_identificados: padroesTipo.rows.length
    });

  } catch (error) {
    console.error('Erro ao buscar padrões:', error);
    res.status(500).json({
      error: 'Erro interno ao buscar padrões',
      details: error.message
    });
  }
});

/**
 * PUT /api/agente/anotacoes/:id
 * Atualizar anotação
 */
router.put('/anotacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, anotacao, relevante, gerou_melhoria } = req.body;

    const result = await query(`
      UPDATE agente_anotacoes 
      SET 
        titulo = COALESCE($2, titulo),
        anotacao = COALESCE($3, anotacao),
        relevante = COALESCE($4, relevante),
        gerou_melhoria = COALESCE($5, gerou_melhoria),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, titulo, anotacao, relevante, gerou_melhoria]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anotação não encontrada' });
    }

    res.json({
      success: true,
      anotacao: result.rows[0],
      message: 'Anotação atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar anotação:', error);
    res.status(500).json({
      error: 'Erro interno ao atualizar anotação',
      details: error.message
    });
  }
});

/**
 * DELETE /api/agente/anotacoes/:id
 * Marcar anotação como não relevante (soft delete)
 */
router.delete('/anotacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      UPDATE agente_anotacoes 
      SET relevante = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anotação não encontrada' });
    }

    res.json({
      success: true,
      message: 'Anotação marcada como não relevante'
    });

  } catch (error) {
    console.error('Erro ao remover anotação:', error);
    res.status(500).json({
      error: 'Erro interno ao remover anotação',
      details: error.message
    });
  }
});

/**
 * POST /api/agente/anotacoes/:id/gerar-melhoria
 * Gerar sugestão de melhoria a partir de anotação
 */
router.post('/anotacoes/:id/gerar-melhoria', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar anotação
    const anotacaoResult = await query(`
      SELECT * FROM agente_anotacoes WHERE id = $1
    `, [id]);

    if (anotacaoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Anotação não encontrada' });
    }

    const anotacao = anotacaoResult.rows[0];

    // Buscar anotações similares para contexto
    const similaresResult = await query(`
      SELECT 
        titulo,
        anotacao,
        sentimento,
        tipo
      FROM agente_anotacoes
      WHERE tenant_id = $1
        AND tipo = $2
        AND id != $3
        AND relevante = true
        AND created_at >= NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 5
    `, [anotacao.tenant_id, anotacao.tipo, id]);

    // Preparar contexto para IA
    const contextoAnotacoes = similaresResult.rows.map(a => 
      `- ${a.titulo}: ${a.anotacao} (${a.sentimento})`
    ).join('\n');

    // TODO: Implementar chamada para IA (Gemini) para gerar melhoria
    // Por enquanto, retornar estrutura básica
    const melhoria = {
      titulo: `Melhoria baseada em: ${anotacao.titulo}`,
      descricao: `Sugestão gerada a partir da anotação: "${anotacao.anotacao}"`,
      categoria: 'conteudo',
      prioridade: anotacao.sentimento === 'negativo' || anotacao.sentimento === 'muito_negativo' ? 'alta' : 'media',
      impacto_estimado: 'medio',
      esforco_estimado: 'medio',
      anotacao_origem_id: id
    };

    res.json({
      success: true,
      anotacao: anotacao,
      melhoria_sugerida: melhoria,
      anotacoes_similares: similaresResult.rows.length,
      message: 'Sugestão de melhoria gerada (implementação da IA pendente)'
    });

  } catch (error) {
    console.error('Erro ao gerar melhoria:', error);
    res.status(500).json({
      error: 'Erro interno ao gerar melhoria',
      details: error.message
    });
  }
});

module.exports = router;

