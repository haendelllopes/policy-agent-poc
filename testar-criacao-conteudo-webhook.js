#!/usr/bin/env node

/**
 * Teste de Criação de Conteúdo com Webhook
 * Data: 2025-10-22
 */

const fetch = require('node-fetch');

async function testarCriacaoConteudo() {
  console.log('🧪 TESTE DE CRIAÇÃO DE CONTEÚDO COM WEBHOOK');
  console.log('============================================');
  console.log('Data:', new Date().toISOString());
  console.log('');

  const baseUrl = 'https://navigator-gules.vercel.app';
  
  try {
    // 1. Criar trilha de teste
    console.log('📊 ETAPA 1: Criar trilha de teste');
    console.log('==================================');
    
    const trilhaResponse = await fetch(`${baseUrl}/api/trilhas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Subdomain': 'demo'
      },
      body: JSON.stringify({
        nome: 'Trilha Teste Webhook',
        descricao: 'Trilha para testar webhook de processamento',
        prazo_dias: 30,
        ordem: 999,
        ativo: true
      })
    });

    if (!trilhaResponse.ok) {
      console.log('❌ Erro ao criar trilha:', trilhaResponse.status);
      return;
    }

    const trilhaData = await trilhaResponse.json();
    console.log('✅ Trilha criada:', trilhaData.id);
    console.log('📋 Dados da trilha:', JSON.stringify(trilhaData, null, 2));
    console.log('');

    // 2. Criar conteúdo na trilha (isso deve disparar webhook)
    console.log('📊 ETAPA 2: Criar conteúdo na trilha');
    console.log('====================================');
    
    const conteudoResponse = await fetch(`${baseUrl}/api/trilhas/${trilhaData.id}/conteudos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Subdomain': 'demo'
      },
      body: JSON.stringify({
        tipo: 'documento',
        titulo: 'Teste Webhook - Documento',
        descricao: 'Documento para testar webhook de processamento',
        url: 'https://example.com/teste-webhook.pdf',
        ordem: 1,
        obrigatorio: true
      })
    });

    if (!conteudoResponse.ok) {
      console.log('❌ Erro ao criar conteúdo:', conteudoResponse.status);
      const errorText = await conteudoResponse.text();
      console.log('Erro:', errorText);
      return;
    }

    const conteudoData = await conteudoResponse.json();
    console.log('✅ Conteúdo criado:', conteudoData.id);
    console.log('📋 Dados do conteúdo:', JSON.stringify(conteudoData, null, 2));
    console.log('');

    // 3. Aguardar processamento
    console.log('📊 ETAPA 3: Aguardar processamento');
    console.log('==================================');
    console.log('⏳ Aguardando 15 segundos para processamento...');
    
    await new Promise(resolve => setTimeout(resolve, 15000));

    // 4. Verificar se foi processado
    console.log('📊 ETAPA 4: Verificar processamento');
    console.log('===================================');
    
    const processamentoResponse = await fetch(`${baseUrl}/api/trilhas/conteudos/${conteudoData.id}/processamento`, {
      headers: {
        'X-Tenant-Subdomain': 'demo'
      }
    });

    if (processamentoResponse.ok) {
      const processamentoData = await processamentoResponse.json();
      console.log('✅ Processamento encontrado!');
      console.log('📊 Dados processados:', JSON.stringify(processamentoData, null, 2));
    } else if (processamentoResponse.status === 404) {
      console.log('ℹ️  Processamento não encontrado (normal se N8N não configurado)');
    } else {
      console.log('❌ Erro ao verificar processamento:', processamentoResponse.status);
    }

    console.log('');
    console.log('📋 RESUMO:');
    console.log('==========');
    console.log('✅ Trilha criada com sucesso');
    console.log('✅ Conteúdo criado com sucesso');
    console.log('✅ Webhook deve ter sido disparado');
    console.log('ℹ️  Verificar logs do N8N para confirmar recebimento');
    console.log('');
    console.log('🔍 PRÓXIMOS PASSOS:');
    console.log('1. Verificar logs do N8N');
    console.log('2. Confirmar se webhook foi recebido');
    console.log('3. Verificar se Switch detectou o tipo correto');
    console.log('4. Verificar se processamento foi executado');

  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testarCriacaoConteudo().then(() => {
  console.log('\n🎉 TESTE DE CRIAÇÃO CONCLUÍDO!');
  console.log('==============================');
  console.log('Verifique os logs do N8N para confirmar o webhook.');
});
