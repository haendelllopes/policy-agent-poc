const axios = require('axios');

async function testConversationSaving() {
  console.log('🧪 Testando salvamento de conversas...\n');
  
  try {
    // Teste 1: Primeira mensagem
    console.log('📝 Enviando primeira mensagem...');
    const response1 = await axios.post('http://localhost:3000/api/chat', {
      message: 'Olá Navi!',
      userId: 'colaborador-demo',
      context: { 
        page: 'colaborador-trilhas', 
        userType: 'colaborador',
        colaborador_id: 'a4cd1933-f066-4595-a0b6-614a603f4bd3'
      }
    });
    
    console.log('✅ Primeira resposta:', response1.data.message.substring(0, 50) + '...');
    console.log('💾 Conversa salva:', response1.data.conversationHistory?.saved || false);
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 2: Segunda mensagem (deve carregar histórico)
    console.log('\n📝 Enviando segunda mensagem...');
    const response2 = await axios.post('http://localhost:3000/api/chat', {
      message: 'Como você está?',
      userId: 'colaborador-demo',
      context: { 
        page: 'colaborador-trilhas', 
        userType: 'colaborador',
        colaborador_id: 'a4cd1933-f066-4595-a0b6-614a603f4bd3'
      }
    });
    
    console.log('✅ Segunda resposta:', response2.data.message.substring(0, 50) + '...');
    console.log('📚 Histórico carregado:', response2.data.conversationHistory?.loaded || 0, 'mensagens');
    console.log('💾 Conversa salva:', response2.data.conversationHistory?.saved || false);
    
    // Teste 3: Pergunta sobre gestor (deve usar histórico)
    console.log('\n📝 Enviando pergunta sobre gestor...');
    const response3 = await axios.post('http://localhost:3000/api/chat', {
      message: 'quem é meu gestor mesmo?',
      userId: 'colaborador-demo',
      context: { 
        page: 'colaborador-trilhas', 
        userType: 'colaborador',
        colaborador_id: 'a4cd1933-f066-4595-a0b6-614a603f4bd3'
      }
    });
    
    console.log('✅ Resposta sobre gestor:', response3.data.message);
    console.log('📚 Histórico carregado:', response3.data.conversationHistory?.loaded || 0, 'mensagens');
    console.log('💾 Conversa salva:', response3.data.conversationHistory?.saved || false);
    
    console.log('\n🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testConversationSaving();
