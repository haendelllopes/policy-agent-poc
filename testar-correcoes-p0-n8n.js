const axios = require('axios');

const BASE_URL = 'https://navigator-gules.vercel.app';
const TENANT_ID = '5978f911-738b-4aae-802a-f037fdac2e64'; // Demo
const COLABORADOR_ID = '556291708483'; // Telefone do WhatsApp (do erro N8N)

async function testeContextoColaborador() {
  console.log('\n🧪 TESTE 1: Contexto do Colaborador');
  
  try {
    console.log(`📞 Testando endpoint: ${BASE_URL}/api/agent/trilhas/colaborador/${COLABORADOR_ID}`);
    
    const response = await axios.get(
      `${BASE_URL}/api/agent/trilhas/colaborador/${COLABORADOR_ID}`
    );
    
    console.log('✅ Dados retornados:', {
      nome: response.data.nome,
      cargo: response.data.cargo,
      gestor: response.data.gestor_nome,
      buddy: response.data.buddy_nome,
      departamento: response.data.departamento,
      data_admissao: response.data.data_admissao
    });
    
    if (!response.data.nome) {
      console.error('❌ FALHA: Nome não retornado');
      return false;
    }
    
    console.log('✅ Endpoint funcionando corretamente');
    return true;
  } catch (error) {
    console.error('❌ ERRO:', error.response?.data || error.message);
    console.error('📊 Status:', error.response?.status);
    console.error('📊 Headers:', error.response?.headers);
    return false;
  }
}

async function testeIsolamentoTenant() {
  console.log('\n🧪 TESTE 2: Isolamento por Tenant');
  
  try {
    // Buscar trilhas com tenant correto
    const response1 = await axios.get(
      `${BASE_URL}/api/agent/trilhas/disponiveis/${COLABORADOR_ID}?tenant_id=${TENANT_ID}`
    );
    
    console.log(`✅ Trilhas encontradas (tenant correto): ${response1.data.disponiveis?.length || 0}`);
    
    // Tentar buscar com tenant errado (deve retornar vazio ou erro)
    const TENANT_ERRADO = '00000000-0000-0000-0000-000000000000';
    const response2 = await axios.get(
      `${BASE_URL}/api/agent/trilhas/disponiveis/${COLABORADOR_ID}?tenant_id=${TENANT_ERRADO}`
    );
    
    if (response2.data.disponiveis?.length > 0) {
      console.error('❌ FALHA: Retornou trilhas de tenant errado');
      return false;
    }
    
    console.log('✅ Isolamento funcionando corretamente');
    return true;
  } catch (error) {
    console.error('❌ ERRO:', error.response?.data || error.message);
    return false;
  }
}

async function testeFinalizarTrilha() {
  console.log('\n🧪 TESTE 3: Finalizar Trilha');
  
  try {
    // Primeiro, buscar uma trilha em andamento
    const trilhasResponse = await axios.get(
      `${BASE_URL}/api/agent/trilhas/disponiveis/${COLABORADOR_ID}?tenant_id=${TENANT_ID}`
    );
    
    const trilhaEmAndamento = trilhasResponse.data.em_andamento?.[0];
    
    if (!trilhaEmAndamento) {
      console.log('⚠️  Nenhuma trilha em andamento para testar');
      return true;
    }
    
    console.log(`📋 Testando finalizar trilha: ${trilhaEmAndamento.nome}`);
    
    // Finalizar trilha
    const response = await axios.post(
      `${BASE_URL}/api/agent/trilhas/finalizar`,
      {
        colaborador_id: COLABORADOR_ID,
        trilha_id: trilhaEmAndamento.id,
        tenant_id: TENANT_ID
      }
    );
    
    console.log('✅ Trilha finalizada:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ ERRO:', error.response?.data || error.message);
    return false;
  }
}

async function testeReativarTrilha() {
  console.log('\n🧪 TESTE 4: Reativar Trilha');
  
  try {
    // Buscar uma trilha concluída
    const trilhasResponse = await axios.get(
      `${BASE_URL}/api/agent/trilhas/disponiveis/${COLABORADOR_ID}?tenant_id=${TENANT_ID}`
    );
    
    const trilhaConcluida = trilhasResponse.data.concluidas?.[0];
    
    if (!trilhaConcluida) {
      console.log('⚠️  Nenhuma trilha concluída para testar');
      return true;
    }
    
    console.log(`📋 Testando reativar trilha: ${trilhaConcluida.nome}`);
    
    // Reativar trilha
    const response = await axios.post(
      `${BASE_URL}/api/agent/trilhas/reativar`,
      {
        colaborador_id: COLABORADOR_ID,
        trilha_id: trilhaConcluida.id,
        tenant_id: TENANT_ID
      }
    );
    
    console.log('✅ Trilha reativada:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ ERRO:', error.response?.data || error.message);
    return false;
  }
}

async function executarTodos() {
  console.log('🚀 INICIANDO TESTES - CORREÇÕES P0 N8N\n');
  console.log(`📞 Colaborador: ${COLABORADOR_ID}`);
  console.log(`🏢 Tenant: ${TENANT_ID}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  const resultados = {
    contexto: await testeContextoColaborador(),
    isolamento: await testeIsolamentoTenant(),
    finalizar: await testeFinalizarTrilha(),
    reativar: await testeReativarTrilha()
  };
  
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('━'.repeat(50));
  console.log(`Contexto Colaborador: ${resultados.contexto ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Isolamento Tenant:    ${resultados.isolamento ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Finalizar Trilha:     ${resultados.finalizar ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Reativar Trilha:      ${resultados.reativar ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log('━'.repeat(50));
  
  const totalPassed = Object.values(resultados).filter(r => r).length;
  console.log(`\n${totalPassed}/4 testes passaram\n`);
  
  if (totalPassed === 4) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Correções P0 N8N funcionando!');
  } else {
    console.log('⚠️  Alguns testes falharam. Verificar logs acima.');
  }
  
  process.exit(totalPassed === 4 ? 0 : 1);
}

executarTodos();
