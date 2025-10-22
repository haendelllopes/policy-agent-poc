#!/usr/bin/env node

/**
 * Teste com Tipos Corretos do N8N
 * Data: 2025-10-22
 */

const fetch = require('node-fetch');

async function testarTiposCorretos() {
  console.log('🧪 TESTE COM TIPOS CORRETOS DO N8N');
  console.log('==================================');
  console.log('Data:', new Date().toISOString());
  console.log('');

  const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://hndll.app.n8n.cloud/webhook/onboarding';
  
  // Teste 1: Payload document_categorization (tipo existente)
  console.log('📊 TESTE 1: Payload document_categorization (tipo existente)');
  console.log('==========================================================');
  
  const payloadDocumento = {
    type: 'document_categorization',
    timestamp: new Date().toISOString(),
    document_id: 'teste-documento-' + Date.now(),
    tenant_subdomain: 'demo',
    document: {
      titulo: 'Documento de Teste',
      url: 'https://example.com/documento-teste.pdf',
      tipo: 'pdf'
    }
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Flowly-Test-Types/1.0'
      },
      body: JSON.stringify(payloadDocumento)
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Resposta:', text);
    
    if (response.ok) {
      console.log('✅ Payload document_categorization funcionando!');
    } else {
      console.log('❌ Payload document_categorization com erro:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro no teste document_categorization:', error.message);
  }
  
  console.log('');

  // Teste 2: Payload trilha_conteudo_processamento (novo tipo)
  console.log('📊 TESTE 2: Payload trilha_conteudo_processamento (novo tipo)');
  console.log('============================================================');
  
  const payloadTrilha = {
    type: 'trilha_conteudo_processamento',
    timestamp: new Date().toISOString(),
    trilha_conteudo_id: 'teste-trilha-' + Date.now(),
    trilha_id: 'trilha-teste-tipo',
    trilha_nome: 'Trilha de Teste - Tipo',
    tenant_id: 'tenant-teste-tipo',
    tenant_subdomain: 'demo',
    conteudo: {
      tipo: 'documento',
      titulo: 'Teste Tipo Correto',
      descricao: 'Teste para verificar tipo correto',
      url: 'https://example.com/teste-tipo.pdf',
      ordem: 1,
      obrigatorio: true
    }
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Flowly-Test-Types/1.0'
      },
      body: JSON.stringify(payloadTrilha)
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Resposta:', text);
    
    if (response.ok) {
      console.log('✅ Payload trilha_conteudo_processamento funcionando!');
    } else if (response.status === 500) {
      console.log('⚠️  Payload trilha_conteudo_processamento com erro 500 - Switch não configurado');
    } else {
      console.log('❌ Payload trilha_conteudo_processamento com erro:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro no teste trilha_conteudo_processamento:', error.message);
  }

  console.log('');
  console.log('📋 DIAGNÓSTICO:');
  console.log('===============');
  console.log('Se o Teste 1 funcionar e o Teste 2 der erro 500:');
  console.log('✅ Webhook funcionando');
  console.log('✅ Fluxo document_categorization funcionando');
  console.log('❌ Switch não configurado para trilha_conteudo_processamento');
  console.log('');
  console.log('🔧 SOLUÇÃO:');
  console.log('1. Adicionar Switch após Webhook');
  console.log('2. Configurar regra: $json.type === "trilha_conteudo_processamento"');
  console.log('3. Conectar Rota 1 ao novo fluxo de processamento');
  console.log('4. Conectar Rota 2 ao fluxo document_categorization existente');
  console.log('');
  console.log('📝 TIPOS CONHECIDOS:');
  console.log('- document_categorization (existente)');
  console.log('- trilha_conteudo_processamento (novo)');
}

// Executar teste
testarTiposCorretos().then(() => {
  console.log('\n🎉 TESTE COM TIPOS CORRETOS CONCLUÍDO!');
  console.log('=====================================');
  console.log('Agora usando os tipos corretos do sistema.');
});
