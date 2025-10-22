const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');
const { normalizePhoneForWhatsApp, addBrazilianNinthDigit } = require('../utils/helpers');
const { requireTenant } = require('../middlewares/requireTenant');

/**
 * GET /api/agent/trilhas/disponiveis/:colaboradorId
 * Lista trilhas disponíveis para um colaborador específico
 * Aceita tanto UUID quanto número de telefone
 */
router.get('/disponiveis/:colaboradorId', requireTenant, async (req, res) => {
  try {
    const colaboradorId = req.params.colaboradorId;
    let userId = colaboradorId;
    let tenantId = null;

    // Se colaboradorId é um telefone (contém apenas números), buscar o usuário em todos os tenants
    if (/^\d+$/.test(colaboradorId)) {
      // É um telefone, normalizar e buscar
      const phoneNormalized = normalizePhoneForWhatsApp(colaboradorId);
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
        console.log(`❌ Phone ${colaboradorId} not found (tried: ${phoneNormalized}, ${phoneWithBrazilDigit})`);
        return res.status(404).json({ 
          error: 'Colaborador não encontrado',
          phoneNormalized,
          phoneWithBrazilDigit
        });
      }
      
      userId = userResult.rows[0].id;
      tenantId = userResult.rows[0].tenant_id;
      console.log(`📞 Lookup: Phone ${colaboradorId} → Normalized ${phoneNormalized} / ${phoneWithBrazilDigit} → User ID ${userId} → Tenant ${tenantId}`);
    } else {
      // Se é UUID, buscar o tenant do usuário
      const userResult = await query(`
        SELECT tenant_id FROM users WHERE id = $1 AND status = 'active'
      `, [colaboradorId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Colaborador não encontrado' });
      }
      
      tenantId = userResult.rows[0].tenant_id;
    }

    // Buscar trilhas disponíveis (não iniciadas ou em andamento)
    const result = await query(`
      SELECT 
        t.id,
        t.nome,
        t.descricao,
        t.prazo_dias,
        t.ordem,
        ct.status,
        ct.data_limite,
        CASE 
          WHEN ct.id IS NULL THEN 'disponivel'
          WHEN ct.status = 'em_andamento' THEN 'em_andamento'
          WHEN ct.status = 'concluida' THEN 'concluida'
          ELSE 'disponivel'
        END as situacao
      FROM trilhas t
      LEFT JOIN colaborador_trilhas ct ON ct.trilha_id = t.id AND ct.colaborador_id = $2
      WHERE t.tenant_id = $1 
        AND t.ativo = true
        AND colaborador_tem_acesso_trilha($2, t.id) = true
      ORDER BY 
        CASE WHEN t.ordem = 0 THEN 999999 ELSE t.ordem END ASC,
        t.nome ASC
    `, [tenantId, userId]);

    // Buscar subdomain do tenant para a URL
    const tenantResult = await query(`
      SELECT subdomain FROM tenants WHERE id = $1
    `, [tenantId]);
    
    const tenantSubdomain = tenantResult.rows[0]?.subdomain || 'demo';

    // Separar trilhas por situação
    const trilhasDisponiveis = result.rows.filter(t => t.situacao === 'disponivel');
    const trilhasEmAndamento = result.rows.filter(t => t.situacao === 'em_andamento');
    const trilhasConcluidas = result.rows.filter(t => t.situacao === 'concluida');

    // ✅ NOVO: Preparar links formatados para diferentes canais
    const dashboardUrl = `${req.protocol}://${req.get('host')}/colaborador-dashboard.html?colaborador_id=${colaboradorId}&tenant=${tenantSubdomain}`;
    
    // Links formatados para diferentes canais
    const linksFormatados = {
      dashboard: {
        url: dashboardUrl,
        titulo: 'Painel Pessoal',
        descricao: 'Acompanhe seu progresso nas trilhas',
        tipo: 'dashboard'
      }
    };
    
    // Adicionar links das trilhas disponíveis se tiverem URLs
    trilhasDisponiveis.forEach((trilha, index) => {
      if (trilha.url) {
        linksFormatados[`trilha_${index}`] = {
          url: trilha.url,
          titulo: trilha.nome,
          descricao: trilha.descricao,
          tipo: 'trilha'
        };
      }
    });

    res.json({
      disponiveis: trilhasDisponiveis,
      em_andamento: trilhasEmAndamento,
      concluidas: trilhasConcluidas,
      dashboard_url: dashboardUrl,
      // ✅ NOVO: Links formatados para diferentes canais
      links_formatados: linksFormatados,
      // ✅ NOVO: Informações para formatação
      formatacao: {
        canal: req.query.canal || 'whatsapp', // whatsapp, telegram, chat, email
        incluir_botoes: req.query.botoes === 'true',
        estilo: req.query.estilo || 'padrao' // padrao, compacto, detalhado
      }
    });
  } catch (error) {
    console.error('Erro ao buscar trilhas disponíveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/agent/trilhas/colaborador/:colaboradorId
 * Busca informações completas do colaborador para o agente conversacional
 * Aceita UUID ou telefone como colaboradorId
 * 
 * NOTA: Este endpoint NÃO usa requireTenant porque é o primeiro ponto de entrada
 * no workflow N8N (só tem telefone neste momento). O tenant_id é buscado 
 * automaticamente do usuário pelo telefone.
 */
router.get('/colaborador/:colaboradorId', async (req, res) => {
  try {
    const colaboradorId = req.params.colaboradorId;
    let userId = colaboradorId;
    let tenantId = null;

    // Se colaboradorId é telefone (só números), normalizar e buscar usuário
    if (/^\d+$/.test(colaboradorId)) {
      const phoneNormalized = normalizePhoneForWhatsApp(colaboradorId);
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
        console.log(`❌ Colaborador não encontrado: ${colaboradorId}`);
        return res.status(404).json({ 
          error: 'Colaborador não encontrado',
          phoneNormalized,
          phoneWithBrazilDigit
        });
      }
      
      userId = userResult.rows[0].id;
      tenantId = userResult.rows[0].tenant_id;
      console.log(`📞 Colaborador encontrado: ${colaboradorId} → ${userId}`);
    } else {
      // Se é UUID, buscar tenant do usuário
      const userResult = await query(`
        SELECT tenant_id FROM users WHERE id = $1 AND status = 'active'
      `, [colaboradorId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Colaborador não encontrado' });
      }
      
      tenantId = userResult.rows[0].tenant_id;
    }

    // Buscar dados completos do colaborador com JOINs
    const result = await query(`
      SELECT 
        u.id,
        u.name as nome,
        u.email,
        u.phone as telefone,
        u.start_date as data_admissao,
        COALESCE(p.name, u.position) as cargo,
        COALESCE(d.name, u.department) as departamento,
        gestor.name as gestor_nome,
        buddy.name as buddy_nome,
        u.created_at,
        u.status
      FROM users u
      LEFT JOIN positions p ON p.id = u.position_id
      LEFT JOIN departments d ON d.id = u.department_id
      LEFT JOIN users gestor ON gestor.id = u.gestor_id
      LEFT JOIN users buddy ON buddy.id = u.buddy_id
      WHERE u.id = $1 AND u.tenant_id = $2 AND u.status = 'active'
    `, [userId, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    console.log(`✅ Dados do colaborador retornados: ${result.rows[0].nome}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erro ao buscar colaborador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/agent/trilhas/iniciar
 * Inicia uma trilha via agente
 * Aceita tanto UUID quanto número de telefone no colaborador_id
 */
router.post('/iniciar', requireTenant, async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const { colaborador_id, trilha_id } = req.body;
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    if (!colaborador_id || !trilha_id) {
      return res.status(400).json({ error: 'colaborador_id e trilha_id são obrigatórios' });
    }

    // Se colaborador_id é um telefone (contém apenas números), buscar o usuário
    let userId = colaborador_id;
    if (/^\d+$/.test(colaborador_id)) {
      // É um telefone, normalizar e buscar
      const phoneNormalized = normalizePhoneForWhatsApp(colaborador_id);
      const phoneWithBrazilDigit = addBrazilianNinthDigit(phoneNormalized);
      
      const userResult = await query(`
        SELECT id FROM users 
        WHERE tenant_id = $1 AND status = 'active' AND (
          REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') = $2 OR
          REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') = $3
        )
      `, [tenant.id, phoneNormalized, phoneWithBrazilDigit]);
      
      if (userResult.rows.length === 0) {
        console.log(`❌ Phone ${colaborador_id} not found (tried: ${phoneNormalized}, ${phoneWithBrazilDigit})`);
        return res.status(404).json({ 
          error: 'Colaborador não encontrado',
          phoneNormalized,
          phoneWithBrazilDigit
        });
      }
      
      userId = userResult.rows[0].id;
      console.log(`📞 Lookup: Phone ${colaborador_id} → Normalized ${phoneNormalized} / ${phoneWithBrazilDigit} → User ID ${userId}`);
    }

    // Verificar se a trilha existe e está ativa
    const trilhaResult = await query(`
      SELECT id, nome, descricao, prazo_dias
      FROM trilhas 
      WHERE id = $1 AND tenant_id = $2 AND ativo = true
    `, [trilha_id, tenant.id]);

    if (trilhaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada ou inativa' });
    }

    // Verificar se já existe progresso
    const progressoResult = await query(`
      SELECT id, status FROM colaborador_trilhas 
      WHERE colaborador_id = $1 AND trilha_id = $2
    `, [userId, trilha_id]);

    if (progressoResult.rows.length > 0) {
      const progresso = progressoResult.rows[0];
      if (progresso.status === 'em_andamento') {
        return res.json({ 
          success: false, 
          message: 'Esta trilha já está em andamento',
          trilha: trilhaResult.rows[0]
        });
      }
      if (progresso.status === 'concluida') {
        return res.json({ 
          success: false, 
          message: 'Esta trilha já foi concluída',
          trilha: trilhaResult.rows[0]
        });
      }
    }

    // Buscar colaborador
    const colaboradorResult = await query(`
      SELECT name, email, phone FROM users WHERE id = $1
    `, [userId]);

    if (colaboradorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    // Iniciar trilha
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + trilhaResult.rows[0].prazo_dias);

    const novoProgresso = await query(`
      INSERT INTO colaborador_trilhas (colaborador_id, trilha_id, status, data_inicio, data_limite)
      VALUES ($1, $2, 'em_andamento', NOW(), $3)
      RETURNING id
    `, [userId, trilha_id, dataLimite]);

    // Buscar primeiro conteúdo da trilha
    const primeiroConteudo = await query(`
      SELECT id, tipo, titulo, descricao, url, ordem
      FROM trilha_conteudos 
      WHERE trilha_id = $1 
      ORDER BY ordem 
      LIMIT 1
    `, [trilha_id]);

    // Disparar webhook para n8n
    try {
      await fetch(`${req.protocol}://${req.get('host')}/webhook/onboarding?tenant=${req.tenantSubdomain}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'trilha',
          tipo: 'trilha_iniciada',
          colaborador_id: userId,
          colaborador_nome: colaboradorResult.rows[0].name,
          colaborador_email: colaboradorResult.rows[0].email,
          colaborador_phone: colaboradorResult.rows[0].phone,
          trilha_id,
          trilha_nome: trilhaResult.rows[0].nome,
          prazo_dias: trilhaResult.rows[0].prazo_dias,
          data_limite: dataLimite.toISOString()
        })
      });
    } catch (webhookError) {
      console.error('Erro ao enviar webhook trilha-iniciada:', webhookError);
    }

    // ✅ NOVO: Preparar links formatados para diferentes canais
    const dashboardUrl = `${req.protocol}://${req.get('host')}/colaborador-dashboard.html?colaborador_id=${userId}&tenant=${req.tenantSubdomain}`;
    
    // Links formatados para diferentes canais
    const linksFormatados = {
      dashboard: {
        url: dashboardUrl,
        titulo: 'Painel Pessoal',
        descricao: 'Acompanhe seu progresso na trilha',
        tipo: 'dashboard'
      }
    };
    
    // Adicionar link do primeiro conteúdo se disponível
    if (primeiroConteudo.rows[0] && primeiroConteudo.rows[0].url) {
      linksFormatados.primeiro_conteudo = {
        url: primeiroConteudo.rows[0].url,
        titulo: primeiroConteudo.rows[0].titulo,
        descricao: primeiroConteudo.rows[0].descricao,
        tipo: primeiroConteudo.rows[0].tipo
      };
    }

    res.json({
      success: true,
      message: `Trilha "${trilhaResult.rows[0].nome}" iniciada com sucesso!`,
      trilha: trilhaResult.rows[0],
      progresso_id: novoProgresso.rows[0].id,
      primeiro_conteudo: primeiroConteudo.rows[0] || null,
      dashboard_url: dashboardUrl,
      // ✅ NOVO: Links formatados para diferentes canais
      links_formatados: linksFormatados,
      // ✅ NOVO: Informações para formatação
      formatacao: {
        canal: req.query.canal || 'whatsapp', // whatsapp, telegram, chat, email
        incluir_botoes: req.query.botoes === 'true',
        estilo: req.query.estilo || 'padrao' // padrao, compacto, detalhado
      }
    });

  } catch (error) {
    console.error('Erro ao iniciar trilha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/agent/trilhas/feedback
 * Recebe feedback sobre uma trilha
 * Aceita tanto UUID quanto número de telefone no colaborador_id
 */
router.post('/feedback', requireTenant, async (req, res) => {
  try {
    const { colaborador_id, trilha_id, feedback, tipo_feedback } = req.body;
    
    if (!colaborador_id || !trilha_id || !feedback) {
      return res.status(400).json({ error: 'colaborador_id, trilha_id e feedback são obrigatórios' });
    }

    let userId = colaborador_id;
    let tenantId = null;

    // Se colaborador_id é um telefone (contém apenas números), buscar o usuário em todos os tenants
    if (/^\d+$/.test(colaborador_id)) {
      // É um telefone, normalizar e buscar
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
        console.log(`❌ Phone ${colaborador_id} not found (tried: ${phoneNormalized}, ${phoneWithBrazilDigit})`);
        return res.status(404).json({ 
          error: 'Colaborador não encontrado',
          phoneNormalized,
          phoneWithBrazilDigit
        });
      }
      
      userId = userResult.rows[0].id;
      tenantId = userResult.rows[0].tenant_id;
      console.log(`📞 Lookup: Phone ${colaborador_id} → Normalized ${phoneNormalized} / ${phoneWithBrazilDigit} → User ID ${userId} → Tenant ${tenantId}`);
    } else {
      // Se é UUID, buscar o tenant do usuário
      const userResult = await query(`
        SELECT tenant_id FROM users WHERE id = $1 AND status = 'active'
      `, [colaborador_id]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Colaborador não encontrado' });
      }
      
      tenantId = userResult.rows[0].tenant_id;
    }

    // Buscar dados do colaborador e trilha
    const dadosResult = await query(`
      SELECT 
        u.name as colaborador_nome,
        u.email as colaborador_email,
        u.phone as colaborador_phone,
        t.nome as trilha_nome
      FROM users u, trilhas t
      WHERE u.id = $1 AND t.id = $2 AND t.tenant_id = $3
    `, [userId, trilha_id, tenantId]);

    if (dadosResult.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador ou trilha não encontrados' });
    }

    const dados = dadosResult.rows[0];

    // Salvar feedback no banco (opcional - para histórico)
    await query(`
      INSERT INTO trilha_feedbacks (colaborador_id, trilha_id, feedback, tipo_feedback, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [userId, trilha_id, feedback, tipo_feedback || 'geral']);

    // Buscar subdomain do tenant para o webhook
    const tenantResult = await query(`
      SELECT subdomain FROM tenants WHERE id = $1
    `, [tenantId]);
    
    const tenantSubdomain = tenantResult.rows[0]?.subdomain || 'demo';

    // Disparar webhook para n8n com feedback
    try {
      await fetch(`${req.protocol}://${req.get('host')}/webhook/onboarding?tenant=${tenantSubdomain}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'trilha',
          tipo: 'feedback_trilha',
          colaborador_id: userId,
          colaborador_nome: dados.colaborador_nome,
          colaborador_email: dados.colaborador_email,
          colaborador_phone: dados.colaborador_phone,
          trilha_id,
          trilha_nome: dados.trilha_nome,
          feedback,
          tipo_feedback: tipo_feedback || 'geral'
        })
      });
    } catch (webhookError) {
      console.error('Erro ao enviar webhook feedback:', webhookError);
    }

    res.json({
      success: true,
      message: 'Feedback recebido com sucesso! Obrigado pelo seu retorno.',
      feedback: {
        colaborador_nome: dados.colaborador_nome,
        trilha_nome: dados.trilha_nome,
        feedback,
        tipo_feedback: tipo_feedback || 'geral'
      }
    });

  } catch (error) {
    console.error('Erro ao processar feedback:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/agent/trilhas/finalizar
 * Finaliza uma trilha em andamento, marcando como concluída
 * Usado pelo agente quando colaborador concluir todos os conteúdos
 */
router.post('/finalizar', async (req, res) => {
  try {
    const { colaborador_id, trilha_id, tenant_id } = req.body;

    // Validação de campos obrigatórios
    if (!colaborador_id || !trilha_id) {
      return res.status(400).json({ 
        error: 'colaborador_id e trilha_id são obrigatórios',
        received: { colaborador_id, trilha_id }
      });
    }

    // Buscar colaborador_trilha existente
    const ctResult = await query(`
      SELECT ct.id, ct.status, ct.data_inicio, t.tenant_id, t.nome as trilha_nome
      FROM colaborador_trilhas ct
      JOIN trilhas t ON t.id = ct.trilha_id
      WHERE ct.colaborador_id = $1 AND ct.trilha_id = $2
    `, [colaborador_id, trilha_id]);

    if (ctResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Trilha não encontrada para este colaborador',
        colaborador_id,
        trilha_id
      });
    }

    const ct = ctResult.rows[0];

    // Validar tenant (segurança)
    if (tenant_id && ct.tenant_id !== tenant_id) {
      console.warn(`⚠️  Tentativa de acesso cross-tenant: ${tenant_id} tentou acessar trilha de ${ct.tenant_id}`);
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Verificar se já está concluída
    if (ct.status === 'concluida') {
      return res.status(400).json({ 
        error: 'Trilha já está concluída',
        status: ct.status
      });
    }

    // Finalizar trilha
    await query(`
      UPDATE colaborador_trilhas 
      SET status = 'concluida', 
          data_conclusao = NOW(),
          updated_at = NOW()
      WHERE id = $1
    `, [ct.id]);

    console.log(`✅ Trilha finalizada: ${ct.trilha_nome} para colaborador ${colaborador_id}`);

    res.json({ 
      message: 'Trilha finalizada com sucesso! 🎉',
      colaborador_trilha_id: ct.id,
      trilha_nome: ct.trilha_nome,
      status_anterior: ct.status,
      status_novo: 'concluida',
      data_conclusao: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao finalizar trilha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/agent/trilhas/reativar
 * Reativa uma trilha concluída, permitindo refazer conteúdos
 * Gera novo prazo baseado no prazo_dias da trilha
 */
router.post('/reativar', async (req, res) => {
  try {
    const { colaborador_id, trilha_id, tenant_id } = req.body;

    // Validação de campos obrigatórios
    if (!colaborador_id || !trilha_id) {
      return res.status(400).json({ 
        error: 'colaborador_id e trilha_id são obrigatórios',
        received: { colaborador_id, trilha_id }
      });
    }

    // Buscar colaborador_trilha existente
    const ctResult = await query(`
      SELECT ct.id, ct.status, ct.data_conclusao, t.tenant_id, t.prazo_dias, t.nome as trilha_nome
      FROM colaborador_trilhas ct
      JOIN trilhas t ON t.id = ct.trilha_id
      WHERE ct.colaborador_id = $1 AND ct.trilha_id = $2
    `, [colaborador_id, trilha_id]);

    if (ctResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Trilha não encontrada para este colaborador',
        colaborador_id,
        trilha_id
      });
    }

    const ct = ctResult.rows[0];

    // Validar tenant (segurança)
    if (tenant_id && ct.tenant_id !== tenant_id) {
      console.warn(`⚠️  Tentativa de acesso cross-tenant: ${tenant_id} tentou acessar trilha de ${ct.tenant_id}`);
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Verificar se já está em andamento
    if (ct.status === 'em_andamento') {
      return res.status(400).json({ 
        error: 'Trilha já está em andamento',
        status: ct.status
      });
    }

    // Calcular nova data limite
    const novaDataLimite = new Date();
    novaDataLimite.setDate(novaDataLimite.getDate() + (ct.prazo_dias || 7));

    // Reativar trilha
    await query(`
      UPDATE colaborador_trilhas 
      SET status = 'em_andamento',
          data_limite = $2,
          data_conclusao = NULL,
          updated_at = NOW()
      WHERE id = $1
    `, [ct.id, novaDataLimite]);

    console.log(`✅ Trilha reativada: ${ct.trilha_nome} para colaborador ${colaborador_id}`);

    res.json({ 
      message: 'Trilha reativada com sucesso! Você pode refazer os conteúdos. 🔄',
      colaborador_trilha_id: ct.id,
      trilha_nome: ct.trilha_nome,
      status_anterior: ct.status,
      status_novo: 'em_andamento',
      nova_data_limite: novaDataLimite,
      prazo_dias: ct.prazo_dias
    });
  } catch (error) {
    console.error('❌ Erro ao reativar trilha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/agent/trilhas/formatar-links
 * Formata links para diferentes canais de comunicação
 */
router.post('/formatar-links', requireTenant, async (req, res) => {
  try {
    const { links, canal = 'whatsapp', estilo = 'padrao' } = req.body;
    
    if (!links || !Array.isArray(links)) {
      return res.status(400).json({ 
        error: 'Links são obrigatórios e devem ser um array' 
      });
    }
    
    // Importar o formatador
    const LinkFormatter = require('../utils/link-formatter');
    const formatter = new LinkFormatter();
    
    const linksFormatados = [];
    
    links.forEach(link => {
      const { url, titulo, descricao } = link;
      
      let linkFormatado;
      
      switch (canal) {
        case 'whatsapp':
          linkFormatado = formatter.formatarWhatsApp(url, titulo, descricao);
          break;
        case 'telegram':
          linkFormatado = formatter.formatarTelegram(url, titulo, descricao);
          break;
        case 'chat':
          linkFormatado = formatter.formatarChatFlutuante(url, titulo, descricao);
          break;
        case 'email':
          linkFormatado = formatter.formatarEmail(url, titulo, descricao);
          break;
        default:
          linkFormatado = formatter.formatarWhatsApp(url, titulo, descricao);
      }
      
      linksFormatados.push({
        original: link,
        formatado: linkFormatado,
        canal: canal,
        estilo: estilo
      });
    });
    
    res.json({
      success: true,
      canal: canal,
      estilo: estilo,
      total_links: linksFormatados.length,
      links_formatados: linksFormatados
    });
    
  } catch (error) {
    console.error('Erro ao formatar links:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/agent/trilhas/buscar-conteudo
 * Busca semântica nos conteúdos processados
 */
router.get('/buscar-conteudo', requireTenant, async (req, res) => {
  try {
    const { query: searchQuery, trilha_id, limit = 10 } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({ error: 'Query de busca é obrigatória' });
    }

    // Gerar embedding da query usando OpenAI
    const { generateEmbedding } = require('../utils/embedding-generator');
    const queryEmbedding = await generateEmbedding(searchQuery);
    
    // Busca semântica usando função SQL
    const result = await query(`
      SELECT * FROM buscar_conteudos_similares($1, $2, $3)
    `, [req.tenantId, JSON.stringify(queryEmbedding), parseInt(limit)]);

    // Buscar informações adicionais dos conteúdos
    const conteudosCompletos = await Promise.all(
      result.rows.map(async (row) => {
        const conteudoInfo = await query(`
          SELECT 
            tc.titulo,
            tc.descricao,
            tc.url,
            tc.tipo,
            t.nome as trilha_nome,
            t.id as trilha_id
          FROM trilha_conteudos tc
          JOIN trilhas t ON t.id = tc.trilha_id
          WHERE tc.id = $1
        `, [row.trilha_conteudo_id]);

        return {
          ...row,
          conteudo_info: conteudoInfo.rows[0]
        };
      })
    );

    res.json({
      success: true,
      query: searchQuery,
      results: conteudosCompletos,
      total: conteudosCompletos.length,
      embedding_generated: true
    });

  } catch (error) {
    console.error('Erro na busca semântica:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/agent/trilhas/buscar-conteudo-semantico
 * Busca semântica avançada com filtros
 */
router.post('/buscar-conteudo-semantico', requireTenant, async (req, res) => {
  try {
    const { 
      query: searchQuery, 
      trilha_id, 
      categoria,
      nivel_dificuldade,
      tipo_conteudo,
      limit = 10,
      min_similarity = 0.7
    } = req.body;
    
    if (!searchQuery) {
      return res.status(400).json({ error: 'Query de busca é obrigatória' });
    }

    // Gerar embedding da query
    const { generateEmbedding } = require('../utils/embedding-generator');
    const queryEmbedding = await generateEmbedding(searchQuery);
    
    // Construir query SQL com filtros
    let whereConditions = ['tcp.tenant_id = $1', 'tcp.status = \'completed\'', 'tcp.embedding IS NOT NULL'];
    let params = [req.tenantId, JSON.stringify(queryEmbedding)];
    let paramIndex = 3;

    if (trilha_id) {
      whereConditions.push(`tc.trilha_id = $${paramIndex}`);
      params.push(trilha_id);
      paramIndex++;
    }

    if (categoria) {
      whereConditions.push(`tcp.categoria_sugerida ILIKE $${paramIndex}`);
      params.push(`%${categoria}%`);
      paramIndex++;
    }

    if (nivel_dificuldade) {
      whereConditions.push(`tcp.nivel_dificuldade = $${paramIndex}`);
      params.push(nivel_dificuldade);
      paramIndex++;
    }

    if (tipo_conteudo) {
      whereConditions.push(`tc.tipo = $${paramIndex}`);
      params.push(tipo_conteudo);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');
    
    // Busca com filtros e similaridade mínima
    const result = await query(`
      SELECT 
        tcp.*,
        tc.titulo,
        tc.descricao,
        tc.url,
        tc.tipo,
        t.nome as trilha_nome,
        t.id as trilha_id,
        (1 - (tcp.embedding <-> $2)) as similarity_score
      FROM trilha_conteudos_processados tcp
      JOIN trilha_conteudos tc ON tc.id = tcp.trilha_conteudo_id
      JOIN trilhas t ON t.id = tc.trilha_id
      WHERE ${whereClause}
        AND (1 - (tcp.embedding <-> $2)) >= $${paramIndex}
      ORDER BY tcp.embedding <-> $2
      LIMIT $${paramIndex + 1}
    `, [...params, min_similarity, parseInt(limit)]);

    res.json({
      success: true,
      query: searchQuery,
      filters: {
        trilha_id,
        categoria,
        nivel_dificuldade,
        tipo_conteudo,
        min_similarity
      },
      results: result.rows,
      total: result.rows.length,
      embedding_generated: true
    });

  } catch (error) {
    console.error('Erro na busca semântica avançada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
