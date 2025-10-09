const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const { query } = require('../db-pg');

/**
 * GET /api/trilhas
 * Listar todas as trilhas do tenant
 */
router.get('/', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const result = await query(`
      SELECT 
        t.id, t.nome, t.descricao, t.prazo_dias, t.ordem, t.ativo,
        t.created_at, t.updated_at,
        COUNT(tc.id) as total_conteudos
      FROM trilhas t
      LEFT JOIN trilha_conteudos tc ON tc.trilha_id = t.id
      WHERE t.tenant_id = $1
      GROUP BY t.id
      ORDER BY t.ordem, t.nome
    `, [tenant.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar trilhas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/trilhas/:id
 * Buscar trilha específica com seus conteúdos
 */
router.get('/:id', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const trilhaId = req.params.id;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Buscar trilha
    const trilhaResult = await query(`
      SELECT id, nome, descricao, prazo_dias, ordem, ativo, created_at, updated_at
      FROM trilhas
      WHERE id = $1 AND tenant_id = $2
    `, [trilhaId, tenant.id]);

    if (trilhaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }

    const trilha = trilhaResult.rows[0];

    // Buscar conteúdos da trilha
    const conteudosResult = await query(`
      SELECT id, tipo, titulo, descricao, url, ordem, obrigatorio, created_at, updated_at
      FROM trilha_conteudos
      WHERE trilha_id = $1
      ORDER BY ordem, titulo
    `, [trilhaId]);

    trilha.conteudos = conteudosResult.rows;

    res.json(trilha);
  } catch (error) {
    console.error('Erro ao buscar trilha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/trilhas
 * Criar nova trilha
 */
router.post('/', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    const schema = z.object({
      nome: z.string().min(1),
      descricao: z.string().optional(),
      prazo_dias: z.number().int().positive().default(7),
      ordem: z.number().int().optional().default(0),
      ativo: z.boolean().optional().default(true)
    });
    
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const trilhaId = uuidv4();
    
    await query(`
      INSERT INTO trilhas (id, tenant_id, nome, descricao, prazo_dias, ordem, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      trilhaId,
      tenant.id,
      parse.data.nome,
      parse.data.descricao || null,
      parse.data.prazo_dias,
      parse.data.ordem,
      parse.data.ativo
    ]);

    res.status(201).json({
      id: trilhaId,
      ...parse.data,
      tenant_id: tenant.id
    });
  } catch (error) {
    console.error('Erro ao criar trilha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/trilhas/:id
 * Atualizar trilha
 */
router.put('/:id', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const trilhaId = req.params.id;
    
    const schema = z.object({
      nome: z.string().min(1),
      descricao: z.string().optional(),
      prazo_dias: z.number().int().positive(),
      ordem: z.number().int().optional(),
      ativo: z.boolean().optional()
    });
    
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Verificar se trilha existe
    const existing = await query(
      'SELECT id FROM trilhas WHERE id = $1 AND tenant_id = $2',
      [trilhaId, tenant.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }

    await query(`
      UPDATE trilhas SET
        nome = $1,
        descricao = $2,
        prazo_dias = $3,
        ordem = $4,
        ativo = $5,
        updated_at = NOW()
      WHERE id = $6 AND tenant_id = $7
    `, [
      parse.data.nome,
      parse.data.descricao || null,
      parse.data.prazo_dias,
      parse.data.ordem !== undefined ? parse.data.ordem : 0,
      parse.data.ativo !== undefined ? parse.data.ativo : true,
      trilhaId,
      tenant.id
    ]);

    res.json({
      message: 'Trilha atualizada com sucesso',
      id: trilhaId,
      ...parse.data
    });
  } catch (error) {
    console.error('Erro ao atualizar trilha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/trilhas/:id
 * Deletar trilha
 */
router.delete('/:id', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const trilhaId = req.params.id;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const existing = await query(
      'SELECT id FROM trilhas WHERE id = $1 AND tenant_id = $2',
      [trilhaId, tenant.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }

    // Deletar trilha (CASCADE vai deletar conteúdos e progresso)
    await query('DELETE FROM trilhas WHERE id = $1 AND tenant_id = $2', [trilhaId, tenant.id]);

    res.json({ message: 'Trilha deletada com sucesso', id: trilhaId });
  } catch (error) {
    console.error('Erro ao deletar trilha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================
// GESTÃO DE CONTEÚDOS DAS TRILHAS
// ============================================

/**
 * POST /api/trilhas/:id/conteudos
 * Adicionar conteúdo a uma trilha
 */
router.post('/:id/conteudos', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const trilhaId = req.params.id;
    
    const schema = z.object({
      tipo: z.enum(['documento', 'video', 'link', 'pdf']),
      titulo: z.string().min(1),
      descricao: z.string().optional(),
      url: z.string().url(),
      ordem: z.number().int().optional().default(0),
      obrigatorio: z.boolean().optional().default(true)
    });
    
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Verificar se trilha existe e pertence ao tenant
    const trilhaExists = await query(
      'SELECT id FROM trilhas WHERE id = $1 AND tenant_id = $2',
      [trilhaId, tenant.id]
    );

    if (trilhaExists.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }

    const conteudoId = uuidv4();
    
    await query(`
      INSERT INTO trilha_conteudos (id, trilha_id, tipo, titulo, descricao, url, ordem, obrigatorio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      conteudoId,
      trilhaId,
      parse.data.tipo,
      parse.data.titulo,
      parse.data.descricao || null,
      parse.data.url,
      parse.data.ordem,
      parse.data.obrigatorio
    ]);

    // Disparar webhook para n8n processar conteúdo (opcional - apenas se N8N_WEBHOOK_PROCESSAR_CONTEUDO estiver configurado)
    const N8N_PROCESSAR_URL = process.env.N8N_WEBHOOK_PROCESSAR_CONTEUDO;
    if (N8N_PROCESSAR_URL) {
      try {
        // Buscar informações da trilha
        const trilhaInfo = await query('SELECT nome FROM trilhas WHERE id = $1', [trilhaId]);
        
        await fetch(N8N_PROCESSAR_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            conteudo: {
              id: conteudoId,
              trilha_id: trilhaId,
              trilha_nome: trilhaInfo.rows[0]?.nome,
              tipo: parse.data.tipo,
              titulo: parse.data.titulo,
              descricao: parse.data.descricao,
              url: parse.data.url
            }
          })
        });
        console.log(`✅ Webhook n8n disparado para processar conteúdo ${conteudoId}`);
      } catch (webhookError) {
        console.error('⚠️ Erro ao enviar webhook processar conteúdo:', webhookError.message);
        // Não bloqueia a criação do conteúdo se o webhook falhar
      }
    }

    res.status(201).json({
      id: conteudoId,
      trilha_id: trilhaId,
      ...parse.data
    });
  } catch (error) {
    console.error('Erro ao adicionar conteúdo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/trilhas/conteudos/:conteudoId
 * Atualizar conteúdo
 */
router.put('/conteudos/:conteudoId', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const conteudoId = req.params.conteudoId;
    
    const schema = z.object({
      tipo: z.enum(['documento', 'video', 'link', 'pdf']).optional(),
      titulo: z.string().min(1).optional(),
      descricao: z.string().optional(),
      url: z.string().url().optional(),
      ordem: z.number().int().optional(),
      obrigatorio: z.boolean().optional()
    });
    
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Verificar se conteúdo existe e pertence a uma trilha do tenant
    const conteudoExists = await query(`
      SELECT tc.id 
      FROM trilha_conteudos tc
      JOIN trilhas t ON tc.trilha_id = t.id
      WHERE tc.id = $1 AND t.tenant_id = $2
    `, [conteudoId, tenant.id]);

    if (conteudoExists.rows.length === 0) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }

    // Construir query dinâmica apenas com campos fornecidos
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (parse.data.tipo !== undefined) {
      updates.push(`tipo = $${paramIndex++}`);
      values.push(parse.data.tipo);
    }
    if (parse.data.titulo !== undefined) {
      updates.push(`titulo = $${paramIndex++}`);
      values.push(parse.data.titulo);
    }
    if (parse.data.descricao !== undefined) {
      updates.push(`descricao = $${paramIndex++}`);
      values.push(parse.data.descricao);
    }
    if (parse.data.url !== undefined) {
      updates.push(`url = $${paramIndex++}`);
      values.push(parse.data.url);
    }
    if (parse.data.ordem !== undefined) {
      updates.push(`ordem = $${paramIndex++}`);
      values.push(parse.data.ordem);
    }
    if (parse.data.obrigatorio !== undefined) {
      updates.push(`obrigatorio = $${paramIndex++}`);
      values.push(parse.data.obrigatorio);
    }

    updates.push(`updated_at = NOW()`);
    values.push(conteudoId);

    await query(`
      UPDATE trilha_conteudos SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, values);

    res.json({
      message: 'Conteúdo atualizado com sucesso',
      id: conteudoId,
      ...parse.data
    });
  } catch (error) {
    console.error('Erro ao atualizar conteúdo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/trilhas/conteudos/:conteudoId
 * Deletar conteúdo
 */
router.delete('/conteudos/:conteudoId', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const conteudoId = req.params.conteudoId;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Verificar se conteúdo existe e pertence a uma trilha do tenant
    const conteudoExists = await query(`
      SELECT tc.id 
      FROM trilha_conteudos tc
      JOIN trilhas t ON tc.trilha_id = t.id
      WHERE tc.id = $1 AND t.tenant_id = $2
    `, [conteudoId, tenant.id]);

    if (conteudoExists.rows.length === 0) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }

    await query('DELETE FROM trilha_conteudos WHERE id = $1', [conteudoId]);

    res.json({ message: 'Conteúdo deletado com sucesso', id: conteudoId });
  } catch (error) {
    console.error('Erro ao deletar conteúdo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;


