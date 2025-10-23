#!/usr/bin/env node

/**
 * 🔄 TESTE MANUAL DE CRON JOBS
 * 
 * Este script simula as chamadas de cron jobs que serão feitas pelo Vercel
 * para testar o sistema de monitoramento proativo
 */

const axios = require('axios');

// Configurações
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'cron-secret-default';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🔄 ${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Testar monitoramento contínuo (a cada 15 minutos)
 */
async function testMonitoramentoContinuo() {
  logSection('MONITORAMENTO CONTÍNUO (15min)');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/cron/monitoramento-continuo`, {
      headers: {
        'x-cron-secret': CRON_SECRET
      }
    });

    if (response.data.success) {
      log('✅ Monitoramento contínuo executado com sucesso', 'green');
      log(`📊 Resultados:`, 'blue');
      log(`   - Tenants processados: ${response.data.results.tenants_processados}`, 'blue');
      log(`   - Colaboradores analisados: ${response.data.results.colaboradores_analisados}`, 'blue');
      log(`   - Alertas criados: ${response.data.results.alertas_criados}`, 'blue');
      log(`   - Timestamp: ${response.data.timestamp}`, 'blue');
    } else {
      log('❌ Erro no monitoramento contínuo', 'red');
      log(`   Erro: ${response.data.error}`, 'red');
    }
  } catch (error) {
    log('❌ Falha na requisição de monitoramento contínuo', 'red');
    log(`   Erro: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Resposta: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

/**
 * Testar análise horária
 */
async function testAnaliseHoraria() {
  logSection('ANÁLISE HORÁRIA');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/cron/analise-horaria`, {
      headers: {
        'x-cron-secret': CRON_SECRET
      }
    });

    if (response.data.success) {
      log('✅ Análise horária executada com sucesso', 'green');
      log(`📊 Resultados:`, 'blue');
      log(`   - Tenants processados: ${response.data.results.tenants_processados}`, 'blue');
      log(`   - Ações sugeridas: ${response.data.results.acoes_sugeridas}`, 'blue');
      log(`   - Timestamp: ${response.data.timestamp}`, 'blue');
    } else {
      log('❌ Erro na análise horária', 'red');
      log(`   Erro: ${response.data.error}`, 'red');
    }
  } catch (error) {
    log('❌ Falha na requisição de análise horária', 'red');
    log(`   Erro: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Resposta: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

/**
 * Testar relatório diário
 */
async function testRelatorioDiario() {
  logSection('RELATÓRIO DIÁRIO');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/cron/relatorio-diario`, {
      headers: {
        'x-cron-secret': CRON_SECRET
      }
    });

    if (response.data.success) {
      log('✅ Relatório diário executado com sucesso', 'green');
      log(`📊 Resultados:`, 'blue');
      log(`   - Tenants processados: ${response.data.results.tenants_processados}`, 'blue');
      log(`   - Relatórios gerados: ${response.data.results.relatorios_gerados}`, 'blue');
      log(`   - Timestamp: ${response.data.timestamp}`, 'blue');
    } else {
      log('❌ Erro no relatório diário', 'red');
      log(`   Erro: ${response.data.error}`, 'red');
    }
  } catch (error) {
    log('❌ Falha na requisição de relatório diário', 'red');
    log(`   Erro: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Resposta: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

/**
 * Simular ciclo completo de monitoramento
 */
async function simularCicloCompleto() {
  logSection('SIMULAÇÃO DE CICLO COMPLETO');
  
  log('🔄 Simulando monitoramento contínuo (15min)...', 'yellow');
  await testMonitoramentoContinuo();
  await sleep(2000);
  
  log('\n🔄 Simulando análise horária...', 'yellow');
  await testAnaliseHoraria();
  await sleep(2000);
  
  log('\n🔄 Simulando relatório diário (9h)...', 'yellow');
  await testRelatorioDiario();
}

/**
 * Testar configuração do Vercel Cron
 */
async function testarConfiguracaoVercel() {
  logSection('CONFIGURAÇÃO DO VERCEL CRON');
  
  log('📋 Cronograma configurado no vercel.json:', 'blue');
  log('   - Monitoramento contínuo: */15 * * * * (a cada 15 minutos)', 'blue');
  log('   - Análise horária: 0 * * * * (a cada hora)', 'blue');
  log('   - Relatório diário: 0 9 * * * (todo dia às 9h)', 'blue');
  
  log('\n🔐 Configurações de segurança:', 'blue');
  log(`   - CRON_SECRET: ${CRON_SECRET ? '✅ Configurado' : '❌ Não configurado'}`, 'blue');
  log(`   - BASE_URL: ${BASE_URL}`, 'blue');
  
  log('\n💡 Para configurar no Vercel:', 'yellow');
  log('   1. Adicione CRON_SECRET nas variáveis de ambiente', 'yellow');
  log('   2. Deploy do projeto com vercel.json', 'yellow');
  log('   3. Verifique logs de execução no dashboard do Vercel', 'yellow');
}

/**
 * Executar todos os testes
 */
async function executarTodosTestes() {
  log('🚀 INICIANDO TESTES MANUAIS DE CRON JOBS', 'bright');
  log('📅 Data/Hora:', new Date().toLocaleString('pt-BR'), 'blue');
  log(`🌐 URL Base: ${BASE_URL}`, 'blue');
  
  await testarConfiguracaoVercel();
  await simularCicloCompleto();
  
  logSection('RESUMO');
  log('✅ Testes de cron jobs concluídos', 'green');
  log('💡 Próximos passos:', 'cyan');
  log('  1. Configurar CRON_SECRET no Vercel', 'blue');
  log('  2. Fazer deploy do projeto', 'blue');
  log('  3. Monitorar execução dos cron jobs', 'blue');
  log('  4. Verificar alertas no dashboard', 'blue');
}

// Executar testes se chamado diretamente
if (require.main === module) {
  executarTodosTestes().catch(error => {
    log(`❌ Erro fatal nos testes: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testMonitoramentoContinuo,
  testAnaliseHoraria,
  testRelatorioDiario,
  simularCicloCompleto,
  executarTodosTestes
};









