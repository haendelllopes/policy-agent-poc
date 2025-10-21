const axios = require('axios');

async function testGestorResponse() {
  console.log('🧪 Testando resposta direta para perguntas sobre gestor...\n');
  
  const testCases = [
    'quem é meu gestor mesmo?',
    'qual o nome do meu gestor?',
    'quem é meu gestor?',
    'meu gestor é quem?',
    'não, esse sou eu, quero saber quem é meu gestor'
  ];
  
  for (const message of testCases) {
    console.log(`📤 Testando: "${message}"`);
    
    try {
      const response = await axios.post('http://localhost:3000/api/chat', {
        message: message,
        userId: 'colaborador-demo',
        context: {
          page: 'colaborador-trilhas',
          userType: 'colaborador',
          colaborador_id: 'a4cd1933-f066-4595-a0b6-614a603f4bd3'
        }
      });
      
      console.log('✅ Status:', response.data.status);
      console.log('📝 Resposta:', response.data.message.substring(0, 200) + '...');
      console.log('🔧 Resposta direta:', response.data.directResponse ? 'SIM' : 'NÃO');
      console.log('---');
      
    } catch (error) {
      console.error('❌ Erro:', error.message);
      if (error.response) {
        console.error('📊 Status:', error.response.status);
        console.error('📝 Dados:', error.response.data);
      }
      console.log('---');
    }
  }
}

// Executar teste
testGestorResponse().catch(console.error);
