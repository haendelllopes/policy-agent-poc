const axios = require('axios');

async function testChatAPI() {
  try {
    console.log('🧪 Testando API /api/chat...');
    
    const testData = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      message: 'teste de mensagem',
      context: {
        page: 'dashboard',
        url: 'https://navigator-gules.vercel.app/dashboard.html'
      }
    };
    
    console.log('📤 Enviando dados:', testData);
    
    const response = await axios.post('https://navigator-gules.vercel.app/api/chat', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Resposta recebida:', response.status);
    console.log('📥 Dados da resposta:', response.data);
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.response?.status);
    console.error('📥 Dados do erro:', error.response?.data);
    console.error('🔍 Erro completo:', error.message);
  }
}

testChatAPI();

