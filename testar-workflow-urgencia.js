#!/usr/bin/env node

/**
 * Script para testar o workflow de Detecção de Urgência
 * Execute este script após configurar o workflow no N8N
 */

const axios = require('axios');

// ⚠️ IMPORTANTE: Substitua pela URL real do seu webhook
const WEBHOOK_URL = 'https://hndll.app.n8n.cloud/webhook/fase-4-5-2-urgencia';

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

async function testarWorkflowUrgencia() {
  log('🧪 TESTANDO WORKFLOW DE DETECÇÃO DE URGÊNCIA', 'blue');
  log('==============================================', 'blue');
  
  // Dados de teste para urgência crítica
  const dadosUrgenciaCritica = {
    anotacao_id: 'test-critica-' + Date.now(),
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
    log('📤 Enviando dados de urgência crítica...', 'yellow');
    log(`🔗 Webhook URL: ${WEBHOOK_URL}`, 'cyan');
    log(`📊 Dados: ${JSON.stringify(dadosUrgenciaCritica, null, 2)}`, 'cyan');
    
    const response = await axios.post(WEBHOOK_URL, dadosUrgenciaCritica, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.status === 200) {
      log('✅ Workflow executado com sucesso!', 'green');
      log(`📊 Status: ${response.status}`, 'green');
      log(`📊 Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
      
      log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!', 'green');
      log('Verifique no N8N se:', 'yellow');
      log('✅ O workflow foi executado', 'yellow');
      log('✅ A notificação foi enviada para administradores', 'yellow');
      log('✅ O ticket foi criado', 'yellow');
    }
  } catch (error) {
    log('❌ Erro ao executar workflow:', 'red');
    log(`📊 Status: ${error.response?.status || 'N/A'}`, 'red');
    log(`📊 Message: ${error.message}`, 'red');
    
    if (error.response?.data) {
      log(`📊 Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    
    log('\n🔍 POSSÍVEIS CAUSAS:', 'yellow');
    log('1. Webhook URL incorreta', 'yellow');
    log('2. Workflow não está ativo', 'yellow');
    log('3. Credenciais OpenAI não configuradas', 'yellow');
    log('4. Backend não está respondendo', 'yellow');
  }
}

// Função para testar urgência alta (não crítica)
async function testarUrgenciaAlta() {
  log('\n🧪 TESTANDO URGÊNCIA ALTA (não crítica)', 'blue');
  
  const dadosUrgenciaAlta = {
    anotacao_id: 'test-alta-' + Date.now(),
    colaborador_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    urgencia: 'alta',
    categoria: 'conteudo',
    subcategoria: 'dificuldade_compreensao',
    titulo: 'Trilha de Compliance muito longa',
    anotacao: 'A trilha de Compliance está muito longa e confusa. Preciso de ajuda para entender melhor.',
    acao_sugerida: 'Revisar conteúdo da trilha',
    impacto_estimado: 'medio',
    from: '556291708483',
    timestamp: new Date().toISOString()
  };

  try {
    log('📤 Enviando dados de urgência alta...', 'yellow');
    
    const response = await axios.post(WEBHOOK_URL, dadosUrgenciaAlta, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.status === 200) {
      log('✅ Workflow executado para urgência alta!', 'green');
      log('✅ Deve ter criado apenas anotação (sem notificação crítica)', 'green');
    }
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
  }
}

// Função principal
async function executarTestes() {
  log('🚀 INICIANDO TESTES DO WORKFLOW DE URGÊNCIA', 'blue');
  log('============================================', 'blue');
  
  // Teste 1: Urgência crítica
  await testarWorkflowUrgencia();
  
  // Aguardar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste 2: Urgência alta
  await testarUrgenciaAlta();
  
  log('\n📋 PRÓXIMOS PASSOS:', 'cyan');
  log('1. Verificar no N8N se os workflows foram executados', 'cyan');
  log('2. Verificar se as notificações foram enviadas', 'cyan');
  log('3. Verificar se os tickets foram criados', 'cyan');
  log('4. Se tudo funcionou, podemos implementar os outros workflows', 'cyan');
}

// Executar se chamado diretamente
if (require.main === module) {
  executarTestes().catch(error => {
    log(`❌ Erro geral: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testarWorkflowUrgencia, testarUrgenciaAlta };



