#!/usr/bin/env node

/**
 * Teste do Webhook de Processamento de Conteúdos
 * Data: 2025-10-22
 */

const fetch = require('node-fetch');

async function testarWebhookProcessamento() {
  console.log('🧪 TESTANDO WEBHOOK DE PROCESSAMENTO');
  console.log('====================================');
  console.log('Sistema: Processamento Automático de Conteúdos de Trilhas');
  console.log('Data:', new Date().toISOString());
  console.log('');

  // URL do webhook N8N
  const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://hndll.app.n8n.cloud/webhook/onboarding';
  
  console.log('📡 URL do Webhook:', webhookUrl);
  console.log('');

  // Payload de teste para processamento de conteúdo
  const payloadTeste = {
    type: 'trilha_conteudo_processamento',
    timestamp: new Date().toISOString(),
    trilha_conteudo_id: 'teste-uuid-' + Date.now(),
    trilha_id: 'trilha-teste-uuid',
    trilha_nome: 'Trilha de Teste - Processamento',
    tenant_id: 'tenant-teste-uuid',
    tenant_subdomain: 'demo',
    conteudo: {
      tipo: 'documento',
      titulo: 'Documento de Teste - Política de Segurança',
      descricao: 'Documento para testar o processamento automático',
      url: 'https://example.com/documento-teste.pdf',
      ordem: 1,
      obrigatorio: true
    }
  };

  console.log('📋 PAYLOAD DE TESTE:');
  console.log('===================');
  console.log(JSON.stringify(payloadTeste, null, 2));
  console.log('');

  try {
    console.log('🚀 Enviando webhook...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Flowly-Test-Webhook/1.0'
      },
      body: JSON.stringify(payloadTeste)
    });

    console.log('📊 RESPOSTA DO WEBHOOK:');
    console.log('========================');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Body:', responseText);
    console.log('');

    if (response.ok) {
      console.log('✅ WEBHOOK ENVIADO COM SUCESSO!');
      console.log('');
      console.log('📋 PRÓXIMOS PASSOS:');
      console.log('1. Verificar logs do N8N');
      console.log('2. Confirmar processamento do conteúdo');
      console.log('3. Verificar dados salvos no banco');
      console.log('4. Testar busca semântica');
      
      return true;
    } else {
      console.log('❌ ERRO NO WEBHOOK!');
      console.log('Status:', response.status);
      console.log('Erro:', responseText);
      
      return false;
    }

  } catch (error) {
    console.log('❌ ERRO AO ENVIAR WEBHOOK:');
    console.log('Erro:', error.message);
    console.log('');
    console.log('🔍 POSSÍVEIS CAUSAS:');
    console.log('- URL do webhook incorreta');
    console.log('- N8N não está rodando');
    console.log('- Problema de conectividade');
    console.log('- Payload inválido');
    
    return false;
  }
}

// Executar teste
testarWebhookProcessamento().then(sucesso => {
  if (sucesso) {
    console.log('\n🎉 TESTE DO WEBHOOK CONCLUÍDO!');
    console.log('==============================');
    console.log('✅ Webhook funcionando');
    console.log('✅ Sistema pronto para processamento');
    console.log('✅ Próximo: Configurar workflow N8N');
  } else {
    console.log('\n⚠️  TESTE DO WEBHOOK FALHOU!');
    console.log('===========================');
    console.log('❌ Verificar configuração');
    console.log('❌ Verificar conectividade');
    console.log('❌ Verificar logs do N8N');
  }
  
  process.exit(sucesso ? 0 : 1);
});
