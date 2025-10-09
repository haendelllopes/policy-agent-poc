const express = require('express');
const router = express.Router();

/**
 * Enviar webhook para n8n
 */
async function enviarWebhookN8N(tipo, dados) {
  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://hndll.app.n8n.cloud/webhook/onboarding';
  
  try {
    const webhookData = {
      timestamp: new Date().toISOString(),
      tipo: tipo,
      ...dados
    };
    
    console.log(`📤 Enviando webhook [${tipo}] para n8n:`, webhookData);
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });
    
    if (response.ok) {
      console.log(`✅ Webhook [${tipo}] enviado com sucesso!`);
      return { success: true };
    } else {
      console.error(`❌ Erro ao enviar webhook [${tipo}]:`, response.status);
      return { success: false, error: response.statusText };
    }
  } catch (error) {
    console.error(`❌ Erro ao enviar webhook [${tipo}]:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Enviar dados para análise do agente IA
 */
async function enviarParaAnaliseIA(eventType, dados) {
  const N8N_AI_WEBHOOK_URL = process.env.N8N_AI_WEBHOOK_URL || 'https://hndll.app.n8n.cloud/webhook/ai-analysis';
  
  try {
    const aiData = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      flowly_url: process.env.VERCEL_URL || 'https://flowly.vercel.app',
      ...dados
    };
    
    console.log(`🤖 Enviando dados para análise IA [${eventType}]:`, aiData);
    
    const response = await fetch(N8N_AI_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiData)
    });
    
    if (response.ok) {
      console.log(`✅ Dados enviados para análise IA [${eventType}] com sucesso!`);
      return { success: true };
    } else {
      console.error(`❌ Erro ao enviar para análise IA [${eventType}]:`, response.status);
      return { success: false, error: response.statusText };
    }
  } catch (error) {
    console.error(`❌ Erro ao enviar para análise IA [${eventType}]:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * POST /api/webhooks/trilha-iniciada
 * Notificar n8n quando colaborador inicia uma trilha
 */
router.post('/trilha-iniciada', async (req, res) => {
  try {
    const { colaborador_id, colaborador_nome, colaborador_email, colaborador_phone, trilha_id, trilha_nome, prazo_dias, data_limite } = req.body;
    
    const resultado = await enviarWebhookN8N('trilha_iniciada', {
      colaborador: {
        id: colaborador_id,
        nome: colaborador_nome,
        email: colaborador_email,
        phone: colaborador_phone
      },
      trilha: {
        id: trilha_id,
        nome: trilha_nome,
        prazo_dias: prazo_dias,
        data_limite: data_limite
      },
      mensagem_sugerida: `Olá ${colaborador_nome}! 👋\n\nVocê tem uma nova trilha de onboarding: *${trilha_nome}*\n\n⏰ Prazo: ${prazo_dias} dias (até ${new Date(data_limite).toLocaleDateString('pt-BR')})\n\nAcesse aqui: ${process.env.VERCEL_URL || 'https://navigator-gules.vercel.app'}/colaborador-trilhas?colaborador_id=${colaborador_id}`
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro no webhook trilha-iniciada:', error);
    res.status(500).json({ error: 'Erro ao enviar webhook' });
  }
});

/**
 * POST /api/webhooks/quiz-disponivel
 * Notificar n8n quando quiz está disponível
 */
router.post('/quiz-disponivel', async (req, res) => {
  try {
    const { colaborador_id, colaborador_nome, colaborador_email, colaborador_phone, trilha_id, trilha_nome } = req.body;
    
    const resultado = await enviarWebhookN8N('quiz_disponivel', {
      colaborador: {
        id: colaborador_id,
        nome: colaborador_nome,
        email: colaborador_email,
        phone: colaborador_phone
      },
      trilha: {
        id: trilha_id,
        nome: trilha_nome
      },
      mensagem_sugerida: `Parabéns ${colaborador_nome}! 🎉\n\nVocê concluiu todos os conteúdos da trilha *${trilha_nome}*!\n\nAgora é hora de validar seu aprendizado com um quiz de 5 questões.\n\n✍️ Faça o quiz aqui: ${process.env.VERCEL_URL || 'https://navigator-gules.vercel.app'}/colaborador-trilha-detalhes?trilha_id=${trilha_id}&colaborador_id=${colaborador_id}`
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro no webhook quiz-disponivel:', error);
    res.status(500).json({ error: 'Erro ao enviar webhook' });
  }
});

/**
 * POST /api/webhooks/trilha-concluida
 * Notificar n8n quando trilha é concluída (quiz aprovado)
 */
router.post('/trilha-concluida', async (req, res) => {
  try {
    const { colaborador_id, colaborador_nome, colaborador_email, colaborador_phone, trilha_id, trilha_nome, nota, pontos } = req.body;
    
    // Enviar webhook normal para notificações
    const resultado = await enviarWebhookN8N('trilha_concluida', {
      colaborador: {
        id: colaborador_id,
        nome: colaborador_nome,
        email: colaborador_email,
        phone: colaborador_phone
      },
      trilha: {
        id: trilha_id,
        nome: trilha_nome
      },
      resultado: {
        nota: nota,
        pontos: pontos
      },
      mensagem_sugerida: `🎉🎉🎉 PARABÉNS ${colaborador_nome}!\n\nVocê concluiu a trilha *${trilha_nome}* com ${nota}% de acerto!\n\n⭐ +${pontos} pontos adicionados!\n📜 Seu certificado será enviado por e-mail em breve.\n\nContinue assim! 💪`
    });

    // Enviar dados para análise do agente IA (assíncrono)
    enviarParaAnaliseIA('trilha_concluida', {
      colaborador_id,
      colaborador_nome,
      trilha_id,
      trilha_nome,
      nota_quiz: nota,
      pontos_ganhos: pontos,
      admin_phone: process.env.ADMIN_PHONE // Para notificar admin sobre melhorias
    }).catch(error => {
      console.error('Erro ao enviar para análise IA (não crítico):', error);
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro no webhook trilha-concluida:', error);
    res.status(500).json({ error: 'Erro ao enviar webhook' });
  }
});

/**
 * POST /api/webhooks/onboarding-completo
 * Notificar n8n quando colaborador conclui TODAS as trilhas
 */
router.post('/onboarding-completo', async (req, res) => {
  try {
    const { colaborador_id, colaborador_nome, colaborador_email, colaborador_phone, total_trilhas, pontuacao_total, ranking_geral } = req.body;
    
    const resultado = await enviarWebhookN8N('onboarding_completo', {
      colaborador: {
        id: colaborador_id,
        nome: colaborador_nome,
        email: colaborador_email,
        phone: colaborador_phone
      },
      resultado: {
        total_trilhas: total_trilhas,
        pontuacao_total: pontuacao_total,
        ranking_geral: ranking_geral
      },
      mensagem_sugerida: `🏆🏆🏆 INCRÍVEL ${colaborador_nome}!\n\nVocê concluiu TODAS as ${total_trilhas} trilhas do onboarding!\n\n📊 Pontuação Final: *${pontuacao_total} pontos*\n🏅 Você ficou em #${ranking_geral} no ranking geral!\n\n✅ Onboarding 100% completo!\n🎓 Todos os certificados foram enviados por e-mail.\n\nBem-vindo(a) oficialmente ao time! 💙`
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro no webhook onboarding-completo:', error);
    res.status(500).json({ error: 'Erro ao enviar webhook' });
  }
});

/**
 * POST /api/webhooks/alerta-atraso
 * Notificar RH sobre colaborador em atraso
 */
router.post('/alerta-atraso', async (req, res) => {
  try {
    const { colaborador_nome, trilha_nome, dias_atraso, rh_email, rh_phone } = req.body;
    
    const resultado = await enviarWebhookN8N('alerta_atraso', {
      tipo_alerta: 'atraso',
      colaborador_nome: colaborador_nome,
      trilha_nome: trilha_nome,
      dias_atraso: dias_atraso,
      destinatario: {
        email: rh_email,
        phone: rh_phone
      },
      mensagem_sugerida: `⚠️ ALERTA DE ATRASO\n\nColaborador: ${colaborador_nome}\nTrilha: ${trilha_nome}\nAtraso: ${dias_atraso} dias\n\nPor favor, entre em contato com o colaborador.`
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro no webhook alerta-atraso:', error);
    res.status(500).json({ error: 'Erro ao enviar webhook' });
  }
});

/**
 * POST /api/webhooks/alerta-nota-baixa
 * Notificar RH sobre nota baixa no quiz
 */
router.post('/alerta-nota-baixa', async (req, res) => {
  try {
    const { colaborador_nome, trilha_nome, nota, tentativa, rh_email, rh_phone } = req.body;
    
    const resultado = await enviarWebhookN8N('alerta_nota_baixa', {
      tipo_alerta: 'nota_baixa',
      colaborador_nome: colaborador_nome,
      trilha_nome: trilha_nome,
      nota: nota,
      tentativa: tentativa,
      destinatario: {
        email: rh_email,
        phone: rh_phone
      },
      mensagem_sugerida: `📉 ALERTA DE DESEMPENHO\n\nColaborador: ${colaborador_nome}\nTrilha: ${trilha_nome}\nNota: ${nota}%\nTentativa: #${tentativa}\n\nColaborador pode precisar de suporte adicional.`
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro no webhook alerta-nota-baixa:', error);
    res.status(500).json({ error: 'Erro ao enviar webhook' });
  }
});

module.exports = router;


