const axios = require('axios');

// Configuração
const BASE_URL = 'https://navigator-gules.vercel.app';
const USER_ID = 'a4cd1933-f066-4595-a0b6-614a603f4bd3'; // Usuário teste
const TENANT_ID = '5978f911-738b-4aae-802a-f037fdac2e64'; // Tenant Demonstração

async function testTrilhaFunctions() {
  console.log('🧪 Testando funcionalidades de trilhas do agente...\n');

  try {
    // 1. Testar buscar trilhas disponíveis
    console.log('1️⃣ Testando buscar trilhas disponíveis...');
    const trilhasResponse = await axios.get(`${BASE_URL}/api/agent/trilhas/disponiveis/${USER_ID}?tenant_id=${TENANT_ID}`);
    console.log('✅ Trilhas disponíveis:', trilhasResponse.data);
    
    if (trilhasResponse.data.disponiveis && trilhasResponse.data.disponiveis.length > 0) {
      const trilhaReal = trilhasResponse.data.disponiveis[0];
      console.log(`📋 Usando trilha real: ${trilhaReal.nome} (ID: ${trilhaReal.id})`);
      
      // 2. Testar iniciar trilha
      console.log('\n2️⃣ Testando iniciar trilha...');
      try {
        const iniciarResponse = await axios.post(`${BASE_URL}/api/agent/trilhas/iniciar?tenant_id=${TENANT_ID}`, {
          trilha_id: trilhaReal.id,
          colaborador_id: USER_ID
        });
        console.log('✅ Trilha iniciada:', iniciarResponse.data);
      } catch (error) {
        console.log('⚠️ Erro ao iniciar (pode já estar iniciada):', error.response?.data || error.message);
      }
      
      // 3. Testar finalizar trilha
      console.log('\n3️⃣ Testando finalizar trilha...');
      try {
        const finalizarResponse = await axios.post(`${BASE_URL}/api/agent/trilhas/finalizar`, {
          trilha_id: trilhaReal.id,
          colaborador_id: USER_ID,
          tenant_id: TENANT_ID
        });
        console.log('✅ Trilha finalizada:', finalizarResponse.data);
      } catch (error) {
        console.log('⚠️ Erro ao finalizar:', error.response?.data || error.message);
      }
      
      // 4. Testar reativar trilha
      console.log('\n4️⃣ Testando reativar trilha...');
      try {
        const reativarResponse = await axios.post(`${BASE_URL}/api/agent/trilhas/reativar`, {
          trilha_id: trilhaReal.id,
          colaborador_id: USER_ID,
          tenant_id: TENANT_ID
        });
        console.log('✅ Trilha reativada:', reativarResponse.data);
      } catch (error) {
        console.log('⚠️ Erro ao reativar:', error.response?.data || error.message);
      }
      
    } else {
      console.log('❌ Nenhuma trilha disponível encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

// Executar teste
testTrilhaFunctions();
