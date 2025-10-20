const axios = require('axios');

// Configurações de teste
const BASE_URL = 'https://navigator-gules.vercel.app';
const COLABORADOR_ID = '556291708483'; // Telefone de teste

async function testarBuscaTrilha() {
  console.log('🧪 TESTANDO BUSCA TRILHA');
  console.log('========================\n');

  try {
    console.log(`🔗 URL: ${BASE_URL}/api/agent-n8n/trilhas/disponiveis/${COLABORADOR_ID}`);
    console.log(`👤 Colaborador ID: ${COLABORADOR_ID}\n`);

    const response = await axios.get(
      `${BASE_URL}/api/agent-n8n/trilhas/disponiveis/${COLABORADOR_ID}`,
      {
        timeout: 30000, // 30 segundos timeout
        headers: {
          'User-Agent': 'N8N-Test/1.0'
        }
      }
    );

    console.log('✅ SUCESSO!');
    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', response.headers);
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ ERRO!');
    console.error('📊 Status:', error.response?.status);
    console.error('📋 Headers:', error.response?.headers);
    console.error('📄 Response:', error.response?.data);
    console.error('🔍 Error Message:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.log('\n💡 DICA: Timeout na requisição - servidor pode estar lento');
    } else if (error.response?.status === 500) {
      console.log('\n💡 DICA: Erro interno do servidor - verificar logs');
    } else if (error.response?.status === 404) {
      console.log('\n💡 DICA: Endpoint não encontrado - verificar URL');
    }
  }
}

// Executar teste
testarBuscaTrilha();
