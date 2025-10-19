#!/usr/bin/env node

/**
 * Script para testar a integração do workflow de urgência com o workflow principal
 */

const axios = require('axios');

// Configurações
const WEBHOOK_PRINCIPAL_URL = 'https://hndll.app.n8n.cloud/webhook/whatsapp'; // URL do webhook WhatsApp
const TENANT_ID = '5978f911-738b-4aae-802a-f037fdac2e64';

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

async function testarIntegracaoUrgencia() {
  log('🧪 TESTANDO INTEGRAÇÃO DE URGÊNCIA', 'blue');
  log('==================================', 'blue');
  
  // Dados de teste para urgência crítica
  const dadosTeste = {
    messageText: 'Sistema não funciona há 3 dias! Não consigo acessar nada. Isso está impedindo meu trabalho completamente.',
    from: '556291708483',
    tenant_id: TENANT_ID,
    colaborador_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  };

  try {
    log('📤 Enviando mensagem para workflow principal...', 'yellow');
    log(`🔗 URL: ${WEBHOOK_PRINCIPAL_URL}`, 'cyan');
    log(`📊 Dados: ${JSON.stringify(dadosTeste, null, 2)}`, 'cyan');
    
    const response = await axios.post(WEBHOOK_PRINCIPAL_URL, dadosTeste, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.status === 200) {
      log('✅ Workflow principal executado com sucesso!', 'green');
      log(`📊 Status: ${response.status}`, 'green');
      log(`📊 Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
      
      log('\n🎉 INTEGRAÇÃO TESTADA!', 'green');
      log('Verifique no N8N se:', 'yellow');
      log('✅ O workflow principal foi executado', 'yellow');
      log('✅ A anotação foi salva', 'yellow');
      log('✅ O workflow de urgência foi acionado', 'yellow');
      log('✅ A notificação foi enviada para administradores', 'yellow');
      log('✅ O ticket foi criado', 'yellow');
    }
  } catch (error) {
    log('❌ Erro ao executar workflow principal:', 'red');
    log(`📊 Status: ${error.response?.status || 'N/A'}`, 'red');
    log(`📊 Message: ${error.message}`, 'red');
    
    if (error.response?.data) {
      log(`📊 Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

// Executar teste
testarIntegracaoUrgencia().catch(error => {
  log(`❌ Erro geral: ${error.message}`, 'red');
  process.exit(1);
});
