const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');

/**
 * GET /api/agent/trilhas/disponiveis/:colaboradorId
 * Lista trilhas disponíveis para um colaborador específico
 * Aceita tanto UUID quanto número de telefone
 */
router.get('/disponiveis/:colaboradorId', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const colaboradorId = req.params.colaboradorId;
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Se colaboradorId é um telefone (contém apenas números), buscar o usuário
    let userId = colaboradorId;
    if (/^\d+$/.test(colaboradorId)) {
      // É um telefone, normalizar e buscar o usuário correspondente
      // Tentar com +55 (formato internacional)
      let phoneVariations = [
        colaboradorId,                    // 556291708483
        `+${colaboradorId}`,             // +556291708483
        `55${colaboradorId}`,            // 55556291708483
        `+55${colaboradorId}`            // +55556291708483
      ];
      
      let userResult = null;
      for (const phone of phoneVariations) {
        userResult = await query(`
          SELECT id FROM users 
          WHERE phone = $1 AND tenant_id = $2 AND status = 'active'
        `, [phone, tenant.id]);
        
        if (userResult.rows.length > 0) {
          console.log(`📞 Lookup: Phone ${colaboradorId} → User ID ${userResult.rows[0].id} (format: ${phone})`);
          break;
        }
      }
      
      if (!userResult || userResult.rows.length === 0) {
        console.log(`❌ Phone ${colaboradorId} not found in any format`);
        return res.status(404).json({ error: 'Colaborador não encontrado' });
      }
      
      userId = userResult.rows[0].id;
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
      WHERE t.tenant_id = $1 AND t.ativo = true
      ORDER BY t.ordem, t.nome
    `, [tenant.id, userId]);

    // Separar trilhas por situação
    const trilhasDisponiveis = result.rows.filter(t => t.situacao === 'disponivel');
    const trilhasEmAndamento = result.rows.filter(t => t.situacao === 'em_andamento');
    const trilhasConcluidas = result.rows.filter(t => t.situacao === 'concluida');

    res.json({
      disponiveis: trilhasDisponiveis,
      em_andamento: trilhasEmAndamento,
      concluidas: trilhasConcluidas,
      dashboard_url: `${req.protocol}://${req.get('host')}/colaborador-dashboard.html?colaborador_id=${colaboradorId}&tenant=${req.tenantSubdomain}`
    });
  } catch (error) {
    console.error('Erro ao buscar trilhas disponíveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/agent/trilhas/iniciar
 * Inicia uma trilha via agente
 * Aceita tanto UUID quanto número de telefone no colaborador_id
 */
router.post('/iniciar', async (req, res) => {
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
      // É um telefone, normalizar e buscar o usuário correspondente
      let phoneVariations = [
        colaborador_id,                    // 556291708483
        `+${colaborador_id}`,             // +556291708483
        `55${colaborador_id}`,            // 55556291708483
        `+55${colaborador_id}`            // +55556291708483
      ];
      
      let userResult = null;
      for (const phone of phoneVariations) {
        userResult = await query(`
          SELECT id FROM users 
          WHERE phone = $1 AND tenant_id = $2 AND status = 'active'
        `, [phone, tenant.id]);
        
        if (userResult.rows.length > 0) {
          console.log(`📞 Lookup: Phone ${colaborador_id} → User ID ${userResult.rows[0].id} (format: ${phone})`);
          break;
        }
      }
      
      if (!userResult || userResult.rows.length === 0) {
        console.log(`❌ Phone ${colaborador_id} not found in any format`);
        return res.status(404).json({ error: 'Colaborador não encontrado' });
      }
      
      userId = userResult.rows[0].id;
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

    res.json({
      success: true,
      message: `Trilha "${trilhaResult.rows[0].nome}" iniciada com sucesso!`,
      trilha: trilhaResult.rows[0],
      progresso_id: novoProgresso.rows[0].id,
      primeiro_conteudo: primeiroConteudo.rows[0] || null,
      dashboard_url: `${req.protocol}://${req.get('host')}/colaborador-dashboard.html?colaborador_id=${userId}&tenant=${req.tenantSubdomain}`
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
router.post('/feedback', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const { colaborador_id, trilha_id, feedback, tipo_feedback } = req.body;
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    if (!colaborador_id || !trilha_id || !feedback) {
      return res.status(400).json({ error: 'colaborador_id, trilha_id e feedback são obrigatórios' });
    }

    // Se colaborador_id é um telefone (contém apenas números), buscar o usuário
    let userId = colaborador_id;
    if (/^\d+$/.test(colaborador_id)) {
      // É um telefone, normalizar e buscar o usuário correspondente
      let phoneVariations = [
        colaborador_id,                    // 556291708483
        `+${colaborador_id}`,             // +556291708483
        `55${colaborador_id}`,            // 55556291708483
        `+55${colaborador_id}`            // +55556291708483
      ];
      
      let userResult = null;
      for (const phone of phoneVariations) {
        userResult = await query(`
          SELECT id FROM users 
          WHERE phone = $1 AND tenant_id = $2 AND status = 'active'
        `, [phone, tenant.id]);
        
        if (userResult.rows.length > 0) {
          console.log(`📞 Lookup: Phone ${colaborador_id} → User ID ${userResult.rows[0].id} (format: ${phone})`);
          break;
        }
      }
      
      if (!userResult || userResult.rows.length === 0) {
        console.log(`❌ Phone ${colaborador_id} not found in any format`);
        return res.status(404).json({ error: 'Colaborador não encontrado' });
      }
      
      userId = userResult.rows[0].id;
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
    `, [userId, trilha_id, tenant.id]);

    if (dadosResult.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador ou trilha não encontrados' });
    }

    const dados = dadosResult.rows[0];

    // Salvar feedback no banco (opcional - para histórico)
    await query(`
      INSERT INTO trilha_feedbacks (colaborador_id, trilha_id, feedback, tipo_feedback, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [userId, trilha_id, feedback, tipo_feedback || 'geral']);

    // Disparar webhook para n8n com feedback
    try {
      await fetch(`${req.protocol}://${req.get('host')}/webhook/onboarding?tenant=${req.tenantSubdomain}`, {
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

module.exports = router;
