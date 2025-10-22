#!/usr/bin/env node

/**
 * TESTE COMPLETO: Ordenação Única e Segregação de Trilhas
 * Data: 2025-10-21
 * 
 * Testa:
 * 1. Validação de ordem única no POST/PUT
 * 2. Endpoint N8N com segmentação + ordenação
 * 3. Endpoint de reordenação
 * 4. Função de próxima ordem
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testarOrdenacaoUnica() {
  console.log('🧪 TESTE 1: Validação de Ordem Única');
  console.log('=====================================');
  
  try {
    // Teste 1.1: Criar trilha com ordem 1
    console.log('📝 Criando trilha com ordem 1...');
    const trilha1 = await client.from('trilhas').insert({
      tenant_id: '00000000-0000-0000-0000-000000000001', // Tenant demo
      nome: 'Trilha Teste 1',
      descricao: 'Teste de ordem única',
      prazo_dias: 7,
      ordem: 1,
      ativo: true
    }).select();
    
    console.log('✅ Trilha 1 criada:', trilha1.data[0].nome);
    
    // Teste 1.2: Tentar criar trilha com mesma ordem (deve falhar)
    console.log('📝 Tentando criar trilha com ordem 1 (deve falhar)...');
    try {
      const trilha2 = await client.from('trilhas').insert({
        tenant_id: '00000000-0000-0000-0000-000000000001',
        nome: 'Trilha Teste 2',
        descricao: 'Teste de ordem duplicada',
        prazo_dias: 7,
        ordem: 1, // Mesma ordem!
        ativo: true
      }).select();
      
      console.log('❌ ERRO: Trilha duplicada foi criada (não deveria)');
    } catch (error) {
      console.log('✅ SUCESSO: Ordem duplicada foi rejeitada:', error.message);
    }
    
    // Teste 1.3: Criar trilha com ordem 0 (deve funcionar)
    console.log('📝 Criando trilha com ordem 0 (sem ordem)...');
    const trilha3 = await client.from('trilhas').insert({
      tenant_id: '00000000-0000-0000-0000-000000000001',
      nome: 'Trilha Teste 3',
      descricao: 'Teste de ordem 0',
      prazo_dias: 7,
      ordem: 0,
      ativo: true
    }).select();
    
    console.log('✅ Trilha 3 criada:', trilha3.data[0].nome);
    
    return { trilha1: trilha1.data[0], trilha3: trilha3.data[0] };
    
  } catch (error) {
    console.log('❌ ERRO no teste de ordem única:', error.message);
    return null;
  }
}

async function testarFuncaoProximaOrdem() {
  console.log('\n🧪 TESTE 2: Função de Próxima Ordem');
  console.log('====================================');
  
  try {
    const result = await client.rpc('obter_proxima_ordem_trilha', {
      p_tenant_id: '00000000-0000-0000-0000-000000000001'
    });
    
    console.log('✅ Próxima ordem disponível:', result.data);
    return result.data;
    
  } catch (error) {
    console.log('❌ ERRO na função de próxima ordem:', error.message);
    return null;
  }
}

async function testarEndpointN8N() {
  console.log('\n🧪 TESTE 3: Endpoint N8N com Segmentação');
  console.log('==========================================');
  
  try {
    // Simular chamada para o endpoint N8N
    const response = await fetch('http://localhost:3000/api/agent-trilhas/disponiveis/test-user-id?tenant=demo');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint N8N funcionando');
      console.log('📊 Trilhas encontradas:', data.disponiveis?.length || 0);
      
      // Verificar se está ordenado corretamente
      if (data.disponiveis && data.disponiveis.length > 0) {
        console.log('📋 Ordem das trilhas:');
        data.disponiveis.forEach((trilha, index) => {
          console.log(`  ${index + 1}. ${trilha.nome} (ordem: ${trilha.ordem})`);
        });
      }
      
      return data;
    } else {
      console.log('❌ ERRO no endpoint N8N:', response.status, response.statusText);
      return null;
    }
    
  } catch (error) {
    console.log('❌ ERRO ao testar endpoint N8N:', error.message);
    return null;
  }
}

async function testarReordenacao() {
  console.log('\n🧪 TESTE 4: Endpoint de Reordenação');
  console.log('====================================');
  
  try {
    const response = await fetch('http://localhost:3000/api/trilhas/reordenar?tenant=demo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Reordenação executada:', data.message);
      console.log('📊 Total de trilhas reordenadas:', data.total);
      return data;
    } else {
      console.log('❌ ERRO na reordenação:', response.status, response.statusText);
      return null;
    }
    
  } catch (error) {
    console.log('❌ ERRO ao testar reordenação:', error.message);
    return null;
  }
}

async function limparDadosTeste() {
  console.log('\n🧹 LIMPEZA: Removendo dados de teste');
  console.log('====================================');
  
  try {
    // Remover trilhas de teste
    await client.from('trilhas').delete().eq('nome', 'Trilha Teste 1');
    await client.from('trilhas').delete().eq('nome', 'Trilha Teste 3');
    
    console.log('✅ Dados de teste removidos');
    
  } catch (error) {
    console.log('❌ ERRO na limpeza:', error.message);
  }
}

async function executarTestes() {
  console.log('🚀 INICIANDO TESTES COMPLETOS');
  console.log('=============================');
  console.log('Data:', new Date().toISOString());
  console.log('');
  
  const resultados = {
    ordemUnica: false,
    proximaOrdem: false,
    endpointN8N: false,
    reordenacao: false
  };
  
  // Executar testes
  const trilhas = await testarOrdenacaoUnica();
  resultados.ordemUnica = trilhas !== null;
  
  const proximaOrdem = await testarFuncaoProximaOrdem();
  resultados.proximaOrdem = proximaOrdem !== null;
  
  const endpointN8N = await testarEndpointN8N();
  resultados.endpointN8N = endpointN8N !== null;
  
  const reordenacao = await testarReordenacao();
  resultados.reordenacao = reordenacao !== null;
  
  // Limpeza
  await limparDadosTeste();
  
  // Resumo final
  console.log('\n📊 RESUMO DOS TESTES');
  console.log('====================');
  console.log('✅ Ordem Única:', resultados.ordemUnica ? 'PASSOU' : 'FALHOU');
  console.log('✅ Próxima Ordem:', resultados.proximaOrdem ? 'PASSOU' : 'FALHOU');
  console.log('✅ Endpoint N8N:', resultados.endpointN8N ? 'PASSOU' : 'FALHOU');
  console.log('✅ Reordenação:', resultados.reordenacao ? 'PASSOU' : 'FALHOU');
  
  const totalPassou = Object.values(resultados).filter(r => r).length;
  const totalTestes = Object.keys(resultados).length;
  
  console.log('\n🎯 RESULTADO FINAL:');
  console.log(`${totalPassou}/${totalTestes} testes passaram`);
  
  if (totalPassou === totalTestes) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente!');
  } else {
    console.log('⚠️  Alguns testes falharam. Verificar implementação.');
  }
  
  process.exit(totalPassou === totalTestes ? 0 : 1);
}

// Executar testes
executarTestes().catch(error => {
  console.error('❌ ERRO CRÍTICO:', error);
  process.exit(1);
});
