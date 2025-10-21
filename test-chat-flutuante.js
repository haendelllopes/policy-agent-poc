const WebSocket = require('ws');

async function testChatFlutuante() {
  console.log('🧪 Testando Chat Flutuante Híbrido...\n');
  
  // 1. Teste de Conexão WebSocket
  console.log('1️⃣ Testando conexão WebSocket...');
  const ws = new WebSocket('ws://localhost:3000/ws/chat');
  
  ws.on('open', () => {
    console.log('✅ WebSocket conectado');
    
    // 2. Teste de Mensagem Simples
    console.log('2️⃣ Testando mensagem simples...');
    ws.send(JSON.stringify({
      type: 'chat',
      userId: 'test-user-123',
      text: 'Olá Navi! Como você está?',
      context: { page: 'dashboard' }
    }));
  });
  
  ws.on('message', (data) => {
    const response = JSON.parse(data);
    console.log('📨 Resposta recebida:', response);
    
    if (response.type === 'response') {
      console.log('✅ Chat funcionando corretamente');
      
      // 3. Teste de Ferramentas
      console.log('3️⃣ Testando ferramentas...');
      ws.send(JSON.stringify({
        type: 'chat',
        userId: 'test-user-123',
        text: 'Quais trilhas estão disponíveis para mim?',
        context: { page: 'colaborador-trilhas' }
      }));
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ Erro WebSocket:', error);
  });
  
  // 4. Teste de Análise Background
  setTimeout(async () => {
    console.log('4️⃣ Testando análise background...');
    const axios = require('axios');
    
    try {
      const response = await axios.post('http://localhost:3000/api/chat/analyze-background', {
        message: 'Estou com dificuldades na trilha de React',
        userId: 'test-user-123',
        context: { page: 'colaborador-trilha-detalhes' }
      });
      
      console.log('✅ Análise background funcionando:', response.data);
    } catch (error) {
      console.error('❌ Erro na análise background:', error.message);
    }
    
    ws.close();
    console.log('\n🎉 Testes concluídos!');
  }, 5000);
}

// Executar testes
testChatFlutuante().catch(console.error);
