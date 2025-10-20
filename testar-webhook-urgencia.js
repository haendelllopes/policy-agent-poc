#!/usr/bin/env node

/**
 * Script para testar webhook de urgência crítica
 * Use este script após configurar o workflow no N8N
 */

const axios = require('axios');

// Configurações
const WEBHOOK_URL = 'https://hndll.app.n8n.cloud/webhook/fase-4-5-2-urgencia';
const TENANT_ID = '5978f911-738b-4aae-802a-f037fdac2e64';

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

async function testarWebhookUrgencia() {
  log('🧪 TESTANDO WEBHOOK DE URGÊNCIA CRÍTICA', 'blue');
  log('========================================', 'blue');
  
  const dadosTeste = {
    anotacao_id: 'test-' + Date.now(),
    colaborador_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    urgencia: 'critica',
    categoria: 'tecnico',
    subcategoria: 'acesso_sistema',
    titulo: 'Sistema não funciona há 3 dias!',
    anotacao: 'Não consigo acessar o sistema há 3 dias. Isso está impedindo meu trabalho completamente.',
    acao_sugerida: 'Escalar para TI imediatamente',
    impacto_estimado: 'muito_alto',
    from: '556291708483',
    timestamp: new Date().toISOString(),
    metadata: {
      sentimento: 'muito_negativo',
      intensidade: 0.9,
      tags: ['sistema-indisponivel', 'acesso-bloqueado', 'urgente', 'bloqueante', 'ti']
    }
  };

  try {
    log('📤 Enviando dados para webhook...', 'yellow');
    log(`🔗 URL: ${WEBHOOK_URL}`, 'yellow');
    
    const response = await axios.post(WEBHOOK_URL, dadosTeste, {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': TENANT_ID
      },
      timeout: 30000
    });

    if (response.status === 200) {
      log('✅ Webhook executado com sucesso!', 'green');
      log(`📊 Status: ${response.status}`, 'green');
      log(`📊 Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
    }
  } catch (error) {
    log('❌ Erro ao executar webhook:', 'red');
    log(`📊 Status: ${error.response?.status || 'N/A'}`, 'red');
    log(`📊 Message: ${error.message}`, 'red');
    
    if (error.response?.data) {
      log(`📊 Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
}

// Executar teste
testarWebhookUrgencia().catch(error => {
  log(`❌ Erro geral: ${error.message}`, 'red');
  process.exit(1);
});



