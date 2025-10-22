#!/usr/bin/env node

/**
 * Teste Simples do Switch N8N
 * Data: 2025-10-22
 */

const fetch = require('node-fetch');

async function testarSwitch() {
  console.log('🧪 TESTE SIMPLES DO SWITCH N8N');
  console.log('===============================');
  console.log('Data:', new Date().toISOString());
  console.log('');

  const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://hndll.app.n8n.cloud/webhook/onboarding';
  
  // Teste 1: Payload do tipo onboarding (deve funcionar)
  console.log('📊 TESTE 1: Payload Onboarding (deve funcionar)');
  console.log('===============================================');
  
  const payloadOnboarding = {
    type: 'onboarding',
    timestamp: new Date().toISOString(),
    colaborador_id: 'teste-onboarding',
    tenant_subdomain: 'demo'
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Flowly-Test-Switch/1.0'
      },
      body: JSON.stringify(payloadOnboarding)
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Resposta:', text);
    
    if (response.ok) {
      console.log('✅ Payload onboarding funcionando!');
    } else {
      console.log('❌ Payload onboarding com erro');
    }
  } catch (error) {
    console.log('❌ Erro no teste onboarding:', error.message);
  }
  
  console.log('');

  // Teste 2: Payload do tipo trilha_conteudo_processamento
  console.log('📊 TESTE 2: Payload Processamento (deve dar erro se Switch não configurado)');
  console.log('========================================================================');
  
  const payloadProcessamento = {
    type: 'trilha_conteudo_processamento',
    timestamp: new Date().toISOString(),
    trilha_conteudo_id: 'teste-switch-' + Date.now(),
    trilha_id: 'trilha-teste-switch',
    trilha_nome: 'Trilha de Teste - Switch',
    tenant_id: 'tenant-teste-switch',
    tenant_subdomain: 'demo',
    conteudo: {
      tipo: 'documento',
      titulo: 'Teste Switch',
      descricao: 'Teste para verificar Switch',
      url: 'https://example.com/teste-switch.pdf',
      ordem: 1,
      obrigatorio: true
    }
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Flowly-Test-Switch/1.0'
      },
      body: JSON.stringify(payloadProcessamento)
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Resposta:', text);
    
    if (response.ok) {
      console.log('✅ Payload processamento funcionando! Switch configurado!');
    } else if (response.status === 500) {
      console.log('⚠️  Payload processamento com erro 500 - Switch não configurado');
    } else {
      console.log('❌ Payload processamento com erro:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro no teste processamento:', error.message);
  }

  console.log('');
  console.log('📋 DIAGNÓSTICO:');
  console.log('===============');
  console.log('Se o Teste 1 funcionar e o Teste 2 der erro 500:');
  console.log('✅ Webhook funcionando');
  console.log('✅ Fluxo onboarding funcionando');
  console.log('❌ Switch não configurado para trilha_conteudo_processamento');
  console.log('');
  console.log('🔧 SOLUÇÃO:');
  console.log('1. Adicionar Switch após Webhook');
  console.log('2. Configurar regra: $json.type === "trilha_conteudo_processamento"');
  console.log('3. Conectar Rota 1 ao novo fluxo');
  console.log('4. Conectar Rota 2 ao fluxo existente');
}

// Executar teste
testarSwitch().then(() => {
  console.log('\n🎉 TESTE DO SWITCH CONCLUÍDO!');
  console.log('=============================');
  console.log('Verifique os resultados acima para diagnosticar o problema.');
});
