#!/usr/bin/env node

/**
 * Script de teste para Evolution API
 * Executa testes básicos após deploy no Render
 */

const axios = require('axios');

// Configurações
const EVOLUTION_API_URL = 'https://navigator-evolution-api.onrender.com';
const API_KEY = 'SUA-API-KEY-DO-RENDER'; // Substituir pela API Key real
const INSTANCE_NAME = 'navigator-whatsapp';
const TEST_PHONE = '5562999404760'; // Substituir pelo seu número

// Cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthEndpoint() {
  log('\n🔍 Teste 1: Health Endpoint', 'blue');
  try {
    const response = await axios.get(`${EVOLUTION_API_URL}/manager/health`, {
      timeout: 10000
    });
    
    if (response.data.status === 'ok') {
      log('✅ Evolution API está funcionando!', 'green');
      return true;
    } else {
      log('❌ Evolution API retornou status inesperado', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao conectar com Evolution API: ${error.message}`, 'red');
    log('💡 Dica: Aguarde ~30s (Render Free Plan "hiberna" após 15min inativo)', 'yellow');
    return false;
  }
}

async function testConnectionState() {
  log('\n🔍 Teste 2: Status da Conexão WhatsApp', 'blue');
  try {
    const response = await axios.get(
      `${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`,
      {
        headers: { apikey: API_KEY },
        timeout: 10000
      }
    );
    
    const state = response.data.instance?.state;
    
    if (state === 'open') {
      log('✅ WhatsApp está conectado!', 'green');
      return true;
    } else {
      log(`⚠️ WhatsApp não está conectado. Estado: ${state}`, 'yellow');
      log('💡 Dica: Execute o comando de conexão e escaneie o QR Code', 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao verificar status: ${error.message}`, 'red');
    return false;
  }
}

async function testSendMessage() {
  log('\n🔍 Teste 3: Envio de Mensagem', 'blue');
  try {
    const response = await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
      {
        number: TEST_PHONE,
        text: '🚀 Teste Evolution API - Navigator\n\nSe você recebeu esta mensagem, o sistema está funcionando perfeitamente!'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: API_KEY
        },
        timeout: 15000
      }
    );
    
    if (response.data.success || response.data.messageId) {
      log('✅ Mensagem enviada com sucesso!', 'green');
      log('📱 Verifique se a mensagem chegou no WhatsApp', 'yellow');
      return true;
    } else {
      log('❌ Mensagem não foi enviada', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erro ao enviar mensagem: ${error.message}`, 'red');
    return false;
  }
}

async function testBackendEndpoint() {
  log('\n🔍 Teste 4: Endpoint Backend', 'blue');
  try {
    const response = await axios.post(
      'https://navigator-gules.vercel.app/api/webhooks/evolution/send-message',
      {
        phone: `+${TEST_PHONE}`,
        message: '🧪 Teste via backend Navigator\n\nEndpoint funcionando!'
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );
    
    if (response.data.success) {
      log('✅ Backend funcionando!', 'green');
      log('📱 Verifique se a mensagem chegou no WhatsApp', 'yellow');
      return true;
    } else {
      log('❌ Backend retornou erro', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erro no backend: ${error.message}`, 'red');
    log('💡 Dica: Verifique se as variáveis de ambiente estão configuradas no Vercel', 'yellow');
    return false;
  }
}

async function testBackendStatus() {
  log('\n🔍 Teste 5: Status via Backend', 'blue');
  try {
    const response = await axios.get(
      'https://navigator-gules.vercel.app/api/webhooks/evolution/status',
      { timeout: 10000 }
    );
    
    if (response.data.success) {
      log('✅ Endpoint de status funcionando!', 'green');
      log(`📊 Status: ${JSON.stringify(response.data.status, null, 2)}`, 'blue');
      return true;
    } else {
      log('❌ Endpoint de status retornou erro', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erro no endpoint de status: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('🚀 Iniciando testes da Evolution API...', 'blue');
  log('📋 Configurações:', 'blue');
  log(`   API URL: ${EVOLUTION_API_URL}`, 'blue');
  log(`   Instance: ${INSTANCE_NAME}`, 'blue');
  log(`   Test Phone: ${TEST_PHONE}`, 'blue');
  
  if (API_KEY === 'SUA-API-KEY-DO-RENDER') {
    log('\n⚠️ ATENÇÃO: Substitua a API_KEY pela chave real do Render!', 'yellow');
    log('   Edite este arquivo e substitua SUA-API-KEY-DO-RENDER', 'yellow');
    return;
  }
  
  const tests = [
    testHealthEndpoint,
    testConnectionState,
    testSendMessage,
    testBackendEndpoint,
    testBackendStatus
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
      
      // Aguardar 2s entre testes
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      log(`❌ Erro inesperado: ${error.message}`, 'red');
    }
  }
  
  // Resultado final
  log('\n📊 Resultado dos Testes:', 'blue');
  log(`✅ Passou: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 Todos os testes passaram! Evolution API está funcionando perfeitamente!', 'green');
    log('🚀 Sistema pronto para uso em produção!', 'green');
  } else {
    log('\n⚠️ Alguns testes falharam. Verifique os erros acima.', 'yellow');
    log('📖 Consulte o arquivo EVOLUTION_API_CONFIG.md para troubleshooting', 'yellow');
  }
  
  log('\n📋 Próximos passos:', 'blue');
  log('1. Configure o N8N com a credencial Evolution API', 'blue');
  log('2. Substitua os nodes WhatsApp Business por HTTP Request', 'blue');
  log('3. Crie o webhook evolution-webhook', 'blue');
  log('4. Teste o fluxo completo end-to-end', 'blue');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testHealthEndpoint,
  testConnectionState,
  testSendMessage,
  testBackendEndpoint,
  testBackendStatus
};


