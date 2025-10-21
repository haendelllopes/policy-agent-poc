const express = require('express');
const router = express.Router();
const GPTService = require('../websocket/gptService');
const PersonalizationEngine = require('../websocket/personalizationEngine');

// Instanciar serviços
const gptService = new GPTService();
const personalizationEngine = new PersonalizationEngine();

// Endpoint HTTP para chat (Produção - Vercel)
router.post('/send', async (req, res) => {
  try {
    const { userId, text, context } = req.body;
    
    if (!userId || !text) {
      return res.status(400).json({
        type: 'error',
        message: 'userId e text são obrigatórios'
      });
    }

    console.log('🌐 Chat HTTP - Usuário:', userId, 'Mensagem:', text);

    // 1. Carregar contexto do usuário
    const userContext = await personalizationEngine.loadUserContext(userId);
    
    // 2. Gerar resposta via GPT
    const response = await gptService.generateResponse(text, userContext);
    
    // 3. Retornar resposta
    res.json({
      type: 'response',
      message: response.message,
      sentiment: response.sentiment,
      toolsUsed: response.toolsUsed
    });

    // 4. Análise background (assíncrona)
    personalizationEngine.performBackgroundAnalysis(userId, text, context)
      .catch(error => console.error('❌ Erro análise background:', error));

  } catch (error) {
    console.error('❌ Erro endpoint HTTP chat:', error);
    res.status(500).json({
      type: 'error',
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
