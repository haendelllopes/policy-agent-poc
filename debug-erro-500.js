#!/usr/bin/env node

/**
 * Teste de Debug - Verificar Erro 500
 * Data: 2025-10-22
 */

const fetch = require('node-fetch');

async function debugErro500() {
  console.log('🔍 DEBUG - VERIFICAR ERRO 500');
  console.log('=============================');
  console.log('Data:', new Date().toISOString());
  console.log('');

  const baseUrl = 'https://navigator-gules.vercel.app';
  
  try {
    // Teste 1: Listar trilhas existentes
    console.log('📊 TESTE 1: Listar trilhas existentes');
    console.log('======================================');
    
    const listResponse = await fetch(`${baseUrl}/api/trilhas`, {
      headers: {
        'X-Tenant-Subdomain': 'demo'
      }
    });

    console.log('Status:', listResponse.status);
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ Lista de trilhas funcionando');
      console.log('📋 Total de trilhas:', listData.length);
      if (listData.length > 0) {
        console.log('📋 Primeira trilha:', JSON.stringify(listData[0], null, 2));
      }
    } else {
      const errorText = await listResponse.text();
      console.log('❌ Erro ao listar trilhas:', errorText);
    }
    
    console.log('');

    // Teste 2: Tentar criar trilha com dados mínimos
    console.log('📊 TESTE 2: Criar trilha com dados mínimos');
    console.log('==========================================');
    
    const trilhaResponse = await fetch(`${baseUrl}/api/trilhas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Subdomain': 'demo'
      },
      body: JSON.stringify({
        nome: 'Teste Debug',
        descricao: 'Teste para debug',
        prazo_dias: 30,
        ordem: 1,
        ativo: true
      })
    });

    console.log('Status:', trilhaResponse.status);
    console.log('Headers:', Object.fromEntries(trilhaResponse.headers.entries()));
    
    const responseText = await trilhaResponse.text();
    console.log('Body:', responseText);
    
    if (trilhaResponse.ok) {
      console.log('✅ Trilha criada com sucesso!');
      const trilhaData = JSON.parse(responseText);
      console.log('📋 Dados:', JSON.stringify(trilhaData, null, 2));
    } else {
      console.log('❌ Erro ao criar trilha');
      console.log('🔍 Possíveis causas:');
      console.log('- Problema de validação');
      console.log('- Erro no banco de dados');
      console.log('- Problema de autenticação');
      console.log('- Erro no webhook');
    }

  } catch (error) {
    console.log('❌ Erro no debug:', error.message);
  }

  console.log('');
  console.log('📋 DIAGNÓSTICO:');
  console.log('===============');
  console.log('Se listar trilhas funciona mas criar falha:');
  console.log('- Problema específico na criação');
  console.log('- Possível erro no webhook');
  console.log('- Possível erro de validação');
}

// Executar debug
debugErro500().then(() => {
  console.log('\n🎉 DEBUG CONCLUÍDO!');
  console.log('===================');
  console.log('Verifique os resultados acima.');
});
