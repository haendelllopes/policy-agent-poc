// src/routes/proactive.js
/**
 * ROTAS DE PROATIVIDADE - SISTEMA PROATIVO
 * Fase 5: Agente Proativo Autônomo
 * 
 * Endpoints para administradores gerenciarem alertas, ações e riscos
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');
const riskDetectionService = require('../services/riskDetectionService');
const proactiveEngine = require('../services/proactiveEngine');
const monitoringService = require('../services/monitoringService');

// Middleware de autenticação (simplificado para demo)
function authenticateAdmin(req, res, next) {
  // Em produção, implementar autenticação JWT adequada
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autorização necessário' });
  }
  next();
}

/**
 * GET /api/proactive/alerts/:tenantId
 * Lista alertas ativos para um tenant
 */
router.get('/alerts/:tenantId', authenticateAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { status = 'ativo', severidade, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE tenant_id = $1 AND alerta_gerado = true';
    const params = [tenantId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (severidade) {
      whereClause += ` AND severidade = $${paramIndex}`;
      params.push(severidade);
      paramIndex++;
    }

    const alertsQuery = `
      SELECT 
        aa.id,
        aa.tipo,
        aa.titulo,
        aa.anotacao,
        aa.severidade,
        aa.status,
        aa.proactive_score,
        aa.created_at,
        aa.contexto,
        aa.tags,
        u.name as colaborador_nome,
        u.email as colaborador_email,
        u.department as colaborador_departamento
      FROM agente_anotacoes aa
      JOIN users u ON u.id = aa.colaborador_id
      ${whereClause}
      ORDER BY aa.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(alertsQuery, params);
    
    res.json({
      success: true,
      alerts: result.rows,
      total: result.rows.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar alertas:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/proactive/actions/pending/:tenantId
 * Lista ações pendentes de aprovação
 */
router.get('/actions/pending/:tenantId', authenticateAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const actionsQuery = `
      SELECT 
        oi.id,
        oi.titulo,
        oi.descricao,
        oi.categoria,
        oi.prioridade,
        oi.tipo_acao,
        oi.alvo_colaborador_id,
        oi.justificativa_ia,
        oi.dados_acao,
        oi.created_at,
        u.name as colaborador_nome,
        u.email as colaborador_email,
        u.department as colaborador_departamento
      FROM onboarding_improvements oi
      LEFT JOIN users u ON u.id = oi.alvo_colaborador_id
      WHERE oi.tenant_id = $1 
        AND oi.status = 'pendente_aprovacao'
      ORDER BY oi.prioridade DESC, oi.created_at ASC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(actionsQuery, [tenantId, parseInt(limit), parseInt(offset)]);
    
    res.json({
      success: true,
      actions: result.rows,
      total: result.rows.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar ações pendentes:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/proactive/actions/:actionId/approve
 * Aprova uma ação sugerida
 */
router.post('/actions/:actionId/approve', authenticateAdmin, async (req, res) => {
  try {
    const { actionId } = req.params;
    const { observacoes, prazo_execucao } = req.body;

    const approveQuery = `
      UPDATE onboarding_improvements 
      SET status = 'aprovada_pendente_execucao',
          observacoes = COALESCE($1, observacoes),
          data_analise = NOW(),
          analisado_por = 'admin'
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(approveQuery, [observacoes, actionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Ação não encontrada' 
      });
    }

    console.log(`✅ Ação aprovada: ${actionId}`);

    res.json({
      success: true,
      action: result.rows[0],
      message: 'Ação aprovada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao aprovar ação:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/proactive/actions/:actionId/reject
 * Rejeita uma ação sugerida
 */
router.post('/actions/:actionId/reject', authenticateAdmin, async (req, res) => {
  try {
    const { actionId } = req.params;
    const { motivo_rejeicao } = req.body;

    const rejectQuery = `
      UPDATE onboarding_improvements 
      SET status = 'rejeitada',
          observacoes = COALESCE($1, observacoes),
          data_analise = NOW(),
          analisado_por = 'admin'
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(rejectQuery, [motivo_rejeicao, actionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Ação não encontrada' 
      });
    }

    console.log(`❌ Ação rejeitada: ${actionId}`);

    res.json({
      success: true,
      action: result.rows[0],
      message: 'Ação rejeitada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao rejeitar ação:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/proactive/alerts/:alertId/resolve
 * Marca um alerta como resolvido
 */
router.post('/alerts/:alertId/resolve', authenticateAdmin, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolucao, resolvido_por } = req.body;

    const resolveQuery = `
      UPDATE agente_anotacoes 
      SET status = 'resolvido',
          resolvido_em = NOW(),
          resolvido_por = $1,
          anotacao = COALESCE($2, anotacao)
      WHERE id = $3
      RETURNING *
    `;

    const result = await query(resolveQuery, [resolvido_por, resolucao, alertId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Alerta não encontrado' 
      });
    }

    console.log(`✅ Alerta resolvido: ${alertId}`);

    res.json({
      success: true,
      alert: result.rows[0],
      message: 'Alerta resolvido com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao resolver alerta:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/proactive/risks/:tenantId
 * Lista colaboradores em risco
 */
router.get('/risks/:tenantId', authenticateAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { 
      scoreMinimo = 30, 
      departamento, 
      limit = 20, 
      offset = 0 
    } = req.query;

    const colaboradoresRisco = await riskDetectionService.detectarColaboradoresEmRisco(tenantId, {
      scoreMinimo: parseInt(scoreMinimo),
      departamento,
      diasAnalise: 30
    });

    // Aplicar paginação
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = colaboradoresRisco.slice(startIndex, endIndex);

    res.json({
      success: true,
      colaboradores: paginatedResults,
      total: colaboradoresRisco.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      filtros: {
        scoreMinimo: parseInt(scoreMinimo),
        departamento
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar colaboradores em risco:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/proactive/dashboard/:tenantId
 * Dados consolidados para o dashboard de proatividade
 */
router.get('/dashboard/:tenantId', authenticateAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Buscar dados em paralelo
    const [
      alertasAtivos,
      acoesPendentes,
      colaboradoresRisco,
      insights
    ] = await Promise.all([
      this.buscarAlertasAtivos(tenantId),
      this.buscarAcoesPendentes(tenantId),
      this.buscarColaboradoresRisco(tenantId),
      this.buscarInsights(tenantId)
    ]);

    // Calcular métricas
    const metricas = {
      alertas_ativos: alertasAtivos.length,
      alertas_criticos: alertasAtivos.filter(a => a.severidade === 'critica').length,
      acoes_pendentes: acoesPendentes.length,
      colaboradores_risco_alto: colaboradoresRisco.filter(c => c.score >= 80).length,
      colaboradores_risco_medio: colaboradoresRisco.filter(c => c.score >= 60 && c.score < 80).length
    };

    res.json({
      success: true,
      metricas,
      alertas: alertasAtivos.slice(0, 10), // Top 10
      acoes: acoesPendentes.slice(0, 10), // Top 10
      colaboradores_risco: colaboradoresRisco.slice(0, 10), // Top 10
      insights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/proactive/insights/:tenantId
 * Insights gerados pela IA
 */
router.get('/insights/:tenantId', authenticateAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { periodo = 7 } = req.query;

    const analise = await proactiveEngine.analisarPerformanceColaboradores(tenantId, null, parseInt(periodo));

    res.json({
      success: true,
      insights: analise.insights,
      metricas: analise.metricas,
      periodo: parseInt(periodo),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar insights:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/proactive/trigger-analysis/:tenantId
 * Força execução de análise para um tenant específico
 */
router.post('/trigger-analysis/:tenantId', authenticateAdmin, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { tipo = 'completa' } = req.body;

    console.log(`🔄 Executando análise ${tipo} para tenant ${tenantId}`);

    let resultado;

    switch (tipo) {
      case 'risco':
        resultado = await riskDetectionService.detectarColaboradoresEmRisco(tenantId);
        break;
      case 'performance':
        resultado = await proactiveEngine.analisarPerformanceColaboradores(tenantId);
        break;
      case 'completa':
        resultado = await monitoringService.executarAnaliseHorariaTenant(tenantId);
        break;
      default:
        return res.status(400).json({ 
          success: false,
          error: 'Tipo de análise inválido' 
        });
    }

    res.json({
      success: true,
      tipo,
      resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao executar análise:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================
// MÉTODOS AUXILIARES
// ============================================

/**
 * Busca alertas ativos
 */
async function buscarAlertasAtivos(tenantId) {
  try {
    const query = `
      SELECT 
        aa.id,
        aa.tipo,
        aa.titulo,
        aa.severidade,
        aa.status,
        aa.proactive_score,
        aa.created_at,
        u.name as colaborador_nome,
        u.department as colaborador_departamento
      FROM agente_anotacoes aa
      JOIN users u ON u.id = aa.colaborador_id
      WHERE aa.tenant_id = $1 
        AND aa.alerta_gerado = true 
        AND aa.status = 'ativo'
      ORDER BY aa.proactive_score DESC, aa.created_at DESC
      LIMIT 20
    `;

    const result = await query(query, [tenantId]);
    return result.rows;

  } catch (error) {
    console.error('❌ Erro ao buscar alertas ativos:', error);
    return [];
  }
}

/**
 * Busca ações pendentes
 */
async function buscarAcoesPendentes(tenantId) {
  try {
    const query = `
      SELECT 
        oi.id,
        oi.titulo,
        oi.descricao,
        oi.prioridade,
        oi.tipo_acao,
        oi.created_at,
        u.name as colaborador_nome,
        u.department as colaborador_departamento
      FROM onboarding_improvements oi
      LEFT JOIN users u ON u.id = oi.alvo_colaborador_id
      WHERE oi.tenant_id = $1 
        AND oi.status = 'pendente_aprovacao'
      ORDER BY oi.prioridade DESC, oi.created_at ASC
      LIMIT 20
    `;

    const result = await query(query, [tenantId]);
    return result.rows;

  } catch (error) {
    console.error('❌ Erro ao buscar ações pendentes:', error);
    return [];
  }
}

/**
 * Busca colaboradores em risco
 */
async function buscarColaboradoresRisco(tenantId) {
  try {
    return await riskDetectionService.detectarColaboradoresEmRisco(tenantId, {
      scoreMinimo: 60,
      diasAnalise: 30
    });

  } catch (error) {
    console.error('❌ Erro ao buscar colaboradores em risco:', error);
    return [];
  }
}

/**
 * Busca insights recentes
 */
async function buscarInsights(tenantId) {
  try {
    const query = `
      SELECT 
        aa.titulo,
        aa.anotacao,
        aa.contexto,
        aa.created_at
      FROM agente_anotacoes aa
      WHERE aa.tenant_id = $1 
        AND aa.tipo = 'observacao_geral'
        AND aa.tags @> ARRAY['relatorio_diario']
      ORDER BY aa.created_at DESC
      LIMIT 5
    `;

    const result = await query(query, [tenantId]);
    return result.rows;

  } catch (error) {
    console.error('❌ Erro ao buscar insights:', error);
    return [];
  }
}

module.exports = router;











