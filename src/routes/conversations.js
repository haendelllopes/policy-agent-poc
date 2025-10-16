const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');
const { normalizePhoneForWhatsApp, addBrazilianNinthDigit } = require('../utils/helpers');

// Middleware para autenticação (mock por enquanto)
const authenticate = async (req, res, next) => {
  const DEFAULT_TENANT_ID = '5978f911-738b-4aae-802a-f037fdac2e64'; // Tenant Demonstração
  
  req.tenantId = req.query.tenant_id || req.params.tenantId || req.body?.tenant_id || req.headers['x-tenant-id'] || DEFAULT_TENANT_ID;
  req.userId = req.query.userId || req.params.userId || req.body?.userId || req.headers['x-user-id'] || null;
  
  next();
};

/**
 * GET /api/conversations/history/:colaboradorId
 * Busca histórico de conversas de um colaborador
 * 
 * Query params:
 *  - tenant_id: UUID do tenant (opcional, usa padrão se não informado)
 *  - limit: Número de mensagens (padrão: 10)
 */
router.get('/history/:colaboradorId', authenticate, async (req, res) => {
  try {
    const { colaboradorId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const tenantId = req.query.tenant_id || req.tenantId;

    if (!colaboradorId) {
      return res.status(400).json({ 
        error: 'colaboradorId é obrigatório' 
      });
    }

    // Se colaboradorId parece telefone, fazer lookup
    let userId = colaboradorId;
    
    if (!colaboradorId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // É telefone, fazer lookup com normalização
      const phoneNormalized = normalizePhoneForWhatsApp(colaboradorId);
      const phoneWithBrazilDigit = addBrazilianNinthDigit(phoneNormalized);
      
      const userLookup = await query(
        `SELECT id FROM users WHERE 
         REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') = $1 OR
         REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') = $2 LIMIT 1`,
        [phoneNormalized, phoneWithBrazilDigit]
      );
      
      if (userLookup.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Colaborador não encontrado',
          colaboradorId: colaboradorId,
          phoneNormalized,
          phoneWithBrazilDigit
        });
      }
      
      userId = userLookup.rows[0].id;
      console.log(`📞 Lookup: ${colaboradorId} → Normalized ${phoneNormalized} / ${phoneWithBrazilDigit} → ${userId}`);
    }

    // Buscar histórico
    const result = await query(
      `SELECT 
        id,
        role,
        content,
        sentiment,
        sentiment_intensity,
        metadata,
        created_at
      FROM conversation_history
      WHERE user_id = $1 AND tenant_id = $2
      ORDER BY created_at DESC
      LIMIT $3`,
      [userId, tenantId, limit]
    );

    // Formatar mensagens no padrão OpenAI (ordem cronológica)
    const messages = result.rows
      .reverse() // Inverter para ordem cronológica
      .map(row => ({
        role: row.role,
        content: row.content,
        sentiment: row.sentiment,
        timestamp: row.created_at
      }));

    res.json({
      success: true,
      userId,
      tenantId,
      messages,
      count: messages.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar histórico de conversas',
      details: error.message 
    });
  }
});

/**
 * POST /api/conversations/history
 * Salva mensagens no histórico de conversas
 * 
 * Body:
 *  - user_id: UUID do usuário (ou phone para lookup)
 *  - tenant_id: UUID do tenant
 *  - session_id: ID da sessão
 *  - messages: Array de mensagens [{role, content}, ...]
 *  - metadata: Objeto com dados adicionais (opcional)
 */
router.post('/history', authenticate, async (req, res) => {
  try {
    const {
      user_id,
      phone,
      tenant_id,
      session_id,
      messages = [],
      sentiment,
      sentiment_intensity,
      metadata = {}
    } = req.body;

    if (!user_id && !phone) {
      return res.status(400).json({ 
        error: 'Informe user_id (UUID) ou phone (telefone)' 
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: 'Campo messages deve ser um array com pelo menos 1 mensagem' 
      });
    }

    const tenantId = tenant_id || req.tenantId;
    const sessionId = session_id || `${phone || user_id}, ${tenantId}, ${metadata.channel || 'whatsapp'}`;

    // Se recebeu phone, fazer lookup do user_id
    let userId = user_id;
    
    if (!user_id && phone) {
      const phoneNormalized = normalizePhoneForWhatsApp(phone);
      const phoneWithBrazilDigit = addBrazilianNinthDigit(phoneNormalized);
      
      const userLookup = await query(
        `SELECT id FROM users WHERE 
         REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') = $1 OR
         REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') = $2 LIMIT 1`,
        [phoneNormalized, phoneWithBrazilDigit]
      );
      
      if (userLookup.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Usuário não encontrado',
          phone: phone,
          phoneNormalized,
          phoneWithBrazilDigit
        });
      }
      
      userId = userLookup.rows[0].id;
      console.log(`📞 Lookup: ${phone} → Normalized ${phoneNormalized} / ${phoneWithBrazilDigit} → ${userId}`);
    }

    // Inserir mensagens no histórico
    const insertedMessages = [];
    
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        console.warn('⚠️ Mensagem inválida ignorada:', msg);
        continue;
      }

      const result = await query(
        `INSERT INTO conversation_history (
          tenant_id,
          user_id,
          session_id,
          role,
          content,
          sentiment,
          sentiment_intensity,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, role, content, created_at`,
        [
          tenantId,
          userId,
          sessionId,
          msg.role,
          msg.content,
          sentiment || msg.sentiment || null,
          sentiment_intensity || msg.sentiment_intensity || null,
          JSON.stringify({ ...metadata, ...msg.metadata })
        ]
      );

      insertedMessages.push(result.rows[0]);
    }

    console.log(`✅ ${insertedMessages.length} mensagens salvas no histórico`);

    res.json({
      success: true,
      userId,
      tenantId,
      sessionId,
      messages: insertedMessages,
      count: insertedMessages.length
    });

  } catch (error) {
    console.error('❌ Erro ao salvar histórico:', error);
    res.status(500).json({ 
      error: 'Erro ao salvar histórico de conversas',
      details: error.message 
    });
  }
});

/**
 * DELETE /api/conversations/history/:colaboradorId
 * Remove histórico de conversas de um colaborador (GDPR/LGPD)
 */
router.delete('/history/:colaboradorId', authenticate, async (req, res) => {
  try {
    const { colaboradorId } = req.params;
    const tenantId = req.query.tenant_id || req.tenantId;

    // Lookup se necessário
    let userId = colaboradorId;
    
    if (!colaboradorId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const phoneNormalized = normalizePhoneForWhatsApp(colaboradorId);
      const phoneWithBrazilDigit = addBrazilianNinthDigit(phoneNormalized);
      
      const userLookup = await query(
        `SELECT id FROM users WHERE 
         REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') = $1 OR
         REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') = $2 LIMIT 1`,
        [phoneNormalized, phoneWithBrazilDigit]
      );
      
      if (userLookup.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Colaborador não encontrado',
          phoneNormalized,
          phoneWithBrazilDigit
        });
      }
      
      userId = userLookup.rows[0].id;
    }

    // Deletar histórico
    const result = await query(
      `DELETE FROM conversation_history 
       WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    console.log(`🗑️ ${result.rowCount} mensagens deletadas do histórico`);

    res.json({
      success: true,
      userId,
      deletedCount: result.rowCount
    });

  } catch (error) {
    console.error('❌ Erro ao deletar histórico:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar histórico',
      details: error.message 
    });
  }
});

module.exports = router;

