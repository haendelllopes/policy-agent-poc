const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');

/**
 * GET /api/admin/dashboard/overview
 * Visão geral do sistema de onboarding
 */
router.get('/dashboard/overview', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Estatísticas gerais
    const statsResult = await query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_colaboradores,
        COUNT(DISTINCT u.id) FILTER (WHERE u.onboarding_status = 'em_andamento') as em_andamento,
        COUNT(DISTINCT u.id) FILTER (WHERE u.onboarding_status = 'concluido') as concluidos,
        COUNT(DISTINCT t.id) as total_trilhas,
        COUNT(DISTINCT ct.id) FILTER (WHERE ct.status = 'atrasada') as trilhas_atrasadas,
        COUNT(DISTINCT qt.id) FILTER (WHERE qt.aprovado = false) as quizzes_reprovados
      FROM users u
      LEFT JOIN colaborador_trilhas ct ON ct.colaborador_id = u.id
      LEFT JOIN trilhas t ON t.tenant_id = u.tenant_id
      LEFT JOIN quiz_tentativas qt ON qt.colaborador_trilha_id = ct.id
      WHERE u.tenant_id = $1 AND u.role = 'colaborador'
    `, [tenant.id]);

    res.json(statsResult.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar overview:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/admin/alertas/atrasados
 * Lista de colaboradores com trilhas atrasadas
 */
router.get('/alertas/atrasados', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const result = await query(`
      SELECT 
        u.id as colaborador_id,
        u.name as colaborador_nome,
        u.email,
        p.name as cargo,
        d.name as departamento,
        t.id as trilha_id,
        t.nome as trilha_nome,
        ct.data_limite,
        ct.status,
        EXTRACT(DAY FROM NOW() - ct.data_limite) as dias_atraso
      FROM colaborador_trilhas ct
      JOIN users u ON ct.colaborador_id = u.id
      JOIN trilhas t ON ct.trilha_id = t.id
      LEFT JOIN positions p ON u.position_id = p.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.tenant_id = $1 
        AND ct.data_limite < NOW()
        AND ct.status IN ('em_andamento', 'aguardando_quiz', 'atrasada')
      ORDER BY ct.data_limite ASC
    `, [tenant.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar atrasados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/admin/alertas/notas-baixas
 * Lista de colaboradores com notas abaixo de 60%
 */
router.get('/alertas/notas-baixas', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const result = await query(`
      SELECT 
        u.id as colaborador_id,
        u.name as colaborador_nome,
        u.email,
        p.name as cargo,
        d.name as departamento,
        t.nome as trilha_nome,
        qt.nota,
        qt.tentativa_numero,
        qt.created_at as data_tentativa
      FROM quiz_tentativas qt
      JOIN colaborador_trilhas ct ON qt.colaborador_trilha_id = ct.id
      JOIN users u ON ct.colaborador_id = u.id
      JOIN trilhas t ON ct.trilha_id = t.id
      LEFT JOIN positions p ON u.position_id = p.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.tenant_id = $1 
        AND qt.aprovado = false
        AND qt.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY qt.created_at DESC
    `, [tenant.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar notas baixas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/admin/colaboradores/progresso
 * Progresso de todos os colaboradores
 */
router.get('/colaboradores/progresso', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const result = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        p.name as cargo,
        d.name as departamento,
        u.onboarding_status,
        u.onboarding_inicio,
        u.onboarding_fim,
        u.pontuacao_total,
        COUNT(DISTINCT t.id) as total_trilhas,
        COUNT(DISTINCT ct.id) FILTER (WHERE ct.status = 'concluida') as trilhas_concluidas,
        COUNT(DISTINCT ct.id) FILTER (WHERE ct.status = 'em_andamento') as trilhas_em_andamento,
        COUNT(DISTINCT ct.id) FILTER (WHERE ct.status = 'atrasada') as trilhas_atrasadas
      FROM users u
      LEFT JOIN positions p ON u.position_id = p.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN trilhas t ON t.tenant_id = u.tenant_id AND t.ativo = true
      LEFT JOIN colaborador_trilhas ct ON ct.colaborador_id = u.id AND ct.trilha_id = t.id
      WHERE u.tenant_id = $1 AND u.role = 'colaborador'
      GROUP BY u.id, p.name, d.name
      ORDER BY u.name
    `, [tenant.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar progresso dos colaboradores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/admin/verificar-atrasos
 * Verificar trilhas atrasadas e enviar alertas via webhook
 * Este endpoint pode ser chamado por um cron job ou manualmente
 */
router.post('/verificar-atrasos', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Buscar trilhas atrasadas que ainda não foram marcadas como atrasadas
    const atrasadosResult = await query(`
      SELECT 
        u.name as colaborador_nome,
        t.nome as trilha_nome,
        EXTRACT(DAY FROM NOW() - ct.data_limite) as dias_atraso,
        u_rh.email as rh_email,
        u_rh.phone as rh_phone,
        ct.id as colaborador_trilha_id
      FROM colaborador_trilhas ct
      JOIN users u ON ct.colaborador_id = u.id
      JOIN trilhas t ON ct.trilha_id = t.id
      LEFT JOIN users u_rh ON u_rh.tenant_id = u.tenant_id AND u_rh.role = 'admin'
      WHERE u.tenant_id = $1 
        AND ct.data_limite < NOW()
        AND ct.status IN ('em_andamento', 'aguardando_quiz')
      ORDER BY ct.data_limite ASC
    `, [tenant.id]);

    const alertasEnviados = [];

    for (const atraso of atrasadosResult.rows) {
      // Marcar trilha como atrasada
      await query(`
        UPDATE colaborador_trilhas
        SET status = 'atrasada', updated_at = NOW()
        WHERE id = $1
      `, [atraso.colaborador_trilha_id]);

      // Disparar webhook para n8n - alerta de atraso
      try {
        await fetch(`${req.protocol}://${req.get('host')}/api/webhooks/alerta-atraso?tenant=${req.tenantSubdomain}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            colaborador_nome: atraso.colaborador_nome,
            trilha_nome: atraso.trilha_nome,
            dias_atraso: Math.floor(atraso.dias_atraso),
            rh_email: atraso.rh_email,
            rh_phone: atraso.rh_phone
          })
        });
        
        alertasEnviados.push({
          colaborador: atraso.colaborador_nome,
          trilha: atraso.trilha_nome,
          dias_atraso: Math.floor(atraso.dias_atraso)
        });
      } catch (webhookError) {
        console.error('Erro ao enviar webhook alerta-atraso:', webhookError);
      }
    }

    res.json({
      message: `${alertasEnviados.length} alertas de atraso enviados`,
      alertas: alertasEnviados
    });
  } catch (error) {
    console.error('Erro ao verificar atrasos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/admin/trilhas/estatisticas
 * Estatísticas de cada trilha
 */
router.get('/trilhas/estatisticas', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const result = await query(`
      SELECT 
        t.id,
        t.nome,
        t.prazo_dias,
        COUNT(DISTINCT ct.id) as total_iniciadas,
        COUNT(DISTINCT ct.id) FILTER (WHERE ct.status = 'concluida') as concluidas,
        COUNT(DISTINCT ct.id) FILTER (WHERE ct.status = 'em_andamento') as em_andamento,
        COUNT(DISTINCT ct.id) FILTER (WHERE ct.status = 'atrasada') as atrasadas,
        ROUND(AVG(ct.pontuacao_final)) as media_pontuacao,
        ROUND(AVG(EXTRACT(DAY FROM ct.data_conclusao - ct.data_inicio))) as media_dias_conclusao
      FROM trilhas t
      LEFT JOIN colaborador_trilhas ct ON ct.trilha_id = t.id
      WHERE t.tenant_id = $1 AND t.ativo = true
      GROUP BY t.id
      ORDER BY t.ordem, t.nome
    `, [tenant.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar estatísticas das trilhas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;


