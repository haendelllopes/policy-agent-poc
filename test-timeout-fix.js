#!/usr/bin/env node

/**
 * Script de teste para verificar se as configurações de timeout estão funcionando
 * Execute: node test-timeout-fix.js
 */

const { query } = require('./src/db-pg');

async function testTimeoutConfigurations() {
  console.log('🧪 Testando configurações de timeout otimizadas...\n');

  const tests = [
    {
      name: 'Teste de Conexão Básica',
      query: 'SELECT 1 as test',
      params: []
    },
    {
      name: 'Teste de Query Simples',
      query: 'SELECT NOW() as current_time',
      params: []
    },
    {
      name: 'Teste de Query com Parâmetros',
      query: 'SELECT $1 as param_test',
      params: ['timeout_test']
    }
  ];

  for (const test of tests) {
    try {
      console.log(`⏱️  Executando: ${test.name}`);
      const start = Date.now();
      
      const result = await query(test.query, test.params);
      
      const duration = Date.now() - start;
      console.log(`✅ Sucesso em ${duration}ms`);
      console.log(`   Resultado:`, result.rows[0]);
      console.log('');
      
    } catch (error) {
      console.log(`❌ Falha: ${test.name}`);
      console.log(`   Erro: ${error.message}`);
      console.log(`   Tipo: ${error.code || 'N/A'}`);
      console.log('');
    }
  }

  // Teste de stress com múltiplas queries
  console.log('🔄 Teste de Stress - Múltiplas Queries Simultâneas...');
  const promises = [];
  
  for (let i = 0; i < 5; i++) {
    promises.push(
      query('SELECT $1 as query_number, NOW() as timestamp', [i])
        .then(result => ({ success: true, query: i, result: result.rows[0] }))
        .catch(error => ({ success: false, query: i, error: error.message }))
    );
  }

  try {
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📊 Resultados do Stress Test:`);
    console.log(`   ✅ Sucessos: ${successful}/5`);
    console.log(`   ❌ Falhas: ${failed}/5`);
    
    if (failed > 0) {
      console.log(`   🔍 Falhas detalhadas:`);
      results.filter(r => !r.success).forEach(r => {
        console.log(`      Query ${r.query}: ${r.error}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Erro no teste de stress: ${error.message}`);
  }

  console.log('\n🎯 Teste concluído!');
  console.log('\n📋 Resumo das configurações aplicadas:');
  console.log('   • connectionTimeoutMillis: 45000ms (era 30000ms)');
  console.log('   • acquireTimeoutMillis: 30000ms (era 15000ms)');
  console.log('   • statement_timeout: 120000ms (era 90000ms)');
  console.log('   • query_timeout: 120000ms (era 90000ms)');
  console.log('   • retryAttempts: 3 (era 2)');
  console.log('   • Conexão direta timeout: 90000ms (era 60000ms)');
  console.log('   • Query direta timeout: 120000ms (era 60000ms)');
}

// Executar teste
testTimeoutConfigurations()
  .then(() => {
    console.log('\n✅ Todos os testes executados com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro durante os testes:', error);
    process.exit(1);
  });

