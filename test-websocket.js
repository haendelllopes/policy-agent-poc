const WebSocket = require('ws');

async function testWebSocket() {
  console.log('🧪 Testando WebSocket Chat Server...\n');
  
  try {
    // Aguardar servidor inicializar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('1️⃣ Conectando ao WebSocket...');
    const ws = new WebSocket('ws://localhost:3000/ws/chat');
    
    ws.on('open', () => {
      console.log('✅ WebSocket conectado com sucesso!');
      
      console.log('2️⃣ Enviando mensagem de teste...');
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
        console.log('✅ Chat funcionando corretamente!');
        console.log('💬 Resposta do Navi:', response.message);
        console.log('😊 Sentimento:', response.sentiment);
        console.log('🔧 Ferramentas usadas:', response.toolsUsed);
        
        // Teste adicional com ferramentas
        console.log('\n3️⃣ Testando ferramentas...');
        ws.send(JSON.stringify({
          type: 'chat',
          userId: 'test-user-123',
          text: 'Quais trilhas estão disponíveis para mim?',
          context: { page: 'colaborador-trilhas' }
        }));
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ Erro WebSocket:', error.message);
      process.exit(1);
    });
    
    ws.on('close', () => {
      console.log('🔌 Conexão WebSocket fechada');
    });
    
    // Timeout de 15 segundos
    setTimeout(() => {
      console.log('⏰ Timeout - servidor pode não estar rodando');
      console.log('💡 Certifique-se de que o servidor está rodando com: node src/server.js');
      process.exit(1);
    }, 15000);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

console.log('🚀 Iniciando teste do WebSocket Chat Server...');
console.log('💡 Certifique-se de que o servidor está rodando com: node src/server.js\n');

testWebSocket();
