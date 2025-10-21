const axios = require('axios');

async function testGestorResponseVercel() {
  console.log('🧪 Testando resposta direta no Vercel...\n');
  
  const testCases = [
    'quem é meu gestor mesmo?',
    'qual o nome do meu gestor?',
    'quem é meu gestor?'
  ];
  
  for (const message of testCases) {
    console.log(`📤 Testando: "${message}"`);
    
    try {
      const response = await axios.post('https://navigator-gules.vercel.app/api/chat', {
        message: message,
        userId: 'colaborador-demo',
        context: {
          page: 'colaborador-trilhas',
          userType: 'colaborador',
          colaborador_id: 'a4cd1933-f066-4595-a0b6-614a603f4bd3'
        }
      });
      
      console.log('✅ Status:', response.data.status);
      console.log('📝 Resposta:', response.data.message.substring(0, 300) + '...');
      console.log('🔧 Resposta direta:', response.data.directResponse ? 'SIM' : 'NÃO');
      console.log('🎭 Sentimento:', response.data.sentiment?.detected);
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
testGestorResponseVercel().catch(console.error);
