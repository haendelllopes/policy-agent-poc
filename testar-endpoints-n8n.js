const axios = require('axios');

// Configurações de teste
const BASE_URL = 'http://localhost:3000';
const COLABORADOR_ID = '4ab6c765-bcfc-4280-84cd-3190fcf881c2'; // UUID de teste
const COLABORADOR_PHONE = '5511999999999'; // Telefone de teste
const TRILHA_ID = '7af41fde-6750-4c8b-9c1a-123456789abc'; // ID de trilha de teste

async function testarEndpointsN8N() {
  console.log('🧪 TESTANDO ENDPOINTS HÍBRIDOS N8N');
  console.log('=====================================\n');

  try {
    // Teste 1: Buscar trilhas disponíveis (UUID)
    console.log('1️⃣ Testando GET /api/agent-n8n/trilhas/disponiveis/:colaborador_id (UUID)\n');
    
    const response1 = await axios.get(
      `${BASE_URL}/api/agent-n8n/trilhas/disponiveis/${COLABORADOR_ID}`
    );
    
    console.log('✅ Sucesso:', response1.data.success);
    console.log('📊 Colaborador ID:', response1.data.colaborador_id);
    console.log('🏢 Tenant ID:', response1.data.tenant_id);
    console.log('📚 Total de trilhas:', response1.data.total);
    console.log('');

    // Teste 2: Buscar trilhas disponíveis (Telefone)
    console.log('2️⃣ Testando GET /api/agent-n8n/trilhas/disponiveis/:colaborador_id (Telefone)\n');
    
    const response2 = await axios.get(
      `${BASE_URL}/api/agent-n8n/trilhas/disponiveis/${COLABORADOR_PHONE}`
    );
    
    console.log('✅ Sucesso:', response2.data.success);
    console.log('📊 Colaborador ID:', response2.data.colaborador_id);
    console.log('🏢 Tenant ID:', response2.data.tenant_id);
    console.log('📚 Total de trilhas:', response2.data.total);
    console.log('');

    // Teste 3: Buscar dados do colaborador
    console.log('3️⃣ Testando GET /api/agent-n8n/trilhas/colaborador/:colaborador_id\n');
    
    const response3 = await axios.get(
      `${BASE_URL}/api/agent-n8n/trilhas/colaborador/${COLABORADOR_ID}`
    );
    
    console.log('✅ Sucesso:', response3.data.success);
    console.log('👤 Nome:', response3.data.colaborador.name);
    console.log('📧 Email:', response3.data.colaborador.email);
    console.log('🏢 Cargo:', response3.data.colaborador.cargo);
    console.log('🏢 Departamento:', response3.data.colaborador.departamento);
    console.log('');

    // Teste 4: Iniciar trilha
    console.log('4️⃣ Testando POST /api/agent-n8n/trilhas/iniciar\n');
    
    const response4 = await axios.post(
      `${BASE_URL}/api/agent-n8n/trilhas/iniciar`,
      {
        colaborador_id: COLABORADOR_ID,
        trilha_id: TRILHA_ID
      }
    );
    
    console.log('✅ Sucesso:', response4.data.success);
    console.log('📚 Trilha:', response4.data.trilha?.nome);
    console.log('📊 Progresso ID:', response4.data.progresso_id);
    console.log('');

    // Teste 5: Registrar feedback
    console.log('5️⃣ Testando POST /api/agent-n8n/trilhas/feedback\n');
    
    const response5 = await axios.post(
      `${BASE_URL}/api/agent-n8n/trilhas/feedback`,
      {
        colaborador_id: COLABORADOR_ID,
        trilha_id: TRILHA_ID,
        feedback: 'Teste de feedback via N8N',
        tipo_feedback: 'teste'
      }
    );
    
    console.log('✅ Sucesso:', response5.data.success);
    console.log('💬 Feedback registrado:', response5.data.feedback.feedback);
    console.log('');

    console.log('🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('✅ Endpoints híbridos N8N funcionando perfeitamente');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 DICA: Verifique se:');
      console.log('- O servidor está rodando (npm run dev)');
      console.log('- Os IDs de teste existem no banco de dados');
      console.log('- As tabelas estão criadas corretamente');
    }
  }
}

// Executar testes
testarEndpointsN8N();

