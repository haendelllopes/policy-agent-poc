// src/routes/cron.js
/**
 * ROTAS DE CRON JOBS - SISTEMA PROATIVO
 * Fase 5: Agente Proativo Autônomo
 * 
 * Endpoints protegidos por CRON_SECRET para execução automática
 * pelo Vercel Cron Jobs
 */

const express = require('express');
const router = express.Router();

// Middleware de segurança para cron jobs
function verifyCronSecret(req, res, next) {
  const auth = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  if (!auth || auth !== expectedAuth) {
    console.log('❌ Tentativa de acesso não autorizado ao cron job:', {
      auth: auth ? auth.substring(0, 10) + '...' : 'undefined',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Cron job access denied'
    });
  }
  
  console.log('✅ Cron job autorizado:', req.path);
  next();
}

/**
 * GET /api/cron/monitoramento-continuo
 * Executado a cada 15 minutos
 * Monitoramento contínuo de alertas e riscos
 */
router.get('/monitoramento-continuo', verifyCronSecret, async (req, res) => {
  try {
    console.log('🔄 Executando monitoramento contínuo...');
    
    const monitoringService = require('../services/monitoringService');
    
    const results = await monitoringService.monitoramentoContinuo();
    
    console.log('✅ Monitoramento contínuo concluído:', {
      tenants_processados: results.tenants_processados,
      alertas_criados: results.alertas_criados,
      colaboradores_analisados: results.colaboradores_analisados
    });
    
    res.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      results 
    });
    
  } catch (error) {
    console.error('❌ Erro no monitoramento contínuo:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/cron/analise-horaria
 * Executado a cada hora
 * Análise profunda de padrões e tendências
 */
router.get('/analise-horaria', verifyCronSecret, async (req, res) => {
  try {
    console.log('🔄 Executando análise horária...');
    
    const monitoringService = require('../services/monitoringService');
    
    const results = await monitoringService.analiseHoraria();
    
    console.log('✅ Análise horária concluída:', {
      padroes_identificados: results.padroes_identificados,
      insights_gerados: results.insights_gerados,
      scores_atualizados: results.scores_atualizados
    });
    
    res.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      results 
    });
    
  } catch (error) {
    console.error('❌ Erro na análise horária:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/cron/relatorio-diario
 * Executado diariamente às 9h
 * Relatório executivo e resumo do dia anterior
 */
router.get('/relatorio-diario', verifyCronSecret, async (req, res) => {
  try {
    console.log('🔄 Executando relatório diário...');
    
    const monitoringService = require('../services/monitoringService');
    
    const results = await monitoringService.relatorioDiario();
    
    console.log('✅ Relatório diário concluído:', {
      relatorios_gerados: results.relatorios_gerados,
      admins_notificados: results.admins_notificados,
      melhorias_sugeridas: results.melhorias_sugeridas
    });
    
    res.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      results 
    });
    
  } catch (error) {
    console.error('❌ Erro no relatório diário:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/cron/status
 * Endpoint para verificar status dos cron jobs
 */
router.get('/status', verifyCronSecret, async (req, res) => {
  try {
    const { query } = require('../db-pg');
    
    // Verificar última execução de cada cron job
    const ultimaExecucao = await query(`
      SELECT 
        'monitoramento-continuo' as cron_job,
        MAX(created_at) as ultima_execucao
      FROM agente_anotacoes 
      WHERE tipo LIKE 'alerta_%'
      UNION ALL
      SELECT 
        'analise-horaria' as cron_job,
        MAX(created_at) as ultima_execucao
      FROM onboarding_improvements 
      WHERE criado_por = 'ai_agent'
      UNION ALL
      SELECT 
        'relatorio-diario' as cron_job,
        MAX(created_at) as ultima_execucao
      FROM notifications 
      WHERE tipo = 'relatorio_diario'
    `);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      cron_jobs: ultimaExecucao.rows,
      environment: {
        node_version: process.version,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar status dos cron jobs:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
