const WebSocket = require('ws');

async function testWebSocketConnection() {
  console.log('🔌 Testando conexão WebSocket local...\n');

  try {
    const ws = new WebSocket('ws://localhost:3000/ws/chat');
    
    ws.onopen = () => {
      console.log('✅ WebSocket conectado com sucesso!');
      console.log('📍 URL: ws://localhost:3000/ws/chat');
      
      // Enviar mensagem de teste
      ws.send(JSON.stringify({
        type: 'chat',
        userId: 'test-local-connection',
        text: 'Teste de conexão local corrigida!',
        context: { page: 'dashboard' }
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('✅ Resposta recebida:', data.message);
      console.log('📊 Sentimento:', data.sentiment);
      ws.close();
    };

    ws.onerror = (error) => {
      console.error('❌ Erro WebSocket:', error.message);
    };

    ws.onclose = () => {
      console.log('\n🎉 Teste concluído!');
      console.log('💡 Agora teste no navegador: http://localhost:3000/dashboard.html');
      console.log('🔧 O chat deve conectar automaticamente com localhost:3000');
    };

  } catch (error) {
    console.error('❌ Erro ao criar WebSocket:', error.message);
  }
}

testWebSocketConnection();
