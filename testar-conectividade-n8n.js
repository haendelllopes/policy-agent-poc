#!/usr/bin/env node

/**
 * Teste de Conectividade N8N
 * Data: 2025-10-22
 */

const fetch = require('node-fetch');

async function testarConectividadeN8N() {
  console.log('🔍 TESTE DE CONECTIVIDADE N8N');
  console.log('=============================');
  console.log('Data:', new Date().toISOString());
  console.log('');

  const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://hndll.app.n8n.cloud/webhook/onboarding';
  
  console.log('📡 URL do Webhook:', webhookUrl);
  console.log('');

  // Teste com payload mínimo
  const payloadMinimo = {
    teste: true,
    timestamp: new Date().toISOString()
  };

  console.log('📋 Payload mínimo:', JSON.stringify(payloadMinimo, null, 2));
  console.log('');

  try {
    console.log('🚀 Enviando requisição...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Flowly-Test-Connectivity/1.0'
      },
      body: JSON.stringify(payloadMinimo)
    });

    console.log('📊 RESPOSTA:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Body:', responseText);
    console.log('');

    if (response.ok) {
      console.log('✅ N8N está funcionando!');
      console.log('✅ Webhook está ativo');
      console.log('✅ Workflow está processando');
    } else if (response.status === 500) {
      console.log('⚠️  N8N está funcionando mas workflow tem erro');
      console.log('🔍 Possíveis causas:');
      console.log('- Workflow não está ativo');
      console.log('- Webhook não está conectado');
      console.log('- Nó com erro de configuração');
      console.log('- Payload não é reconhecido');
    } else {
      console.log('❌ N8N com problema:', response.status);
    }

  } catch (error) {
    console.log('❌ ERRO DE CONECTIVIDADE:');
    console.log('Erro:', error.message);
    console.log('');
    console.log('🔍 Possíveis causas:');
    console.log('- N8N está offline');
    console.log('- URL do webhook incorreta');
    console.log('- Problema de rede');
    console.log('- Firewall bloqueando');
  }

  console.log('');
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('===================');
  console.log('1. Verificar se workflow está ativo no N8N');
  console.log('2. Verificar se webhook está conectado');
  console.log('3. Verificar se há erros nos nós');
  console.log('4. Testar com payload mais simples');
  console.log('5. Verificar logs do N8N');
}

// Executar teste
testarConectividadeN8N().then(() => {
  console.log('\n🎉 TESTE DE CONECTIVIDADE CONCLUÍDO!');
  console.log('====================================');
  console.log('Verifique os resultados acima.');
});
