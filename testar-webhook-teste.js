#!/usr/bin/env node

/**
 * Script para testar webhook de teste (não precisa estar ativo)
 */

const axios = require('axios');

// URL de teste (não precisa de workflow ativo)
const WEBHOOK_TEST_URL = 'https://hndll.app.n8n.cloud/webhook-test/fase-4-5-2-urgencia';

// Cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testarWebhookTeste() {
  log('🧪 TESTANDO WEBHOOK DE TESTE', 'blue');
  log('============================', 'blue');
  
  const dadosTeste = {
    anotacao_id: 'test-' + Date.now(),
    colaborador_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    urgencia: 'critica',
    categoria: 'tecnico',
    titulo: 'Teste de urgência crítica',
    anotacao: 'Este é um teste do workflow de detecção de urgência.',
    from: '556291708483',
    timestamp: new Date().toISOString()
  };

  try {
    log('📤 Enviando dados para webhook de teste...', 'yellow');
    log(`🔗 URL: ${WEBHOOK_TEST_URL}`, 'cyan');
    
    const response = await axios.post(WEBHOOK_TEST_URL, dadosTeste, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.status === 200) {
      log('✅ Webhook de teste funcionou!', 'green');
      log(`📊 Status: ${response.status}`, 'green');
      log(`📊 Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
      
      log('\n🎉 WEBHOOK CONFIGURADO CORRETAMENTE!', 'green');
      log('Agora você pode:', 'yellow');
      log('1. Ativar o workflow (toggle verde)', 'yellow');
      log('2. Testar com a URL de produção', 'yellow');
      log('3. Verificar se os nós estão conectados', 'yellow');
    }
  } catch (error) {
    log('❌ Erro ao testar webhook:', 'red');
    log(`📊 Status: ${error.response?.status || 'N/A'}`, 'red');
    log(`📊 Message: ${error.message}`, 'red');
    
    if (error.response?.data) {
      log(`📊 Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

// Executar teste
testarWebhookTeste().catch(error => {
  log(`❌ Erro geral: ${error.message}`, 'red');
  process.exit(1);
});




