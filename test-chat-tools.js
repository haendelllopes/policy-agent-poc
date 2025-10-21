const axios = require('axios');

async function testChatTools() {
  console.log('🧪 Testando ferramentas do chat...');
  
  const testCases = [
    {
      name: 'Mensagem simples (sem ferramentas)',
      message: 'Olá',
      userId: 'colaborador-demo',
      context: { page: 'colaborador-trilhas', userType: 'colaborador' }
    },
    {
      name: 'Busca de trilhas (com ferramentas)',
      message: 'Quais trilhas tenho disponíveis?',
      userId: 'colaborador-demo',
      context: { page: 'colaborador-trilhas', userType: 'colaborador' }
    },
    {
      name: 'Busca de documentos (com ferramentas)',
      message: 'Busque documentos sobre políticas',
      userId: 'colaborador-demo',
      context: { page: 'colaborador-trilhas', userType: 'colaborador' }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testando: ${testCase.name}`);
    console.log(`📤 Mensagem: "${testCase.message}"`);
    
    try {
      const response = await axios.post('http://localhost:3000/api/chat', {
        message: testCase.message,
        userId: testCase.userId,
        context: testCase.context
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📝 Resposta: ${response.data.message.substring(0, 100)}...`);
      
    } catch (error) {
      console.log(`❌ Erro: ${error.response?.status || error.code}`);
      console.log(`📝 Mensagem: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.data?.errorType) {
        console.log(`🔍 Tipo de erro: ${error.response.data.errorType}`);
      }
    }
  }
}

// Executar teste
testChatTools().catch(console.error);
