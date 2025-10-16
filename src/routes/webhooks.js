const express = require('express');
const router = express.Router();
const { query } = require('../db-pg');
const { normalizePhoneForWhatsApp, addBrazilianNinthDigit } = require('../utils/helpers');
const axios = require('axios');

// POST /api/webhooks/alerta-sentimento-negativo
router.post('/alerta-sentimento-negativo', async (req, res) => {
  try {
    const {
      colaborador_id,
      phone,
      sentimento,
      intensidade,
      mensagem,
      canal,
      tenant_id
    } = req.body;

    console.log('🚨 ALERTA: Sentimento negativo detectado!', {
      colaborador_id,
      phone,
      sentimento,
      intensidade,
      canal
    });

    // Se recebeu phone, fazer lookup do user_id
    let userId = colaborador_id;
    
    if (!colaborador_id && phone) {
      // Normalizar phone e tentar com/sem 9º dígito brasileiro
      const phoneNormalized = normalizePhoneForWhatsApp(phone);
      const phoneWithBrazilDigit = addBrazilianNinthDigit(phoneNormalized);
      
      const userLookup = await query(
        `SELECT id FROM users WHERE 
         REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') = $1 OR
         REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') = $2`,
        [phoneNormalized, phoneWithBrazilDigit]
      );
      
      if (userLookup.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Usuário não encontrado com este telefone',
          phone: phone,
          phoneNormalized,
          phoneWithBrazilDigit,
          hint: 'Verifique se o usuário existe no sistema e o número está correto'
        });
      }
      
      userId = userLookup.rows[0].id;
      console.log(`📞 Lookup: Phone ${phone} → Normalized ${phoneNormalized} / ${phoneWithBrazilDigit} → User ID ${userId}`);
    }

    // 1. Buscar dados do colaborador
    const colaboradorResult = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.position,
        u.department,
        u.sentimento_atual,
        t.name as tenant_name
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE u.id = $1
    `, [userId]);

    if (colaboradorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    const colaborador = colaboradorResult.rows[0];

    // 2. Buscar gestor/RH do tenant (se existir)
    const gestorResult = await query(`
      SELECT 
        email,
        name,
        phone
      FROM users
      WHERE tenant_id = $1
        AND role IN ('admin', 'gestor', 'rh')
      LIMIT 1
    `, [tenant_id]);

    // 3. Log do alerta (não salvar novamente - já foi salvo no nó de análise)
    console.log(`✅ Alerta processado - sentimento já salvo no banco pelo nó de análise`);

    // 4. Montar mensagem de alerta
    const emojiSentimento = sentimento === 'muito_negativo' ? '🔴' : '🟡';
    const mensagemAlerta = `
${emojiSentimento} ALERTA: Sentimento ${sentimento} detectado

👤 Colaborador: ${colaborador.name}
📧 Email: ${colaborador.email}
📱 Telefone: ${colaborador.phone}
🏢 Departamento: ${colaborador.department || 'N/A'}
💼 Cargo: ${colaborador.position || 'N/A'}

💭 Mensagem:
"${mensagem}"

📊 Análise:
- Sentimento: ${sentimento}
- Intensidade: ${intensidade}
- Canal: ${canal}
- Data: ${new Date().toLocaleString('pt-BR')}

⚠️ AÇÃO RECOMENDADA:
O colaborador pode estar precisando de suporte adicional. Recomendamos entrar em contato o mais breve possível.
    `.trim();

    // 5. Enviar notificações (você pode adicionar envio de email/SMS aqui)
    const notificacoes = {
      console: true,
      email: false, // Habilite quando configurar SMTP
      whatsapp: false, // Habilite quando quiser notificar via WhatsApp
      slack: false // Habilite quando quiser notificar via Slack
    };

    const resultadoNotificacoes = {
      console: 'enviado',
      email: 'desabilitado',
      whatsapp: 'desabilitado',
      slack: 'desabilitado'
    };

    // TODO: Adicionar envio de email se configurado
    // if (gestorResult.rows.length > 0 && notificacoes.email) {
    //   await enviarEmail({
    //     to: gestorResult.rows[0].email,
    //     subject: `🚨 Alerta: Sentimento ${sentimento} - ${colaborador.name}`,
    //     body: mensagemAlerta
    //   });
    //   resultadoNotificacoes.email = 'enviado';
    // }

    console.log('\n' + '='.repeat(80));
    console.log(mensagemAlerta);
    console.log('='.repeat(80) + '\n');

    // 6. Retornar sucesso
    res.json({
      success: true,
      message: 'Alerta registrado com sucesso',
      alerta: {
      colaborador: {
          id: colaborador.id,
          name: colaborador.name,
          email: colaborador.email
        },
        sentimento,
        intensidade,
        mensagem,
        timestamp: new Date().toISOString()
      },
      notificacoes: resultadoNotificacoes,
      gestor_notificado: gestorResult.rows.length > 0 ? gestorResult.rows[0].name : null
    });

  } catch (error) {
    console.error('Erro ao processar alerta de sentimento negativo:', error);
    res.status(500).json({ 
      error: 'Erro ao processar alerta',
      details: error.message 
    });
  }
});

// GET /api/webhooks/alertas-ativos/:tenantId
router.get('/alertas-ativos/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { dias = 7 } = req.query;

    const result = await query(`
      SELECT 
        cs.id,
        cs.colaborador_id,
        cs.sentimento,
        cs.intensidade,
        cs.mensagem_analisada,
        cs.origem,
        cs.created_at,
        u.name as colaborador_name,
        u.email as colaborador_email,
        u.department,
        u.position
      FROM colaborador_sentimentos cs
      JOIN users u ON u.id = cs.colaborador_id
      WHERE cs.tenant_id = $1
        AND cs.sentimento IN ('negativo', 'muito_negativo')
        AND cs.created_at >= NOW() - INTERVAL '${parseInt(dias)} days'
      ORDER BY cs.created_at DESC
    `, [tenantId]);

    res.json({
      total: result.rows.length,
      alertas: result.rows,
      periodo_dias: parseInt(dias)
    });

  } catch (error) {
    console.error('Erro ao buscar alertas ativos:', error);
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

// POST /api/webhooks/evolution/send-message
router.post('/evolution/send-message', async (req, res) => {
  try {
    const { 
      phone, 
      message, 
      instance = process.env.EVOLUTION_INSTANCE_NAME || 'navigator-whatsapp' 
    } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ 
        error: 'phone e message são obrigatórios' 
      });
    }

    // Normalizar telefone (remover caracteres especiais)
    const phoneNormalized = phone.replace(/\D/g, '');

    console.log(`📱 Enviando mensagem via Evolution API para ${phoneNormalized}`);

    const response = await axios.post(
      `${process.env.EVOLUTION_API_URL}/message/sendText/${instance}`,
      {
        number: phoneNormalized,
        text: message
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.EVOLUTION_API_KEY
        },
        timeout: 10000
      }
    );

    console.log('✅ Mensagem enviada com sucesso via Evolution API');

    res.json({ 
      success: true, 
      data: response.data,
      phone: phoneNormalized 
    });

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem via Evolution API:', error.message);
    res.status(500).json({ 
      error: 'Erro ao enviar mensagem',
      details: error.message,
      apiUrl: process.env.EVOLUTION_API_URL
    });
  }
});

// GET /api/webhooks/evolution/status
router.get('/evolution/status', async (req, res) => {
  try {
    const instance = req.query.instance || process.env.EVOLUTION_INSTANCE_NAME;
    
    const response = await axios.get(
      `${process.env.EVOLUTION_API_URL}/instance/connectionState/${instance}`,
      {
        headers: {
          'apikey': process.env.EVOLUTION_API_KEY
        }
      }
    );

    res.json({ 
      success: true, 
      status: response.data 
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao verificar status',
      details: error.message 
    });
  }
});

module.exports = router;
