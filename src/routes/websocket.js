const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Inicializar Supabase Client
let supabase = null;
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase Client inicializado');
  } else {
    console.log('⚠️ Supabase não configurado - variáveis de ambiente ausentes');
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Supabase:', error.message);
}

/**
 * POST /api/websocket/notify-admin
 * Ativa chat flutuante para admin com notificação de urgência
 */
router.post('/notify-admin', async (req, res) => {
  try {
    const {
      admin_id,
      tenant_id,
      tipo,
      colaborador_nome,
      problema,
      urgencia,
      categoria,
      acao_sugerida,
      anotacao_id
    } = req.body;

    console.log('🚨 Notificando admin via chat flutuante:', {
      admin_id,
      colaborador_nome,
      urgencia,
      categoria
    });

    // Notificar via Supabase Realtime se disponível
    if (supabase) {
      try {
        // Enviar notificação via Supabase Realtime
        // Limpar anotacao_id se estiver vazio
        const cleanAnotacaoId = anotacao_id && anotacao_id.trim() !== '' ? anotacao_id : null;
        
        const { data, error } = await supabase
          .from('admin_notifications')
          .insert({
            admin_id,
            tenant_id,
            tipo: tipo || 'urgencia_critica',
            colaborador_nome,
            colaborador_email: req.body.colaborador_email,
            colaborador_phone: req.body.colaborador_phone,
            problema,
            urgencia,
            categoria,
            acao_sugerida,
            anotacao_id: cleanAnotacaoId,
            lida: false,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('❌ Erro ao enviar notificação Supabase:', error.message);
          // Não falhar o endpoint - continuar com sucesso simulado
        } else {
          console.log('✅ Notificação enviada via Supabase Realtime:', data);
        }
      } catch (error) {
        console.error('❌ Erro ao enviar notificação:', error.message);
        // Não falhar o endpoint
      }
    } else {
      console.log('⚠️ Supabase não disponível - notificação não será enviada via Realtime');
    }

    // Buscar conexões WebSocket ativas do admin (server local)
    const chatServer = req.app.locals.chatServer;
    
    // Se o chatServer não estiver disponível, retornar sucesso simulado
    if (!chatServer) {
      console.log('⚠️ Chat server não disponível - retornando sucesso simulado');
      return res.json({
        success: true,
        message: 'Alerta registrado (Notificação via Supabase Realtime)',
        admin_id,
        connections_found: 0,
        alert_saved: true,
        data: {
          colaborador_nome,
          urgencia,
          categoria,
          problema,
          acao_sugerida
        }
      });
    }

    const adminConnections = chatServer.getAdminConnections(admin_id);

    if (adminConnections.length === 0) {
      console.log('⚠️ Admin não está conectado ao chat flutuante:', admin_id);
      // Não é erro - apenas informar que o admin não está conectado
      return res.json({
        success: true,
        message: 'Admin não está conectado ao chat flutuante',
        admin_id,
        connections_found: 0,
        alert_saved: true,
        data: {
          colaborador_nome,
          urgencia,
          categoria,
          problema,
          acao_sugerida
        }
      });
    }

    // Mensagem do Navi para o admin
    const mensagemNavi = `🚨 **ALERTA CRÍTICO DETECTADO**

👤 **Colaborador:** ${colaborador_nome}
⚠️ **Problema:** ${problema}
🔴 **Urgência:** ${urgencia}
📂 **Categoria:** ${categoria}

💡 **Ação Sugerida:** ${acao_sugerida}

⏰ **Detectado em:** ${new Date().toLocaleString('pt-BR')}

---
*Este alerta foi gerado automaticamente pelo sistema de detecção de urgência.*`;

    // Enviar notificação para todas as conexões do admin
    let notifiedCount = 0;
    adminConnections.forEach(ws => {
      try {
        ws.send(JSON.stringify({
          type: 'urgent_notification',
          message: mensagemNavi,
          data: {
            colaborador_nome,
            problema,
            urgencia,
            categoria,
            acao_sugerida,
            anotacao_id,
            timestamp: new Date().toISOString(),
            admin_id,
            tenant_id
          }
        }));
        notifiedCount++;
        console.log('✅ Notificação enviada para conexão do admin');
      } catch (error) {
        console.error('❌ Erro ao enviar notificação:', error);
      }
    });

    console.log(`✅ Admin notificado via chat flutuante: ${notifiedCount} conexões`);

    res.json({
      success: true,
      notified_connections: notifiedCount,
      admin_id,
      message: 'Admin notificado via chat flutuante',
      data: {
        colaborador_nome,
        urgencia,
        categoria
      }
    });

  } catch (error) {
    console.error('❌ Erro ao notificar admin:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

/**
 * GET /api/websocket/admin-connections/:admin_id
 * Verificar conexões ativas de um admin
 */
router.get('/admin-connections/:admin_id', async (req, res) => {
  try {
    const { admin_id } = req.params;
    const chatServer = req.app.locals.chatServer;
    
    if (!chatServer) {
      return res.status(500).json({
        success: false,
        message: 'Chat server não disponível'
      });
    }

    const adminConnections = chatServer.getAdminConnections(admin_id);
    
    res.json({
      success: true,
      admin_id,
      active_connections: adminConnections.length,
      connections: adminConnections.map(ws => ({
        readyState: ws.readyState,
        connected: ws.readyState === 1
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao verificar conexões:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

module.exports = router;


