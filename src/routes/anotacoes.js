const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');

// POST /api/anotacoes - Criar nova anotação
router.post('/', async (req, res) => {
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

    // Validar tipo
    const tiposValidos = [
      'sentimento_trilha',
      'sentimento_empresa',
      'dificuldade_conteudo',
      'sugestao_colaborador',
      'padrao_identificado',
      'observacao_geral'
    ];

    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ 
        error: `Tipo inválido. Use: ${tiposValidos.join(', ')}` 
      });
    }

    // Buscar tenant_id
    const userResult = await query(
      'SELECT tenant_id FROM users WHERE id = $1',
      [colaborador_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    const tenant_id = userResult.rows[0].tenant_id;

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
      tenant_id,
      colaborador_id,
      trilha_id,
      tipo,
      titulo,
      anotacao,
      sentimento,
      intensidade_sentimento,
      JSON.stringify(contexto),
      tags || []
    ]);

    res.status(201).json({
      success: true,
      anotacao: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar anotação:', error);
    res.status(500).json({ error: 'Erro ao criar anotação' });
  }
});

// GET /api/anotacoes/:tenantId - Listar anotações
router.get('/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { 
      tipo, 
      relevante = 'true', 
      limit = 50,
      offset = 0 
    } = req.query;

    let whereClause = 'WHERE aa.tenant_id = $1';
    const params = [tenantId];
    let paramCount = 1;

    if (tipo) {
      paramCount++;
      whereClause += ` AND aa.tipo = $${paramCount}`;
      params.push(tipo);
    }

    if (relevante === 'true') {
      whereClause += ' AND aa.relevante = true';
    }

    const result = await query(`
      SELECT 
        aa.*,
        u.name as colaborador_nome,
        t.nome as trilha_nome
      FROM agente_anotacoes aa
      LEFT JOIN users u ON u.id = aa.colaborador_id
      LEFT JOIN trilhas t ON t.id = aa.trilha_id
      ${whereClause}
      ORDER BY aa.created_at DESC
      LIMIT $${paramCount + 1}
      OFFSET $${paramCount + 2}
    `, [...params, parseInt(limit), parseInt(offset)]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar anotações:', error);
    res.status(500).json({ error: 'Erro ao listar anotações' });
  }
});

// GET /api/anotacoes/padroes/:tenantId - Identificar padrões
router.get('/padroes/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { dias = 30, minOcorrencias = 3 } = req.query;

    // Padrões por tipo e tags
    const result = await query(`
      SELECT 
        aa.tipo,
        unnest(aa.tags) as tag,
        COUNT(*) as frequencia,
        AVG(CASE 
          WHEN aa.sentimento = 'muito_positivo' THEN 5
          WHEN aa.sentimento = 'positivo' THEN 4
          WHEN aa.sentimento = 'neutro' THEN 3
          WHEN aa.sentimento = 'negativo' THEN 2
          WHEN aa.sentimento = 'muito_negativo' THEN 1
        END) as sentimento_medio,
        array_agg(DISTINCT aa.trilha_id) FILTER (WHERE aa.trilha_id IS NOT NULL) as trilhas_afetadas,
        array_agg(aa.titulo ORDER BY aa.created_at DESC) as ultimos_titulos
      FROM agente_anotacoes aa
      WHERE aa.tenant_id = $1
        AND aa.relevante = true
        AND aa.gerou_melhoria = false
        AND aa.created_at >= NOW() - INTERVAL '${parseInt(dias)} days'
        AND array_length(aa.tags, 1) > 0
      GROUP BY aa.tipo, unnest(aa.tags)
      HAVING COUNT(*) >= $2
      ORDER BY frequencia DESC, sentimento_medio ASC
    `, [tenantId, parseInt(minOcorrencias)]);

    res.json({
      periodo_dias: parseInt(dias),
      min_ocorrencias: parseInt(minOcorrencias),
      padroes: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar padrões:', error);
    res.status(500).json({ error: 'Erro ao buscar padrões' });
  }
});

// GET /api/anotacoes/colaborador/:userId - Anotações de um colaborador
router.get('/colaborador/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(`
      SELECT 
        aa.*,
        t.nome as trilha_nome
      FROM agente_anotacoes aa
      LEFT JOIN trilhas t ON t.id = aa.trilha_id
      WHERE aa.colaborador_id = $1
      ORDER BY aa.created_at DESC
      LIMIT 50
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar anotações do colaborador:', error);
    res.status(500).json({ error: 'Erro ao buscar anotações' });
  }
});

// GET /api/anotacoes/trilha/:trilhaId - Anotações de uma trilha
router.get('/trilha/:trilhaId', async (req, res) => {
  try {
    const { trilhaId } = req.params;

    const result = await query(`
      SELECT 
        aa.*,
        u.name as colaborador_nome
      FROM agente_anotacoes aa
      LEFT JOIN users u ON u.id = aa.colaborador_id
      WHERE aa.trilha_id = $1
        AND aa.relevante = true
      ORDER BY aa.created_at DESC
    `, [trilhaId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar anotações da trilha:', error);
    res.status(500).json({ error: 'Erro ao buscar anotações' });
  }
});

// PUT /api/anotacoes/:id/marcar-melhoria - Marcar que gerou melhoria
router.put('/:id/marcar-melhoria', async (req, res) => {
  try {
    const { id } = req.params;
    const { improvement_id } = req.body;

    await query(`
      UPDATE agente_anotacoes
      SET gerou_melhoria = true,
          improvement_id = $1,
          updated_at = NOW()
      WHERE id = $2
    `, [improvement_id, id]);

    res.json({
      success: true,
      message: 'Anotação marcada como tendo gerado melhoria'
    });
  } catch (error) {
    console.error('Erro ao marcar anotação:', error);
    res.status(500).json({ error: 'Erro ao marcar anotação' });
  }
});

// PUT /api/anotacoes/:id/relevancia - Alterar relevância
router.put('/:id/relevancia', async (req, res) => {
  try {
    const { id } = req.params;
    const { relevante } = req.body;

    await query(`
      UPDATE agente_anotacoes
      SET relevante = $1,
          updated_at = NOW()
      WHERE id = $2
    `, [relevante, id]);

    res.json({
      success: true,
      message: `Anotação marcada como ${relevante ? 'relevante' : 'não relevante'}`
    });
  } catch (error) {
    console.error('Erro ao alterar relevância:', error);
    res.status(500).json({ error: 'Erro ao alterar relevância' });
  }
});

// GET /api/anotacoes/estatisticas/:tenantId - Estatísticas de anotações
router.get('/estatisticas/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;

    const result = await query(`
      SELECT 
        tipo,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE relevante = true) as relevantes,
        COUNT(*) FILTER (WHERE gerou_melhoria = true) as geraram_melhoria,
        AVG(CASE 
          WHEN sentimento = 'muito_positivo' THEN 5
          WHEN sentimento = 'positivo' THEN 4
          WHEN sentimento = 'neutro' THEN 3
          WHEN sentimento = 'negativo' THEN 2
          WHEN sentimento = 'muito_negativo' THEN 1
        END) as sentimento_medio
      FROM agente_anotacoes
      WHERE tenant_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY tipo
      ORDER BY total DESC
    `, [tenantId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router;



