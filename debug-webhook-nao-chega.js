#!/usr/bin/env node

/**
 * Debug - Verificar Por Que Webhook Não Chega no N8N
 * Data: 2025-10-22
 */

const fetch = require('node-fetch');

async function debugWebhookNaoChega() {
  console.log('🔍 DEBUG - WEBHOOK NÃO CHEGA NO N8N');
  console.log('====================================');
  console.log('Data:', new Date().toISOString());
  console.log('');

  const baseUrl = 'https://navigator-gules.vercel.app';
  
  try {
    // 1. Verificar se há trilhas existentes
    console.log('📊 ETAPA 1: Verificar trilhas existentes');
    console.log('=========================================');
    
    const listResponse = await fetch(`${baseUrl}/api/trilhas`, {
      headers: {
        'X-Tenant-Subdomain': 'demo'
      }
    });

    if (!listResponse.ok) {
      console.log('❌ Erro ao listar trilhas:', listResponse.status);
      return;
    }

    const trilhas = await listResponse.json();
    console.log('✅ Trilhas encontradas:', trilhas.length);
    
    if (trilhas.length === 0) {
      console.log('❌ Nenhuma trilha encontrada para testar');
      return;
    }

    const trilhaId = trilhas[0].id;
    console.log('📋 Usando trilha:', trilhaId);
    console.log('📋 Nome:', trilhas[0].nome);
    console.log('');

    // 2. Criar conteúdo na trilha existente
    console.log('📊 ETAPA 2: Criar conteúdo na trilha existente');
    console.log('==============================================');
    
    const conteudoResponse = await fetch(`${baseUrl}/api/trilhas/${trilhaId}/conteudos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Subdomain': 'demo'
      },
      body: JSON.stringify({
        tipo: 'documento',
        titulo: 'Debug Webhook - Documento Teste',
        descricao: 'Documento para debug do webhook',
        url: 'https://example.com/debug-webhook.pdf',
        ordem: 1,
        obrigatorio: true
      })
    });

    console.log('Status:', conteudoResponse.status);
    console.log('Headers:', Object.fromEntries(conteudoResponse.headers.entries()));
    
    const conteudoText = await conteudoResponse.text();
    console.log('Body:', conteudoText);
    
    if (!conteudoResponse.ok) {
      console.log('❌ Erro ao criar conteúdo');
      console.log('🔍 Possíveis causas:');
      console.log('- Problema no backend');
      console.log('- Erro no webhook');
      console.log('- Problema de validação');
      return;
    }

    const conteudoData = JSON.parse(conteudoText);
    console.log('✅ Conteúdo criado:', conteudoData.id);
    console.log('');

    // 3. Verificar logs do backend
    console.log('📊 ETAPA 3: Verificar se webhook foi disparado');
    console.log('===============================================');
    console.log('⏳ Aguardando 5 segundos...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔍 Verificações necessárias:');
    console.log('1. Verificar logs do Vercel/backend');
    console.log('2. Verificar se N8N_WEBHOOK_URL está configurado');
    console.log('3. Verificar se webhook está sendo chamado');
    console.log('4. Verificar logs do N8N');
    console.log('');

    // 4. Testar webhook diretamente
    console.log('📊 ETAPA 4: Testar webhook diretamente');
    console.log('======================================');
    
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://hndll.app.n8n.cloud/webhook/onboarding';
    console.log('📡 URL do webhook:', webhookUrl);
    
    const payloadTeste = {
      type: 'trilha_conteudo_processamento',
      timestamp: new Date().toISOString(),
      trilha_conteudo_id: conteudoData.id,
      trilha_id: trilhaId,
      trilha_nome: trilhas[0].nome,
      tenant_id: 'tenant-debug',
      tenant_subdomain: 'demo',
      conteudo: {
        tipo: 'documento',
        titulo: 'Debug Webhook - Documento Teste',
        descricao: 'Documento para debug do webhook',
        url: 'https://example.com/debug-webhook.pdf',
        ordem: 1,
        obrigatorio: true
      }
    };

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Flowly-Debug/1.0'
        },
        body: JSON.stringify(payloadTeste)
      });

      console.log('📡 Status do webhook:', webhookResponse.status);
      const webhookText = await webhookResponse.text();
      console.log('📡 Resposta do webhook:', webhookText);
      
      if (webhookResponse.ok) {
        console.log('✅ Webhook direto funcionando!');
      } else {
        console.log('❌ Webhook direto com erro');
      }
    } catch (error) {
      console.log('❌ Erro no webhook direto:', error.message);
    }

    console.log('');
    console.log('📋 DIAGNÓSTICO:');
    console.log('===============');
    console.log('Se conteúdo foi criado mas webhook não chegou:');
    console.log('1. Verificar se N8N_WEBHOOK_URL está configurado no backend');
    console.log('2. Verificar logs do backend para ver se webhook foi chamado');
    console.log('3. Verificar se há erro no webhook que impede o envio');
    console.log('4. Verificar se N8N está recebendo o webhook');
    console.log('');
    console.log('🔧 PRÓXIMOS PASSOS:');
    console.log('1. Verificar variável N8N_WEBHOOK_URL no backend');
    console.log('2. Verificar logs do Vercel');
    console.log('3. Verificar logs do N8N');
    console.log('4. Testar webhook manualmente');

  } catch (error) {
    console.log('❌ Erro no debug:', error.message);
  }
}

// Executar debug
debugWebhookNaoChega().then(() => {
  console.log('\n🎉 DEBUG CONCLUÍDO!');
  console.log('===================');
  console.log('Verifique os resultados acima.');
});
