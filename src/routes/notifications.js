// src/routes/notifications.js
/**
 * ROTAS DE NOTIFICAÇÕES IN-APP
 * Fase 5: Agente Proativo Autônomo
 * 
 * Endpoints para gerenciar notificações in-app
 */

const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

// Middleware de autenticação (simplificado para demo)
function authenticateUser(req, res, next) {
  // Em produção, implementar autenticação JWT adequada
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autorização necessário' });
  }
  next();
}

/**
 * GET /api/notifications/unread/:userId
 * Busca notificações não lidas de um usuário
 */
router.get('/unread/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const notifications = await notificationService.buscarNaoLidas(userId, parseInt(limit));
    
    res.json({
      success: true,
      notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar notificações não lidas:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/notifications/all/:userId
 * Busca todas as notificações de um usuário
 */
router.get('/all/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      limit = 50, 
      offset = 0, 
      tipo = null, 
      apenasNaoLidas = false 
    } = req.query;

    const notifications = await notificationService.buscarTodas(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      tipo,
      apenasNaoLidas: apenasNaoLidas === 'true'
    });
    
    res.json({
      success: true,
      notifications,
      count: notifications.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar todas as notificações:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/notifications/count/:userId
 * Conta notificações não lidas de um usuário
 */
router.get('/count/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await notificationService.contarNaoLidas(userId);
    
    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('❌ Erro ao contar notificações:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/notifications/stats/:userId
 * Estatísticas de notificações de um usuário
 */
router.get('/stats/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await notificationService.getStats(userId);
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/notifications/:notificationId/read
 * Marca uma notificação como lida
 */
router.post('/:notificationId/read', authenticateUser, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    const success = await notificationService.marcarComoLida(notificationId, userId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Notificação marcada como lida'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Notificação não encontrada ou já lida'
      });
    }

  } catch (error) {
    console.error('❌ Erro ao marcar notificação como lida:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/notifications/read-all/:userId
 * Marca todas as notificações de um usuário como lidas
 */
router.post('/read-all/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await notificationService.marcarTodasComoLidas(userId);
    
    res.json({
      success: true,
      count,
      message: `${count} notificações marcadas como lidas`
    });

  } catch (error) {
    console.error('❌ Erro ao marcar todas como lidas:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * DELETE /api/notifications/cleanup/:userId
 * Remove notificações antigas de um usuário
 */
router.delete('/cleanup/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await notificationService.limparAntigas(userId);
    
    res.json({
      success: true,
      count,
      message: `${count} notificações antigas removidas`
    });

  } catch (error) {
    console.error('❌ Erro ao limpar notificações antigas:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/notifications/create
 * Cria uma nova notificação (para testes)
 */
router.post('/create', authenticateUser, async (req, res) => {
  try {
    const { 
      userId, 
      tipo, 
      titulo, 
      mensagem, 
      dados = null, 
      link = null 
    } = req.body;

    if (!userId || !tipo || !titulo || !mensagem) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: userId, tipo, titulo, mensagem'
      });
    }

    const notificationId = await notificationService.criarNotificacao(
      userId,
      tipo,
      titulo,
      mensagem,
      dados,
      link
    );
    
    res.json({
      success: true,
      notificationId,
      message: 'Notificação criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar notificação:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;











