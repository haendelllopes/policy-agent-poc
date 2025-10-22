const express = require('express');
const multer = require('multer');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const { query } = require('../db-pg');
const path = require('path');

// Configurar multer para upload temporário
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'video/x-msvideo',
      'text/plain',
      'application/rtf',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false);
    }
  }
});

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

    // Validar ordem única (se ordem > 0)
    if (parse.data.ordem > 0) {
      const ordemExists = await query(
        'SELECT id FROM trilhas WHERE tenant_id = $1 AND ordem = $2',
        [tenant.id, parse.data.ordem]
      );
      
      if (ordemExists.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Já existe uma trilha com esta ordem. Escolha outra ordem ou deixe 0 para ordem automática.' 
        });
      }
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

    // Validar ordem única (se ordem > 0, excluindo a própria trilha)
    if (parse.data.ordem !== undefined && parse.data.ordem > 0) {
      const ordemExists = await query(
        'SELECT id FROM trilhas WHERE tenant_id = $1 AND ordem = $2 AND id != $3',
        [tenant.id, parse.data.ordem, trilhaId]
      );
      
      if (ordemExists.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Já existe uma trilha com esta ordem. Escolha outra ordem ou deixe 0 para ordem automática.' 
        });
      }
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

/**
 * POST /api/trilhas/reordenar
 * Reordenar todas as trilhas do tenant (ordem crescente)
 */
router.post('/reordenar', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Reordenar trilhas por data de criação (exceto ordem 0)
    const result = await query(`
      WITH trilhas_ordenadas AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as nova_ordem
        FROM trilhas 
        WHERE tenant_id = $1 AND ativo = true AND ordem > 0
      )
      UPDATE trilhas 
      SET ordem = to_ordenadas.nova_ordem
      FROM trilhas_ordenadas to_ordenadas
      WHERE trilhas.id = to_ordenadas.id
    `, [tenant.id]);

    res.json({ 
      message: 'Trilhas reordenadas com sucesso',
      total: result.rowCount
    });
  } catch (error) {
    console.error('Erro ao reordenar trilhas:', error);
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

    // ✅ NOVO: Disparar webhook para processamento automático com AI
    const N8N_PROCESSAR_URL = process.env.N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_PROCESSAR_CONTEUDO;
    console.log('🔍 DEBUG: N8N_PROCESSAR_URL =', N8N_PROCESSAR_URL);
    if (N8N_PROCESSAR_URL) {
      try {
        // Buscar informações da trilha
        const trilhaInfo = await query('SELECT nome FROM trilhas WHERE id = $1', [trilhaId]);
        
        await fetch(N8N_PROCESSAR_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'trilha_conteudo_processamento',
            timestamp: new Date().toISOString(),
            trilha_conteudo_id: conteudoId,
            trilha_id: trilhaId,
            trilha_nome: trilhaInfo.rows[0]?.nome,
            tenant_id: tenant.id,
            tenant_subdomain: req.tenantSubdomain,
            conteudo: {
              tipo: parse.data.tipo,
              titulo: parse.data.titulo,
              descricao: parse.data.descricao,
              url: parse.data.url,
              ordem: parse.data.ordem,
              obrigatorio: parse.data.obrigatorio
            }
          })
        });
        console.log(`✅ Webhook processamento disparado para conteúdo ${conteudoId} (${parse.data.tipo})`);
      } catch (webhookError) {
        console.error('⚠️ Erro ao enviar webhook processamento:', webhookError.message);
        console.error('⚠️ Detalhes do erro:', webhookError);
        // Não bloqueia a criação do conteúdo se o webhook falhar
      }
    } else {
      console.log('ℹ️ N8N_WEBHOOK_URL não configurado - processamento automático desabilitado');
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

/**
 * POST /api/trilhas/:id/conteudos-com-upload
 * Criar conteúdo de trilha com upload de arquivo
 */
router.post('/:id/conteudos-com-upload', upload.single('arquivo'), async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const trilhaId = req.params.id;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Validar trilha
    const trilha = await query('SELECT * FROM trilhas WHERE id = $1 AND tenant_id = $2', [trilhaId, tenant.id]);
    if (trilha.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }

    // Validar dados do conteúdo
    const conteudoSchema = z.object({
      tipo: z.enum(['documento', 'pdf', 'video', 'link']),
      titulo: z.string().min(1, 'Título é obrigatório'),
      descricao: z.string().optional(),
      ordem: z.number().int().min(1),
      obrigatorio: z.boolean().optional()
    });

    const parse = conteudoSchema.safeParse({
      tipo: req.body.tipo,
      titulo: req.body.titulo,
      descricao: req.body.descricao,
      ordem: parseInt(req.body.ordem),
      obrigatorio: req.body.obrigatorio === 'true'
    });

    if (!parse.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: parse.error.errors
      });
    }

    // Processar arquivo se fornecido
    let arquivoUrl = null;
    if (req.file) {
      try {
        // Upload para Supabase Storage
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Configuração do Supabase não encontrada');
        }

        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Gerar nome único para o arquivo
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = `tenant_${tenant.id}/${fileName}`;

        // Upload para Supabase Storage
        const { data, error } = await supabase.storage
          .from('trilha-arquivos')
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            metadata: {
              originalName: req.file.originalname,
              size: req.file.size,
              uploadedAt: new Date().toISOString(),
              tenantId: tenant.id,
              trilhaId: trilhaId
            }
          });

        if (error) {
          throw new Error(`Erro no upload: ${error.message}`);
        }

        // Gerar URL pública
        const publicUrl = await query(`
          SELECT obter_url_arquivo_trilha('trilha-arquivos', $1) as url
        `, [filePath]);

        arquivoUrl = publicUrl.rows[0].url;
        console.log(`✅ Arquivo uploadado: ${req.file.originalname} -> ${arquivoUrl}`);

      } catch (uploadError) {
        console.error('Erro no upload do arquivo:', uploadError);
        return res.status(500).json({ 
          error: 'Erro ao fazer upload do arquivo',
          details: uploadError.message
        });
      }
    }

    // Criar conteúdo na trilha
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
      arquivoUrl || parse.data.url || null,
      parse.data.ordem,
      parse.data.obrigatorio
    ]);

    // ✅ Disparar webhook para processamento automático com AI
    const N8N_PROCESSAR_URL = process.env.N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_PROCESSAR_CONTEUDO;
    if (N8N_PROCESSAR_URL) {
      try {
        // Buscar informações da trilha
        const trilhaInfo = await query('SELECT nome FROM trilhas WHERE id = $1', [trilhaId]);
        
        await fetch(N8N_PROCESSAR_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'trilha_conteudo_processamento',
            timestamp: new Date().toISOString(),
            trilha_conteudo_id: conteudoId,
            trilha_id: trilhaId,
            trilha_nome: trilhaInfo.rows[0]?.nome,
            tenant_id: tenant.id,
            tenant_subdomain: req.tenantSubdomain,
            conteudo: {
              tipo: parse.data.tipo,
              titulo: parse.data.titulo,
              descricao: parse.data.descricao,
              url: arquivoUrl || parse.data.url,
              ordem: parse.data.ordem,
              obrigatorio: parse.data.obrigatorio,
              arquivo_original: req.file ? {
                name: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
              } : null
            }
          })
        });
        console.log(`✅ Webhook processamento disparado para conteúdo ${conteudoId} (${parse.data.tipo}) com arquivo`);
      } catch (webhookError) {
        console.error('⚠️ Erro ao enviar webhook processamento:', webhookError.message);
        // Não bloqueia a criação do conteúdo se o webhook falhar
      }
    }

    res.status(201).json({
      id: conteudoId,
      trilha_id: trilhaId,
      ...parse.data,
      url: arquivoUrl || parse.data.url,
      arquivo_uploadado: req.file ? {
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: arquivoUrl
      } : null
    });

  } catch (error) {
    console.error('Erro ao criar conteúdo com upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Receber resultado do processamento do N8N
 */
router.post('/conteudos/processamento-resultado', async (req, res) => {
  try {
    const { 
      trilha_conteudo_id, 
      conteudo_extraido, 
      resumo, 
      tags, 
      categoria_sugerida,
      nivel_dificuldade,
      tempo_estimado_minutos,
      idioma,
      word_count,
      sentiment_score,
      embedding,
      status,
      erro 
    } = req.body;

    // Validações básicas
    if (!trilha_conteudo_id) {
      return res.status(400).json({ error: 'trilha_conteudo_id é obrigatório' });
    }

    if (!status) {
      return res.status(400).json({ error: 'status é obrigatório' });
    }

    // Buscar tenant_id do conteúdo
    const conteudoResult = await query(`
      SELECT tc.id, tc.trilha_id, t.tenant_id 
      FROM trilha_conteudos tc
      JOIN trilhas t ON t.id = tc.trilha_id
      WHERE tc.id = $1
    `, [trilha_conteudo_id]);

    if (conteudoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }

    const tenantId = conteudoResult.rows[0].tenant_id;

    // Salvar ou atualizar dados processados
    const result = await query(`
      INSERT INTO trilha_conteudos_processados (
        trilha_conteudo_id, tenant_id, conteudo_extraido, resumo, tags,
        categoria_sugerida, nivel_dificuldade, tempo_estimado_minutos,
        idioma, word_count, sentiment_score, embedding, status, erro
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (trilha_conteudo_id) 
      DO UPDATE SET
        conteudo_extraido = EXCLUDED.conteudo_extraido,
        resumo = EXCLUDED.resumo,
        tags = EXCLUDED.tags,
        categoria_sugerida = EXCLUDED.categoria_sugerida,
        nivel_dificuldade = EXCLUDED.nivel_dificuldade,
        tempo_estimado_minutos = EXCLUDED.tempo_estimado_minutos,
        idioma = EXCLUDED.idioma,
        word_count = EXCLUDED.word_count,
        sentiment_score = EXCLUDED.sentiment_score,
        embedding = EXCLUDED.embedding,
        status = EXCLUDED.status,
        erro = EXCLUDED.erro,
        processed_at = NOW()
      RETURNING *
    `, [
      trilha_conteudo_id, 
      tenantId,
      conteudo_extraido || null, 
      resumo || null, 
      tags || null, 
      categoria_sugerida || null,
      nivel_dificuldade || null,
      tempo_estimado_minutos || null,
      idioma || 'pt-BR',
      word_count || null,
      sentiment_score || null,
      embedding ? JSON.stringify(embedding) : null,
      status,
      erro || null
    ]);

    console.log(`✅ Processamento salvo para conteúdo ${trilha_conteudo_id} - Status: ${status}`);

    res.json({ 
      success: true, 
      processed_id: result.rows[0].id,
      status: result.rows[0].status,
      message: 'Dados processados salvos com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar processamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/trilhas/conteudos/:id/processamento
 * Buscar dados de processamento de um conteúdo
 */
router.get('/conteudos/:id/processamento', async (req, res) => {
  try {
    const conteudoId = req.params.id;
    const { getTenantBySubdomain } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const result = await query(`
      SELECT 
        tcp.*,
        tc.titulo,
        tc.descricao,
        tc.url,
        tc.tipo,
        t.nome as trilha_nome
      FROM trilha_conteudos_processados tcp
      JOIN trilha_conteudos tc ON tc.id = tcp.trilha_conteudo_id
      JOIN trilhas t ON t.id = tc.trilha_id
      WHERE tcp.trilha_conteudo_id = $1 AND tcp.tenant_id = $2
    `, [conteudoId, tenant.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Processamento não encontrado' });
    }

    res.json({
      success: true,
      processamento: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar processamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/trilhas/conteudos/processamento/estatisticas
 * Buscar estatísticas de processamento do tenant
 */
router.get('/conteudos/processamento/estatisticas', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const result = await query(`
      SELECT * FROM obter_estatisticas_processamento_conteudos($1)
    `, [tenant.id]);

    res.json({
      success: true,
      estatisticas: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;


