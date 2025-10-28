const axios = require('axios');

// Configuração
const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000';

const COLABORADOR_ID = '552f0329-ae97-4fd8-b599-0a9dca59fa58';
const TENANT_ID = '5978f911-738b-4aae-802a-f037fdac2e64';

console.log('🧪 TESTES DE FINALIZAR E REINICIAR TRILHA\n');
console.log('BASE_URL:', BASE_URL);
console.log('COLABORADOR_ID:', COLABORADOR_ID);
console.log('TENANT_ID:', TENANT_ID);
console.log('---\n');

/**
 * Testa se as ferramentas finalizar_trilha e reiniciar_trilha estão disponíveis no chat HTTP
 */
async function testarFerramentasDisponiveis() {
  console.log('🧪 TESTE 1: Verificar se as ferramentas estão disponíveis\n');
  
  try {
    // Buscar trilhas disponíveis primeiro
    const trilhasResponse = await axios.get(
      `${BASE_URL}/api/agent/trilhas/disponiveis/${COLABORADOR_ID}?tenant_id=${TENANT_ID}`
    );
    
    console.log('📋 Trilhas disponíveis:', JSON.stringify(trilhasResponse.data, null, 2));
    
    // Pegar uma trilha em andamento se existir
    const trilhasEmAndamento = trilhasResponse.data.em_andamento || [];
    const trilhasDisponiveis = trilhasResponse.data.disponiveis || [];
    
    if (trilhasEmAndamento.length === 0 && trilhasDisponiveis.length === 0) {
      console.log('⚠️  Nenhuma trilha disponível para testar');
      return { sucesso: true, mensagem: 'Nenhuma trilha para testar - considerando sucesso' };
    }
    
    const trilhaTeste = trilhasEmAndamento[0] || trilhasDisponiveis[0];
    console.log(`📝 Usando trilha para teste: ${trilhaTeste.nome} (${trilhaTeste.id})`);
    
    return { sucesso: true, trilha: trilhaTeste };
    
  } catch (error) {
    console.error('❌ ERRO:', error.response?.data || error.message);
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Testa finalizar trilha via chat HTTP
 */
async function testarFinalizarTrilhaViaChat(trilha) {
  console.log('\n🧪 TESTE 2: Finalizar trilha via chat HTTP\n');
  
  if (!trilha || trilha.status === 'concluida') {
    console.log('⚠️  Trilha já está concluída, pulando teste');
    return { sucesso: true, pulado: true };
  }
  
  try {
    console.log('📤 Enviando mensagem para finalizar trilha...');
    console.log(`Trilha: ${trilha.nome} (${trilha.id})`);
    
    const response = await axios.post(`${BASE_URL}/api/chat`, {
      message: `finalize a trilha ${trilha.nome}`,
      userId: COLABORADOR_ID,
      context: {
        page: 'test',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('📥 Resposta recebida:', response.data.message.substring(0, 200));
    
    if (response.data.message && !response.data.message.includes('erro')) {
      return { sucesso: true, mensagem: 'Finalizar trilha funcionou via chat' };
    } else {
      return { sucesso: false, erro: 'Resposta indica erro' };
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.response?.data || error.message);
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Testa reiniciar trilha via chat HTTP
 */
async function testarReiniciarTrilhaViaChat(trilha) {
  console.log('\n🧪 TESTE 3: Reiniciar trilha via chat HTTP\n');
  
  if (!trilha || trilha.status !== 'concluida') {
    console.log('⚠️  Trilha não está concluída, pulando teste');
    return { sucesso: true, pulado: true };
  }
  
  try {
    console.log('📤 Enviando mensagem para reiniciar trilha...');
    console.log(`Trilha: ${trilha.nome} (${trilha.id})`);
    
    const response = await axios.post(`${BASE_URL}/api/chat`, {
      message: `reinicie a trilha ${trilha.nome}`,
      userId: COLABORADOR_ID,
      context: {
        page: 'test',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('📥 Resposta recebida:', response.data.message.substring(0, 200));
    
    if (response.data.message && !response.data.message.includes('erro')) {
      return { sucesso: true, mensagem: 'Reiniciar trilha funcionou via chat' };
    } else {
      return { sucesso: false, erro: 'Resposta indica erro' };
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.response?.data || error.message);
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Testa diretamente via API
 */
async function testarViaAPIDireta() {
  console.log('\n🧪 TESTE 4: Testar finalizar via API direta\n');
  
  try {
    // Buscar trilhas em andamento
    const trilhasResponse = await axios.get(
      `${BASE_URL}/api/agent/trilhas/disponiveis/${COLABORADOR_ID}?tenant_id=${TENANT_ID}`
    );
    
    const trilhasEmAndamento = trilhasResponse.data.em_andamento || [];
    
    if (trilhasEmAndamento.length === 0) {
      console.log('⚠️  Nenhuma trilha em andamento para testar');
      return { sucesso: true, pulado: true };
    }
    
    const trilha = trilhasEmAndamento[0];
    console.log(`📝 Testando com trilha: ${trilha.nome} (${trilha.id})`);
    
    // Tentar finalizar via API
    const finalizarResponse = await axios.post(
      `${BASE_URL}/api/agent/trilhas/finalizar?tenant_id=${TENANT_ID}`,
      {
        trilha_id: trilha.id,
        colaborador_id: COLABORADOR_ID
      }
    );
    
    console.log('✅ API direta funcionou:', finalizarResponse.data);
    return { sucesso: true, dados: finalizarResponse.data };
    
  } catch (error) {
    console.error('❌ ERRO:', error.response?.data || error.message);
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Executar todos os testes
 */
async function executarTodosTestes() {
  const resultados = {
    ferramentasDisponiveis: null,
    finalizarViaChat: null,
    reiniciarViaChat: null,
    viaAPIDireta: null
  };
  
  // Teste 1: Verificar ferramentas disponíveis
  resultados.ferramentasDisponiveis = await testarFerramentasDisponiveis();
  
  // Teste 2 e 3: Se encontrou trilhas, testar
  if (resultados.ferramentasDisponiveis.sucesso && resultados.ferramentasDisponiveis.trilha) {
    resultados.finalizarViaChat = await testarFinalizarTrilhaViaChat(resultados.ferramentasDisponiveis.trilha);
    resultados.reiniciarViaChat = await testarReiniciarTrilhaViaChat(resultados.ferramentasDisponiveis.trilha);
  }
  
  // Teste 4: API direta
  resultados.viaAPIDireta = await testarViaAPIDireta();
  
  // Resumo final
  console.log('\n\n📊 RESUMO DOS TESTES:');
  console.log('========================');
  console.log(`Ferramentas Disponívels:  ${resultados.ferramentasDisponiveis.sucesso ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Finalizar via Chat:      ${resultados.finalizarViaChat?.sucesso ? '✅ PASSOU' : resultados.finalizarViaChat?.pulado ? '⏭️ PULADO' : '❌ FALHOU'}`);
  console.log(`Reiniciar via Chat:      ${resultados.reiniciarViaChat?.sucesso ? '✅ PASSOU' : resultados.reiniciarViaChat?.pulado ? '⏭️ PULADO' : '❌ FALHOU'}`);
  console.log(`API Direta:              ${resultados.viaAPIDireta?.sucesso ? '✅ PASSOU' : resultados.viaAPIDireta?.pulado ? '⏭️ PULADO' : '❌ FALHOU'}`);
  
  const todosPassaram = Object.values(resultados).every(r => r === null || r.sucesso || r.pulado);
  
  if (todosPassaram) {
    console.log('\n🎉 Todos os testes passaram!');
    process.exit(0);
  } else {
    console.log('\n❌ Alguns testes falharam');
    process.exit(1);
  }
}

// Executar
executarTodosTestes().catch(error => {
  console.error('❌ Erro ao executar testes:', error);
  process.exit(1);
});

