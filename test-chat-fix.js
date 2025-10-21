const WebSocket = require('ws');

// Teste rápido para verificar se o erro foi corrigido
async function testChatFix() {
  console.log('🔧 Testando correção do erro "Cannot read properties of null"...\n');

  const ws = new WebSocket('ws://localhost:3000/ws/chat');

  ws.onopen = () => {
    console.log('✅ WebSocket conectado!');
    
    // Enviar mensagem de teste
    ws.send(JSON.stringify({
      type: 'chat',
      userId: 'test-user-fix',
      text: 'Olá! Teste de correção do erro.',
      context: { 
        page: 'dashboard', 
        userType: 'colaborador',
        timestamp: new Date().toISOString()
      }
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('📨 Resposta recebida:');
    console.log('   💬 Mensagem:', data.message || 'null');
    console.log('   📊 Sentimento:', data.sentiment);
    console.log('   🔧 Ferramentas:', data.toolsUsed?.length || 0);
    
    if (data.message && data.message !== 'null') {
      console.log('\n✅ SUCESSO! Erro corrigido - mensagem não é mais null');
    } else {
      console.log('\n❌ ERRO ainda persiste - mensagem é null');
    }
    
    ws.close();
  };

  ws.onerror = (error) => {
    console.error('❌ Erro WebSocket:', error);
  };

  ws.onclose = () => {
    console.log('\n🔌 Teste concluído!');
    console.log('\n🌐 Agora você pode testar manualmente em:');
    console.log('   http://localhost:3000/dashboard.html');
    console.log('   Clique no ícone do chat (🤖) e digite uma mensagem');
  };
}

// Aguardar servidor inicializar
setTimeout(() => {
  testChatFix().catch(console.error);
}, 3000);
