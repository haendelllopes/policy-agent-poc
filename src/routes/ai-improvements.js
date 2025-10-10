const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { query } = require('../db-pg');

/**
 * POST /api/ai/improvements
 * Endpoint para agente de IA registrar oportunidades de melhoria
 */
router.post('/improvements', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    const schema = z.object({
      categoria: z.enum(['conteudo', 'interface', 'fluxo', 'performance', 'engajamento', 'acessibilidade', 'outros']),
      prioridade: z.enum(['baixa', 'media', 'alta', 'critica']).optional().default('media'),
      titulo: z.string().min(1).max(255),
      descricao: z.string().min(1),
      contexto: z.object({
        trilha_id: z.string().uuid().optional(),
        colaborador_id: z.string().uuid().optional(),
        momento: z.string().optional(),
        dados_especificos: z.record(z.any()).optional()
      }).optional(),
      dados_analise: z.record(z.any()).optional(),
      impacto_estimado: z.enum(['baixo', 'medio', 'alto', 'muito_alto']).optional(),
      esforco_estimado: z.enum(['baixo', 'medio', 'alto', 'muito_alto']).optional(),
      observacoes: z.string().optional()
    });
    
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const improvementId = uuidv4();
    
    await query(`
      INSERT INTO onboarding_improvements (
        id, tenant_id, categoria, prioridade, titulo, descricao, 
        contexto, dados_analise, impacto_estimado, esforco_estimado, 
        observacoes, criado_por, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      improvementId,
      tenant.id,
      parse.data.categoria,
      parse.data.prioridade,
      parse.data.titulo,
      parse.data.descricao,
      parse.data.contexto ? JSON.stringify(parse.data.contexto) : null,
      parse.data.dados_analise ? JSON.stringify(parse.data.dados_analise) : null,
      parse.data.impacto_estimado,
      parse.data.esforco_estimado,
      parse.data.observacoes,
      'ai_agent',
      'sugerida'
    ]);

    console.log(`🤖 Agente IA registrou melhoria: ${parse.data.titulo} (${parse.data.categoria})`);

    res.status(201).json({
      id: improvementId,
      message: 'Oportunidade de melhoria registrada com sucesso',
      ...parse.data
    });
  } catch (error) {
    console.error('Erro ao registrar melhoria do agente IA:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ai/improvements
 * Listar oportunidades de melhoria (para admins)
 */
router.get('/improvements', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const { categoria, prioridade, status, limit = 50, offset = 0 } = req.query;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    let whereClause = 'WHERE tenant_id = $1';
    let params = [tenant.id];
    let paramCount = 1;

    if (categoria) {
      paramCount++;
      whereClause += ` AND categoria = $${paramCount}`;
      params.push(categoria);
    }

    if (prioridade) {
      paramCount++;
      whereClause += ` AND prioridade = $${paramCount}`;
      params.push(prioridade);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
    }

    const result = await query(`
      SELECT 
        id, categoria, prioridade, titulo, descricao, contexto, 
        dados_analise, status, impacto_estimado, esforco_estimado,
        observacoes, criado_por, created_at, updated_at
      FROM onboarding_improvements 
      ${whereClause}
      ORDER BY 
        CASE prioridade 
          WHEN 'critica' THEN 1 
          WHEN 'alta' THEN 2 
          WHEN 'media' THEN 3 
          WHEN 'baixa' THEN 4 
        END,
        created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, limit, offset]);

    res.json({
      improvements: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erro ao listar melhorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/ai/improvements/:id/status
 * Atualizar status de uma melhoria (para admins)
 */
router.put('/improvements/:id/status', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const { id } = req.params;
    const { status, observacoes } = req.body;
    
    if (!['sugerida', 'em_analise', 'aprovada', 'em_desenvolvimento', 'implementada', 'rejeitada'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    await query(`
      UPDATE onboarding_improvements 
      SET status = $1, observacoes = COALESCE($2, observacoes), updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4
    `, [status, observacoes, id, tenant.id]);

    res.json({ message: 'Status atualizado com sucesso', status });
  } catch (error) {
    console.error('Erro ao atualizar status da melhoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;


