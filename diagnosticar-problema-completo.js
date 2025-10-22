const axios = require('axios');

async function diagnosticarProblemaCompleto() {
  try {
    console.log('🔍 DIAGNÓSTICO COMPLETO DO PROBLEMA');
    console.log('=====================================');
    
    const userId = '4ab6c765-bcfc-4280-84cd-3190fcf881c2'; // Haendell Lopes
    const message = 'qual meu nome completo?';
    
    console.log('\n📋 DADOS DE ENTRADA:');
    console.log(`   • User ID: ${userId}`);
    console.log(`   • Mensagem: ${message}`);
    console.log(`   • Usuário esperado: Haendell Lopes (Coordenador)`);
    
    // 1. TESTAR ENDPOINT DIRETO
    console.log('\n🔍 TESTE 1: Endpoint direto');
    const endpointUrl = `https://navigator-gules.vercel.app/api/agent/trilhas/colaborador/${userId}`;
    console.log(`   • URL: ${endpointUrl}`);
    
    const endpointResponse = await axios.get(endpointUrl);
    console.log('   ✅ Resposta do endpoint:');
    console.log(`      - Nome: ${endpointResponse.data.nome}`);
    console.log(`      - Cargo: ${endpointResponse.data.cargo}`);
    console.log(`      - Departamento: ${endpointResponse.data.departamento}`);
    
    // 2. TESTAR CHAT HTTP COMPLETO
    console.log('\n🔍 TESTE 2: Chat HTTP completo');
    const chatUrl = 'https://navigator-gules.vercel.app/api/chat';
    console.log(`   • URL: ${chatUrl}`);
    
    const chatResponse = await axios.post(chatUrl, {
      message: message,
      userId: userId,
      context: {
        url: 'https://navigator-gules.vercel.app/dashboard.html',
        title: 'Insights - Navigator',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('   ✅ Resposta do chat:');
    console.log(`      - Mensagem: ${chatResponse.data.message}`);
    
    // 3. ANALISAR DIFERENÇAS
    console.log('\n🔍 ANÁLISE:');
    console.log('   📊 Endpoint direto retorna:');
    console.log(`      - Nome: ${endpointResponse.data.nome}`);
    console.log(`      - Cargo: ${endpointResponse.data.cargo}`);
    
    console.log('   📊 Chat HTTP retorna:');
    const chatMessage = chatResponse.data.message;
    if (chatMessage.includes('Usuário teste')) {
      console.log('      - ❌ PROBLEMA: Contém "Usuário teste"');
    } else if (chatMessage.includes('Haendell Lopes')) {
      console.log('      - ✅ CORRETO: Contém "Haendell Lopes"');
    } else {
      console.log('      - ⚠️ Genérico ou diferente');
    }
    
    // 4. VERIFICAR SE HÁ DADOS MOCKADOS
    console.log('\n🔍 TESTE 3: Verificar dados mockados');
    
    // Testar com ID do usuário teste
    const usuarioTesteId = 'a4cd1933-f066-4595-a0b6-614a603f4bd3';
    const usuarioTesteResponse = await axios.get(`https://navigator-gules.vercel.app/api/agent/trilhas/colaborador/${usuarioTesteId}`);
    
    console.log('   📊 Usuário teste retorna:');
    console.log(`      - Nome: ${usuarioTesteResponse.data.nome}`);
    console.log(`      - Cargo: ${usuarioTesteResponse.data.cargo}`);
    
    // 5. CONCLUSÃO
    console.log('\n🎯 CONCLUSÃO:');
    if (endpointResponse.data.nome === 'Haendell Lopes' && chatMessage.includes('Usuário teste')) {
      console.log('   ❌ PROBLEMA IDENTIFICADO:');
      console.log('      - O endpoint funciona corretamente');
      console.log('      - Mas o chat HTTP retorna dados incorretos');
      console.log('      - O problema está no processamento interno do chat');
      console.log('      - Possível causa: cache, dados mockados ou bug no personalizationEngine');
    } else if (endpointResponse.data.nome === 'Haendell Lopes' && chatMessage.includes('Haendell Lopes')) {
      console.log('   ✅ TUDO FUNCIONANDO:');
      console.log('      - Endpoint e chat retornam dados corretos');
      console.log('      - O problema pode ter sido resolvido');
    } else {
      console.log('   ⚠️ SITUAÇÃO INESPERADA:');
      console.log('      - Investigação adicional necessária');
    }
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Dados:', error.response.data);
    }
  }
}

diagnosticarProblemaCompleto();

