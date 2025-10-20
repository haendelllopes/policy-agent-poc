const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');
const { normalizePhoneForWhatsApp, addBrazilianNinthDigit } = require('../utils/helpers');

/**
 * MIDDLEWARE PARA DERIVAR TENANT_ID DO COLABORADOR_ID
 * Este middleware busca o tenant_id do colaborador automaticamente
 */
async function deriveTenantFromCollaborator(req, res, next) {
  try {
    const { colaborador_id } = req.params;
    
    if (!colaborador_id) {
      return res.status(400).json({ error: 'colaborador_id é obrigatório' });
    }

    let userId = colaborador_id;
    let tenantId = null;

    // Se colaborador_id é um telefone (contém apenas números), buscar o usuário
    if (/^\d+$/.test(colaborador_id)) {
      const phoneNormalized = normalizePhoneForWhatsApp(colaborador_id);
      const phoneWithBrazilDigit = addBrazilianNinthDigit(phoneNormalized);
      
      const userResult = await query(`
        SELECT u.id, u.tenant_id FROM users u
        WHERE u.status = 'active' AND (
          REPLACE(REPLACE(REPLACE(u.phone, '+', ''), '-', ''), ' ', '') = $1 OR
          REPLACE(REPLACE(REPLACE(u.phone, '+', ''), '-', ''), ' ', '') = $2
        )
        LIMIT 1
      `, [phoneNormalized, phoneWithBrazilDigit]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Colaborador não encontrado',
          phoneNormalized,
          phoneWithBrazilDigit
        });
      }
      
      userId = userResult.rows[0].id;
      tenantId = userResult.rows[0].tenant_id;
      console.log(`📞 N8N Lookup: Phone ${colaborador_id} → User ID ${userId} → Tenant ${tenantId}`);
    } else {
      // Se é UUID, buscar o tenant do usuário
      const userResult = await query(
        'SELECT tenant_id FROM users WHERE id = $1 AND status = \'active\'',
        [colaborador_id]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Colaborador não encontrado' });
      }
      
      tenantId = userResult.rows[0].tenant_id;
      userId = colaborador_id;
      console.log(`📞 N8N Lookup: UUID ${colaborador_id} → Tenant ${tenantId}`);
    }

    // Adicionar tenantId e userId ao request para uso nos endpoints
    req.tenantId = tenantId;
    req.userId = userId;
    req.colaborador_id = userId; // Normalizar para UUID
    
    next();
  } catch (error) {
    console.error('❌ Erro ao derivar tenant do colaborador:', error);
    console.error('📞 Colaborador ID:', colaborador_id);
    console.error('🔍 Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      colaborador_id: colaborador_id
    });
  }
}

/**
 * MIDDLEWARE PARA DERIVAR TENANT_ID DO COLABORADOR_ID (POST)
 * Para endpoints POST que recebem colaborador_id no body
 */
async function deriveTenantFromCollaboratorBody(req, res, next) {
  try {
    const { colaborador_id } = req.body;
    
    if (!colaborador_id) {
      return res.status(400).json({ error: 'colaborador_id é obrigatório' });
    }

    let userId = colaborador_id;
    let tenantId = null;

    // Se colaborador_id é um telefone (contém apenas números), buscar o usuário
    if (/^\d+$/.test(colaborador_id)) {
      const phoneNormalized = normalizePhoneForWhatsApp(colaborador_id);
      const phoneWithBrazilDigit = addBrazilianNinthDigit(phoneNormalized);
      
      const userResult = await query(`
        SELECT u.id, u.tenant_id FROM users u
        WHERE u.status = 'active' AND (
          REPLACE(REPLACE(REPLACE(u.phone, '+', ''), '-', ''), ' ', '') = $1 OR
          REPLACE(REPLACE(REPLACE(u.phone, '+', ''), '-', ''), ' ', '') = $2
        )
        LIMIT 1
      `, [phoneNormalized, phoneWithBrazilDigit]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Colaborador não encontrado',
          phoneNormalized,
          phoneWithBrazilDigit
        });
      }
      
      userId = userResult.rows[0].id;
      tenantId = userResult.rows[0].tenant_id;
      console.log(`📞 N8N Lookup: Phone ${colaborador_id} → User ID ${userId} → Tenant ${tenantId}`);
    } else {
      // Se é UUID, buscar o tenant do usuário
      const userResult = await query(
        'SELECT tenant_id FROM users WHERE id = $1 AND status = \'active\'',
        [colaborador_id]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Colaborador não encontrado' });
      }
      
      tenantId = userResult.rows[0].tenant_id;
      userId = colaborador_id;
      console.log(`📞 N8N Lookup: UUID ${colaborador_id} → Tenant ${tenantId}`);
    }

    // Adicionar tenantId e userId ao request para uso nos endpoints
    req.tenantId = tenantId;
    req.userId = userId;
    req.colaborador_id = userId; // Normalizar para UUID
    
    next();
  } catch (error) {
    console.error('❌ Erro ao derivar tenant do colaborador:', error);
    console.error('📞 Colaborador ID:', colaborador_id);
    console.error('🔍 Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message,
      colaborador_id: colaborador_id
    });
  }
}

/**
 * GET /api/agent-n8n/trilhas/disponiveis/:colaboradorId
 * Lista trilhas disponíveis para N8N (deriva tenantId automaticamente)
 */
router.get('/trilhas/disponiveis/:colaborador_id', deriveTenantFromCollaborator, async (req, res) => {
  try {
    const colaboradorId = req.userId;
    const tenantId = req.tenantId;

    console.log(`🔍 N8N Buscando trilhas para colaborador ${colaboradorId} (tenant: ${tenantId})`);

    // Buscar trilhas disponíveis para o colaborador
    const trilhasResult = await query(`
      SELECT 
        t.id,
        t.nome,
        t.descricao,
        t.prazo_dias,
        t.ordem,
        t.ativo as status,
        CASE 
          WHEN ct.id IS NOT NULL THEN ct.status
          ELSE 'disponivel'
        END as status_colaborador,
        ct.data_inicio as data_inscricao,
        ct.data_limite,
        ct.pontuacao_final as progresso_percentual
      FROM trilhas t
      LEFT JOIN colaborador_trilhas ct ON t.id = ct.trilha_id AND ct.colaborador_id = $1
      WHERE t.tenant_id = $2 AND t.ativo = true
      ORDER BY t.ordem ASC, t.nome ASC
    `, [colaboradorId, tenantId]);

    console.log(`✅ N8N Encontradas ${trilhasResult.rows.length} trilhas para colaborador ${colaboradorId}`);

    res.json({
      success: true,
      colaborador_id: colaboradorId,
      tenant_id: tenantId,
      trilhas: trilhasResult.rows,
      total: trilhasResult.rows.length
    });

  } catch (error) {
    console.error('Erro ao buscar trilhas disponíveis (N8N):', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/agent-n8n/trilhas/colaborador/:colaboradorId
 * Busca dados completos do colaborador para N8N (deriva tenantId automaticamente)
 */
router.get('/trilhas/colaborador/:colaborador_id', deriveTenantFromCollaborator, async (req, res) => {
  try {
    const colaboradorId = req.userId;
    const tenantId = req.tenantId;

    console.log(`👤 N8N Buscando dados do colaborador ${colaboradorId} (tenant: ${tenantId})`);

    // Buscar dados completos do colaborador
    const colaboradorResult = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.position as cargo,
        u.start_date as data_admissao,
        u.status,
        d.name as departamento,
        p.name as posicao,
        COALESCE(p.name, u.position) as cargo_final,
        COALESCE(d.name, 'Não definido') as departamento_final,
        g.name as gestor_nome,
        g.email as gestor_email,
        b.name as buddy_nome,
        b.email as buddy_email
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN positions p ON u.position_id = p.id
      LEFT JOIN users g ON u.gestor_id = g.id
      LEFT JOIN users b ON u.buddy_id = b.id
      WHERE u.id = $1 AND u.tenant_id = $2 AND u.status = 'active'
    `, [colaboradorId, tenantId]);

    if (colaboradorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    const colaborador = colaboradorResult.rows[0];

    console.log(`✅ N8N Dados do colaborador encontrados: ${colaborador.name}`);

    res.json({
      success: true,
      colaborador_id: colaboradorId,
      tenant_id: tenantId,
      colaborador: {
        id: colaborador.id,
        name: colaborador.name,
        email: colaborador.email,
        phone: colaborador.phone,
        cargo: colaborador.cargo_final,
        departamento: colaborador.departamento_final,
        data_admissao: colaborador.data_admissao,
        status: colaborador.status,
        gestor: {
          nome: colaborador.gestor_nome,
          email: colaborador.gestor_email
        },
        buddy: {
          nome: colaborador.buddy_nome,
          email: colaborador.buddy_email
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados do colaborador (N8N):', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/agent-n8n/trilhas/iniciar
 * Inicia uma trilha via N8N (deriva tenantId automaticamente)
 */
router.post('/trilhas/iniciar', deriveTenantFromCollaboratorBody, async (req, res) => {
  try {
    const { trilha_id } = req.body;
    const colaboradorId = req.userId;
    const tenantId = req.tenantId;

    if (!trilha_id) {
      return res.status(400).json({ error: 'trilha_id é obrigatório' });
    }

    console.log(`🚀 N8N Iniciando trilha ${trilha_id} para colaborador ${colaboradorId} (tenant: ${tenantId})`);

    // Verificar se a trilha existe e está ativa
    const trilhaResult = await query(`
      SELECT * FROM trilhas 
      WHERE id = $1 AND tenant_id = $2 AND status = 'ativa'
    `, [trilha_id, tenantId]);

    if (trilhaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada ou inativa' });
    }

    const trilha = trilhaResult.rows[0];

    // Verificar se o colaborador já está inscrito
    const inscricaoExistente = await query(`
      SELECT * FROM colaborador_trilhas 
      WHERE colaborador_id = $1 AND trilha_id = $2
    `, [colaboradorId, trilha_id]);

    if (inscricaoExistente.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Colaborador já está inscrito nesta trilha',
        status: inscricaoExistente.rows[0].status
      });
    }

    // Calcular data limite
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + trilha.prazo_dias);

    // Inserir nova inscrição
    const novoProgresso = await query(`
      INSERT INTO colaborador_trilhas (
        colaborador_id, trilha_id, status, data_inscricao, data_limite, progresso_percentual
      ) VALUES ($1, $2, 'em_andamento', NOW(), $3, 0)
      RETURNING *
    `, [colaboradorId, trilha_id, dataLimite]);

    // Buscar primeiro conteúdo da trilha
    const primeiroConteudo = await query(`
      SELECT id, tipo, titulo, descricao, url, ordem
      FROM trilha_conteudos 
      WHERE trilha_id = $1 
      ORDER BY ordem 
      LIMIT 1
    `, [trilha_id]);

    console.log(`✅ N8N Trilha "${trilha.nome}" iniciada com sucesso para colaborador ${colaboradorId}`);

    res.json({
      success: true,
      message: `Trilha "${trilha.nome}" iniciada com sucesso!`,
      colaborador_id: colaboradorId,
      tenant_id: tenantId,
      trilha: trilha,
      progresso_id: novoProgresso.rows[0].id,
      primeiro_conteudo: primeiroConteudo.rows[0] || null,
      data_limite: dataLimite.toISOString()
    });

  } catch (error) {
    console.error('Erro ao iniciar trilha (N8N):', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/agent-n8n/trilhas/feedback
 * Registra feedback via N8N (deriva tenantId automaticamente)
 */
router.post('/trilhas/feedback', deriveTenantFromCollaboratorBody, async (req, res) => {
  try {
    const { trilha_id, feedback, tipo_feedback } = req.body;
    const colaboradorId = req.userId;
    const tenantId = req.tenantId;

    if (!trilha_id || !feedback) {
      return res.status(400).json({ error: 'trilha_id e feedback são obrigatórios' });
    }

    console.log(`💬 N8N Registrando feedback para colaborador ${colaboradorId} (tenant: ${tenantId})`);

    // Buscar dados do colaborador e trilha
    const dadosResult = await query(`
      SELECT 
        u.name as colaborador_nome,
        u.email as colaborador_email,
        u.phone as colaborador_phone,
        t.nome as trilha_nome
      FROM users u, trilhas t
      WHERE u.id = $1 AND t.id = $2 AND t.tenant_id = $3
    `, [colaboradorId, trilha_id, tenantId]);

    if (dadosResult.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador ou trilha não encontrados' });
    }

    const dados = dadosResult.rows[0];

    // Salvar feedback no banco
    await query(`
      INSERT INTO trilha_feedbacks (colaborador_id, trilha_id, feedback, tipo_feedback, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [colaboradorId, trilha_id, feedback, tipo_feedback || 'geral']);

    console.log(`✅ N8N Feedback registrado com sucesso para colaborador ${colaboradorId}`);

    res.json({
      success: true,
      message: 'Feedback recebido com sucesso! Obrigado pelo seu retorno.',
      colaborador_id: colaboradorId,
      tenant_id: tenantId,
      feedback: {
        colaborador_nome: dados.colaborador_nome,
        trilha_nome: dados.trilha_nome,
        feedback,
        tipo_feedback: tipo_feedback || 'geral'
      }
    });

  } catch (error) {
    console.error('Erro ao processar feedback (N8N):', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
