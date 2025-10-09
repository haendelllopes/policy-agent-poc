const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db-pg');

/**
 * GET /api/colaborador/trilhas
 * Listar trilhas do colaborador com seu progresso
 */
router.get('/trilhas', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const colaboradorId = req.query.colaborador_id;

    if (!colaboradorId) {
      return res.status(400).json({ error: 'colaborador_id é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Buscar trilhas ativas com progresso do colaborador
    const result = await query(`
      SELECT 
        t.id, t.nome, t.descricao, t.prazo_dias, t.ordem,
        ct.id as progresso_id,
        ct.status, ct.data_inicio, ct.data_limite, ct.data_conclusao,
        ct.pontuacao_final,
        COUNT(DISTINCT tc.id) as total_conteudos,
        COUNT(DISTINCT ca.id) as conteudos_aceitos
      FROM trilhas t
      LEFT JOIN colaborador_trilhas ct ON ct.trilha_id = t.id AND ct.colaborador_id = $2
      LEFT JOIN trilha_conteudos tc ON tc.trilha_id = t.id
      LEFT JOIN conteudo_aceites ca ON ca.conteudo_id = tc.id AND ca.colaborador_trilha_id = ct.id
      WHERE t.tenant_id = $1 AND t.ativo = true
      GROUP BY t.id, ct.id
      ORDER BY t.ordem, t.nome
    `, [tenant.id, colaboradorId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar trilhas do colaborador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/colaborador/trilhas/:id
 * Detalhes de uma trilha específica com progresso
 */
router.get('/trilhas/:id', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const trilhaId = req.params.id;
    const colaboradorId = req.query.colaborador_id;

    if (!colaboradorId) {
      return res.status(400).json({ error: 'colaborador_id é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Buscar trilha e progresso
    const trilhaResult = await query(`
      SELECT 
        t.id, t.nome, t.descricao, t.prazo_dias,
        ct.id as progresso_id,
        ct.status, ct.data_inicio, ct.data_limite, ct.data_conclusao,
        ct.pontuacao_final
      FROM trilhas t
      LEFT JOIN colaborador_trilhas ct ON ct.trilha_id = t.id AND ct.colaborador_id = $3
      WHERE t.id = $1 AND t.tenant_id = $2
    `, [trilhaId, tenant.id, colaboradorId]);

    if (trilhaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada' });
    }

    const trilha = trilhaResult.rows[0];

    // Buscar conteúdos com status de aceite
    const conteudosResult = await query(`
      SELECT 
        tc.id, tc.tipo, tc.titulo, tc.descricao, tc.url, tc.ordem, tc.obrigatorio,
        ca.aceito_em,
        CASE WHEN ca.id IS NOT NULL THEN true ELSE false END as aceito
      FROM trilha_conteudos tc
      LEFT JOIN conteudo_aceites ca ON ca.conteudo_id = tc.id 
        AND ca.colaborador_trilha_id = $2
      WHERE tc.trilha_id = $1
      ORDER BY tc.ordem, tc.titulo
    `, [trilhaId, trilha.progresso_id]);

    trilha.conteudos = conteudosResult.rows;

    res.json(trilha);
  } catch (error) {
    console.error('Erro ao buscar detalhes da trilha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/colaborador/trilhas/:id/iniciar
 * Iniciar uma trilha
 */
router.post('/trilhas/:id/iniciar', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const trilhaId = req.params.id;
    const { colaborador_id } = req.body;

    if (!colaborador_id) {
      return res.status(400).json({ error: 'colaborador_id é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Verificar se trilha existe
    const trilhaResult = await query(`
      SELECT id, prazo_dias FROM trilhas 
      WHERE id = $1 AND tenant_id = $2 AND ativo = true
    `, [trilhaId, tenant.id]);

    if (trilhaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trilha não encontrada ou inativa' });
    }

    const trilha = trilhaResult.rows[0];

    // Verificar se já existe progresso
    const progressoExiste = await query(`
      SELECT id FROM colaborador_trilhas 
      WHERE colaborador_id = $1 AND trilha_id = $2
    `, [colaborador_id, trilhaId]);

    if (progressoExiste.rows.length > 0) {
      return res.status(400).json({ error: 'Trilha já foi iniciada' });
    }

    // Criar registro de progresso
    const progressoId = uuidv4();
    const dataInicio = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + trilha.prazo_dias);

    await query(`
      INSERT INTO colaborador_trilhas (
        id, colaborador_id, trilha_id, status, data_inicio, data_limite
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      progressoId,
      colaborador_id,
      trilhaId,
      'em_andamento',
      dataInicio.toISOString(),
      dataLimite.toISOString()
    ]);

    // Buscar dados do colaborador e trilha para webhook
    const colaboradorResult = await query(`
      SELECT u.name, u.email, u.phone, t.nome as trilha_nome
      FROM users u, trilhas t
      WHERE u.id = $1 AND t.id = $2
    `, [colaborador_id, trilhaId]);

    if (colaboradorResult.rows.length > 0) {
      const dados = colaboradorResult.rows[0];
      
      // Disparar webhook para n8n
      try {
        await fetch(`${req.protocol}://${req.get('host')}/api/webhooks/trilha-iniciada?tenant=${req.tenantSubdomain}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            colaborador_id,
            colaborador_nome: dados.name,
            colaborador_email: dados.email,
            colaborador_phone: dados.phone,
            trilha_id: trilhaId,
            trilha_nome: dados.trilha_nome,
            prazo_dias: trilha.prazo_dias,
            data_limite: dataLimite.toISOString()
          })
        });
      } catch (webhookError) {
        console.error('Erro ao enviar webhook trilha-iniciada:', webhookError);
      }
    }

    res.status(201).json({
      id: progressoId,
      trilha_id: trilhaId,
      colaborador_id,
      status: 'em_andamento',
      data_inicio: dataInicio,
      data_limite: dataLimite
    });
  } catch (error) {
    console.error('Erro ao iniciar trilha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/colaborador/conteudos/:id/aceitar
 * Marcar conteúdo como lido/aceito
 */
router.post('/conteudos/:id/aceitar', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const conteudoId = req.params.id;
    const { colaborador_id } = req.body;

    if (!colaborador_id) {
      return res.status(400).json({ error: 'colaborador_id é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Buscar o progresso da trilha
    const progressoResult = await query(`
      SELECT ct.id, ct.trilha_id
      FROM trilha_conteudos tc
      JOIN trilhas t ON tc.trilha_id = t.id
      LEFT JOIN colaborador_trilhas ct ON ct.trilha_id = t.id AND ct.colaborador_id = $3
      WHERE tc.id = $1 AND t.tenant_id = $2
    `, [conteudoId, tenant.id, colaborador_id]);

    if (progressoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }

    const progresso = progressoResult.rows[0];

    if (!progresso.id) {
      return res.status(400).json({ error: 'Trilha ainda não foi iniciada' });
    }

    // Verificar se já foi aceito
    const aceiteExiste = await query(`
      SELECT id FROM conteudo_aceites 
      WHERE colaborador_trilha_id = $1 AND conteudo_id = $2
    `, [progresso.id, conteudoId]);

    let aceiteId;
    if (aceiteExiste.rows.length > 0) {
      // Conteúdo já aceito, usar ID existente
      aceiteId = aceiteExiste.rows[0].id;
    } else {
      // Registrar aceite
      aceiteId = uuidv4();
      await query(`
        INSERT INTO conteudo_aceites (id, colaborador_trilha_id, conteudo_id, aceito_em)
        VALUES ($1, $2, $3, $4)
      `, [aceiteId, progresso.id, conteudoId, new Date().toISOString()]);
    }

    // Verificar se todos os conteúdos foram aceitos
    console.log(`🔍 Verificando status da trilha ${progresso.trilha_id}...`);
    
    const statusResult = await query(`
      SELECT 
        COUNT(tc.id) as total_conteudos,
        COUNT(ca.id) as conteudos_aceitos
      FROM trilha_conteudos tc
      LEFT JOIN conteudo_aceites ca ON ca.conteudo_id = tc.id AND ca.colaborador_trilha_id = $2
      WHERE tc.trilha_id = $1
    `, [progresso.trilha_id, progresso.id]);

    const status = statusResult.rows[0];
    console.log(`📊 Status: ${status.total_conteudos} total, ${status.conteudos_aceitos} aceitos`);

    // Se todos foram aceitos, atualizar status para aguardando_quiz
    if (status.total_conteudos === parseInt(status.conteudos_aceitos)) {
      console.log(`✅ Todos os conteúdos aceitos! Mudando status para aguardando_quiz...`);
      await query(`
        UPDATE colaborador_trilhas 
        SET status = 'aguardando_quiz', updated_at = NOW()
        WHERE id = $1
      `, [progresso.id]);

      // Buscar dados do colaborador e trilha para webhook
      const colaboradorResult = await query(`
        SELECT u.name, u.email, u.phone, t.nome as trilha_nome
        FROM users u
        JOIN colaborador_trilhas ct ON u.id = ct.colaborador_id
        JOIN trilhas t ON ct.trilha_id = t.id
        WHERE ct.id = $1
      `, [progresso.id]);

      if (colaboradorResult.rows.length > 0) {
        const dados = colaboradorResult.rows[0];
        
        // Disparar webhook para n8n - quiz disponível
        try {
          await fetch(`${req.protocol}://${req.get('host')}/api/webhooks/quiz-disponivel?tenant=${req.tenantSubdomain}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              colaborador_id,
              colaborador_nome: dados.name,
              colaborador_email: dados.email,
              colaborador_phone: dados.phone,
              trilha_id: progresso.trilha_id,
              trilha_nome: dados.trilha_nome
            })
          });
        } catch (webhookError) {
          console.error('Erro ao enviar webhook quiz-disponivel:', webhookError);
        }
      }

      return res.json({
        message: 'Conteúdo aceito! Todos os conteúdos foram concluídos. Aguardando quiz.',
        id: aceiteId,
        status: 'aguardando_quiz'
      });
    }

    res.json({
      message: 'Conteúdo aceito com sucesso',
      id: aceiteId
    });
  } catch (error) {
    console.error('Erro ao aceitar conteúdo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/colaborador/progresso
 * Buscar progresso geral do colaborador
 */
router.get('/progresso', async (req, res) => {
  try {
    const { getTenantBySubdomain } = req.app.locals;
    const colaboradorId = req.query.colaborador_id;

    if (!colaboradorId) {
      return res.status(400).json({ error: 'colaborador_id é obrigatório' });
    }
    
    const tenant = await getTenantBySubdomain(req.tenantSubdomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    // Buscar dados do colaborador
    const userResult = await query(`
      SELECT 
        id, name, email, 
        onboarding_status, onboarding_inicio, onboarding_fim,
        pontuacao_total
      FROM users
      WHERE id = $1 AND tenant_id = $2
    `, [colaboradorId, tenant.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    const user = userResult.rows[0];

    // Estatísticas de trilhas
    const statsResult = await query(`
      SELECT 
        COUNT(DISTINCT t.id) as total_trilhas,
        COUNT(DISTINCT CASE WHEN ct.status = 'concluida' THEN t.id END) as trilhas_concluidas,
        COUNT(DISTINCT CASE WHEN ct.status = 'em_andamento' THEN t.id END) as trilhas_em_andamento,
        COUNT(DISTINCT CASE WHEN ct.status = 'atrasada' THEN t.id END) as trilhas_atrasadas
      FROM trilhas t
      LEFT JOIN colaborador_trilhas ct ON ct.trilha_id = t.id AND ct.colaborador_id = $2
      WHERE t.tenant_id = $1 AND t.ativo = true
    `, [tenant.id, colaboradorId]);

    const stats = statsResult.rows[0];

    res.json({
      colaborador: user,
      estatisticas: stats
    });
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;


